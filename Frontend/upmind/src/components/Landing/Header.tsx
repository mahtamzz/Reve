import React from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";

export type HeroHeaderProps = {
  brand?: string;
  onGetStarted?: () => void;
  onLogin?: () => void;
  heroImageUrl?: string;
};

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function HeroHeader({
  brand = "REVE",
  onGetStarted,
  onLogin,
  heroImageUrl,
}: HeroHeaderProps) {
  return (
    <header className="relative overflow-hidden" id="top">
      <div className="relative h-[75vh] min-h-[560px] w-full bg-[#2A241D]">
        {/* Background image */}
        {/* Sentinel for Navbar theme switch */}
        <div
        id="nav-sentinel"
        className="absolute top-0 left-0 h-[2px] w-full"
        aria-hidden
        />

        {heroImageUrl ? (
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 scale-[1.04]"
              style={{
                backgroundImage: `url(${heroImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(6px) saturate(1.06) brightness(0.95)",
                transform: "translateZ(0)",
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#2A241D]" />
        )}

        {/* overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_78%_36%,rgba(255,200,140,0.22),transparent_62%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/80" />

        {/* Navbar (fixed in its own component) */}
        <Navbar switchOffsetPx={220} />

        {/* ✅ Layout that centers hero content properly */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 h-full">
          {/* این padding-top فقط برای اینکه زیر navbar نیاد (نه برای جابه‌جایی وسط) */}
          <div className="h-full pt-[110px] sm:pt-[120px] pb-20 flex items-center">
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.05 }}
            >
              <h1 className="font-serif text-[48px] leading-[1.05] text-white sm:text-[62px]">
                Responsibility begins
                <br />
                with a dream...
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-6 text-white/80">
                Once a dream is given shape, responsibility inevitably begins. A
                dream is inseparable from imagination, and imagination, in turn,
                relies upon strength.
              </p>
            </motion.div>
          </div>
        </div>

        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-[#6B6A58]/70" />
      </div>
    </header>
  );
}
