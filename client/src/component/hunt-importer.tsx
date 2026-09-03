import { onCleanup, onMount, Show } from "solid-js";
import * as styles from "@/style/hunt-importer.css";
import type { HuntImporterProps, PreviewSectionProps } from "@/type/components";

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

	return (
		<div class={styles.previewArea} ref={previewElement}>
			{props.children}
		</div>
	);
};

export default (props: HuntImporterProps) => {
	return (
		<section class={styles.card}>
			<h1 class={styles.sectionTitle}>Importar Analyser</h1>
			<button class={styles.clipboardButton} type="button" onClick={props.onReadClipboard} disabled={props.readingClipboard}>
				{props.readingClipboard ? "Lendo clipboard..." : "Colar do clipboard"}
			</button>
			<Show when={props.clipboardText}>
				<PreviewSection>
					<label class={styles.previewLabel} for="hunt-analyser">
						Conteúdo capturado
					</label>
					<textarea class={styles.clipboardPreview} id="hunt-analyser" value={props.clipboardText} readonly />
					<button class={styles.saveButton} type="button" onClick={props.onSave} disabled={props.saving}>
						{props.saving ? "Salvando..." : "Salvar resultado"}
					</button>
				</PreviewSection>
			</Show>
		</section>
	);
};
