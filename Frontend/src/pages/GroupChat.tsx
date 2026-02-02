// src/pages/GroupChat.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import {
  ArrowLeft,
  Send,
  Smile,
  Users,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Lock,
  Globe,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { logout } from "@/utils/authToken";

import { useGroupChatSocket, type ChatMessage } from "@/hooks/useGroupChatSocket";
import {
  isUuid,
  useGroupDetails,
  useGroupMembers,
  useJoinGroup,
  useMyMembership,
} from "@/hooks/useGroups";

// ✅ همون هوکی که بالا فرستادی (Public batch)
import { usePublicProfilesBatch } from "@/hooks/usePublicProfilesBatch";

// ✅ برای آواتار سایر اعضا (public)
import { getUserAvatarUrl } from "@/api/media";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type UiMessage = {
  id: string;
  text: string;
  time: string;
  mine: boolean;
  senderUid: string;
  senderLabel?: string | null;
  senderAvatarUrl?: string | null;
};

type MemberCard = {
  uid: string;
  fullName: string;
  username?: string | null;
  avatarUrl: string | null;
  online: boolean;
  isMe: boolean;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toNum(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function isMineMessage(senderUid: any, myUid: any): boolean {
  if (senderUid == null || myUid == null) return false;
  if (String(senderUid) === String(myUid)) return true;
  const a = toNum(senderUid);
  const b = toNum(myUid);
  return a != null && b != null && a === b;
}

function initialsFromName(name: string) {
  const cleaned = (name || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "?";
  const parts = cleaned.split(" ");
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (a + b).toUpperCase() || "?";
}

function safeStr(x: any): string | null {
  return typeof x === "string" && x.trim() ? x.trim() : null;
}

function pickUid(m: any): string | null {
  const uid = m?.uid ?? m?.user_id ?? m?.userId ?? m?.id ?? m?.profile?.uid ?? null;
  if (uid == null) return null;
  const s = String(uid).trim();
  return s ? s : null;
}

function pickNameFromMember(m: any): { displayName: string | null; username: string | null } {
  const displayName =
    safeStr(m?.profile?.display_name) ??
    safeStr(m?.profile?.displayName) ??
    safeStr(m?.profile?.name) ??
    safeStr(m?.display_name) ??
    safeStr(m?.displayName) ??
    safeStr(m?.name) ??
    null;

  const username =
    safeStr(m?.profile?.username) ??
    safeStr(m?.username) ??
    safeStr(m?.handle) ??
    null;

  return { displayName, username };
}

function AvatarCircle({
  uid,
  src,
  fallback,
  alt,
}: {
  uid: string;
  src?: string | null;
  fallback: string;
  alt: string;
}) {
  // ✅ مثل Topbar: اگر 404 شد، عکس رو بیار پایین
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    // وقتی uid یا src عوض شد، دوباره اجازه بده لود شه
    setBroken(false);
  }, [uid, src]);

  const showImg = Boolean(src && !broken);

  return (
    <div className="relative h-10 w-10 rounded-2xl overflow-hidden border border-zinc-200 bg-white grid place-items-center">
      {showImg ? (
        <img
          src={src!}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="text-xs font-bold text-zinc-600">{fallback}</span>
      )}
    </div>
  );
}

export default function GroupChat() {
  const { groupId } = useParams<{ groupId: string }>();
  const gid = groupId || "";

  const location = useLocation();
  const navigate = useNavigate();

  const groupNameFromState =
    (location.state as { groupName?: string } | null)?.groupName ?? "Group Chat";

  const invalidId = Boolean(gid) && !isUuid(gid);

  // group info
  const groupQ = useGroupDetails(gid, Boolean(gid));
  const group = groupQ.data;

  const visibility = String(group?.visibility ?? "private");
  const isPrivate = visibility === "private" || visibility === "invite_only";

  // membership
  const membershipQ = useMyMembership(gid, Boolean(gid));
  const myUid = membershipQ.data?.uid ?? null;
  const isMember = Boolean(membershipQ.data?.isMember);

  // members
  const canSeeMembers = !isPrivate || isMember;
  const membersQ = useGroupMembers(gid, Boolean(gid) && canSeeMembers);
  const members = membersQ.data?.items ?? [];
  const memberCount = membersQ.data?.total ?? members.length;

  const joinMut = useJoinGroup();

  // socket chat + presence
  const {
    messages: serverMessages,
    connected,
    joined,
    lastError,
    send,
    presence,
    checkPresence,
  } = useGroupChatSocket({
    groupId: gid,
    limit: 50,
  });

  // emoji
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!emojiRef.current) return;
      if (!emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // input
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleButtonClick = () => fileInputRef.current?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log(files);
  };

  // scroll bottom
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // --- collect member uids
  const memberUids = useMemo(() => {
    const set = new Set<string>();
    for (const m of members as any[]) {
      const uid = pickUid(m);
      if (uid) set.add(uid);
    }
    return Array.from(set);
  }, [members]);

  // --- fetch public profiles (fallback for name/username/etc)
  // این دقیقاً همون روشی‌ه که بالا فرستادی (batch)
  const profiles = usePublicProfilesBatch(memberUids, canSeeMembers);

  // --- presence snapshot after join (فقط وقتی واقعاً عضو هستی)
  useEffect(() => {
    if (!isMember || !joined) return;
    if (!memberUids.length) return;
    checkPresence(memberUids);
  }, [isMember, joined, memberUids, checkPresence]);

  // --- build member cards (Right panel)
  const memberCards: MemberCard[] = useMemo(() => {
    const out: MemberCard[] = [];

    for (const m of members as any[]) {
      const uid = pickUid(m);
      if (!uid) continue;

      const isMe = myUid != null && String(uid) === String(myUid);

      // 1) اول از payload خودش
      const fromMember = pickNameFromMember(m);

      // 2) بعد از public batch
      const pub = profiles.map.get(String(uid));

      const fullName =
        fromMember.displayName ??
        safeStr(pub?.display_name) ??
        safeStr(pub?.displayName) ??
        safeStr(pub?.name) ??
        safeStr(pub?.username) ??
        `User #${uid}`;

      const username =
        fromMember.username ??
        safeStr(pub?.username) ??
        safeStr(pub?.handle) ??
        null;

      // ✅ آواتار رو مثل Media layer بساز (این همون مسیریه که بالا داری)
      // اگر کاربر آواتار نداشته باشه 404 می‌خوری، ولی UI با onError fallback می‌ده
      const avatarUrl = getUserAvatarUrl(uid, { bustCache: true });

      const online = presence[String(uid)] === "online" || Boolean(m?.online);

      out.push({
        uid: String(uid),
        fullName: String(fullName),
        username,
        avatarUrl,
        online,
        isMe,
      });
    }

    return out;
  }, [members, myUid, profiles.map, presence]);

  // --- messages -> UI
  const uiMessages: UiMessage[] = useMemo(() => {
    return (serverMessages || []).map((m: ChatMessage) => {
      const senderUidRaw = (m as any).sender_uid ?? (m as any).senderUid ?? "";
      const senderUid = String(senderUidRaw);

      const mine = isMineMessage(senderUidRaw, myUid);

      // label/avatar از memberCards
      const card = memberCards.find((x) => x.uid === senderUid);

      const created =
        (m as any).created_at ??
        (m as any).createdAt ??
        new Date().toISOString();

      const senderLabel = mine ? "You" : card?.fullName ?? `User #${senderUid}`;
      const senderAvatarUrl = card?.avatarUrl ?? (senderUid ? getUserAvatarUrl(senderUid, { bustCache: true }) : null);

      return {
        id: String((m as any).id ?? crypto.randomUUID()),
        text: String((m as any).text ?? ""),
        time: formatTime(created),
        mine,
        senderUid,
        senderLabel,
        senderAvatarUrl,
      };
    });
  }, [serverMessages, myUid, memberCards]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [uiMessages.length]);

  const sendMessage = () => {
    const t = input.trim();
    if (!t || !gid) return;
    send(t);
    setInput("");
  };

  const canType = Boolean(isMember && joined);

  return (
    <div className="h-screen overflow-hidden bg-creamtext text-zinc-900">
      <div className="flex h-full">
        <Sidebar activeKey="groups" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64 flex flex-col h-full">
          <Topbar />

          <div className="flex-1 min-h-0 w-full px-4 py-4">
            <div className="max-w-7xl mx-auto h-full min-h-0">
              <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
                {/* Chat */}
                <motion.section
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="
                    min-h-0 flex flex-col overflow-hidden
                    rounded-3xl border border-zinc-200
                    bg-white/80 backdrop-blur shadow-sm
                  "
                >
                  {/* Header */}
                  <div className="shrink-0 px-4 py-3 border-b border-zinc-200 bg-white/70">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() =>
                            navigate(`/groups/${gid}`, {
                              state: { groupName: group?.name ?? groupNameFromState },
                            })
                          }
                          className="
                            rounded-xl border border-zinc-200 bg-white
                            p-2 text-zinc-600
                            hover:border-yellow-300 hover:text-zinc-900
                            transition-colors
                          "
                          type="button"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {group?.name ?? groupNameFromState}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Users className="h-4 w-4" />
                            <span>
                              {membersQ.isLoading ? "Loading members..." : `${memberCount} members`}
                            </span>
                            <span className="text-zinc-300">•</span>
                            <span className="font-medium">
                              {connected ? (joined ? "Joined" : "Connecting...") : "Offline"}
                            </span>
                          </div>

                          {invalidId ? (
                            <p className="text-xs text-rose-700 mt-1">
                              groupId باید UUID باشه: <span className="font-mono">{gid}</span>
                            </p>
                          ) : null}

                          {lastError ? (
                            <p className="text-xs text-red-600 mt-1">
                              {lastError.message || lastError.code}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-500">
                        {!isMember ? (
                          <button
                            onClick={() => joinMut.mutate(gid)}
                            disabled={joinMut.isPending}
                            className="
                              inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white
                              px-3 py-2 text-xs font-semibold
                              hover:border-yellow-300 transition
                              disabled:opacity-60
                            "
                            type="button"
                          >
                            {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                            {joinMut.isPending ? "Joining..." : isPrivate ? "Request to join" : "Join"}
                          </button>
                        ) : null}

                        <button className="rounded-xl p-2 hover:bg-zinc-50 transition" type="button">
                          <Phone className="h-4 w-4" />
                        </button>
                        <button className="rounded-xl p-2 hover:bg-zinc-50 transition" type="button">
                          <Video className="h-4 w-4" />
                        </button>
                        <button className="rounded-xl p-2 hover:bg-zinc-50 transition" type="button">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    className="
                      flex-1 min-h-0 overflow-y-auto
                      bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,0.12),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(14,165,233,0.08),transparent_45%),linear-gradient(to_bottom,#ffffff,#fafafa)]
                      px-4 py-4
                    "
                  >
                    {!isMember ? (
                      <div className="h-full grid place-items-center">
                        <div className="max-w-md rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
                          <p className="text-base font-semibold">You’re not a member</p>
                          <p className="mt-2 text-sm text-zinc-500">
                            Join the group to read and send messages.
                          </p>
                          <button
                            onClick={() => joinMut.mutate(gid)}
                            disabled={joinMut.isPending}
                            className="
                              mt-4 inline-flex items-center gap-2 rounded-2xl
                              border border-zinc-200 bg-[#FFFBF2] px-4 py-2 text-sm font-semibold
                              hover:border-yellow-300 transition disabled:opacity-60
                            "
                            type="button"
                          >
                            {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                            {joinMut.isPending ? "Joining..." : isPrivate ? "Request to join" : "Join"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="min-h-full flex flex-col justify-end">
                        <AnimatePresence initial={false}>
                          {uiMessages.map((m) => (
                            <motion.div
                              key={m.id}
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className={`mb-3 flex ${m.mine ? "justify-end" : "justify-start"}`}
                            >
                              {/* left avatar */}
                              {!m.mine && (
                                <div className="mr-2 mt-1 h-8 w-8 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">
                                  {m.senderAvatarUrl ? (
                                    <img
                                      src={m.senderAvatarUrl}
                                      alt="user"
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        // ✅ مثل Topbar: fallback
                                        (e.currentTarget as HTMLImageElement).src = "";
                                        (e.currentTarget as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    "?"
                                  )}
                                </div>
                              )}

                              <div
                                className={`
                                  max-w-[78%] rounded-3xl px-4 py-2
                                  text-sm shadow-sm break-words
                                  ${m.mine
                                    ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                                    : "bg-zinc-100 text-zinc-900"}
                                `}
                              >
                                {!m.mine && m.senderLabel ? (
                                  <p className="text-[11px] font-semibold opacity-80 mb-1">
                                    {m.senderLabel}
                                  </p>
                                ) : null}
                                <p>{m.text}</p>
                                <p className="mt-1 text-[10px] opacity-70 text-right">{m.time}</p>
                              </div>

                              {/* right avatar */}
                              {m.mine && (
                                <div className="ml-2 mt-1 h-8 w-8 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">
                                  {m.senderAvatarUrl ? (
                                    <img
                                      src={m.senderAvatarUrl}
                                      alt="me"
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = "";
                                        (e.currentTarget as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    "ME"
                                  )}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <div ref={bottomRef} />
                      </div>
                    )}
                  </div>

                  {/* Composer */}
                  <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative" ref={emojiRef}>
                        <button
                          type="button"
                          onClick={() => setEmojiOpen((v) => !v)}
                          className="text-zinc-400 hover:text-zinc-600 transition"
                          disabled={!canType}
                        >
                          <Smile className="h-5 w-5" />
                        </button>

                        {emojiOpen && canType && (
                          <div className="absolute bottom-12 left-0 z-50">
                            <EmojiPicker
                              theme={Theme.LIGHT}
                              onEmojiClick={(emojiData: EmojiClickData) => {
                                setInput((prev) => prev + emojiData.emoji);
                                setEmojiOpen(false);
                              }}
                              width={320}
                              height={380}
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleButtonClick}
                        className="text-zinc-400 hover:text-zinc-600 transition"
                        disabled={!canType}
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.zip,.rar"
                        onChange={handleFileChange}
                      />

                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder={canType ? "Type a message…" : "Join the group to chat…"}
                        disabled={!canType}
                        className="
                          flex-1 bg-transparent outline-none
                          text-sm placeholder:text-zinc-400
                          disabled:opacity-50
                        "
                      />

                      <button
                        onClick={sendMessage}
                        disabled={!canType}
                        className="
                          rounded-xl bg-yellow-400 p-2
                          text-white hover:bg-yellow-500
                          transition-colors
                          disabled:opacity-50 disabled:hover:bg-yellow-400
                        "
                        type="button"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.section>

                {/* Right panel */}
                <motion.aside
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="
                    hidden lg:flex min-h-0 flex-col
                    rounded-3xl border border-zinc-200 bg-white/80 backdrop-blur
                    shadow-sm overflow-hidden
                  "
                >
                  <div className="p-4 border-b border-zinc-200">
                    <p className="text-sm font-semibold text-zinc-900">
                      {group?.name ?? groupNameFromState}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Members · {membersQ.isLoading ? "..." : memberCount}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-zinc-600">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-semibold">Team</span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                      <p className="text-xs font-semibold text-zinc-700">About</p>
                      <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                        {String(group?.description ?? "").trim()
                          ? group?.description
                          : "Working together, sharing ideas and communicating effectively."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-zinc-700">Members</p>
                        {membersQ.isLoading ? (
                          <span className="text-[11px] text-zinc-400">Loading…</span>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-2">
                        {memberCards.map((m) => (
                          <div
                            key={m.uid}
                            className={`
                              flex items-center gap-3 rounded-2xl
                              border border-zinc-200 bg-zinc-50 px-3 py-2
                              ${m.isMe ? "ring-1 ring-yellow-300" : ""}
                            `}
                          >
                            <div className="relative">
                              <AvatarCircle
                                uid={m.uid}
                                src={m.avatarUrl}
                                fallback={initialsFromName(m.fullName)}
                                alt={m.fullName}
                              />
                              <span
                                className={`
                                  absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white
                                  ${m.online ? "bg-emerald-500" : "bg-zinc-300"}
                                `}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-zinc-900">
                                {m.fullName}
                                {m.isMe ? (
                                  <span className="ml-2 text-[11px] font-semibold text-yellow-700">
                                    (You)
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate text-[11px] text-zinc-500 mt-0.5">
                                {m.username ? `@${m.username.replace(/^@/, "")}` : `ID: ${m.uid}`}
                              </p>
                            </div>
                          </div>
                        ))}

                        {!memberCards.length && !membersQ.isLoading ? (
                          <p className="text-xs text-zinc-500">No members found.</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
