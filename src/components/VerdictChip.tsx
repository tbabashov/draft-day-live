import type { Verdict } from "@/lib/tournament-utils";

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const tone =
    verdict.label === "OVERPERFORMED"
      ? "border-[oklch(0.75_0.19_145)]/60 bg-[oklch(0.75_0.19_145)]/15 text-[oklch(0.85_0.22_140)]"
      : verdict.label === "UNDERPERFORMED"
        ? "border-primary/60 bg-primary/15 text-primary"
        : "border-[oklch(0.8_0.14_85)]/60 bg-[oklch(0.8_0.14_85)]/15 text-[oklch(0.85_0.17_85)]";
  return (
    <div className={`inline-flex flex-col items-center gap-0.5 rounded-xl border px-5 py-2.5 ${tone}`}>
      <span className="font-display text-2xl tracking-wide">{verdict.label}</span>
      <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">{verdict.detail}</span>
    </div>
  );
}
