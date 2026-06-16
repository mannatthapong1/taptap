"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useChat } from "@/lib/hooks/useChat";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { markChatSeen } from "@/lib/hooks/useUnreadMessages";
import ChatBubble from "@/components/chat/ChatBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import QuickActions from "@/components/chat/QuickActions";
import RatingModal from "@/components/rating/RatingModal";
import type { Match } from "@/lib/types";

export default function EmployerChatPage() {
  const t = useTranslations("chat");
  const { matchId, locale } = useParams<{ matchId: string; locale: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const { messages, typingUsers, loading, sendMessage, broadcastTyping } = useChat(matchId, user?.id ?? "");
  const [text, setText] = useState("");
  const [matchData, setMatchData] = useState<Match | null>(null);
  const [showRating, setShowRating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("matches").select("*, seeker:seeker_profiles(name, user_id), job:jobs(title)").eq("id", matchId).single()
      .then(({ data }) => {
        setMatchData(data as Match);
        if (data?.status === "completed" && !data?.employer_rated) setShowRating(true);
      });
  }, [matchId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typingUsers]);

  // Clear unread badge whenever messages update while viewing this chat
  useEffect(() => { markChatSeen(); }, [messages]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await sendMessage(trimmed);
  }

  async function handleQuickAction(type: "schedule_interview" | "accept_job" | "send_resume") {
    const msgMap: Record<string, string> = {
      schedule_interview: "📅 ขอนัดสัมภาษณ์ด้วยนะครับ/ค่ะ",
      accept_job: "✅ ยืนยันรับเข้าทำงานแล้วครับ/ค่ะ",
      send_resume: "📎 ขอเรซูเม่ด้วยได้ไหมครับ/ค่ะ",
    };
    await sendMessage(msgMap[type]);
  }

  async function handleRating(stars: number, comment: string) {
    const supabase = createClient();
    if (!user || !matchData?.seeker) return;
    await supabase.from("ratings").insert({ match_id: matchId, rater_id: user.id, ratee_id: (matchData.seeker as { user_id: string }).user_id, stars, comment });
    await supabase.from("matches").update({ employer_rated: true }).eq("id", matchId);
    setShowRating(false);
  }

  const seekerName = (matchData?.seeker as { name?: string } | null)?.name ?? "";
  const seekerUserId = (matchData?.seeker as { user_id?: string } | null)?.user_id ?? "";

  return (
    <div className="flex flex-col h-screen" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4" style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
        <button onClick={() => router.push(`/${locale}/employer/matches`)} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div>
          <p className="font-bold text-white text-sm">{seekerName}</p>
          <p className="text-xs text-blue-300">{(matchData?.job as { title?: string } | null)?.title}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
        {!loading && messages.length === 0 && (
          <div className="text-center mt-16">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm text-blue-300">{t("empty")}</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} isMine={msg.sender_id === user?.id} />
        ))}
        {typingUsers.length > 0 && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <QuickActions onAction={handleQuickAction} />

      <div className="flex items-center gap-2 px-4 py-3 pb-8" style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(56,189,248,0.15)" }}>
        <div className="flex-1 flex items-center rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(56,189,248,0.2)" }}>
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); broadcastTyping(); }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={t("placeholder")}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-blue-400"
          />
        </div>
        <button onClick={handleSend} disabled={!text.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl text-white disabled:opacity-30" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
          <Send size={16} />
        </button>
      </div>

      {showRating && (
        <RatingModal matchId={matchId} rateeId={seekerUserId} onSubmit={handleRating} onSkip={() => setShowRating(false)} />
      )}
    </div>
  );
}
