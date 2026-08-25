import { styled } from "solid-styled-components";

import type { CharacterCardProps } from "@/types/character";

const Card = styled("article")`
	margin-top: 1.5rem;
	padding: 1.25rem;
	border: 1px solid rgb(217 164 65 / 30%);
	border-radius: 0;
	background: #1b1e27;
`;

const Found = styled("p")`
	margin: 0 0 0.25rem;
	color: #d9a441;
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.18em;
`;

const Name = styled("h2")`
	margin: 0;
	font-size: 1.5rem;
`;

const Details = styled("dl")`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 1rem;
	margin: 1.5rem 0 0;

	@media (max-width: 600px) {
		grid-template-columns: repeat(2, 1fr);
	}
`;

const Detail = styled("div")`
	dt {
		color: #777b88;
		font-size: 0.75rem;
	}

	dd {
		margin: 0.25rem 0 0;
		font-weight: 600;
	}
`;

const AddButton = styled("button")`
	width: 100%;
	margin-top: 1.5rem;
	padding: 0.75rem;
	border: 1px solid rgb(217 164 65 / 50%);
	border-radius: 0;
	background: transparent;
	color: #edbd5a;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background: #d9a441;
		color: #17130c;
	}
`;

export default (props: CharacterCardProps) => {
	return (
		<Card>
			<Found>Personagem encontrado</Found>
			<Name>{props.character.name}</Name>
			<Details>
				<Detail>
					<dt>Level</dt>
					<dd>{props.character.level}</dd>
				</Detail>
				<Detail>
					<dt>Vocação</dt>
					<dd>{props.character.vocation}</dd>
				</Detail>
				<Detail>
					<dt>Mundo</dt>
					<dd>{props.character.world}</dd>
				</Detail>
				<Detail>
					<dt>Guilda</dt>
					<dd>{props.character.guild ?? "—"}</dd>
				</Detail>
			</Details>
			<AddButton type="button" onClick={props.onAdd}>
				Adicionar personagem
			</AddButton>
		</Card>
	);
};
