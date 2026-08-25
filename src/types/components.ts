import type { JSX } from "solid-js";
import type { HuntRecord, View } from "@/types/hunt-solo";

export type IconProps = {
	size?: number;
};

export type AppShellProps = {
	view: View;
	children: JSX.Element;
	onViewChange: (view: View) => void;
};

export type HuntImporterProps = {
	clipboardText: string;
	readingClipboard: boolean;
	saving: boolean;
	onReadClipboard: () => void;
	onSave: () => void;
};

export type HuntViewerProps = {
	history: HuntRecord[];
	currentIndex: number;
	loading: boolean;
	deleting: boolean;
	onPrevious: () => void;
	onNext: () => void;
	onImport: () => void;
	onDelete: (id: string) => void;
};

export type ConfirmModalProps = {
	open: boolean;
	confirming: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
};

export type PreviewSectionProps = {
	children: JSX.Element;
};
