/* Out-of-position marker: one arrow for a near-enough role, two when it
   genuinely costs, three when the player is plain wrong there. Red so it reads
   as a warning against the gold/silver card art. */
export function OopArrows({ n, className = "" }: { n: number; className?: string }) {
  if (n <= 0) return null;
  const label =
    n === 1 ? "Slightly out of position" : n === 2 ? "Out of position" : "Badly out of position";
  return (
    <div
      title={label}
      aria-label={label}
      className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex flex-col items-center
                  leading-[0.62] text-[9px] sm:text-[10px] text-[oklch(0.66_0.25_25)]
                  drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] ${className}`}
    >
      {Array.from({ length: n }, (_, i) => (
        <span key={i}>▼</span>
      ))}
    </div>
  );
}
