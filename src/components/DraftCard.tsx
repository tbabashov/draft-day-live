import { motion } from "framer-motion";
import { type Player, tierOf, TIER_STYLES, initials, shortName, isGkAttrs } from "@/lib/draft-utils";
import { faceFor } from "@/lib/faces";
import { clubLogo } from "@/lib/logos";

interface Props {
  player: Player;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  interactive?: boolean;
  highlight?: boolean;
}

export function DraftCard({ player, size = "md", onClick, interactive, highlight }: Props) {
  const tier = tierOf(player.overall);
  const s = TIER_STYLES[tier];
  const face = faceFor(player.name.display);
  // Fixed heights: with a min-height only, tall-aspect face images could
  // stretch individual cards (flex max-h needs a definite container height).
  const dims = size === "lg" ? "w-44 h-64" : size === "sm" ? "w-24 h-36" : "w-32 h-48";
  const nameSize = size === "lg" ? "text-lg" : size === "sm" ? "text-[10px]" : "text-xs";
  const ovrSize = size === "lg" ? "text-5xl" : size === "sm" ? "text-2xl" : "text-3xl";

  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={interactive ? { y: -6, scale: 1.02 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      className={`relative shrink-0 rounded-xl bg-gradient-to-b ${s.grad} ${s.ring} ${dims} p-2.5 text-left overflow-hidden group flex flex-col ${interactive ? "cursor-pointer" : "cursor-default"} ${highlight ? "ring-2 ring-primary" : ""}`}
    >
      {/* holo sheen */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
        style={{ background: "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)" }}
      />
      {/* tier watermark + club crest, top right */}
      <div className="absolute top-1.5 right-2 flex flex-col items-end gap-1">
        <div className={`font-mono text-[8px] tracking-widest ${s.text} opacity-60`}>{s.label}</div>
        {clubLogo(player.clubId) && (
          <img src={clubLogo(player.clubId)} alt={player.club}
            className={`${size === "lg" ? "w-6 h-6" : size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5"} object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]`}
          />
        )}
      </div>

      {/* OVR + POS */}
      <div className={`relative shrink-0 font-display leading-none ${s.text}`}>
        <div className={ovrSize}>{player.overall}</div>
        <div className={`text-[10px] font-bold tracking-wider mt-0.5`}>{player.position}</div>
      </div>

      {/* Face (photo when available, initials fallback) — fills remaining space above the name */}
      {face ? (
        <div className="relative flex-1 min-h-0 flex items-end justify-center">
          <img src={face} alt={player.name.display}
            className={`${size === "lg" ? "w-28" : size === "sm" ? "w-14" : "w-20"} max-h-full object-contain object-bottom pointer-events-none`}
          />
        </div>
      ) : (
        <div className="relative flex-1 min-h-0 flex items-center justify-center">
          <div className={`w-${size === "lg" ? "24" : size === "sm" ? "12" : "16"} aspect-square rounded-full grid place-items-center font-display text-2xl ${s.text}`}
            style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.35), transparent 70%)" }}
          >
            <span className={size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-2xl"}>{initials(player)}</span>
          </div>
        </div>
      )}

      {/* divider */}
      <div className={`relative shrink-0 mt-1 border-t ${s.text} opacity-40`} />

      {/* name */}
      <div className={`relative shrink-0 pt-1 text-center font-black uppercase tracking-tight truncate ${s.text} ${nameSize}`}>
        {shortName(player)}
      </div>

      {/* mini attrs — labels don't fit on the sm card, values only there */}
      <div className={`relative shrink-0 mt-1 grid grid-cols-6 ${size === "sm" ? "gap-0" : "gap-0.5"} font-mono text-[8px] ${s.text}`}>
        {(isGkAttrs(player.attributes)
          ? ([["DIV", player.attributes.diving], ["HAN", player.attributes.handling], ["KIC", player.attributes.kicking], ["REF", player.attributes.reflexes], ["SPD", player.attributes.speed], ["POS", player.attributes.positioning]] as const)
          : ([["PAC", player.attributes.pace], ["SHO", player.attributes.shooting], ["PAS", player.attributes.passing], ["DRI", player.attributes.dribbling], ["DEF", player.attributes.defending], ["PHY", player.attributes.physical]] as const)
        ).map(([label, v]) => (
          <Attr key={label} label={label} v={v} compact={size === "sm"} />
        ))}
      </div>
    </motion.button>
  );
}

function Attr({ label, v, compact }: { label: string; v: number; compact?: boolean }) {
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="font-bold">{v}</span>
      {!compact && <span className="opacity-70 text-[7px]">{label}</span>}
    </div>
  );
}
