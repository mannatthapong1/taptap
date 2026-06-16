"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SeekerProfile } from "@/lib/types";

interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatPage() {
  const t = useTranslations("ai.assistant");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [msgs, setMsgs] = useState<AIChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<SeekerProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("seeker_profiles").select("*").eq("user_id", user.id).single();
      setProfile(data as SeekerProfile);
    });
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  async function handleSend(content: string) {
    if (!content.trim() || loading) return;
    const userMsg: AIChatMessage = { role: "user", content };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setText("");
    setLoading(true);

    const res = await fetch("/api/ai/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMsgs, locale, seekerProfile: profile }),
    });
    const data = await res.json();
    setMsgs((prev) => [...prev, { role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  const suggestions: string[] = t.raw("suggestions");

  return (
    <div className="flex flex-col h-screen" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4" style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <p className="font-black text-white">{t("title")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4">
        {msgs.length === 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-sm text-blue-300 mb-3 px-1">ลองถามคำถามเหล่านี้ได้เลย 👇</p>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => handleSend(s)}
                className="w-full text-left rounded-2xl px-4 py-3 text-sm text-white transition-all active:opacity-80"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(56,189,248,0.2)" }}>
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex mb-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-xl flex items-center justify-center mr-2 shrink-0 mt-1" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
                <Sparkles size={12} className="text-white" />
              </div>
            )}
            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              style={m.role === "user"
                ? { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "white" }
                : { background: "rgba(255,255,255,0.08)", color: "#e2e8f0", border: "1px solid rgba(56,189,248,0.15)" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-xl flex items-center justify-center mr-2" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
              <Sparkles size={12} className="text-white" />
            </div>
            <div className="rounded-2xl px-4 py-3 flex gap-1" style={{ background: "rgba(255,255,255,0.08)" }}>
              {[0,1,2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 pb-8" style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(56,189,248,0.15)" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(text)}
          placeholder={t("placeholder")}
          className="flex-1 rounded-full px-4 py-2.5 text-sm text-white outline-none placeholder:text-blue-400"
          style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(56,189,248,0.25)" }}
        />
        <button onClick={() => handleSend(text)} disabled={!text.trim() || loading}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white disabled:opacity-40" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
