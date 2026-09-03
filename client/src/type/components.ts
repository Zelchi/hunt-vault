import type { Accessor, JSX } from "solid-js";
import type { EntitySearchResult } from "@/type/entity";
import type { CreatureSummary, ImbuementSummary, ItemSummary } from "@/type/entity-details";
import type { HuntRecord, View } from "@/type/hunt-common";
import type { MetricConfig } from "@/type/hunt-dashboard";
import type { TibiaWatchRespawnDetails } from "@/type/tibiawatch";

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

export type CustomScrollbarProps = {
	children: JSX.Element;
	onScroll?: (event: Event) => void;
	variant?: "main" | "nested";
	scrollbarVariant?: "default" | "minimal";
	orientation?: "vertical" | "horizontal";
	class?: string;
	viewportClass?: string;
	viewportRole?: "listbox";
	viewportAriaLabel?: string;
	id?: string;
	ariaLabel?: string;
};

export type EntityDetailPanelProps = {
	entity: EntitySearchResult;
	onClose: () => void;
};

export type CreatureSummaryViewProps = {
	summary: CreatureSummary;
};

export type ItemSummaryViewProps = {
	summary?: ItemSummary;
	sourceUrl?: string;
};

export type ImbuementSummaryViewProps = {
	summary?: ImbuementSummary;
	sourceUrl?: string;
};

export type HuntSummaryViewProps = {
	details: TibiaWatchRespawnDetails;
};

export type HuntDetailField = {
	label: string;
	value: string;
};

export type EntitySearchProps = {
	onSelect: (result: EntitySearchResult) => void;
};

export type SearchResultButtonProps = {
	result: EntitySearchResult;
	isActive: () => boolean;
	onHover: () => void;
	onSelect: (result: EntitySearchResult) => void;
};

export type MetricChartProps = {
	config: MetricConfig;
	values: Accessor<number[]>;
};

export type KpiColor = "green" | "orange" | "red" | "lightGreen";

export type KpiCardProps = {
	label: string;
	value: string;
	detail?: string;
	color?: KpiColor;
};

export type StorageErrorModalProps = {
	open: boolean;
	onClose: () => void;
};

export type NavbarProps = {
	view: View;
	onViewChange: (view: View) => void;
};
