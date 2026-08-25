import { Show } from "solid-js";
import { styled } from "solid-styled-components";
import { WarningIcon } from "@/components/Icons";
import type { ConfirmModalProps } from "@/types/components";

const Backdrop = styled("div")`
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	background: rgb(3 6 5 / 82%);
	backdrop-filter: blur(2px);
	animation: modal-backdrop-in 160ms ease-out;

	@keyframes modal-backdrop-in {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}
`;

const Dialog = styled("section")`
	display: flex;
	align-items: center;
	flex-direction: column;
	width: min(100%, 30rem);
	padding: 1.5rem;
	border: 2px solid #b85a51;
	border-radius: 0;
	background: #121816;
	box-shadow: 6px 6px 0 #050706;
	animation: modal-dialog-in 180ms ease-out;

	@keyframes modal-dialog-in {
		from {
			opacity: 0;
			transform: translateY(-0.75rem);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		padding: 1.25rem;
	}
`;

const ModalMark = styled("div")`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.75rem;
	height: 2.75rem;
	margin-bottom: 1rem;
	border: 2px solid #b85a51;
	border-radius: 0;
	background: #2b1514;
	color: #f08e83;
	font-size: 1.25rem;
	font-weight: 700;
`;

const Title = styled("h2")`
	margin: 0;
	color: #f4f1ea;
	font-size: 1.25rem;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

const Message = styled("p")`
	margin: 0.75rem 0 1.5rem;
	color: #a5b2a7;
	font-size: 0.9rem;
	line-height: 1.6;
`;

const Actions = styled("div")`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.75rem;

	@media (max-width: 420px) {
		grid-template-columns: 1fr;
	}
`;

const ActionButton = styled("button")`
	padding: 0.75rem 1rem;
	border: 2px solid;
	border-radius: 0;
	font-size: 0.8rem;
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	cursor: pointer;
	transition: background 150ms ease, color 150ms ease, transform 150ms ease;

	&:disabled {
		cursor: wait;
		opacity: 0.5;
		transform: none;
	}
`;

const CancelButton = styled(ActionButton)`
	border-color: #526d5b;
	background: #101512;
	color: #b7c7ba;

	&:hover:not(:disabled) {
		background: #1a2b22;
		color: #f4f1ea;
		transform: translate(-1px, -1px);
	}
`;

const ConfirmButton = styled(ActionButton)`
	border-color: #b85a51;
	background: #2b1514;
	color: #f08e83;

	&:hover:not(:disabled) {
		background: #4a1d1b;
		color: #ffc0b9;
		transform: translate(-1px, -1px);
	}
`;

export default (props: ConfirmModalProps) => {
	const handleBackdropClick = (event: MouseEvent) => {
		if (!props.confirming && event.target === event.currentTarget) {
			props.onCancel();
		}
	};

	return (
		<Show when={props.open}>
			<Backdrop onClick={handleBackdropClick}>
				<Dialog
					role="dialog"
					aria-modal="true"
					aria-labelledby="confirm-modal-title"
					aria-describedby="confirm-modal-message"
				>
					<ModalMark>
						<WarningIcon size={25} />
					</ModalMark>
					<Title id="confirm-modal-title">{props.title}</Title>
					<Message id="confirm-modal-message">
						{props.message}
					</Message>
					<Actions>
						<CancelButton
							type="button"
							onClick={props.onCancel}
							disabled={props.confirming}
						>
							Cancelar
						</CancelButton>
						<ConfirmButton
							type="button"
							onClick={props.onConfirm}
							disabled={props.confirming}
						>
							{props.confirming
								? "Excluindo..."
								: "Excluir caçada"}
						</ConfirmButton>
					</Actions>
				</Dialog>
			</Backdrop>
		</Show>
	);
};
