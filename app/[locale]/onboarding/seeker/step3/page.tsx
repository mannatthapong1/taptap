"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AvailabilitySlot } from "@/lib/types";
import ProfileScoreBadge from "@/components/ui/ProfileScoreBadge";
import { calcProfileScore } from "@/lib/profileScore";
import { ChevronRight, ChevronLeft } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const BG = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0369a1 100%)";

export default function Step3Page() {
  const t = useTranslations("onboarding");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const dayNames: string[] = t.raw("step3.days");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const score = calcProfileScore({ name: "x", photo_url: "x", skills: ["x","x","x"], availability: slots });

  function toggleDay(day: number) {
    const exists = slots.find((s) => s.day === day);
    if (exists) setSlots((prev) => prev.filter((s) => s.day !== day));
    else setSlots((prev) => [...prev, { day, from: "09:00", to: "17:00" }]);
  }
  function updateSlot(day: number, field: "from" | "to", value: string) {
    setSlots((prev) => prev.map((s) => s.day === day ? { ...s, [field]: value } : s));
  }
  async function handleNext() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("seeker_profiles").upsert({ user_id: user.id, availability: slots, profile_score: calcProfileScore({ name: "x", photo_url: "x", skills: ["x"], availability: slots }) }, { onConflict: "user_id" });
    router.push(`/${locale}/onboarding/seeker/step4`);
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-8 max-w-md mx-auto" style={{ background: BG }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-2 rounded-full transition-all" style={{ width: i <= 3 ? "32px" : "8px", background: i <= 3 ? "#38bdf8" : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <ProfileScoreBadge score={score} />
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-1">ขั้นตอน 3 จาก 4</p>
        <h1 className="text-2xl font-black text-white">{t("step3.title")}</h1>
        <p className="text-sm text-blue-200 mt-1">{t("step3.subtitle")}</p>
      </div>

      {/* Day toggles */}
      <div className="flex gap-1.5 mb-6">
        {dayNames.map((name, day) => {
          const active = slots.some((s) => s.day === day);
          return (
            <button key={day} onClick={() => toggleDay(day)}
              className="flex-1 rounded-2xl py-3 text-xs font-bold transition-all"
              style={active
                ? { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "white", boxShadow: "0 4px 15px rgba(14,165,233,0.4)" }
                : { background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.12)", color: "#93c5fd" }
              }>
              {name}
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      <div className="space-y-3 mb-auto">
        {slots.sort((a, b) => a.day - b.day).map((slot) => (
          <div key={slot.day} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(56,189,248,0.2)" }}>
            <p className="text-sm font-bold text-white mb-3">{dayNames[slot.day]}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-blue-300 mb-1.5">{t("step3.from")}</p>
                <select value={slot.from} onChange={(e) => updateSlot(slot.day, "from", e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  {HOURS.map((h) => <option key={h} style={{ background: "#1e3a5f" }}>{h}</option>)}
                </select>
              </div>
              <span className="text-blue-300 text-lg mt-4">—</span>
              <div className="flex-1">
                <p className="text-xs text-blue-300 mb-1.5">{t("step3.to")}</p>
                <select value={slot.to} onChange={(e) => updateSlot(slot.day, "to", e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  {HOURS.map((h) => <option key={h} style={{ background: "#1e3a5f" }}>{h}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        {slots.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-sm text-blue-300">เลือกวันด้านบนเพื่อกำหนดเวลา</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={() => router.back()} className="flex-1 rounded-2xl py-4 text-sm font-semibold flex items-center justify-center gap-1" style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.15)", color: "#93c5fd" }}>
          <ChevronLeft size={16} />{t("back")}
        </button>
        <button onClick={handleNext} disabled={loading} className="flex-[2] rounded-2xl py-4 font-bold text-white flex items-center justify-center gap-2 disabled:opacity-30" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
          {loading ? "..." : <>{t("next")} <ChevronRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}
