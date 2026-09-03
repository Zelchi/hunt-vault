import type { IconProps } from "../type/components";

const SwordIcon = (props: IconProps) => {
	const size = props.size ?? 24;
	return (
		<svg aria-hidden="true" fill="none" height={size} shape-rendering="geometricPrecision" viewBox="0 0 24 24" width={size}>
			<path
				d="m12 2.5 7.5 3v5.8c0 4.6-2.9 8.5-7.5 10.2-4.6-1.7-7.5-5.6-7.5-10.2V5.5l7.5-3Z"
				stroke="currentColor"
				stroke-linecap="square"
				stroke-linejoin="miter"
				stroke-width="1.7"
			/>
			<path d="m8 8 8 8m0-8-8 8" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.8" />
			<path d="M6.5 10.5H10m4 0h3.5M6.5 13.5H10m4 0h3.5" stroke="currentColor" stroke-linecap="square" stroke-width="1.4" />
			<path d="m12 10.5 1.5 1.5-1.5 1.5-1.5-1.5 1.5-1.5Z" fill="currentColor" />
		</svg>
	);
};

const ScrollIcon = (props: IconProps) => {
	const size = props.size ?? 28;
	return (
		<svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
			<path
				d="M6 3h9l3 3v15H6V3Zm9 0v4h3M9 12h6M9 16h6"
				stroke="currentColor"
				stroke-linecap="square"
				stroke-linejoin="miter"
				stroke-width="1.7"
			/>
		</svg>
	);
};

const ChevronLeftIcon = (props: IconProps) => {
	const size = props.size ?? 22;
	return (
		<svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
			<path d="m14 4-8 8 8 8" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" />
		</svg>
	);
};

const ChevronRightIcon = (props: IconProps) => {
	const size = props.size ?? 22;
	return (
		<svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
			<path d="m10 4 8 8-8 8" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" />
		</svg>
	);
};

const SearchIcon = (props: IconProps) => {
	const size = props.size ?? 24;
	return (
		<svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
			<circle cx="10.5" cy="10.5" r="5.75" stroke="currentColor" stroke-linecap="square" stroke-width="1.7" />
			<path d="m15 15 5 5" stroke="currentColor" stroke-linecap="square" stroke-width="1.7" />
		</svg>
	);
};

const WarningIcon = (props: IconProps) => {
	const size = props.size ?? 25;
	return (
		<svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
			<path d="m12 3 9 17H3L12 3Z" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.7" />
			<path d="M12 9v5m0 3h.01" stroke="currentColor" stroke-linecap="square" stroke-width="1.8" />
		</svg>
	);
};

export { ChevronLeftIcon, ChevronRightIcon, ScrollIcon, SearchIcon, SwordIcon, WarningIcon };
