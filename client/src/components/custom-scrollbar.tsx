import { createSignal, type JSX, onCleanup, onMount } from "solid-js";
import * as styles from "@/styles/custom-scrollbar.css";

type CustomScrollbarProps = {
	children: JSX.Element;
	onScroll?: (event: Event) => void;
};

const CustomScrollbar = (props: CustomScrollbarProps) => {
	const [scrollable, setScrollable] = createSignal(false);
	const [scrollPosition, setScrollPosition] = createSignal(0);
	const [scrollMaximum, setScrollMaximum] = createSignal(0);
	const [thumbHeight, setThumbHeight] = createSignal(0);
	const [thumbTop, setThumbTop] = createSignal(0);
	const [draggingScrollbar, setDraggingScrollbar] = createSignal(false);
	let mainElement!: HTMLElement;
	let scrollbarElement!: HTMLDivElement;
	let dragStartY = 0;
	let dragStartScrollTop = 0;

	const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

	const updateScrollbar = () => {
		if (!mainElement || !scrollbarElement) {
			return;
		}

		const viewportHeight = mainElement.clientHeight;
		const contentHeight = mainElement.scrollHeight;
		const trackHeight = scrollbarElement.clientHeight;
		const maximumScroll = Math.max(contentHeight - viewportHeight, 0);
		const currentScroll = clamp(mainElement.scrollTop, 0, maximumScroll);
		const calculatedThumbHeight = contentHeight > 0 ? (viewportHeight / contentHeight) * trackHeight : trackHeight;
		const nextThumbHeight = Math.min(trackHeight, Math.max(48, calculatedThumbHeight));
		const maximumThumbTop = Math.max(trackHeight - nextThumbHeight, 0);

		setScrollable(maximumScroll > 0 && trackHeight > 0);
		setScrollPosition(currentScroll);
		setScrollMaximum(maximumScroll);
		setThumbHeight(nextThumbHeight);
		setThumbTop(maximumScroll > 0 ? (currentScroll / maximumScroll) * maximumThumbTop : 0);
	};

	const handleMainScroll = (event: Event) => {
		updateScrollbar();
		props.onScroll?.(event);
	};

	const handleScrollbarTrackPointerDown = (event: PointerEvent) => {
		if (!scrollable() || event.target !== event.currentTarget) {
			return;
		}

		event.preventDefault();
		const trackRect = scrollbarElement.getBoundingClientRect();
		const maximumThumbTop = Math.max(scrollbarElement.clientHeight - thumbHeight(), 0);

		if (maximumThumbTop === 0) {
			return;
		}

		const requestedThumbTop = event.clientY - trackRect.top - thumbHeight() / 2;
		const positionRatio = clamp(requestedThumbTop / maximumThumbTop, 0, 1);
		mainElement.scrollTop = positionRatio * scrollMaximum();
	};

	const handleScrollbarPointerMove = (event: PointerEvent) => {
		if (!draggingScrollbar()) {
			return;
		}

		const maximumThumbTop = Math.max(scrollbarElement.clientHeight - thumbHeight(), 0);
		if (maximumThumbTop === 0) {
			return;
		}

		const scrollDelta = ((event.clientY - dragStartY) / maximumThumbTop) * scrollMaximum();
		mainElement.scrollTop = clamp(dragStartScrollTop + scrollDelta, 0, scrollMaximum());
	};

	const stopScrollbarDrag = () => {
		setDraggingScrollbar(false);
		window.removeEventListener("pointermove", handleScrollbarPointerMove);
		window.removeEventListener("pointerup", stopScrollbarDrag);
		window.removeEventListener("pointercancel", stopScrollbarDrag);
	};

	const handleScrollbarThumbPointerDown = (event: PointerEvent) => {
		if (!scrollable()) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		dragStartY = event.clientY;
		dragStartScrollTop = mainElement.scrollTop;
		setDraggingScrollbar(true);
		window.addEventListener("pointermove", handleScrollbarPointerMove);
		window.addEventListener("pointerup", stopScrollbarDrag);
		window.addEventListener("pointercancel", stopScrollbarDrag);
	};

	const handleScrollbarKeyDown = (event: KeyboardEvent) => {
		if (!scrollable()) {
			return;
		}

		const scrollStep = Math.max(mainElement.clientHeight * 0.15, 48);
		let nextScrollTop: number | undefined;

		switch (event.key) {
			case "ArrowDown":
				nextScrollTop = mainElement.scrollTop + scrollStep;
				break;
			case "ArrowUp":
				nextScrollTop = mainElement.scrollTop - scrollStep;
				break;
			case "PageDown":
				nextScrollTop = mainElement.scrollTop + mainElement.clientHeight;
				break;
			case "PageUp":
				nextScrollTop = mainElement.scrollTop - mainElement.clientHeight;
				break;
			case "Home":
				nextScrollTop = 0;
				break;
			case "End":
				nextScrollTop = scrollMaximum();
				break;
			default:
				return;
		}

		event.preventDefault();
		mainElement.scrollTop = clamp(nextScrollTop, 0, scrollMaximum());
	};

	onMount(() => {
		const resizeObserver = new ResizeObserver(updateScrollbar);
		const mutationObserver = new MutationObserver(updateScrollbar);

		resizeObserver.observe(mainElement);
		resizeObserver.observe(scrollbarElement);
		mutationObserver.observe(mainElement, { childList: true, subtree: true });
		window.addEventListener("resize", updateScrollbar);
		updateScrollbar();

		onCleanup(() => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			window.removeEventListener("resize", updateScrollbar);
			stopScrollbarDrag();
		});
	});

	return (
		<div class={styles.mainFrame}>
			<main class={styles.main} id="main-scroll" onScroll={handleMainScroll} ref={mainElement}>
				{props.children}
			</main>
			<div
				class={styles.scrollbar}
				data-visible={scrollable()}
				data-dragging={draggingScrollbar()}
				role="scrollbar"
				aria-label="Rolagem do conteúdo"
				aria-controls="main-scroll"
				aria-orientation="vertical"
				aria-valuemin="0"
				aria-valuemax={scrollMaximum()}
				aria-valuenow={scrollPosition()}
				tabIndex={scrollable() ? 0 : -1}
				onPointerDown={handleScrollbarTrackPointerDown}
				onKeyDown={handleScrollbarKeyDown}
				ref={scrollbarElement}
			>
				<div
					class={styles.scrollbarThumb}
					data-dragging={draggingScrollbar()}
					style={{ height: `${thumbHeight()}px`, transform: `translateY(${thumbTop()}px)` }}
					onPointerDown={handleScrollbarThumbPointerDown}
				/>
			</div>
		</div>
	);
};

export default CustomScrollbar;
