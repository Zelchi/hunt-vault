import Dexie, { type Table } from "dexie";

import type { HuntRecord, HuntSyncMutation, HuntSyncState } from "@/types/hunt-common";

class HuntVaultDatabase extends Dexie {
	hunts!: Table<HuntRecord, string>;
	syncOutbox!: Table<HuntSyncMutation, string>;
	syncState!: Table<HuntSyncState, string>;

	constructor() {
		super("HuntVaultDatabase");
		this.version(1).stores({
			hunts: "id, createdAt",
		});
		this.version(2).stores({
			hunts: "id, createdAt, fingerprint",
		});
		this.version(3).stores({
			hunts: "id, createdAt, fingerprint",
			syncOutbox: "fingerprint",
			syncState: "key",
		});
	}
}

export const database = new HuntVaultDatabase();
