import { loadSquadStatus } from "@/lib/squad-status";

/* Shows who's suspended or injured for the next match. `refresh` is any value
   that changes when a match completes, forcing a re-read of the store. */
export function UnavailableStrip({ refresh }: { refresh?: unknown }) {
  void refresh;
  const s = loadSquadStatus();
  const rows = [
    ...Object.entries(s.bans).map(([id, e]) => ({ id, ...e, kind: "ban" as const })),
    ...Object.entries(s.injuries).map(([id, e]) => ({ id, ...e, kind: "injury" as const })),
  ].filter((r) => r.matches > 0);
  if (!rows.length) return null;
  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Unavailable</div>
      <div className="flex flex-wrap gap-2">
        {rows.map((r) => (
          <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs">
            <span className={r.kind === "ban" ? "w-2.5 h-3.5 rounded-[2px] bg-primary" : "font-bold text-[oklch(0.8_0.17_45)]"}>{r.kind === "ban" ? "" : "+"}</span>
            <span className="font-semibold">{r.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{r.matches} {r.matches === 1 ? "match" : "matches"}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
