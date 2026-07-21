/* Out-of-position marker: one chevron for a near-enough role, two when it
   genuinely costs, three when the player is plain wrong there.

   Drawn inline rather than loaded as images — these render as small as 9px on a
   pitch card, where an SVG stays crisp and can be filled red directly. The path
   is the supplied single-chevron asset, normalised to a 640x448 tile; stacked
   copies use a 336 pitch (0.75 of the tile) so they nest exactly like the
   supplied double/triple artwork. */

const CHEVRON = "M512 0 L320 192 L128 0 L0 128 L320 448 L640 128 Z";
const TILE_W = 640;
const TILE_H = 448;
const PITCH = 336; // 0.75 x tile height — measured off the double/triple assets

/* Sized by width so a single chevron and a triple stack read as the same
   mark; `size` lets a caller cap it (a 9px triple is 15.75px tall, which
   still fits a 16px line box). */
export function OopArrows({ n, className = "", size = "w-[9px] sm:w-[11px]" }: {
  n: number; className?: string; size?: string;
}) {
  if (n <= 0) return null;
  const count = Math.min(n, 3);
  const label =
    count === 1 ? "Slightly out of position" : count === 2 ? "Out of position" : "Badly out of position";
  return (
    <svg
      viewBox={`0 0 ${TILE_W} ${TILE_H + (count - 1) * PITCH}`}
      role="img"
      aria-label={label}
      className={`shrink-0 h-auto ${size} ${className}`}
      style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.85))" }}
    >
      <title>{label}</title>
      {Array.from({ length: count }, (_, i) => (
        <path key={i} d={CHEVRON} transform={`translate(0 ${i * PITCH})`} fill="oklch(0.63 0.24 25)" />
      ))}
    </svg>
  );
}
