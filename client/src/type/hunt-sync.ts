export type PushResponse = {
	accepted: string[];
	server_time: number;
};

export type PulledHunt = {
	fingerprint: string;
	payload: unknown;
	version: number;
	updated_at: number;
	deleted: boolean;
};

export type PullResponse = {
	hunts: PulledHunt[];
	cursor: number;
	has_more: boolean;
};
