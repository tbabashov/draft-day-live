import { motion } from "framer-motion";
import { type Player, tierOf, TIER_STYLES, initials, shortName } from "@/lib/draft-utils";

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
  const dims = size === "lg" ? "w-44 min-h-[16rem]" : size === "sm" ? "w-24 min-h-[9rem]" : "w-32 min-h-[12rem]";
  const nameSize = size === "lg" ? "text-lg" : size === "sm" ? "text-[10px]" : "text-xs";
  const ovrSize = size === "lg" ? "text-5xl" : size === "sm" ? "text-2xl" : "text-3xl";

  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={interactive ? { y: -6, scale: 1.02 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      className={`relative shrink-0 rounded-xl bg-gradient-to-b ${s.grad} ${s.ring} ${dims} p-2.5 text-left overflow-hidden group ${interactive ? "cursor-pointer" : "cursor-default"} ${highlight ? "ring-2 ring-primary" : ""}`}
    >
      {/* holo sheen */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)" }}
      />
      {/* tier watermark */}
      <div className={`absolute top-1 right-2 font-mono text-[8px] tracking-widest ${s.text} opacity-60`}>{s.label}</div>

      {/* OVR + POS */}
      <div className={`relative font-display leading-none ${s.text}`}>
        <div className={ovrSize}>{player.overall}</div>
        <div className={`text-[10px] font-bold tracking-wider mt-0.5`}>{player.position}</div>
      </div>

      {/* Face circle with initials */}
      <div className="relative mt-1 flex justify-center">
        <div className={`w-${size === "lg" ? "24" : size === "sm" ? "12" : "16"} aspect-square rounded-full grid place-items-center font-display text-2xl ${s.text}`}
          style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.35), transparent 70%)" }}
        >
          <span className={size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-2xl"}>{initials(player)}</span>
        </div>
      </div>

      {/* name */}
      <div className={`absolute inset-x-2 bottom-8 text-center font-black uppercase tracking-tight truncate ${s.text} ${nameSize}`}>
        {shortName(player)}
      </div>

      {/* mini attrs */}
      <div className={`absolute inset-x-2 bottom-1.5 grid grid-cols-6 gap-0.5 font-mono text-[8px] ${s.text}`}>
        <Attr label="PAC" v={player.attributes.pace} />
        <Attr label="SHO" v={player.attributes.shooting} />
        <Attr label="PAS" v={player.attributes.passing} />
        <Attr label="DRI" v={player.attributes.dribbling} />
        <Attr label="DEF" v={player.attributes.defending} />
        <Attr label="PHY" v={player.attributes.physical} />
      </div>
    </motion.button>
  );
}

function Attr({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="font-bold">{v}</span>
      <span className="opacity-70 text-[7px]">{label}</span>
    </div>
  );
}
