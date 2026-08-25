import Dexie, { type Table } from "dexie";

import type { HuntRecord } from "@/types/hunt-solo";

class HuntVaultDatabase extends Dexie {
	hunts!: Table<HuntRecord, string>;
	constructor() {
		super("HuntVaultDatabase");
		this.version(1).stores({
			hunts: "id, createdAt",
		});
	}
}

export const database = new HuntVaultDatabase();
