import React from "react";
import HeroHeader from "@/components/Landing/Header";
import heroImg from "../../pics/iewek-gnos-hhUx08PuYpc-unsplash.jpg";
import famImg from "../../pics/brooke-cagle--uHVRvDr7pg-unsplash.jpg";

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="text-[11px] tracking-[0.34em] text-[#2A241D]/60 uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-serif text-4xl leading-tight text-[#2A241D]">
        {title}
      </h2>
      {desc && (
        <p className="mt-4 text-sm leading-7 text-[#3A332C]/75">{desc}</p>
      )}
    </div>
  );
}

function FeatureCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/55 backdrop-blur p-6 shadow-[0_18px_45px_-32px_rgba(0,0,0,0.35)]">
      <h3 className="font-semibold text-[#2A241D]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#3A332C]/75">{desc}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[11px] font-medium text-[#3A332C]/80">
      {children}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F6F1E6] text-[#1F1B16]">
      <HeroHeader
        heroImageUrl={heroImg}
        onGetStarted={() => console.log("Get started")}
        onLogin={() => console.log("Login")}
        brand="RÊVE"
      />

      {/* ====== STATS STRIP (new) ====== */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 -mt-10 sm:-mt-14 relative z-10">
          <div className="rounded-[28px] border border-black/10 bg-white/70 backdrop-blur-xl shadow-[0_24px_65px_-48px_rgba(0,0,0,0.45)]">
            <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-3">
              <div>
                <p className="text-[11px] tracking-[0.28em] uppercase text-[#3A332C]/60">
                  Focus sessions
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#2A241D]">
                  Simple, fast
                </p>
                <p className="mt-2 text-sm leading-6 text-[#3A332C]/70">
                  Start a session in one click, keep your flow, finish with a summary.
                </p>
              </div>

              <div>
                <p className="text-[11px] tracking-[0.28em] uppercase text-[#3A332C]/60">
                  For everyone
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#2A241D]">
                  Solo or group
                </p>
                <p className="mt-2 text-sm leading-6 text-[#3A332C]/70">
                  Works for high school, uni, deep work — your routine, your rules.
                </p>
              </div>

              <div>
                <p className="text-[11px] tracking-[0.28em] uppercase text-[#3A332C]/60">
                  Clean design
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#2A241D]">
                  Calm & modern
                </p>
                <p className="mt-2 text-sm leading-6 text-[#3A332C]/70">
                  Editorial typography with soft tones, built to feel premium.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* subtle ambient */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(900px_260px_at_50%_0%,rgba(227,198,91,0.25),transparent_65%)]" />
      </section>

      {/* ====== ABOUT ====== */}
      <section id="about" className="mt-16 bg-[#6B6A58] text-[#F3EEDF]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[11px] tracking-[0.34em] uppercase text-[#F3EEDF]/65">
                About
              </p>
              <h2 className="mt-2 font-serif text-4xl sm:text-[44px] leading-tight">
                easy as ABC
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#F3EEDF]/85">
                No matter what you&apos;re studying for or what your home setup is,
                we&apos;ve got a solution for you — solo sessions or group focus.
                Keep it simple, consistent, and calm.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill>Focus timer</Pill>
                <Pill>Study dashboard</Pill>
                <Pill>Gentle routines</Pill>
              </div>
            </div>

            {/* mini block */}
            <div className="w-full max-w-sm rounded-[28px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="text-xs text-[#F3EEDF]/75 leading-6">
                “A dream becomes real when you build a rhythm around it.”
              </p>
              <div className="mt-4 h-[1px] w-full bg-white/15" />
              <p className="mt-4 text-[11px] tracking-[0.28em] uppercase text-[#F3EEDF]/65">
                RÊVE METHOD
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES (new) ====== */}
      <section className="bg-[#F6F1E6]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <SectionTitle
            eyebrow="What you get"
            title="A calm system for consistent progress."
            desc="Minimal tools, maximum clarity. Designed for focus and long-term habit building."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="One-tap sessions"
              desc="Start instantly. No setup screens, no friction — just begin."
            />
            <FeatureCard
              title="Progress you can trust"
              desc="Track minutes naturally across sessions, without overthinking."
            />
            <FeatureCard
              title="Soft UI, strong structure"
              desc="Warm, pastel design that supports attention instead of stealing it."
            />
            <FeatureCard
              title="Works everywhere"
              desc="Mobile-first layout with clean navigation that stays readable."
            />
            <FeatureCard
              title="Simple sections"
              desc="Landing page sections that scale as your product grows."
            />
            <FeatureCard
              title="Fast & maintainable"
              desc="Clean components with reusable UI blocks and spacing rules."
            />
          </div>
        </div>
      </section>

      {/* ====== SERVICES (image + quote) ====== */}
      <section id="services" className="bg-[#F6F1E6]">
        <div className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            {/* image */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[32px] bg-[radial-gradient(700px_300px_at_20%_0%,rgba(227,198,91,0.28),transparent_65%)]" />
              <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white/40 shadow-[0_24px_65px_-48px_rgba(0,0,0,0.45)]">
                <img
                  src={famImg}
                  alt="Students studying together"
                  className="h-full w-full object-cover aspect-[4/3]"
                />
              </div>
            </div>

            {/* text */}
            <div>
              <p className="text-[11px] tracking-[0.34em] uppercase text-[#2A241D]/60">
                Philosophy
              </p>
              <h3 className="mt-2 font-serif text-4xl leading-tight text-[#2A241D]">
                The only way to live
                <br />
                your dream is to take
                <br />
                action.
              </h3>

              <p className="mt-6 max-w-md text-sm leading-7 text-[#3A332C]/75">
                Dreams don&apos;t come to life by chance, but by choice. Every small
                step turns an idea into reality — and a routine into momentum.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill>Take action</Pill>
                <Pill>Build rhythm</Pill>
                <Pill>Stay consistent</Pill>
              </div>

              <p className="mt-6 max-w-md text-sm leading-7 text-[#3A332C]/75">
                Action is where courage meets possibility — and where your dream
                finally begins to breathe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FOOTER (improved) ====== */}
      <footer id="contact" className="border-t border-black/10 bg-[#F6F1E6]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="font-serif text-2xl tracking-[0.18em] text-[#2A241D]">
                RÊVE
              </div>
              <p className="mt-3 text-sm leading-6 text-[#3A332C]/70 max-w-xs">
                Calm tools for deep focus and steady progress.
              </p>
            </div>

            <div className="text-sm text-[#3A332C]/75">
              <div className="font-semibold text-[#2A241D] mb-3">About</div>
              <ul className="space-y-2">
                <li className="hover:text-[#2A241D] transition cursor-pointer">
                  Latest news &amp; releases
                </li>
                <li className="hover:text-[#2A241D] transition cursor-pointer">
                  FAQs &amp; Rules
                </li>
                <li className="hover:text-[#2A241D] transition cursor-pointer">
                  About us
                </li>
                <li className="hover:text-[#2A241D] transition cursor-pointer">
                  Our Tutors &amp; Supporters
                </li>
                <li className="hover:text-[#2A241D] transition cursor-pointer">
                  Jobs
                </li>
              </ul>
            </div>

            <div className="text-sm text-[#3A332C]/75">
              <div className="font-semibold text-[#2A241D] mb-3">Legal</div>
              <ul className="space-y-2">
                <li className="hover:text-[#2A241D] transition cursor-pointer">
                  Privacy policy
                </li>
                <li className="hover:text-[#2A241D] transition cursor-pointer">
                  Terms and conditions
                </li>
                <li className="hover:text-[#2A241D] transition cursor-pointer">
                  Cookies
                </li>
                <li className="hover:text-[#2A241D] transition cursor-pointer">
                  Imprint
                </li>
              </ul>
            </div>

            <div className="text-sm text-[#3A332C]/75">
              <div className="font-semibold text-[#2A241D] mb-3">
                Newsletter
              </div>
              <p className="text-sm leading-6 text-[#3A332C]/70">
                Monthly updates. No spam.
              </p>

              <div className="mt-4 flex gap-2">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm outline-none focus:border-black/20"
                  placeholder="Email address"
                />
                <button className="rounded-2xl bg-[#E3C65B] px-4 py-2 text-sm font-semibold text-[#221B14] border border-black/10 shadow-sm hover:brightness-105 active:brightness-95 transition">
                  Join
                </button>
              </div>

              <p className="mt-3 text-[11px] text-[#3A332C]/60">
                By subscribing you agree to our privacy policy.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-6 text-xs text-[#3A332C]/60">
            <span>© {new Date().getFullYear()} RÊVE. All rights reserved.</span>
            <span className="tracking-[0.18em] uppercase">Made for focus</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
