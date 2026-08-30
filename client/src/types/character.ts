import type { JSX } from "solid-js";

export type Character = {
	name: string;
	level: number;
	vocation: string;
	world: string;
	guild?: string;
};

export type CharacterCardProps = {
	character: Character;
	onAdd: () => void;
};

export type CharacterSearchFormProps = {
	value: string;
	loading: boolean;
	onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
	onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent>;
};
