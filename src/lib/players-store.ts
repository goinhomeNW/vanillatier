import { useSyncExternalStore } from "react";
import type { Player, Region, TierKey } from "./tiers";

const KEY = "mcranks.players.v1";

function seed(): Player[] {
  // empty by default — admins add players
  return [];
}

const EMPTY: Player[] = [];
let cache: Player[] = EMPTY;
let cacheRaw: string | null = null;

function read(): Player[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      raw = JSON.stringify(s);
      localStorage.setItem(KEY, raw);
    }
    if (raw !== cacheRaw) {
      cacheRaw = raw;
      cache = JSON.parse(raw) as Player[];
    }
    return cache;
  } catch {
    return EMPTY;
  }
}

const listeners = new Set<() => void>();

function write(players: Player[]) {
  const raw = JSON.stringify(players);
  cacheRaw = raw;
  cache = players;
  localStorage.setItem(KEY, raw);
  listeners.forEach((l) => l());
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      cacheRaw = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePlayers(): Player[] {
  return useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY,
  );
}

export const playersStore = {
  all(): Player[] {
    return read();
  },
  get(id: string): Player | undefined {
    return read().find((p) => p.id === id);
  },
  upsert(p: Player) {
    const all = read();
    const i = all.findIndex((x) => x.id === p.id);
    const now = Date.now();
    if (i >= 0) all[i] = { ...p, updatedAt: now };
    else all.push({ ...p, createdAt: now, updatedAt: now });
    write(all);
  },
  remove(id: string) {
    write(read().filter((p) => p.id !== id));
  },
  setRetired(id: string, retired: boolean) {
    const all = read();
    const i = all.findIndex((p) => p.id === id);
    if (i < 0) return;
    all[i] = { ...all[i], retired, updatedAt: Date.now() };
    write(all);
  },
  replaceAll(players: Player[]) {
    write(players);
  },
};

export function newPlayer(input: {
  username: string;
  uuid?: string;
  region: Region;
  currentTier: TierKey | null;
  peakTier: TierKey | null;
  retired?: boolean;
  notes?: string;
  avatarUrl?: string;
}): Player {
  return {
    id: crypto.randomUUID(),
    username: input.username.trim(),
    uuid: (input.uuid ?? "").trim(),
    region: input.region,
    currentTier: input.currentTier,
    peakTier: input.peakTier ?? input.currentTier,
    retired: !!input.retired,
    notes: input.notes,
    avatarUrl: input.avatarUrl,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
