import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { TierList } from "@/components/TierList";
import { PlayerModal } from "@/components/PlayerModal";
import { Layers } from "lucide-react";

export const Route = createFileRoute("/tierlist")({
  head: () => ({
    meta: [
      { title: "Tier List — VanillaTiers" },
      { name: "description", content: "Vanilla Minecraft PvP tier list. HT and LT players grouped by peak tier." },
      { property: "og:title", content: "Tier List — VanillaTiers" },
      { property: "og:description", content: "The official Vanilla Minecraft PvP tier list." },
      { property: "og:url", content: "https://vanillatier.lovable.app/tierlist" },
    ],
    links: [
      { rel: "canonical", href: "https://vanillatier.lovable.app/tierlist" },
    ],
  }),
  component: TierListPage,
});

function TierListPage() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary glow-primary">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gradient">Tier List</h1>
            <p className="text-sm text-muted-foreground">HT and LT players grouped by their peak tier.</p>
          </div>
        </div>
        <TierList onSelect={setSelected} />
      </main>
      <PlayerModal playerId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
