import { Show } from "solid-js";
import { WarningIcon } from "@/components/icons";
import * as styles from "@/styles/confirm-modal.css";

type StorageErrorModalProps = {
	open: boolean;
	onClose: () => void;
};

export default (props: StorageErrorModalProps) => {
	return (
		<Show when={props.open}>
			<dialog
				class={styles.backdrop}
				open
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="storage-error-modal-title"
				aria-describedby="storage-error-modal-message"
			>
				<section class={styles.dialog}>
					<div class={styles.modalMark}>
						<WarningIcon size={25} />
					</div>
					<h2 class={styles.title} id="storage-error-modal-title">
						Armazenamento indisponível
					</h2>
					<p class={styles.message} id="storage-error-modal-message">
						Este navegador não permitiu o acesso ao IndexedDB. O Hunt Vault precisa desse recurso para salvar e exibir seu
						histórico de caçadas. Ative o armazenamento deste site, desative o modo privado ou bloqueios de conteúdo e
						recarregue a página.
					</p>
					<div class={styles.singleAction}>
						<button class={styles.confirmButton} type="button" onClick={props.onClose}>
							Entendi
						</button>
					</div>
				</section>
			</dialog>
		</Show>
	);
};
