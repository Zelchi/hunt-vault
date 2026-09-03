import { createEffect, createSignal, lazy, onCleanup, Show } from "solid-js";
import EntityDetailPanel from "@/component/entity-detail-panel";
import EntitySearch from "@/component/entity-search";
import { SwordIcon } from "@/component/icons";
import Navbar from "@/component/navbar";
import * as styles from "@/style/app-shell.css";
import type { AppShellProps } from "@/type/components";
import type { EntitySearchResult } from "@/type/entity";

const CustomScrollbar = lazy(() => {
	return import("@/component/custom-scrollbar");
});

export default (props: AppShellProps) => {
	const [headerVisible, setHeaderVisible] = createSignal(true);
	const [selectedEntity, setSelectedEntity] = createSignal<EntitySearchResult>();
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

	const handleEntitySelect = (entity: EntitySearchResult) => {
		return setSelectedEntity(entity);
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
				<EntitySearch onSelect={handleEntitySelect} />
				<Navbar view={props.view} onViewChange={props.onViewChange} />
			</header>
			<Show when={selectedEntity()}>
				{(entity) => {
					return (
						<EntityDetailPanel
							entity={entity()}
							onClose={() => {
								return setSelectedEntity(undefined);
							}}
						/>
					);
				}}
			</Show>
			<CustomScrollbar onScroll={handleMainScroll}>{props.children}</CustomScrollbar>
		</div>
	);
};
