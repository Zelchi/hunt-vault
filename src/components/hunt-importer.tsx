import { onCleanup, onMount, Show } from "solid-js";
import { styled } from "solid-styled-components";

import type { HuntImporterProps, PreviewSectionProps } from "@/types/components";

const Card = styled("section")`
	width: 100%;
	max-width: 52rem;
	padding: 2rem;
	border: 2px solid #2b4638;
	border-radius: 0;
	background: #121816;
	box-shadow: 4px 4px 0 #050706;
	display: flex;
	gap: 30px;
	flex-direction: column;
	align-items: center;

	@media (max-width: 640px) {
		padding: 1.25rem;
	}
`;

const SectionTitle = styled("h1")`
	margin: 0 0 0.5rem;
	color: #e8b84e;
	font-size: clamp(1.6rem, 4vw, 2.25rem);
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

const ClipboardButton = styled("button")`
	width: 100%;
	padding: 0.875rem 1.25rem;
	border: 2px solid #d9a441;
	border-radius: 0;
	background: #d9a441;
	box-shadow: 3px 3px 0 #6f4e0d;
	color: #17130c;
	font-size: 0.85rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;

	&:hover {
		background: #edbd5a;
		box-shadow: 4px 4px 0 #6f4e0d;
		transform: translate(-1px, -1px);
	}

	&:disabled {
		cursor: wait;
		opacity: 0.6;
		transform: none;
	}
`;

const SaveButton = styled("button")`
	width: 100%;
	margin-top: 0.75rem;
	padding: 0.875rem 1.25rem;
	border: 2px solid #4fc47b;
	border-radius: 0;
	background: #102319;
	box-shadow: 3px 3px 0 #1d5e3a;
	color: #70e0a0;
	font-size: 0.85rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;

	&:hover {
		background: #163522;
		box-shadow: 4px 4px 0 #1d5e3a;
		transform: translate(-1px, -1px);
	}

	&:disabled {
		opacity: 0.45;
		transform: none;
	}
`;

const PreviewLabel = styled("label")`
	display: block;
	margin: 1.5rem 0 0.5rem;
	color: #d7d4cc;
	font-size: 0.8rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
`;

const ClipboardPreview = styled("textarea")`
	width: 100%;
	min-height: 18rem;
	padding: 1rem;
	resize: none;
	border: 2px solid #2b4638;
	border-radius: 0;
	background: #0a0e0c;
	box-shadow: inset 0 0 0 1px rgb(217 164 65 / 8%);
	color: #d7d4cc;
	font: 0.875rem/1.6 "Courier New", ui-monospace, SFMono-Regular, Consolas, monospace;
	outline: none;

	&:focus,
	&:focus-visible {
		border-color: #526d5b;
		outline: none;
		box-shadow: inset 0 0 0 1px rgb(82 109 91 / 35%);
	}
`;

const PreviewArea = styled("div")`
	width: 100%;
	max-height: 0;
	overflow: hidden;
	opacity: 0;
	transform: translateY(-0.5rem);
	transition:
		max-height 420ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 180ms ease,
		transform 420ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		max-height: none;
		opacity: 1;
		transform: none;
		transition: none;
	}
`;

const PreviewSection = (props: PreviewSectionProps) => {
	let previewElement: HTMLDivElement | undefined;
	let frameId: number | undefined;
	let transitionTimer: number | undefined;

	onMount(() => {
		if (!previewElement) {
			return;
		}

		const contentHeight = previewElement.scrollHeight;
		void previewElement.offsetHeight;

		frameId = window.requestAnimationFrame(() => {
			if (!previewElement) {
				return;
			}

			previewElement.style.maxHeight = `${contentHeight}px`;
			previewElement.style.opacity = "1";
			previewElement.style.transform = "translateY(0)";

			transitionTimer = window.setTimeout(() => {
				if (previewElement) {
					previewElement.style.maxHeight = "none";
				}
			}, 450);
		});
	});

	onCleanup(() => {
		if (frameId !== undefined) {
			window.cancelAnimationFrame(frameId);
		}

		if (transitionTimer !== undefined) {
			window.clearTimeout(transitionTimer);
		}
	});

	return <PreviewArea ref={previewElement}>{props.children}</PreviewArea>;
};

export default (props: HuntImporterProps) => {
	return (
		<Card>
			<SectionTitle>Importar Analyser</SectionTitle>
			<ClipboardButton type="button" onClick={props.onReadClipboard} disabled={props.readingClipboard}>
				{props.readingClipboard ? "Lendo clipboard..." : "Colar do clipboard"}
			</ClipboardButton>
			<Show when={props.clipboardText}>
				<PreviewSection>
					<PreviewLabel for="hunt-analyser">Conteúdo capturado</PreviewLabel>
					<ClipboardPreview id="hunt-analyser" value={props.clipboardText} readonly />
					<SaveButton type="button" onClick={props.onSave} disabled={props.saving}>
						{props.saving ? "Salvando..." : "Salvar resultado"}
					</SaveButton>
				</PreviewSection>
			</Show>
		</Card>
	);
};
