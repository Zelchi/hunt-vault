import { createEffect, createSignal, onCleanup } from "solid-js";
import { SwordIcon } from "@/components/icons";
import * as styles from "@/styles/app-shell.css";
import type { AppShellProps } from "@/types/components";

export default (props: AppShellProps) => {
	const [headerVisible, setHeaderVisible] = createSignal(true);
	let previousScrollTop = 0;
	let isAdjustingLayout = false;
	let transitionTimer: number | undefined;

	const clearTransitionTimer = () => {
		if (transitionTimer !== undefined) {
			window.clearTimeout(transitionTimer);
			transitionTimer = undefined;
		}
	};

	const setHeaderVisibility = (visible: boolean) => {
		if (headerVisible() === visible) {
			return;
		}

		setHeaderVisible(visible);
		isAdjustingLayout = true;
		clearTransitionTimer();
		transitionTimer = window.setTimeout(() => {
			isAdjustingLayout = false;
			transitionTimer = undefined;
		}, 320);
	};

	createEffect(() => {
		props.view;
		previousScrollTop = 0;
		isAdjustingLayout = false;
		clearTransitionTimer();
		setHeaderVisible(true);
	});

	onCleanup(clearTransitionTimer);

	const handleMainScroll = (event: Event) => {
		const target = event.currentTarget as HTMLElement;
		const currentScrollTop = target.scrollTop;
		const scrollDelta = currentScrollTop - previousScrollTop;

		if (isAdjustingLayout) {
			previousScrollTop = currentScrollTop;

			if (currentScrollTop <= 4) {
				isAdjustingLayout = false;
				clearTransitionTimer();
				setHeaderVisible(true);
			}

			return;
		}

		if (currentScrollTop <= 4 || scrollDelta < -2) {
			setHeaderVisibility(true);
		} else if (scrollDelta > 2) {
			setHeaderVisibility(false);
		}

		previousScrollTop = currentScrollTop;
	};

	return (
		<div class={styles.page}>
			<header class={styles.header} data-visible={headerVisible()}>
				<div class={styles.brand}>
					<span class={styles.brandIcon}>
						<SwordIcon size={22} />
					</span>
					Hunt Vault
				</div>
				<nav class={styles.nav} aria-label="Navegação principal">
					<button
						class={styles.navButton}
						data-active={props.view === "solo"}
						type="button"
						onClick={() => props.onViewChange("solo")}
					>
						Solo
					</button>
					<button
						class={styles.navButton}
						data-active={props.view === "party"}
						type="button"
						onClick={() => props.onViewChange("party")}
					>
						Party
					</button>
					<button
						class={styles.navButton}
						data-active={props.view === "import"}
						type="button"
						onClick={() => props.onViewChange("import")}
					>
						Import
					</button>
				</nav>
			</header>
			<main class={styles.main} onScroll={handleMainScroll}>
				{props.children}
			</main>
		</div>
	);
};
