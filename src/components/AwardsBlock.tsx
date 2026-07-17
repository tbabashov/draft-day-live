import { Medal, Target, Star } from "lucide-react";
import { clubLogo } from "@/lib/logos";
import { loadSquadStatus } from "@/lib/squad-status";
// @ts-expect-error - JS file without types
import { INITIAL_PLAYERS } from "@/data/players";
import type { Player } from "@/lib/draft-utils";
import type { ScoreEntry } from "@/lib/tournament-utils";

/* Best user player of the run, from stored form ratings (needs ≥2 games). */
function playerOfRun(): { name: string; avg: number } | null {
  const s = loadSquadStatus();
  let best: { name: string; avg: number } | null = null;
  for (const [id, ratings] of Object.entries(s.form)) {
    if (!ratings || ratings.length < 2) continue;
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const p = (INITIAL_PLAYERS as Player[]).find((x) => x.id === id);
    if (!p) continue;
    if (!best || avg > best.avg) best = { name: p.name.display, avg };
  }
  return best;
}

function AwardRow({ icon, label, entry, extra }: {
  icon: React.ReactNode; label: string; entry?: ScoreEntry; extra?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
      <div className="shrink-0 text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
        {entry ? (
          <div className="flex items-center gap-2 min-w-0">
            {clubLogo(entry.teamId) && <img src={clubLogo(entry.teamId)} alt="" className="w-4 h-4 object-contain shrink-0" />}
            <span className="font-display text-lg truncate">{entry.name}</span>
          </div>
        ) : (
          <div className="font-display text-lg text-muted-foreground">—</div>
        )}
      </div>
      {extra && <div className="font-display text-2xl tabular-nums shrink-0">{extra}</div>}
    </div>
  );
}

export function AwardsBlock({ scorers, assisters }: { scorers: ScoreEntry[]; assisters: ScoreEntry[] }) {
  const gb = scorers[0];
  const pm = assisters[0];
  const por = playerOfRun();
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <AwardRow icon={<Medal className="w-6 h-6" />} label="Golden Boot" entry={gb} extra={gb ? `${gb.goals}` : undefined} />
      <AwardRow icon={<Target className="w-6 h-6" />} label="Playmaker" entry={pm} extra={pm ? `${pm.assists}` : undefined} />
      <AwardRow icon={<Star className="w-6 h-6" />} label="Player of the Run"
        entry={por ? { name: por.name, teamId: "user", goals: 0, assists: 0 } : undefined}
        extra={por ? por.avg.toFixed(1) : undefined} />
    </div>
  );
}
