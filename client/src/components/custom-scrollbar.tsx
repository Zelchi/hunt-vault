import { createSignal, type JSX, onCleanup, onMount } from "solid-js";
import * as styles from "@/styles/custom-scrollbar.css";

type CustomScrollbarProps = {
	children: JSX.Element;
	onScroll?: (event: Event) => void;
	variant?: "main" | "nested";
	scrollbarVariant?: "default" | "minimal";
	orientation?: "vertical" | "horizontal";
	class?: string;
	viewportClass?: string;
	viewportRole?: "listbox";
	viewportAriaLabel?: string;
	id?: string;
	ariaLabel?: string;
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
	const isNested = () => props.variant === "nested";
	const isHorizontal = () => props.orientation === "horizontal";
	const scrollId = () => props.id ?? "main-scroll";

	const getScrollPosition = () => (isHorizontal() ? mainElement.scrollLeft : mainElement.scrollTop);
	const setElementScrollPosition = (value: number) => {
		if (isHorizontal()) {
			mainElement.scrollLeft = value;
			return;
		}

		mainElement.scrollTop = value;
	};

	const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

	const updateScrollbar = () => {
		if (!mainElement || !scrollbarElement) {
			return;
		}

		const viewportSize = isHorizontal() ? mainElement.clientWidth : mainElement.clientHeight;
		const contentSize = isHorizontal() ? mainElement.scrollWidth : mainElement.scrollHeight;
		const trackSize = isHorizontal() ? scrollbarElement.clientWidth : scrollbarElement.clientHeight;
		const maximumScroll = Math.max(contentSize - viewportSize, 0);
		const currentScroll = clamp(getScrollPosition(), 0, maximumScroll);
		const calculatedThumbSize = contentSize > 0 ? (viewportSize / contentSize) * trackSize : trackSize;
		const nextThumbSize = Math.min(trackSize, Math.max(48, calculatedThumbSize));
		const maximumThumbOffset = Math.max(trackSize - nextThumbSize, 0);

		setScrollable(maximumScroll > 0 && trackSize > 0);
		setScrollPosition(currentScroll);
		setScrollMaximum(maximumScroll);
		setThumbHeight(nextThumbSize);
		setThumbTop(maximumScroll > 0 ? (currentScroll / maximumScroll) * maximumThumbOffset : 0);
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
		const trackSize = isHorizontal() ? scrollbarElement.clientWidth : scrollbarElement.clientHeight;
		const pointerPosition = isHorizontal() ? event.clientX : event.clientY;
		const trackStart = isHorizontal() ? trackRect.left : trackRect.top;
		const maximumThumbTop = Math.max(trackSize - thumbHeight(), 0);

		if (maximumThumbTop === 0) {
			return;
		}

		const requestedThumbTop = pointerPosition - trackStart - thumbHeight() / 2;
		const positionRatio = clamp(requestedThumbTop / maximumThumbTop, 0, 1);
		setElementScrollPosition(positionRatio * scrollMaximum());
	};

	const handleScrollbarPointerMove = (event: PointerEvent) => {
		if (!draggingScrollbar()) {
			return;
		}

		const trackSize = isHorizontal() ? scrollbarElement.clientWidth : scrollbarElement.clientHeight;
		const pointerPosition = isHorizontal() ? event.clientX : event.clientY;
		const maximumThumbTop = Math.max(trackSize - thumbHeight(), 0);
		if (maximumThumbTop === 0) {
			return;
		}

		const scrollDelta = ((pointerPosition - dragStartY) / maximumThumbTop) * scrollMaximum();
		setElementScrollPosition(clamp(dragStartScrollTop + scrollDelta, 0, scrollMaximum()));
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
		dragStartY = isHorizontal() ? event.clientX : event.clientY;
		dragStartScrollTop = getScrollPosition();
		setDraggingScrollbar(true);
		window.addEventListener("pointermove", handleScrollbarPointerMove);
		window.addEventListener("pointerup", stopScrollbarDrag);
		window.addEventListener("pointercancel", stopScrollbarDrag);
	};

	const handleScrollbarKeyDown = (event: KeyboardEvent) => {
		if (!scrollable()) {
			return;
		}

		const viewportSize = isHorizontal() ? mainElement.clientWidth : mainElement.clientHeight;
		const scrollStep = Math.max(viewportSize * 0.15, 48);
		let nextScrollTop: number | undefined;

		if (isHorizontal()) {
			switch (event.key) {
				case "ArrowRight":
					nextScrollTop = getScrollPosition() + scrollStep;
					break;
				case "ArrowLeft":
					nextScrollTop = getScrollPosition() - scrollStep;
					break;
				case "PageDown":
					nextScrollTop = getScrollPosition() + viewportSize;
					break;
				case "PageUp":
					nextScrollTop = getScrollPosition() - viewportSize;
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
		} else {
			switch (event.key) {
				case "ArrowDown":
					nextScrollTop = getScrollPosition() + scrollStep;
					break;
				case "ArrowUp":
					nextScrollTop = getScrollPosition() - scrollStep;
					break;
				case "PageDown":
					nextScrollTop = getScrollPosition() + viewportSize;
					break;
				case "PageUp":
					nextScrollTop = getScrollPosition() - viewportSize;
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
		}

		event.preventDefault();
		setElementScrollPosition(clamp(nextScrollTop, 0, scrollMaximum()));
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
		<div class={`${isNested() ? styles.nestedFrame : styles.mainFrame} ${props.class ?? ""}`}>
			<main
				class={`${isNested() ? (isHorizontal() ? styles.horizontalMain : styles.nestedMain) : styles.main} ${props.viewportClass ?? ""}`}
				id={scrollId()}
				role={props.viewportRole}
				aria-label={props.viewportAriaLabel}
				data-scrollable={scrollable()}
				onScroll={handleMainScroll}
				ref={mainElement}
			>
				{props.children}
			</main>
			<div
				class={`${styles.scrollbar} ${isNested() ? styles.nestedScrollbar : ""} ${isHorizontal() ? styles.horizontalScrollbar : ""} ${props.scrollbarVariant === "minimal" ? styles.minimalScrollbar : ""}`}
				data-visible={scrollable()}
				data-dragging={draggingScrollbar()}
				role="scrollbar"
				aria-label={props.ariaLabel ?? "Rolagem do conteúdo"}
				aria-controls={scrollId()}
				aria-orientation={isHorizontal() ? "horizontal" : "vertical"}
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
					style={
						isHorizontal()
							? { width: `${thumbHeight()}px`, height: "100%", transform: `translateX(${thumbTop()}px)` }
							: { height: `${thumbHeight()}px`, transform: `translateY(${thumbTop()}px)` }
					}
					onPointerDown={handleScrollbarThumbPointerDown}
				/>
			</div>
		</div>
	);
};

export default CustomScrollbar;
