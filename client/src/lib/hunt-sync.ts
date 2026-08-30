import { database } from "@/lib/database";
import { validateHuntPartyReport } from "@/lib/hunt-party";
import { getPartyHuntFingerprint } from "@/lib/hunt-party-fingerprint";
import type { HuntRecord, HuntSyncMutation } from "@/types/hunt-common";
import type { ParsedHuntParty } from "@/types/hunt-party";

const defaultSyncAPIURL = import.meta.env.DEV ? "http://localhost:8080" : `${window.location.origin}/api`;
const syncAPIURL = (import.meta.env.VITE_SYNC_API_URL?.trim() || defaultSyncAPIURL).replace(/\/+$/, "");
const cursorStateKey = "party-hunts-cursor";
const maxPushBatch = 500;
const listeners = new Set<() => void>();
let sessionSyncAPIKey = "";
let activeSync: Promise<void> | undefined;
let syncRequested = false;

type PushResponse = {
	accepted: string[];
	server_time: number;
};

type PulledHunt = {
	fingerprint: string;
	payload: unknown;
	version: number;
	updated_at: number;
	deleted: boolean;
};

type PullResponse = {
	hunts: PulledHunt[];
	cursor: number;
	has_more: boolean;
};

const getSessionSyncAPIKey = () => sessionSyncAPIKey;

const removeSessionSyncAPIKey = () => {
	sessionSyncAPIKey = "";
};

const saveSyncAPIKey = (apiKey: string) => {
	sessionSyncAPIKey = apiKey.trim();
	return true;
};

const hasStoredSyncAPIKey = () => {
	const apiKey = getSessionSyncAPIKey();
	if (apiKey.length === 0) {
		return false;
	}
	if (apiKey.length < 32) {
		removeSessionSyncAPIKey();
		return false;
	}
	return true;
};

const removeRejectedSyncAPIKey = (response: Response, sentAPIKey: string) => {
	if (sentAPIKey && (response.status === 401 || response.status === 403)) {
		removeSessionSyncAPIKey();
	}
};

const createPartyHuntUpsertMutation = (record: HuntRecord, party: ParsedHuntParty): HuntSyncMutation => {
	if (!record.fingerprint) {
		throw new Error("Party Hunt sem fingerprint.");
	}
	return {
		fingerprint: record.fingerprint,
		mutationId: crypto.randomUUID(),
		action: "upsert",
		sessionData: party.sessionData,
		members: party.members.map((member) => member.name),
		payload: { createdAt: record.createdAt, rawText: record.rawText },
	};
};

const createPartyHuntDeleteMutation = (fingerprint: string): HuntSyncMutation => ({
	fingerprint,
	mutationId: crypto.randomUUID(),
	action: "delete",
});

const requestJSON = async <Response>(path: string, init?: RequestInit): Promise<Response> => {
	const apiKey = getSessionSyncAPIKey();
	const authHeaders: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
	const response = await fetch(`${syncAPIURL}${path}`, {
		...init,
		headers: {
			Accept: "application/json",
			...authHeaders,
			...init?.headers,
		},
	});
	if (!response.ok) {
		removeRejectedSyncAPIKey(response, apiKey);
		throw new Error(`Sync respondeu HTTP ${response.status}.`);
	}
	return response.json() as Promise<Response>;
};

const pushPendingHunts = async () => {
	if (!hasStoredSyncAPIKey()) {
		return;
	}
	while (true) {
		const mutations = await database.syncOutbox.limit(maxPushBatch).toArray();
		if (mutations.length === 0) {
			return;
		}

		const response = await requestJSON<PushResponse>("/v1/sync/push", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				hunts: mutations.map((mutation) =>
					mutation.action === "delete"
						? { fingerprint: mutation.fingerprint, deleted: true }
						: {
								fingerprint: mutation.fingerprint,
								session_data: mutation.sessionData,
								members: mutation.members,
								payload: mutation.payload,
							},
				),
			}),
		});
		const accepted = new Set(response.accepted);
		await database.transaction("rw", database.syncOutbox, async () => {
			for (const mutation of mutations) {
				if (!accepted.has(mutation.fingerprint)) {
					continue;
				}
				const current = await database.syncOutbox.get(mutation.fingerprint);
				if (current?.mutationId === mutation.mutationId) {
					await database.syncOutbox.delete(mutation.fingerprint);
				}
			}
		});
	}
};

const parsePulledRecord = async (hunt: PulledHunt): Promise<HuntRecord | undefined> => {
	if (!hunt.payload || typeof hunt.payload !== "object") {
		return undefined;
	}
	const payload = hunt.payload as { createdAt?: unknown; rawText?: unknown };
	if (typeof payload.rawText !== "string") {
		return undefined;
	}
	const validation = validateHuntPartyReport(payload.rawText);
	if (validation.errors.length > 0 || (await getPartyHuntFingerprint(validation.parsed)) !== hunt.fingerprint) {
		return undefined;
	}
	const createdAt =
		typeof payload.createdAt === "string" && !Number.isNaN(Date.parse(payload.createdAt))
			? payload.createdAt
			: new Date(hunt.updated_at).toISOString();
	return {
		id: hunt.fingerprint,
		fingerprint: hunt.fingerprint,
		createdAt,
		rawText: payload.rawText,
	};
};

const mergePullPage = async (page: PullResponse) => {
	const parsedRecords = new Map<string, HuntRecord>();
	for (const hunt of page.hunts) {
		if (!hunt.deleted) {
			const record = await parsePulledRecord(hunt);
			if (record) {
				parsedRecords.set(hunt.fingerprint, record);
			}
		}
	}

	let changed = false;
	await database.transaction("rw", database.hunts, database.syncOutbox, database.syncState, async () => {
		for (const hunt of page.hunts) {
			if (await database.syncOutbox.get(hunt.fingerprint)) {
				continue;
			}
			const matchingKeys = await database.hunts.where("fingerprint").equals(hunt.fingerprint).primaryKeys();
			if (hunt.deleted) {
				if (matchingKeys.length > 0) {
					await database.hunts.bulkDelete(matchingKeys);
					changed = true;
				}
				continue;
			}

			const record = parsedRecords.get(hunt.fingerprint);
			if (!record) {
				continue;
			}
			const obsoleteKeys = matchingKeys.filter((key) => key !== record.id);
			if (obsoleteKeys.length > 0) {
				await database.hunts.bulkDelete(obsoleteKeys);
			}
			await database.hunts.put(record);
			changed = true;
		}
		await database.syncState.put({ key: cursorStateKey, value: String(page.cursor) });
	});
	return changed;
};

const pullRemoteHunts = async () => {
	let cursor = Number((await database.syncState.get(cursorStateKey))?.value || 0);
	let changed = false;
	while (true) {
		const page = await requestJSON<PullResponse>(`/v1/sync/pull?since=${encodeURIComponent(cursor)}`);
		changed = (await mergePullPage(page)) || changed;
		if (!page.has_more) {
			return changed;
		}
		if (page.cursor <= cursor) {
			throw new Error("Cursor de sincronização não avançou.");
		}
		cursor = page.cursor;
	}
};

const runSynchronization = async () => {
	await database.open();
	await pushPendingHunts();
	if (await pullRemoteHunts()) {
		for (const listener of listeners) {
			listener();
		}
	}
};

const synchronizePartyHunts = (): Promise<void> => {
	syncRequested = true;
	if (!activeSync) {
		activeSync = (async () => {
			while (syncRequested) {
				syncRequested = false;
				await runSynchronization();
			}
		})().finally(() => {
			activeSync = undefined;
			if (syncRequested) {
				void synchronizePartyHunts().catch(() => undefined);
			}
		});
	}
	return activeSync;
};

const consumeEventStream = async (signal: AbortSignal, onConnected: () => void) => {
	const apiKey = getSessionSyncAPIKey();
	const authHeaders: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
	const response = await fetch(`${syncAPIURL}/v1/sync/events`, {
		headers: {
			Accept: "text/event-stream",
			...authHeaders,
		},
		signal,
	});
	if (!response.ok || !response.body) {
		removeRejectedSyncAPIKey(response, apiKey);
		throw new Error(`SSE respondeu HTTP ${response.status}.`);
	}
	onConnected();

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const chunk = await reader.read();
		if (chunk.done) {
			throw new Error("Conexão SSE encerrada.");
		}
		buffer += decoder.decode(chunk.value, { stream: true });
		let boundary = buffer.match(/\r?\n\r?\n/);
		while (boundary?.index !== undefined) {
			const message = buffer.slice(0, boundary.index).replace(/\r\n/g, "\n");
			buffer = buffer.slice(boundary.index + boundary[0].length);
			const event = message
				.split("\n")
				.find((line) => line.startsWith("event:"))
				?.slice("event:".length)
				.trim();
			if (event === "ready" || event === "sync") {
				await synchronizePartyHunts();
			}
			boundary = buffer.match(/\r?\n\r?\n/);
		}
	}
};

const startPartyHuntSync = (onRecordsChanged: () => void) => {
	listeners.add(onRecordsChanged);
	let stopped = false;
	let reconnectDelay = 1_000;
	let controller: AbortController | undefined;
	let reconnectTimer: number | undefined;

	const connect = async () => {
		try {
			await synchronizePartyHunts();
			if (stopped) return;
			controller = new AbortController();
			await consumeEventStream(controller.signal, () => {
				reconnectDelay = 1_000;
			});
		} catch (error) {
			if (!stopped) {
				console.warn("Sincronização de Party Hunts temporariamente indisponível.", error);
			}
		}
		if (!stopped) {
			reconnectTimer = window.setTimeout(() => {
				reconnectTimer = undefined;
				void connect();
			}, reconnectDelay);
			reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
		}
	};

	void connect();
	return () => {
		stopped = true;
		listeners.delete(onRecordsChanged);
		controller?.abort();
		if (reconnectTimer !== undefined) {
			window.clearTimeout(reconnectTimer);
		}
	};
};

export {
	createPartyHuntDeleteMutation,
	createPartyHuntUpsertMutation,
	hasStoredSyncAPIKey,
	saveSyncAPIKey,
	startPartyHuntSync,
	synchronizePartyHunts,
};
