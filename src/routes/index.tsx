import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Trophy, Users, Zap, Grid3x3 } from "lucide-react";
import { ALL_PLAYERS, shuffle, type Player } from "@/lib/draft-utils";
import { DraftCard } from "@/components/DraftCard";
import { clubLogo } from "@/lib/logos";
import brunoFace from "@/assets/faces/bruno_fernandes.webp";
import kroupiFace from "@/assets/faces/eli_junior_kroupi.png";
import kadiogluFace from "@/assets/faces/ferdi_kadioglu.webp";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <Ticker />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
      <Faq />
      <Footer />
    </div>
  );
}

/* ---------------- NAV ---------------- */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "backdrop-blur-xl bg-background/70 border-b border-border" : ""}`}>
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-display text-2xl tracking-widest">
          <span className="w-2 h-2 rounded-full bg-primary ticker-dot" />
          GAFFER
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#stats" className="hover:text-foreground transition">Stats</a>
          <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          <a href="/history" className="hover:text-foreground transition">Trophies</a>
        </nav>
        <a href="/home" className="group cta-pulse inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-[0_10px_40px_-10px_var(--crimson)] transition-all">
          Start drafting
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
        </a>
      </div>
    </header>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const bx = useSpring(mx, { stiffness: 60, damping: 20 });
  const by = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width);
      my.set((e.clientY - r.top) / r.height);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  const blob1X = useTransform(bx, (v) => `${v * 40 - 20}%`);
  const blob1Y = useTransform(by, (v) => `${v * 40 - 20}%`);
  const blob2X = useTransform(bx, (v) => `${-v * 30 + 15}%`);
  const blob2Y = useTransform(by, (v) => `${-v * 30 + 15}%`);

  const verbs = ["DOMINATE.", "OUTPLAY.", "SILENCE 'EM.", "LIFT SILVERWARE."];
  const [vi, setVi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setVi((i) => (i + 1) % verbs.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-24 pb-24 md:pb-32 grain overflow-hidden">
      {/* Mouse-reactive blobs */}
      <motion.div style={{ x: blob1X, y: blob1Y }} className="absolute top-[10%] left-[10%] w-[55vw] h-[55vw] rounded-full bg-primary/25 blur-[120px] pointer-events-none" />
      <motion.div style={{ x: blob2X, y: blob2Y }} className="absolute bottom-[5%] right-[5%] w-[45vw] h-[45vw] rounded-full bg-[oklch(0.55_0.18_260)]/25 blur-[120px] pointer-events-none" />
      {/* Pitch line grid */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      <div className="relative mx-auto max-w-7xl px-6 w-full lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
        <div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 backdrop-blur px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-accent ticker-dot" /> Season 26 · Now open
        </motion.div>

        <h1 className="mt-8 font-display text-[clamp(3.5rem,12vw,11rem)] lg:text-[clamp(3.5rem,7vw,7.5rem)] leading-[0.85] tracking-tight">
          <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="block">DRAFT.</motion.span>
          <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="block text-muted-foreground">DEPLOY.</motion.span>
          <span className="block relative h-[0.95em] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span key={verbs[vi]}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1] }}
                className="block text-primary italic"
                style={{ textShadow: "0 0 60px oklch(0.63 0.24 25 / 0.4)" }}
              >
                {verbs[vi]}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>

        <div className="mt-12 flex flex-col gap-8">
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Draft your XI from every Premier League star. Set the tactics. Then take them to a knockout cup — or grind out a 21-club league season. No wallets, no packs — just you and the gaffer's chair.
          </p>
          <div id="hero-cta" className="flex items-center gap-4">
            <a href="/home" className="group relative inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground shadow-[0_20px_60px_-20px_var(--crimson)] hover:shadow-[0_25px_80px_-15px_var(--crimson)] transition-all">
              Start your draft
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </a>
          </div>
        </div>
        </div>

        <HeroCollage />
      </div>
    </section>
  );
}

/* ---------------- HERO COLLAGE ---------------- */
function HeroCollage() {
  const cards = [
    {
      r: 91, pos: "CAM", name: "FERNANDES", face: brunoFace, club: "manutd",
      stats: { PAC: 66, SHO: 85, PAS: 91, DRI: 83, DEF: 64, PHY: 76 },
      grad: "from-[oklch(0.72_0.19_340)] via-[oklch(0.72_0.15_20)] to-[oklch(0.74_0.15_60)]",
      cls: "top-0 left-0 -rotate-6 z-10", delay: 0.3,
    },
    {
      r: 78, pos: "ST", name: "KROUPI", face: kroupiFace, club: "bournemouth",
      stats: { PAC: 81, SHO: 80, PAS: 66, DRI: 79, DEF: 34, PHY: 70 },
      grad: "from-[oklch(0.86_0.012_260)] via-[oklch(0.72_0.01_260)] to-[oklch(0.5_0.008_260)]",
      cls: "top-20 right-0 rotate-[5deg] z-20", delay: 0.45,
    },
    {
      r: 80, pos: "LB", name: "KADIOĞLU", face: kadiogluFace, club: "brighton",
      stats: { PAC: 84, SHO: 66, PAS: 77, DRI: 81, DEF: 78, PHY: 77 },
      grad: "from-[oklch(0.8_0.14_90)] via-[oklch(0.72_0.14_82)] to-[oklch(0.58_0.13_72)]",
      cls: "bottom-0 left-12 rotate-[-2deg] z-30", delay: 0.6,
    },
  ];
  return (
    <div className="relative hidden lg:block w-[26rem] h-[36rem] pointer-events-none select-none">
      {cards.map((c) => (
        <motion.div key={c.name}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: c.delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute ${c.cls}`}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 5.5, delay: c.delay * 2, ease: "easeInOut" }}
            className={`w-[15rem] rounded-2xl bg-gradient-to-br ${c.grad} p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/20`}
          >
            <div className="flex items-start justify-between">
              <div className="font-display text-black/85">
                <div className="text-6xl leading-none">{c.r}</div>
                <div className="mt-1 font-mono text-[11px] font-bold tracking-[0.2em]">{c.pos}</div>
              </div>
              {clubLogo(c.club) ? (
                <img src={clubLogo(c.club)} alt="" className="w-8 h-8 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-black/20" />
              )}
            </div>
            <img src={c.face} alt={c.name} className="mx-auto -mt-4 h-36 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]" />
            <div className="mt-2 border-t border-black/25 pt-3">
              <div className="font-display text-2xl tracking-wide text-black/85">{c.name}</div>
              <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1 font-mono text-[11px] text-black/75">
                {Object.entries(c.stats).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between">
                    <span className="opacity-70">{k}</span>
                    <span className="font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------- TICKER ---------------- */
function Ticker() {
  const items = [
    "24,881 squads drafted today",
    "Haaland picked 62% of the time",
    "Longest win streak · 14",
    "Biggest upset · Luton 3-1 Man City",
    "Avg squad rating · 84",
    "Most-used formation · 4-3-3",
    "127 gaffers online now",
  ];
  const doubled = [...items, ...items];
  return (
    <section className="relative border-y border-border bg-surface/40 overflow-hidden py-4">
      <div className="marquee flex gap-12 whitespace-nowrap font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {doubled.map((t, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */
function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ["0%", "100%"]);

  const steps = [
    { n: "01", title: "Draft your club", body: "Formation first, then your captain, then the XI and bench — five cards a pick, one choice, no rerolls." },
    { n: "02", title: "Set your tactics", body: "Mentality, pressing, tempo, width, roles. Play someone out of position and their rating pays the price." },
    { n: "03", title: "Pick your battle", body: "A 16-team knockout cup, or a 21-club league season. Either way, you only play your own matches — live." },
    { n: "04", title: "Beat the odds", body: "The game predicts your finish before a ball is kicked. Overperform it, lift silverware, run it back." },
  ];

  return (
    <section id="how" ref={ref} className="relative py-32 md:py-48">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel n="01">The Loop</SectionLabel>
        <h2 className="mt-4 font-display text-6xl md:text-8xl leading-[0.9]">
          Four steps.<br /><span className="text-muted-foreground">One trophy.</span>
        </h2>

        <div className="relative mt-20 grid md:grid-cols-4 gap-8 md:gap-4">
          {/* progress line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-border">
            <motion.div style={{ width: lineHeight }} className="h-full bg-primary origin-left" />
          </div>
          {steps.map((s, i) => (
            <StepCard key={s.n} step={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index }: { step: { n: string; title: string; body: string }; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative pt-16 md:pt-20"
    >
      <div className="absolute top-0 left-0 md:left-4 w-4 h-4 rounded-full bg-background border-2 border-primary">
        <div className="absolute inset-0.5 rounded-full bg-primary/30 ticker-dot" />
      </div>
      <div className="font-mono text-xs text-primary tracking-widest">{step.n}</div>
      <h3 className="mt-3 font-display text-3xl">{step.title}</h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{step.body}</p>
    </motion.div>
  );
}

/* ---------------- FEATURES ---------------- */
function Features() {
  return (
    <section id="features" className="relative py-32 md:py-48 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel n="02">Kit bag</SectionLabel>
        <h2 className="mt-4 font-display text-6xl md:text-8xl leading-[0.9]">
          Built for<br /><span className="text-primary italic">the touchline.</span>
        </h2>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6 auto-rows-[minmax(200px,auto)]">
          <TiltCard className="md:col-span-4 md:row-span-2 bg-gradient-to-br from-primary/20 via-surface to-surface">
            <FeatureDraft />
          </TiltCard>
          <TiltCard className="md:col-span-2 md:row-span-1 bg-surface">
            <FeatureTactics />
          </TiltCard>
          <TiltCard className="md:col-span-2 md:row-span-1 bg-surface-2">
            <FeatureBracket />
          </TiltCard>
          <TiltCard className="md:col-span-6 md:row-span-1 bg-gradient-to-r from-surface via-[oklch(0.2_0.03_260)] to-surface">
            <FeatureMatch />
          </TiltCard>
        </div>
      </div>
    </section>
  );
}

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rxs = useSpring(rx, { stiffness: 150, damping: 15 });
  const rys = useSpring(ry, { stiffness: 150, damping: 15 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 8);
    rx.set(-py * 8);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rxs, rotateY: rys, transformStyle: "preserve-3d" }}
      className={`relative rounded-2xl border border-border overflow-hidden p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function FeatureDraft() {
  // A fresh pack every visit: always 1 icon, 2 golds, 2 silvers/bronzes.
  // Client-only so SSR markup stays deterministic.
  const [showcase, setShowcase] = useState<Player[]>([]);
  useEffect(() => {
    const icons = ALL_PLAYERS.filter((p) => p.overall >= 88);
    const golds = ALL_PLAYERS.filter((p) => p.overall >= 80 && p.overall < 88);
    const lower = ALL_PLAYERS.filter((p) => p.overall < 80);
    setShowcase(shuffle([
      ...shuffle(icons).slice(0, 1),
      ...shuffle(golds).slice(0, 2),
      ...shuffle(lower).slice(0, 2),
    ]));
  }, []);
  return (
    <div className="relative h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary"><Users className="w-3.5 h-3.5" /> Draft</div>
        <h3 className="mt-4 font-display text-5xl md:text-6xl leading-[0.9]">Card packs,<br />without the wallet.</h3>
        <p className="mt-4 text-muted-foreground max-w-md">Five eligible players. One pick. Rarity tiers glow gold, silver, bronze — Icons burn purple.</p>
      </div>
      <div className="flex flex-wrap justify-between gap-3 mt-8 min-h-48">
        {showcase.map((p, i) => (
          <motion.div key={p.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
            style={{ transform: "translateZ(40px)" }}
          >
            <DraftCard player={p} size="md" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FeatureTactics() {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent"><Grid3x3 className="w-3.5 h-3.5" /> Tactics</div>
      <div>
        <h3 className="font-display text-3xl md:text-4xl leading-[0.9]">Formation matters.</h3>
        <p className="mt-2 text-sm text-muted-foreground">4-3-3, 3-5-2, 4-2-3-1. Play a striker at CB — good luck.</p>
      </div>
    </div>
  );
}

function FeatureBracket() {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[oklch(0.82_0.16_85)]"><Trophy className="w-3.5 h-3.5" /> Bracket</div>
      <div>
        <h3 className="font-display text-3xl md:text-4xl leading-[0.9]">Cup or league.<br />Your call.</h3>
        <p className="mt-2 text-sm text-muted-foreground">16-team knockout, or a 21-club season. Upsets happen.</p>
      </div>
    </div>
  );
}

function FeatureMatch() {
  return (
    <div className="h-full flex items-center justify-between gap-8">
      <div>
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary"><Zap className="w-3.5 h-3.5" /> Live match engine</div>
        <h3 className="mt-3 font-display text-4xl md:text-5xl leading-[0.9]">Watch the ball move.<br />Not a text log.</h3>
      </div>
      <div className="hidden md:flex items-center gap-6 font-mono text-sm">
        <StatBox label="POSS" value="58%" />
        <StatBox label="SHOTS" value="14" />
        <StatBox label="xG" value="2.1" />
        <div className="font-display text-5xl text-primary">2 - 1</div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl">{value}</div>
    </div>
  );
}

/* ---------------- STATS ---------------- */
function Stats() {
  const stats = [
    { v: 500, s: "+", l: "Real players in the pool" },
    { v: 24881, l: "Squads drafted this week" },
    { v: 16, l: "Teams in every bracket" },
    { v: 93, s: "%", l: "Gaffers say they'll draft again" },
  ];
  return (
    <section id="stats" className="relative py-32 border-t border-border bg-surface/30">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel n="03">By the numbers</SectionLabel>
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => <Counter key={i} target={s.v} suffix={s.s} label={s.l} />)}
        </div>
      </div>
    </section>
  );
}

function Counter({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);
  return (
    <div ref={ref}>
      <div className="font-display text-6xl md:text-7xl text-primary">
        {n.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-sm text-muted-foreground uppercase tracking-widest font-mono">{label}</div>
    </div>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
function Testimonials() {
  const rowA = [
    { q: "Drafted a bronze CB, he ended top scorer. Gaffer moment.", a: "@toffee_tom", club: "EVE" },
    { q: "Finally a manager sim where the tactics screen doesn't feel like tax software.", a: "@northlondoner", club: "ARS" },
    { q: "Lost the final on pens. Filed for divorce with my own squad.", a: "@sam_utd", club: "MUN" },
    { q: "The live match dots are strangely hypnotic.", a: "@potter_out", club: "CHE" },
  ];
  const rowB = [
    { q: "Finally something new in the football-game space.", a: "@katia_kop", club: "LIV" },
    { q: "Got Haaland at 94, immediately played him at LB for laughs. 0-6.", a: "@citizen42", club: "MCI" },
    { q: "Bracket format is genius. Every match matters.", a: "@blade_runner", club: "SHU" },
    { q: "My mate rage-quit after his bronze GK conceded 5. Peak entertainment.", a: "@spursy4life", club: "TOT" },
  ];
  return (
    <section className="py-32 border-t border-border overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel n="04">From the terraces</SectionLabel>
        <h2 className="mt-4 font-display text-5xl md:text-7xl leading-[0.9]">
          The <span className="text-primary italic">gaffers</span> speak.
        </h2>
      </div>
      <div className="mt-16 space-y-6">
        <TestimonialRow items={rowA} />
        <TestimonialRow items={rowB} reverse />
      </div>
    </section>
  );
}

function TestimonialRow({ items, reverse = false }: { items: { q: string; a: string; club: string }[]; reverse?: boolean }) {
  const doubled = [...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <div className={`flex gap-6 whitespace-nowrap w-max ${reverse ? "marquee" : "marquee"}`}
        style={reverse ? { animationDirection: "reverse" } : {}}
      >
        {doubled.map((t, i) => (
          <div key={i} className="w-[420px] shrink-0 rounded-xl border border-border bg-surface p-6 hover:border-primary/50 transition">
            <p className="text-base text-foreground/90 whitespace-normal leading-relaxed">"{t.q}"</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center font-mono text-xs text-primary">{t.club}</div>
              <span className="font-mono text-xs text-muted-foreground">{t.a}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- FAQ ---------------- */
function Faq() {
  const items = [
    { q: "Is this free?", a: "Yes. No packs, no paywalls, no premium currency. Draft as much as you want." },
    { q: "Where does the player data come from?", a: "Every current Premier League squad — real names, real attributes, live overall ratings." },
    { q: "Can I reroll a bad pick?", a: "No. Five options, one choice, you live with it. Swap between XI and bench as much as you like." },
    { q: "Does the match actually simulate or is it random?", a: "There's a real engine — squad quality, tactics, formation fit, opponent reputation all feed in. Randomness sits on top so upsets are possible." },
    { q: "Cup or league — what's the difference?", a: "The cup is a 16-team knockout: lose once and the whole run is wiped. The league puts you and all twenty clubs in one table, everyone faced once, draws allowed — most points takes the title." },
    { q: "Do I need an account?", a: "Not for the first draft. Save your history once you want to track streaks." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-32 border-t border-border">
      <div className="mx-auto max-w-4xl px-6">
        <SectionLabel n="05">Questions</SectionLabel>
        <h2 className="mt-4 font-display text-5xl md:text-7xl leading-[0.9]">Ask the ref.</h2>
        <div className="mt-16 divide-y divide-border border-y border-border">
          {items.map((it, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between py-6 text-left group">
                <span className="font-display text-2xl md:text-3xl group-hover:text-primary transition">{it.q}</span>
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-3xl text-muted-foreground">+</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                    <p className="pb-6 text-muted-foreground leading-relaxed max-w-2xl">{it.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], [80, -20]);
  return (
    <footer ref={ref} className="relative pt-32 pb-8 border-t border-border overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Ready?</div>
            <h2 className="mt-3 font-display text-5xl md:text-7xl leading-[0.9]">
              The touchline<br /><span className="text-primary italic">is calling.</span>
            </h2>
            <a href="/home" className="mt-8 group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground shadow-[0_20px_60px_-20px_var(--crimson)] hover:shadow-[0_25px_80px_-15px_var(--crimson)] transition-all">
              Start your draft
              <ArrowUpRight className="w-5 h-5 group-hover:rotate-12 transition" />
            </a>
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <FooterCol title="Play" links={["Draft", "Tactics", "Bracket", "Match engine"]} />
            <FooterCol title="Company" links={["About", "Press", "Careers", "Contact"]} />
            <FooterCol title="Legal" links={["Terms", "Privacy", "Cookies", "Licences"]} />
          </div>
        </div>
        <motion.div style={{ y }} className="mt-24 font-display leading-[0.8] text-[clamp(4rem,22vw,20rem)] text-foreground/[0.04] select-none">
          GAFFER
        </motion.div>
        <div className="mt-8 flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <span>© 2026 Gaffer FC</span>
          <span>Made offside</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l}><a href="#" className="hover:text-primary transition">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Shared ---------------- */
function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
      <span className="text-primary">{n}</span>
      <span className="w-8 h-px bg-border" />
      {children}
    </div>
  );
}
