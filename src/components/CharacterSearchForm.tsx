import { styled } from "solid-styled-components";
import type { CharacterSearchFormProps } from "@/types/character";

const Form = styled("form")`
	display: flex;
	gap: 0.75rem;

	@media (max-width: 600px) {
		flex-direction: column;
	}
`;

const Input = styled("input")`
	flex: 1;
	min-width: 0;
	padding: 0.75rem 1rem;
	border: 1px solid rgb(255 255 255 / 10%);
	border-radius: 0;
	background: #111318;
	color: #f4f1ea;
	outline: none;

	&:focus {
		border-color: #d9a441;
	}
`;

const Button = styled("button")`
	padding: 0.75rem 1.25rem;
	border: 0;
	border-radius: 0;
	background: #d9a441;
	color: #17130c;
	font-weight: 600;
	cursor: pointer;

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

export default (props: CharacterSearchFormProps) => {
	return (
		<Form onSubmit={props.onSubmit}>
			<label hidden for="character-name">
				Nick do personagem
			</label>
			<Input
				id="character-name"
				type="text"
				value={props.value}
				onInput={props.onInput}
				placeholder="Digite o nick do personagem"
				autocomplete="off"
				required
			/>
			<Button type="submit" disabled={props.loading}>
				{props.loading ? "Buscando..." : "Buscar personagem"}
			</Button>
		</Form>
	);
};
