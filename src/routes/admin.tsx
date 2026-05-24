import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";
import {
  ADMIN_USER, isAuthed, login, logout,
} from "@/lib/admin-auth";
import { newPlayer, playersStore, usePlayers } from "@/lib/players-store";
import {
  REGIONS, RETIRABLE_TIERS, TIER_ORDER, avatarFor, isHT, pointsForPlayer,
} from "@/lib/tiers";
import type { Player, Region, TierKey } from "@/lib/tiers";
import {
  Shield, LogOut, Plus, Search, Pencil, Trash2, Power, PowerOff,
  Download, Upload, RefreshCw, Database, X,
} from "lucide-react";
import { TierBadge } from "@/components/TierBadge";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · MCranks" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(isAuthed()); }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <Toaster theme="dark" position="top-right" richColors />
      {authed ? <Dashboard onLogout={() => { logout(); setAuthed(false); }} />
              : <LoginCard onSuccess={() => setAuthed(true)} />}
    </div>
  );
}

/* -------------------- LOGIN -------------------- */

function LoginCard({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-md px-4 py-20">
      <div className="glass-strong rounded-2xl p-8 animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary mb-3">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">Restricted area · MCranks staff only</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (login(user, pass)) {
              toast.success("Welcome back");
              onSuccess();
            } else {
              setError("Invalid credentials");
            }
          }}
          className="space-y-3"
        >
          <Field label="Username">
            <Input value={user} onChange={(e) => setUser(e.target.value)} autoFocus className="bg-secondary/40" />
          </Field>
          <Field label="Password">
            <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="bg-secondary/40" />
          </Field>
          {error && <p className="text-sm text-crimson">{error}</p>}
          <Button type="submit" className="w-full bg-gradient-primary glow-primary border-0 text-primary-foreground font-bold">
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/* -------------------- DASHBOARD -------------------- */

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const players = usePlayers();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<"all" | Region>("all");
  const [status, setStatus] = useState<"all" | "active" | "retired">("all");
  const [editing, setEditing] = useState<Player | "new" | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...players];
    if (q.trim()) list = list.filter((p) => p.username.toLowerCase().includes(q.toLowerCase()));
    if (region !== "all") list = list.filter((p) => p.region === region);
    if (status !== "all") list = list.filter((p) => (status === "retired" ? p.retired : !p.retired));
    return list.sort((a, b) => pointsForPlayer(b) - pointsForPlayer(a));
  }, [players, q, region, status]);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Admin Dashboard</div>
          <h1 className="text-3xl font-black text-gradient">MCranks Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Signed in as <b>{ADMIN_USER}</b></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border/60 bg-secondary/40" onClick={() => setImportOpen(true)}>
            <Database className="h-4 w-4 mr-1.5" /> Sync from Bot
          </Button>
          <Button variant="outline" className="border-border/60 bg-secondary/40" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-1.5" /> Log out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total players" value={players.length} />
        <Stat label="Active" value={players.filter((p) => !p.retired).length} />
        <Stat label="Retired" value={players.filter((p) => p.retired).length} />
        <Stat label="Top points" value={Math.max(0, ...players.map(pointsForPlayer))} />
      </div>

      <div className="glass-strong rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username..." className="pl-9 bg-secondary/40" />
        </div>
        <select value={region} onChange={(e) => setRegion(e.target.value as "all" | Region)} className="h-10 px-3 rounded-md bg-secondary/40 border border-border/60 text-sm font-semibold">
          <option value="all">All regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as "all" | "active" | "retired")} className="h-10 px-3 rounded-md bg-secondary/40 border border-border/60 text-sm font-semibold capitalize">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="retired">Retired</option>
        </select>
        <Button onClick={() => setEditing("new")} className="bg-gradient-primary text-primary-foreground border-0 glow-primary font-bold">
          <Plus className="h-4 w-4 mr-1.5" /> Add player
        </Button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_70px_120px_80px_180px] px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground border-b border-border/60">
          <div>Player</div>
          <div>Region</div>
          <div>Tiers (peak / current)</div>
          <div className="text-right">Points</div>
          <div className="text-right">Actions</div>
        </div>
        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center text-muted-foreground">No players match these filters.</div>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_70px_120px_80px_180px] items-center px-4 py-3 border-b border-border/40 hover:bg-white/[0.03]">
            <div className="flex items-center gap-3 min-w-0">
              <img src={avatarFor(p)} alt="" className="h-8 w-8 rounded border border-border/60 bg-secondary/40" loading="lazy" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold truncate">{p.username}</span>
                  {p.retired && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-crimson/20 text-crimson border border-crimson/40">Retired</span>}
                </div>
                {p.uuid && <div className="text-[10px] text-muted-foreground font-mono truncate">{p.uuid}</div>}
              </div>
            </div>
            <div className="text-sm font-bold">{p.region}</div>
            <div className="flex gap-1.5">
              {p.peakTier && <TierBadge tier={p.peakTier} size="sm" />}
              {p.currentTier && p.currentTier !== p.peakTier && <TierBadge tier={p.currentTier} size="sm" />}
              {!p.peakTier && !p.currentTier && <span className="text-xs text-muted-foreground">—</span>}
            </div>
            <div className="text-right font-bold tabular-nums">{pointsForPlayer(p)}</div>
            <div className="flex justify-end gap-1.5">
              {canRetire(p) && (
                <Button size="sm" variant="outline" className="h-8 border-border/60 bg-secondary/40"
                  onClick={() => { playersStore.setRetired(p.id, !p.retired); toast.success(p.retired ? "Unretired" : "Retired"); }}>
                  {p.retired ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-8 border-border/60 bg-secondary/40" onClick={() => setEditing(p)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 border-crimson/40 bg-crimson/10 text-crimson hover:bg-crimson/20"
                onClick={() => {
                  if (confirm(`Delete ${p.username}? This cannot be undone.`)) {
                    playersStore.remove(p.id);
                    toast.success("Player deleted");
                  }
                }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <PlayerEditor
          player={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {importOpen && <BotImportDialog onClose={() => setImportOpen(false)} />}
    </main>
  );
}

function canRetire(p: Player): boolean {
  const peak = p.peakTier;
  return !!peak && RETIRABLE_TIERS.includes(peak);
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </div>
  );
}

/* -------------------- EDITOR -------------------- */

function PlayerEditor({ player, onClose }: { player: Player | null; onClose: () => void }) {
  const isNew = !player;
  const [username, setUsername] = useState(player?.username ?? "");
  const [region, setRegion] = useState<Region>(player?.region ?? "NA");
  const [currentTier, setCurrentTier] = useState<TierKey | "">(player?.currentTier ?? "");
  const [peakTier, setPeakTier] = useState<TierKey | "">(player?.peakTier ?? "");
  const [retired, setRetired] = useState(player?.retired ?? false);
  const [notes, setNotes] = useState(player?.notes ?? "");

  function save() {
    if (!username.trim()) return toast.error("Username required");
    const peak = (peakTier || currentTier || null) as TierKey | null;
    const curr = (currentTier || null) as TierKey | null;
    if (retired && peak && !RETIRABLE_TIERS.includes(peak)) {
      return toast.error("Only LT2/HT2/LT1/HT1 players can retire");
    }
    if (isNew) {
      playersStore.upsert(newPlayer({
        username, region, currentTier: curr, peakTier: peak, retired, notes,
      }));
      toast.success("Player added");
    } else {
      playersStore.upsert({
        ...player!,
        username: username.trim(),
        region,
        currentTier: curr,
        peakTier: peak,
        retired,
        notes,
      });
      toast.success("Player updated");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black">{isNew ? "Add player" : "Edit player"}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-md hover:bg-white/5 inline-flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Username (NameMC)">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. Notch" className="bg-secondary/40" />
          </Field>

          <Field label="Region">
            <select value={region} onChange={(e) => setRegion(e.target.value as Region)} className="h-10 w-full px-3 rounded-md bg-secondary/40 border border-border/60 text-sm font-semibold">
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>


          <Field label="Current Tier">
            <TierSelect value={currentTier} onChange={setCurrentTier} />
          </Field>
          <Field label="Peak Tier (auto-calcs points)">
            <TierSelect value={peakTier} onChange={setPeakTier} />
          </Field>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 select-none">
              <input type="checkbox" checked={retired} onChange={(e) => setRetired(e.target.checked)} className="accent-primary" />
              <span className="text-sm">Retired <span className="text-muted-foreground text-xs">(only allowed for LT2/HT2/LT1/HT1)</span></span>
            </label>
          </div>

          <div className="sm:col-span-2">
            <Field label="Admin notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary/40 min-h-[80px]" placeholder="Internal notes..." />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Points: <b className="text-foreground">{
              peakTier ? pointsForPlayer({
                id: "tmp", username, uuid, region,
                currentTier: (currentTier || null) as TierKey | null,
                peakTier: peakTier as TierKey,
                retired, createdAt: 0, updatedAt: 0,
              }) : 0
            }</b>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-border/60 bg-secondary/40">Cancel</Button>
            <Button onClick={save} className="bg-gradient-primary text-primary-foreground border-0 glow-primary font-bold">
              {isNew ? "Create" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TierSelect({ value, onChange }: { value: TierKey | ""; onChange: (v: TierKey | "") => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TierKey | "")}
      className="h-10 w-full px-3 rounded-md bg-secondary/40 border border-border/60 text-sm font-semibold"
    >
      <option value="">— none —</option>
      {TIER_ORDER.map((t) => (
        <option key={t} value={t}>{t} ({isHT(t) ? "High" : "Low"})</option>
      ))}
    </select>
  );
}

/* -------------------- BOT IMPORT -------------------- */

interface BotEntry {
  username: string;
  uuid?: string;
  region?: Region;
  currentTier?: TierKey;
  peakTier?: TierKey;
  retired?: boolean;
}

function BotImportDialog({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"merge" | "replace">("merge");

  async function fetchUrl() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const text = await res.text();
      setRaw(text);
      toast.success("Fetched data — review then apply");
    } catch (e) {
      toast.error("Failed to fetch. Check URL / CORS.");
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    let entries: BotEntry[];
    try {
      const parsed = JSON.parse(raw);
      entries = Array.isArray(parsed) ? parsed : (parsed.players ?? parsed.data ?? []);
      if (!Array.isArray(entries)) throw new Error("not an array");
    } catch {
      return toast.error("Invalid JSON. Expected an array of {username, currentTier, ...}");
    }
    const valid = entries.filter((e) => e && typeof e.username === "string");
    if (valid.length === 0) return toast.error("No valid entries");

    const existing = playersStore.all();
    const byName = new Map(existing.map((p) => [p.username.toLowerCase(), p]));
    const next: Player[] = mode === "replace" ? [] : [...existing];

    for (const e of valid) {
      const prev = byName.get(e.username.toLowerCase());
      const merged: Player = prev
        ? {
            ...prev,
            uuid: e.uuid ?? prev.uuid,
            region: (e.region ?? prev.region) as Region,
            currentTier: (e.currentTier ?? prev.currentTier) as TierKey | null,
            peakTier: (e.peakTier ?? prev.peakTier ?? e.currentTier ?? prev.currentTier) as TierKey | null,
            retired: e.retired ?? prev.retired,
            updatedAt: Date.now(),
          }
        : newPlayer({
            username: e.username,
            uuid: e.uuid,
            region: (e.region ?? "NA") as Region,
            currentTier: (e.currentTier ?? null) as TierKey | null,
            peakTier: (e.peakTier ?? e.currentTier ?? null) as TierKey | null,
            retired: !!e.retired,
          });
      if (mode === "replace") {
        next.push(merged);
      } else {
        const i = next.findIndex((p) => p.username.toLowerCase() === e.username.toLowerCase());
        if (i >= 0) next[i] = merged; else next.push(merged);
      }
    }
    playersStore.replaceAll(next);
    toast.success(`Imported ${valid.length} players`);
    onClose();
  }

  function exportJson() {
    const data = JSON.stringify(playersStore.all(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mcranks-players.json"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" /> Sync from Tier List Bot
          </h2>
          <button onClick={onClose} className="h-8 w-8 rounded-md hover:bg-white/5 inline-flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Provide a JSON endpoint from your tier-list bot. Expected shape:{" "}
          <code className="text-xs bg-secondary/60 px-1.5 py-0.5 rounded">
            {`[{ "username": "...", "uuid": "...", "region": "NA", "currentTier": "HT2", "peakTier": "HT1", "retired": false }]`}
          </code>
        </p>

        <div className="space-y-3">
          <Field label="Bot endpoint URL">
            <div className="flex gap-2">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-bot.example.com/api/players" className="bg-secondary/40" />
              <Button onClick={fetchUrl} disabled={loading} className="bg-accent text-accent-foreground border-0 glow-blue">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>
          </Field>

          <Field label="Or paste JSON directly">
            <Textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder='[{ "username": "Steve", "currentTier": "HT3", "region": "NA" }]'
              className="bg-secondary/40 font-mono text-xs min-h-[160px]" />
          </Field>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="m" checked={mode === "merge"} onChange={() => setMode("merge")} className="accent-primary" /> Merge</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="m" checked={mode === "replace"} onChange={() => setMode("replace")} className="accent-primary" /> Replace all</label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={exportJson} className="border-border/60 bg-secondary/40">
            <Upload className="h-4 w-4 mr-1.5" /> Export current
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-border/60 bg-secondary/40">Cancel</Button>
            <Button onClick={apply} className="bg-gradient-primary text-primary-foreground border-0 glow-primary font-bold">Apply import</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
