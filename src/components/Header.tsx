import { Link } from "@tanstack/react-router";
import { Swords } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary glow-primary">
            <Swords className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tight text-gradient">Vanilla Tiers</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Minecraft PvP</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          <NavLink to="/tierlist">Tier List</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: "/" | "/leaderboard" | "/tierlist"; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
      activeProps={{ className: "px-3 py-2 rounded-md text-sm font-semibold text-foreground bg-white/10" }}
      activeOptions={{ exact: to === "/" }}
    >
      {children}
    </Link>
  );
}
