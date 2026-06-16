"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { X, Plus, ChevronRight, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcProfileScore } from "@/lib/profileScore";
import ProfileScoreBadge from "@/components/ui/ProfileScoreBadge";

const POPULAR_TH = ["เสิร์ฟอาหาร","ทำอาหาร","แคชเชียร์","ขับรถ","ทำความสะอาด","บริการลูกค้า","งานคลังสินค้า","เด็กส่งของ","รักษาความปลอดภัย","งานก่อสร้าง","ช่างไฟฟ้า","ช่างประปา"];
const POPULAR_EN = ["Waiter","Cook","Cashier","Driver","Cleaning","Customer Service","Warehouse","Delivery","Security","Construction","Electrician","Plumber"];

const BG = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0369a1 100%)";

export default function Step2Page() {
  const t = useTranslations("onboarding");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const popular = locale === "th" ? POPULAR_TH : POPULAR_EN;
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const score = calcProfileScore({ name: "x", photo_url: "x", skills: selected });

  function toggle(s: string) {
    setSelected((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function addCustom() {
    const trimmed = custom.trim();
    if (trimmed && !selected.includes(trimmed)) setSelected((prev) => [...prev, trimmed]);
    setCustom("");
  }
  async function handleNext() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("seeker_profiles").upsert({ user_id: user.id, skills: selected, profile_score: calcProfileScore({ name: "x", photo_url: "x", skills: selected }) }, { onConflict: "user_id" });
    router.push(`/${locale}/onboarding/seeker/step3`);
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-8 max-w-md mx-auto" style={{ background: BG }}>
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-2 rounded-full transition-all" style={{ width: i <= 2 ? "32px" : "8px", background: i <= 2 ? "#38bdf8" : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <ProfileScoreBadge score={score} />
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-1">ขั้นตอน 2 จาก 4</p>
        <h1 className="text-2xl font-black text-white">{t("step2.title")}</h1>
        <p className="text-sm text-blue-200 mt-1">{t("step2.subtitle")}</p>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(56,189,248,0.2)", border: "1px solid #38bdf8", color: "#38bdf8" }}>
              {s}
              <button onClick={() => toggle(s)}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Custom input */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1 flex items-center rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(56,189,248,0.3)" }}>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder={t("step2.add_placeholder")}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-blue-400"
          />
        </div>
        <button onClick={addCustom} className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
          <Plus size={18} className="text-white" />
        </button>
      </div>

      <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-3">{t("step2.popular")}</p>
      <div className="flex flex-wrap gap-2 mb-auto">
        {popular.map((s) => (
          <button key={s} onClick={() => toggle(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={selected.includes(s)
              ? { background: "rgba(56,189,248,0.2)", border: "1.5px solid #38bdf8", color: "#38bdf8" }
              : { background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.15)", color: "#93c5fd" }
            }>
            {s}
          </button>
        ))}
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
