import type { JSX } from "solid-js";
import type { HuntRecord, View } from "@/types/hunt-common";

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

export type APIKeyModalProps = {
	open: boolean;
	onSubmit: (apiKey: string) => boolean;
	onCancel: () => void;
};

export type HuntViewerProps = {
	history: HuntRecord[];
	loading: boolean;
	deleting: boolean;
	onImport: () => void;
	onDelete: (id: string) => void;
};

export type DashboardProps = {
	history: HuntRecord[];
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
