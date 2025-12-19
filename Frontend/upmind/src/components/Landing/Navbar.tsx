import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type NavItem = { label: string; href: string };

export type NavbarProps = {
  brand?: string;
  items?: NavItem[];
  onGetStarted?: () => void;
  onLogin?: () => void;

  /** id of hero header element (you already have id="top" on <header>) */
  heroId?: string;

  /** how early to switch to light mode (px) */
  switchOffsetPx?: number;
};

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function useHeroTheme(heroId: string, switchOffsetPx: number) {
  const [onHero, setOnHero] = useState(true);

  useEffect(() => {
    const getHeroBottom = () => {
      const hero = document.getElementById(heroId);
      if (!hero) return 0;
      const rect = hero.getBoundingClientRect();
      return window.scrollY + rect.bottom;
    };

    let heroBottom = getHeroBottom();

    const compute = () => {
      setOnHero(window.scrollY < Math.max(0, heroBottom - switchOffsetPx));
    };

    const onScroll = () => compute();
    const onResize = () => {
      heroBottom = getHeroBottom();
      compute();
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
    };
  }, [heroId, switchOffsetPx]);

  return onHero;
}

function PremiumButton({
  children,
  onClick,
  variant = "primary",
  tone = "dark",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  tone?: "dark" | "light";
}) {
  const base =
    "relative inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold " +
    "focus:outline-none focus-visible:ring-2 transition";

  const ring =
    tone === "dark"
      ? "focus-visible:ring-white/35"
      : "focus-visible:ring-black/20";

  if (variant === "ghost") {
    const ghost =
      tone === "dark"
        ? "text-white/80 hover:text-white bg-white/0 hover:bg-white/10 border border-white/12"
        : "text-zinc-700 hover:text-zinc-950 bg-black/0 hover:bg-black/5 border border-black/10";

    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className={`${base} ${ring} ${ghost}`}
      >
        {children}
      </motion.button>
    );
  }

  const shadow =
    tone === "dark"
      ? "shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
      : "shadow-[0_14px_34px_-26px_rgba(0,0,0,0.35)]";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className={`${base} ${ring} text-[#221B14] ${shadow}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-2xl p-[1px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.40), rgba(227,198,91,0.98), rgba(255,255,255,0.25))",
        }}
      >
        <span className="block h-full w-full rounded-2xl bg-[#E3C65B]" />
      </span>

      <span
        aria-hidden
        className="absolute inset-0 rounded-2xl opacity-70"
        style={{
          background:
            "radial-gradient(120px 60px at 30% 15%, rgba(255,255,255,0.45), transparent 60%)",
        }}
      />

      <span className="relative inline-flex items-center gap-2">
        {children}
        <ArrowRight className="h-4 w-4" />
      </span>
    </motion.button>
  );
}

export default function Navbar({
  brand = "RÊVE",
  items,
  onGetStarted,
  onLogin,
  heroId = "top",
  switchOffsetPx = 140,
}: NavbarProps) {
  const navigate = useNavigate();
  const handleLogin = () => {
    if (onLogin) return onLogin();
    navigate("/login");
  };

  const handleGetStarted = () => {
    if (onGetStarted) return onGetStarted();
    navigate("/signup");
  };
  

  const scrolled = useScrolled(14);
  const onHero = useHeroTheme(heroId, switchOffsetPx);
  const tone: "dark" | "light" = onHero ? "dark" : "light";

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  const navItems: NavItem[] = useMemo(
    () =>
      items ?? [
        { label: "About", href: "#about" },
        { label: "Services", href: "#services" },
        { label: "Contact", href: "#contact" },
      ],
    [items]
  );

  useEffect(() => {
    const onHash = () => setActive(window.location.hash || "");
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const shellClass = onHero
    ? "border border-white/12 bg-white/6 text-white shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]"
    : "border border-black/10 bg-white/85 text-zinc-900 shadow-[0_18px_55px_-38px_rgba(0,0,0,0.28)]";

  const edgeLight = onHero
    ? "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04), rgba(255,255,255,0.08))"
    : "linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02), rgba(0,0,0,0.04))";

  const pillClass = onHero
    ? "bg-white/5 border border-white/10"
    : "bg-black/0 border border-black/10";

  const linkClass = onHero
    ? "text-white/80 hover:text-white"
    : "text-zinc-700 hover:text-zinc-950";

  const activePillClass = onHero
    ? "bg-white/10 border border-white/12"
    : "bg-black/5 border border-black/10";

  const mobileIconClass = onHero
    ? "border border-white/10 bg-white/5 text-white/85"
    : "border border-black/10 bg-white/80 text-zinc-900";

  return (
    <>
      <motion.div
        className="fixed left-0 right-0 top-6 z-50"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            animate={{
              paddingTop: scrolled ? 12 : 14,
              paddingBottom: scrolled ? 12 : 14,
            }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className={[
              "relative overflow-hidden rounded-[22px] backdrop-blur-xl",
              shellClass,
            ].join(" ")}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-80"
              style={{ background: edgeLight }}
            />

            <div className="relative flex items-center justify-between px-5">
              <motion.a
                href="#top"
                className="group flex items-baseline gap-3 select-none"
                onClick={() => setOpen(false)}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
              >
                <span
                  className={[
                    "font-serif text-[22px] sm:text-[24px] tracking-[0.22em]",
                    onHero ? "text-white" : "text-zinc-900",
                  ].join(" ")}
                >
                  {brand}
                </span>

                <span
                  className={[
                    "hidden sm:block text-[10px] tracking-[0.34em]",
                    onHero ? "text-white/60" : "text-zinc-500",
                  ].join(" ")}
                >
                  ACADEMY
                </span>

                <motion.span
                  aria-hidden
                  className={[
                    "ml-1 hidden sm:block h-[1px] w-10",
                    onHero ? "bg-white/35" : "bg-black/15",
                  ].join(" ")}
                  initial={{ width: 18, opacity: 0.5 }}
                  whileHover={{ width: 44, opacity: 0.85 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                />
              </motion.a>

              <div className="hidden md:flex items-center gap-2">
                <div
                  className={[
                    "relative flex items-center rounded-2xl px-1 py-1",
                    pillClass,
                  ].join(" ")}
                >
                  {navItems.map((it) => {
                    const isActive = active === it.href;
                    return (
                      <a
                        key={it.href}
                        href={it.href}
                        onClick={() => setActive(it.href)}
                        className={`relative px-4 py-2 text-sm transition ${linkClass}`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="navPill"
                            className={[
                              "absolute inset-0 rounded-xl",
                              activePillClass,
                            ].join(" ")}
                            transition={{ duration: 0.22, ease: EASE_OUT }}
                          />
                        )}
                        <span className="relative">{it.label}</span>
                      </a>
                    );
                  })}
                </div>

                <div className="ml-3 flex items-center gap-2">
                  <PremiumButton tone={tone} variant="ghost" onClick={handleLogin}>
                    Login
                  </PremiumButton>
                  <PremiumButton tone={tone} onClick={handleGetStarted}>
                    Get started
                  </PremiumButton>
                </div>
              </div>

              <div className="md:hidden flex items-center gap-2">
                <PremiumButton tone={tone} onClick={handleGetStarted}>
                  Get started
                </PremiumButton>

                <motion.button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className={[
                    "ml-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl backdrop-blur-xl",
                    mobileIconClass,
                  ].join(" ")}
                  aria-label="Open menu"
                >
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ y: -10, opacity: 0, scale: 0.99 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className={[
                "absolute left-0 right-0 top-0 mx-6 mt-[88px] overflow-hidden rounded-[22px] border backdrop-blur-xl",
                onHero ? "border-white/12 bg-white/10" : "border-black/10 bg-white/92",
                "shadow-[0_30px_90px_-55px_rgba(0,0,0,0.55)]",
              ].join(" ")}
            >
              <div className="p-4">
                <div className="grid gap-1">
                  {navItems.map((it) => (
                    <a
                      key={it.href}
                      href={it.href}
                      onClick={() => {
                        setActive(it.href);
                        setOpen(false);
                      }}
                      className={[
                        "rounded-2xl px-4 py-3 text-sm transition",
                        onHero
                          ? "text-white/90 hover:text-white hover:bg-white/10"
                          : "text-zinc-800 hover:text-zinc-950 hover:bg-black/5",
                      ].join(" ")}
                    >
                      {it.label}
                    </a>
                  ))}
                </div>

                <div className="mt-3 grid gap-2">
                  <PremiumButton tone={tone} variant="ghost" onClick={handleLogin}>
                    Login
                  </PremiumButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
