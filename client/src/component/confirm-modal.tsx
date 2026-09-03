import { Show } from "solid-js";
import { WarningIcon } from "@/component/icons";
import * as styles from "@/style/confirm-modal.css";
import type { ConfirmModalProps } from "@/type/components";

export default (props: ConfirmModalProps) => {
	const handleBackdropClick = (event: MouseEvent) => {
		if (!props.confirming && event.target === event.currentTarget) {
			props.onCancel();
		}
	};

	const handleBackdropKeyDown = (event: KeyboardEvent) => {
		if (!props.confirming && (event.key === "Enter" || event.key === " ")) {
			props.onCancel();
		}
	};

	return (
		<Show when={props.open}>
			<dialog
				class={styles.backdrop}
				open
				aria-modal="true"
				aria-labelledby="confirm-modal-title"
				aria-describedby="confirm-modal-message"
				onClick={handleBackdropClick}
				onKeyDown={handleBackdropKeyDown}
			>
				<section class={styles.dialog}>
					<div class={styles.modalMark}>
						<WarningIcon size={25} />
					</div>
					<h2 class={styles.title} id="confirm-modal-title">
						{props.title}
					</h2>
					<p class={styles.message} id="confirm-modal-message">
						{props.message}
					</p>
					<div class={styles.actions}>
						<button class={styles.cancelButton} type="button" onClick={props.onCancel} disabled={props.confirming}>
							Cancelar
						</button>
						<button class={styles.confirmButton} type="button" onClick={props.onConfirm} disabled={props.confirming}>
							{props.confirming ? "Excluindo..." : "Excluir caçada"}
						</button>
					</div>
				</section>
			</dialog>
		</Show>
	);
};
