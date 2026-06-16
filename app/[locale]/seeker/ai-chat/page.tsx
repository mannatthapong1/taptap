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
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={() => router.back()}><ArrowLeft size={22} className="text-gray-600" /></button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <p className="font-bold text-gray-900">{t("title")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4">
        {msgs.length === 0 && (
          <div className="space-y-2 mt-4">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => handleSend(s)}
                className="w-full text-left bg-white rounded-2xl px-4 py-3 text-sm text-gray-700 border border-gray-100 shadow-sm hover:border-indigo-300 transition">
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex mb-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-xl bg-indigo-600 flex items-center justify-center mr-2 shrink-0 mt-1">
                <Sparkles size={12} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 shadow-sm"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-xl bg-indigo-600 flex items-center justify-center mr-2">
              <Sparkles size={12} className="text-white" />
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex gap-1">
              {[0,1,2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100 pb-8">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(text)}
          placeholder={t("placeholder")}
          className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
        <button onClick={() => handleSend(text)} disabled={!text.trim() || loading}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-40">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
