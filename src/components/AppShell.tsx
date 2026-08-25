import { createEffect, createSignal, onCleanup } from "solid-js";
import { styled } from "solid-styled-components";

import type { AppShellProps } from "@/types/components";

import { SwordIcon } from "@/components/Icons";

const Page = styled("div")`
	height: 100vh;
	min-height: 100dvh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background-color: #0c100f;
	background-image:
		linear-gradient(rgb(93 150 104 / 4%) 1px, transparent 1px),
		linear-gradient(90deg, rgb(93 150 104 / 4%) 1px, transparent 1px);
	background-size: 4px 4px;
	color: #f4f1ea;
`;

const Header = styled("header")`
	flex: 0 0 auto;
	max-height: 10rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.65rem 1rem;
	background: #101512;
	border-bottom: 2px solid #284336;
	box-shadow: 0 3px 0 #070a09;
	overflow: hidden;
	z-index: 10;
	transform: translateY(0);
	opacity: 1;
	transition:
		max-height 260ms ease,
		padding 260ms ease,
		border-bottom-width 260ms ease,
		border-bottom-color 260ms ease,
		box-shadow 260ms ease,
		transform 260ms ease,
		opacity 180ms ease;

	&[data-visible="false"] {
		max-height: 0;
		padding-top: 0;
		padding-bottom: 0;
		border-bottom-width: 0;
		border-bottom-color: transparent;
		box-shadow: none;
		transform: translateY(-0.75rem);
		opacity: 0;
		pointer-events: none;
	}

	@media (max-width: 640px) {
		align-items: flex-start;
		flex-direction: column;
		padding: 0.65rem 0.75rem;
	}
`;

const Brand = styled("div")`
	display: flex;
	align-items: center;
	gap: 0.55rem;
	font-size: 1rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #f4f1ea;
`;

const BrandIcon = styled("span")`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border: 2px solid #d9a441;
	border-radius: 0;
	background: #d9a441;
	box-shadow: 2px 2px 0 #6f4e0d;
	color: #17130c;
	font-size: 1rem;
	line-height: 0;
`;

const Nav = styled("nav")`
	display: flex;
	gap: 0.35rem;

	@media (max-width: 640px) {
		width: 100%;
	}
`;

const NavButton = styled("button")`
	padding: 0.4rem 0.75rem;
	border: 1px solid transparent;
	border-radius: 0;
	background: transparent;
	color: #a5a8b2;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	cursor: pointer;
	transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;

	&[data-active="true"] {
		border-color: #d9a441;
		background: #d9a441;
		box-shadow: 2px 2px 0 #6f4e0d;
		color: #0c100f;
	}

	&:hover {
		border-color: #526d5b;
		background: #18231d;
		color: #f4f1ea;
	}

	@media (max-width: 640px) {
		flex: 1;
	}
`;

const Main = styled("main")`
	flex: 1;
	min-height: 0;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	width: 100%;
	padding: 2rem 1rem 4rem;
	overflow-x: hidden;
	overflow-y: auto;
	scrollbar-gutter: stable;
`;

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
		<Page>
			<Header data-visible={headerVisible()}>
				<Brand>
					<BrandIcon>
						<SwordIcon size={22} />
					</BrandIcon>
					Hunt Vault
				</Brand>
				<Nav aria-label="Navegação principal">
					<NavButton data-active={props.view === "visualize"} type="button" onClick={() => props.onViewChange("visualize")}>
						Visualizar
					</NavButton>
					<NavButton data-active={props.view === "import"} type="button" onClick={() => props.onViewChange("import")}>
						Importar
					</NavButton>
				</Nav>
			</Header>
			<Main onScroll={handleMainScroll}>{props.children}</Main>
		</Page>
	);
};
