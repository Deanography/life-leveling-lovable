import Dexie, { type Table } from "dexie";

/** Single-document persistence for Phase 0. The whole game state is one JSON blob. */
export interface KV {
  key: string;
  value: string;
}

class LifeLevelingDB extends Dexie {
  kv!: Table<KV, string>;
  constructor() {
    super("life-leveling");
    this.version(1).stores({ kv: "key" });
  }
}

export const db = typeof indexedDB !== "undefined" ? new LifeLevelingDB() : null;

export const dexieStorage = {
  getItem: async (name: string) => {
    if (!db) return null;
    const row = await db.kv.get(name);
    return row?.value ?? null;
  },
  setItem: async (name: string, value: string) => {
    if (!db) return;
    await db.kv.put({ key: name, value });
  },
  removeItem: async (name: string) => {
    if (!db) return;
    await db.kv.delete(name);
  },
};
