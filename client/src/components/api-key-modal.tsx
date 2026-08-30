import { createSignal, Show } from "solid-js";
import * as styles from "@/styles/api-key-modal.css";
import type { APIKeyModalProps } from "@/types/components";

export default (props: APIKeyModalProps) => {
	const [apiKey, setAPIKey] = createSignal("");
	const [error, setError] = createSignal("");

	const submit = () => {
		const value = apiKey().trim();
		if (value.length < 32) {
			setError("A API Key precisa ter pelo menos 32 caracteres.");
			return;
		}
		if (!props.onSubmit(value)) {
			setError("Não foi possível salvar a API Key neste navegador.");
			return;
		}
		setAPIKey("");
		setError("");
	};

	const cancel = () => {
		setAPIKey("");
		setError("");
		props.onCancel();
	};

	return (
		<Show when={props.open}>
			<dialog
				class={styles.backdrop}
				open
				aria-modal="true"
				aria-labelledby="api-key-modal-title"
				aria-describedby="api-key-modal-message"
				onKeyDown={(event) => {
					if (event.key === "Escape") cancel();
				}}
			>
				<section class={styles.dialog}>
					<div class={styles.modalMark} aria-hidden="true">
						KEY
					</div>
					<h2 class={styles.title} id="api-key-modal-title">
						Chave de sincronização
					</h2>
					<p class={styles.message} id="api-key-modal-message">
						Informe a API Key para enviar esta Party Hunt. Ela ficará disponível somente nesta sessão. Se você cancelar, a
						caçada poderá ser salva localmente sem ser enviada ao servidor.
					</p>
					<label class={styles.label} for="sync-api-key">
						API Key
					</label>
					<input
						class={styles.input}
						id="sync-api-key"
						type="password"
						value={apiKey()}
						autocomplete="off"
						autofocus
						onInput={(event) => {
							setAPIKey(event.currentTarget.value);
							setError("");
						}}
						onKeyDown={(event) => {
							if (event.key === "Enter") submit();
						}}
					/>
					<Show when={error()}>
						<p class={styles.error} role="alert">
							{error()}
						</p>
					</Show>
					<div class={styles.actions}>
						<button class={styles.cancelButton} type="button" onClick={cancel}>
							Cancelar
						</button>
						<button class={styles.submitButton} type="button" onClick={submit}>
							Salvar chave e continuar
						</button>
					</div>
				</section>
			</dialog>
		</Show>
	);
};
