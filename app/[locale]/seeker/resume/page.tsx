"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

interface ResumeResult {
  score: number;
  strengths: string[];
  improvements: string[];
}

export default function ResumePage() {
  const t = useTranslations("ai.resume");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);

  async function handleAnalyze() {
    if (!resumeText.trim() || loading) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/ai/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, locale }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  const scoreColor = (s: number) => s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen pb-10" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4" style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
            <FileText size={14} className="text-white" />
          </div>
          <p className="font-black text-white">{t("title")}</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4 max-w-md mx-auto">
        <p className="text-sm text-blue-200">วางข้อความเรซูเม่หรือประวัติย่อของคุณ แล้ว AI จะให้คะแนนพร้อมคำแนะนำ</p>

        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={8}
          placeholder="วางเรซูเม่ของคุณที่นี่... เช่น ชื่อ, ประสบการณ์ทำงาน, ทักษะ, การศึกษา"
          className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-blue-400 resize-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(56,189,248,0.2)" }}
        />

        <button onClick={handleAnalyze} disabled={!resumeText.trim() || loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white text-sm disabled:opacity-40 transition-all"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
          <Sparkles size={16} />
          {loading ? t("analyzing") : "วิเคราะห์เรซูเม่"}
        </button>

        {result && (
          <div className="space-y-4 pt-2">
            {/* Score */}
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.2)" }}>
              <p className="text-sm text-blue-300 mb-2">{t("score")}</p>
              <p className="text-5xl font-black" style={{ color: scoreColor(result.score) }}>{result.score}<span className="text-2xl text-blue-400">/100</span></p>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <p className="text-sm font-bold text-green-300">{t("strengths")}</p>
                </div>
                <ul className="space-y-1.5">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-green-100/90 flex gap-2"><span className="text-green-400">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-amber-400" />
                  <p className="text-sm font-bold text-amber-300">{t("improvements")}</p>
                </div>
                <ul className="space-y-1.5">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-amber-100/90 flex gap-2"><span className="text-amber-400">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
