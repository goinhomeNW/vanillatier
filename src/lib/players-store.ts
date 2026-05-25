import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Player, Region, TierKey } from "./tiers";

/* ============================================================
 * Shared players store backed by Lovable Cloud (Supabase).
 * Every visitor sees the same data. Realtime keeps it in sync.
 * ============================================================ */

const EMPTY: Player[] = [];
let cache: Player[] = EMPTY;
let initialized = false;
const listeners = new Set<() => void>();

type Row = {
  id: string;
  username: string;
  region: string;
  current_tier: string | null;
  peak_tier: string | null;
  retired: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function rowToPlayer(r: Row): Player {
  return {
    id: r.id,
    username: r.username,
    uuid: "",
    region: r.region as Region,
    currentTier: (r.current_tier ?? null) as TierKey | null,
    peakTier: (r.peak_tier ?? null) as TierKey | null,
    retired: !!r.retired,
    notes: r.notes ?? undefined,
    avatarUrl: undefined,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

function playerToInsert(p: Partial<Player> & { username: string; region: Region }) {
  return {
    username: p.username.trim(),
    region: p.region,
    current_tier: p.currentTier ?? null,
    peak_tier: p.peakTier ?? null,
    retired: !!p.retired,
    notes: p.notes ?? null,
  };
}

function emit(next: Player[]) {
  cache = next;
  listeners.forEach((l) => l());
}

function sortByUpdated(arr: Player[]): Player[] {
  return [...arr].sort((a, b) => b.updatedAt - a.updatedAt);
}

async function loadAll() {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[players-store] load error", error);
    return;
  }
  emit((data as Row[]).map(rowToPlayer));
}

let channel: ReturnType<typeof supabase.channel> | null = null;

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  loadAll();
  channel = supabase
    .channel("players-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "players" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const p = rowToPlayer(payload.new as Row);
          if (cache.some((x) => x.id === p.id)) return;
          emit(sortByUpdated([p, ...cache]));
        } else if (payload.eventType === "UPDATE") {
          const p = rowToPlayer(payload.new as Row);
          emit(sortByUpdated(cache.map((x) => (x.id === p.id ? p : x))));
        } else if (payload.eventType === "DELETE") {
          const id = (payload.old as { id: string }).id;
          emit(cache.filter((x) => x.id !== id));
        }
      },
    )
    .subscribe();
}

function subscribe(cb: () => void) {
  ensureInit();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function usePlayers(): Player[] {
  return useSyncExternalStore(
    subscribe,
    () => cache,
    () => EMPTY,
  );
}

export const playersStore = {
  all(): Player[] {
    ensureInit();
    return cache;
  },
  get(id: string): Player | undefined {
    return cache.find((p) => p.id === id);
  },
  async upsert(p: Player) {
    const payload = playerToInsert(p);
    const existing = cache.find((x) => x.id === p.id);
    if (existing) {
      const { data, error } = await supabase
        .from("players")
        .update(payload)
        .eq("id", p.id)
        .select()
        .single();
      if (error) {
        console.error("[players-store] update error", error);
        throw new Error(error.message);
      }
      const updated = rowToPlayer(data as Row);
      emit(sortByUpdated(cache.map((x) => (x.id === updated.id ? updated : x))));
    } else {
      const { data, error } = await supabase
        .from("players")
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error("[players-store] insert error", error);
        throw new Error(error.message);
      }
      const inserted = rowToPlayer(data as Row);
      emit(sortByUpdated([inserted, ...cache.filter((x) => x.id !== inserted.id)]));
    }
  },
  async remove(id: string) {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) {
      console.error("[players-store] delete error", error);
      return;
    }
    emit(cache.filter((p) => p.id !== id));
  },
  async setRetired(id: string, retired: boolean) {
    const { data, error } = await supabase
      .from("players")
      .update({ retired })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("[players-store] retire error", error);
      return;
    }
    const updated = rowToPlayer(data as Row);
    emit(sortByUpdated(cache.map((x) => (x.id === updated.id ? updated : x))));
  },
  async replaceAll(players: Player[]) {
    // Delete every existing row, then insert provided players.
    const { error: delErr } = await supabase
      .from("players")
      .delete()
      .not("id", "is", null);
    if (delErr) {
      console.error("[players-store] replaceAll delete error", delErr);
      return;
    }
    if (players.length === 0) {
      emit([]);
      return;
    }
    const { data, error } = await supabase
      .from("players")
      .insert(players.map((p) => playerToInsert(p)))
      .select();
    if (error) {
      console.error("[players-store] replaceAll insert error", error);
      return;
    }
    emit(sortByUpdated((data as Row[]).map(rowToPlayer)));
  },
  async refresh() {
    await loadAll();
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
  // The DB assigns the id on insert; we generate a placeholder so the
  // existing call sites that pass the object straight into upsert keep
  // working. upsert() detects "not in cache" and inserts a new row.
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
