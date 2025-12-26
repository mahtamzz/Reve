// src/pages/Help.tsx
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  LifeBuoy,
  BookOpen,
  ShieldCheck,
  Users,
  Clock3,
  MessageCircle,
  ChevronDown,
  Mail,
  ArrowRight,
} from "lucide-react";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { logout } from "@/utils/authToken";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type FaqItem = {
  id: string;
  category: string;
  q: string;
  a: React.ReactNode;
  tags?: string[];
};

const CATEGORIES = [
  { key: "getting-started", label: "Getting started", icon: BookOpen },
  { key: "groups", label: "Groups & members", icon: Users },
  { key: "focus", label: "Focus sessions", icon: Clock3 },
  { key: "account", label: "Account & privacy", icon: ShieldCheck },
  { key: "support", label: "Support", icon: LifeBuoy },
] as const;

const FAQ: FaqItem[] = [
  {
    id: "gs-1",
    category: "getting-started",
    q: "How do I create my first group?",
    a: (
      <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-700">
        <li>Go to <b>Groups</b> from the sidebar.</li>
        <li>Click <b>New group</b>.</li>
        <li>Choose <b>Public</b> or <b>Private</b>, set <b>Weekly XP goal</b> and <b>Minimum daily minutes</b>.</li>
        <li>Hit <b>Create</b>. You’ll be the owner.</li>
      </ol>
    ),
    tags: ["create", "group", "owner"],
  },
  {
    id: "gs-2",
    category: "getting-started",
    q: "What are Weekly XP goal and Minimum daily minutes?",
    a: (
      <div className="space-y-2 text-sm text-zinc-700">
        <p>
          <b>Weekly XP goal</b> is your group’s target for the week (used for progress and motivation).
        </p>
        <p>
          <b>Minimum daily minutes</b> helps members stay consistent by setting a baseline for daily study.
        </p>
      </div>
    ),
    tags: ["weekly_xp", "minimum", "goal"],
  },
  {
    id: "grp-1",
    category: "groups",
    q: "Why can’t I open a group or see its details?",
    a: (
      <div className="space-y-2 text-sm text-zinc-700">
        <p>Usually one of these is true:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The group was deleted.</li>
          <li>The group is private and you’re not a member.</li>
          <li>You are logged into a different account.</li>
        </ul>
        <p className="text-xs text-zinc-500">
          Tip: If you see “Not Found (404)”, the group doesn’t exist on the server anymore.
        </p>
      </div>
    ),
    tags: ["404", "private", "access"],
  },
  {
    id: "grp-2",
    category: "groups",
    q: "Who can delete a group?",
    a: (
      <div className="space-y-2 text-sm text-zinc-700">
        <p>
          Only the <b>owner</b> can delete a group. Admins and members can’t.
        </p>
        <p className="text-xs text-zinc-500">
          If you’re the owner and want to leave, transfer ownership first.
        </p>
      </div>
    ),
    tags: ["owner", "delete"],
  },
  {
    id: "focus-1",
    category: "focus",
    q: "How do focus sessions work?",
    a: (
      <div className="space-y-2 text-sm text-zinc-700">
        <p>
          Focus sessions help you log study time. Pick a subject, start a timer, and your progress is tracked.
        </p>
        <p className="text-xs text-zinc-500">
          (If you haven’t connected this feature yet, keep this section as a placeholder.)
        </p>
      </div>
    ),
    tags: ["timer", "subjects"],
  },
  {
    id: "acc-1",
    category: "account",
    q: "Do you store my password or sensitive info?",
    a: (
      <div className="space-y-2 text-sm text-zinc-700">
        <p>
          Your app uses secure authentication. We never display sensitive tokens on the UI.
        </p>
        <p className="text-xs text-zinc-500">
          (Customize this based on your auth: JWT in cookie/header, etc.)
        </p>
      </div>
    ),
    tags: ["privacy", "security"],
  },
  {
    id: "sup-1",
    category: "support",
    q: "How can I report a bug or request a feature?",
    a: (
      <div className="space-y-2 text-sm text-zinc-700">
        <p>
          Use the support box on this page. Include a screenshot and what you expected vs what happened.
        </p>
      </div>
    ),
    tags: ["bug", "feature"],
  },
];

function Pill({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-yellow-800">
      {children}
    </span>
  );
}

function FaqAccordion({
  items,
  openId,
  setOpenId,
}: {
  items: FaqItem[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const isOpen = openId === it.id;
        return (
          <div
            key={it.id}
            className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : it.id)}
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{it.q}</p>
                {it.tags?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {it.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[11px] font-semibold text-zinc-500 border border-zinc-200 bg-zinc-50 rounded-full px-2 py-0.5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <ChevronDown
                className={[
                  "h-4 w-4 text-zinc-500 transition-transform",
                  isOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                >
                  <div className="px-5 pb-5">
                    <div className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
                      {it.a}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function Help() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<(typeof CATEGORIES)[number]["key"]>("getting-started");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byCat = FAQ.filter((x) => x.category === activeCat);

    if (!q) return byCat;

    return byCat.filter((x) => {
      const hay = [
        x.q,
        typeof x.a === "string" ? x.a : "",
        ...(x.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, activeCat]);

  const activeCategoryLabel =
    CATEGORIES.find((c) => c.key === activeCat)?.label ?? "Help";

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="help" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar username={"User"} />

          <div className="mx-auto max-w-6xl px-4 py-6">
            {/* Hero */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="
                relative overflow-hidden
                rounded-3xl border border-zinc-200
                bg-white shadow-sm
                p-6 sm:p-8
              "
            >
              <div className="pointer-events-none absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-yellow-200/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-28 h-[520px] w-[520px] rounded-full bg-yellow-100/50 blur-3xl" />

              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="max-w-xl">
                  <p className="text-xs tracking-[0.35em] text-zinc-500">HELP CENTER</p>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                    Ask anything — we’ve got you.
                  </h1>
                  <p className="mt-2 text-sm text-zinc-600">
                    Guides for groups, focus sessions, and account settings — in the same style as your dashboard.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Pill>Groups</Pill>
                    <Pill>Focus</Pill>
                    <Pill>Privacy</Pill>
                    <Pill>Support</Pill>
                  </div>

                  <div className="mt-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search help articles..."
                        className="
                          w-full sm:w-[520px]
                          rounded-2xl border border-zinc-200 bg-white
                          pl-11 pr-4 py-3 text-sm text-zinc-700
                          shadow-sm outline-none
                          focus:ring-2 focus:ring-yellow-300/60
                        "
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      Tip: try “delete group”, “private group”, “404”, “weekly xp”
                    </p>
                  </div>
                </div>

                {/* right side illustration-ish card (no external image) */}
                <div className="lg:w-[360px]">
                  <div className="rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-700">
                      <MessageCircle className="h-4 w-4" />
                      <p className="text-sm font-semibold">Quick help</p>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs font-semibold text-zinc-900">Most common</p>
                        <p className="mt-1 text-xs text-zinc-600">
                          If you see <b>404</b>, the group id in your browser is old or the group was deleted.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs font-semibold text-zinc-900">Owner actions</p>
                        <p className="mt-1 text-xs text-zinc-600">
                          Only owners can delete a group — members/admins can’t.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveCat("support");
                          setOpenId("sup-1");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="
                          w-full rounded-2xl border border-zinc-200 bg-white
                          px-4 py-3 text-xs font-semibold text-zinc-700
                          hover:border-yellow-300 hover:text-zinc-900 transition
                          inline-flex items-center justify-between
                        "
                      >
                        Contact support
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Main grid */}
            <div className="mt-6 grid grid-cols-12 gap-6">
              {/* Left: categories */}
              <motion.aside
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="col-span-12 lg:col-span-4"
              >
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-900">Categories</p>
                  <p className="mt-1 text-xs text-zinc-500">Browse topics like your dashboard sections.</p>

                  <div className="mt-4 grid gap-2">
                    {CATEGORIES.map((c) => {
                      const Icon = c.icon;
                      const active = c.key === activeCat;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => {
                            setActiveCat(c.key);
                            setOpenId(null);
                          }}
                          className={[
                            "w-full rounded-2xl border px-4 py-3 text-left transition shadow-sm",
                            active
                              ? "border-yellow-300 bg-yellow-50"
                              : "border-zinc-200 bg-white hover:border-yellow-200",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={[
                                "h-10 w-10 rounded-xl flex items-center justify-center border",
                                active
                                  ? "bg-yellow-100 border-yellow-200"
                                  : "bg-zinc-50 border-zinc-200",
                              ].join(" ")}
                            >
                              <Icon className="h-5 w-5 text-amber-700" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-zinc-900">{c.label}</p>
                              <p className="text-xs text-zinc-500 truncate">
                                {c.key === "getting-started" && "Basics to start using the app"}
                                {c.key === "groups" && "Members, roles, private/public"}
                                {c.key === "focus" && "Timers, subjects, logging"}
                                {c.key === "account" && "Security, privacy, login"}
                                {c.key === "support" && "Bug reports & contact"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
                    <div className="flex items-center gap-2 text-zinc-700">
                      <Mail className="h-4 w-4" />
                      <p className="text-xs font-semibold">Need help fast?</p>
                    </div>
                    <p className="mt-1 text-xs text-zinc-600">
                      Send a message with screenshot + steps. We’ll reply as soon as possible.
                    </p>
                    <button
                      type="button"
                      className="
                        mt-3 w-full rounded-xl bg-amber-500 hover:bg-amber-600
                        text-white px-4 py-2 text-xs font-semibold shadow-sm transition
                      "
                      onClick={() => {
                        setActiveCat("support");
                        setOpenId("sup-1");
                      }}
                    >
                      Open support tips
                    </button>
                  </div>
                </div>
              </motion.aside>

              {/* Right: FAQ */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="col-span-12 lg:col-span-8"
              >
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{activeCategoryLabel}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {query.trim()
                          ? `Results for “${query.trim()}”`
                          : "Click an item to expand."}
                      </p>
                    </div>

                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                      {filtered.length} articles
                    </span>
                  </div>

                  <div className="mt-5">
                    {filtered.length ? (
                      <FaqAccordion items={filtered} openId={openId} setOpenId={setOpenId} />
                    ) : (
                      <div className="rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-6 text-center">
                        <p className="text-sm font-semibold text-zinc-900">No results</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Try another keyword (e.g. “private”, “delete”, “goal”).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            </div>

            <footer className="mt-10 text-center text-xs text-zinc-400">
              REVE help center
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
