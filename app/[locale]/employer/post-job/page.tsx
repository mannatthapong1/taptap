"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, X, Plus, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AvailabilitySlot } from "@/lib/types";

const DAY_TH = ["อา","จ","อ","พ","พฤ","ศ","ส"];
const DAY_EN = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const BG = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)";

export default function PostJobPage() {
  const t = useTranslations("employer.post_job");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const days = locale === "th" ? DAY_TH : DAY_EN;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState<"hourly"|"daily"|"monthly"|"fixed">("daily");
  const [schedule, setSchedule] = useState<AvailabilitySlot[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [loading, setLoading] = useState(false);

  function toggleDay(day: number) {
    const exists = schedule.find((s) => s.day === day);
    if (exists) setSchedule((p) => p.filter((s) => s.day !== day));
    else setSchedule((p) => [...p, { day, from: "09:00", to: "17:00" }]);
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((p) => [...p, s]);
    setSkillInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: employer } = await supabase.from("employer_profiles").select("id").eq("user_id", user.id).single();
    if (!employer) return;
    await supabase.from("jobs").insert({ employer_id: employer.id, title, description, location_text: location, pay_amount: Number(payAmount), pay_type: payType, schedule, skills_needed: skills, urgent });
    router.push(`/${locale}/employer/home`);
  }

  const PAY_TYPES = ["hourly","daily","monthly","fixed"] as const;

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4" style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="font-black text-white text-lg">{t("title")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 pb-32 space-y-4 max-w-md mx-auto">

        <Field label={t("job_title")}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("job_title_placeholder")} required className={inputCls} />
        </Field>

        <Field label={t("description")}>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("description_placeholder")} rows={4} className={inputCls + " resize-none"} />
        </Field>

        <Field label={t("location")}>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="เช่น สาทร กรุงเทพฯ" required className={inputCls} />
        </Field>

        <div className="flex gap-3">
          <Field label={t("pay_amount")} className="flex-1">
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0" required className={inputCls} />
          </Field>
          <Field label={t("pay_type")} className="flex-1">
            <select value={payType} onChange={(e) => setPayType(e.target.value as typeof payType)} className={inputCls}>
              {PAY_TYPES.map((pt) => <option key={pt} value={pt} style={{ background: "#1e3a5f" }}>{t(`pay_types.${pt}`)}</option>)}
            </select>
          </Field>
        </div>

        <Field label={t("schedule")}>
          <div className="flex gap-1.5 flex-wrap">
            {days.map((d, i) => {
              const active = schedule.some((s) => s.day === i);
              return (
                <button type="button" key={i} onClick={() => toggleDay(i)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={active
                    ? { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "white" }
                    : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#93c5fd" }
                  }>{d}</button>
              );
            })}
          </div>
        </Field>

        <Field label={t("skills_needed")}>
          <div className="flex gap-2 mb-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="เพิ่มทักษะ" className={inputCls + " flex-1"} />
            <button type="button" onClick={addSkill} className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8" }}>
                {s}
                <button type="button" onClick={() => setSkills((p) => p.filter((x) => x !== s))}><X size={11} /></button>
              </span>
            ))}
          </div>
        </Field>

        {/* Urgent toggle */}
        <label className="flex items-center gap-3 rounded-2xl p-4 cursor-pointer" style={{ background: "rgba(255,255,255,0.06)", border: urgent ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.12)" }}>
          <div className="relative h-6 w-11 rounded-full transition-colors" style={{ background: urgent ? "#f59e0b" : "rgba(255,255,255,0.15)" }}>
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${urgent ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <Zap size={14} className={urgent ? "text-amber-400" : "text-blue-300"} />
              <p className="text-sm font-bold" style={{ color: urgent ? "#fbbf24" : "white" }}>{t("urgent")}</p>
            </div>
            <p className="text-xs text-blue-300 mt-0.5">{t("urgent_hint")}</p>
          </div>
          <input type="checkbox" className="sr-only" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
        </label>
      </form>

      {/* Submit button */}
      <div className="fixed bottom-0 inset-x-0 p-4" style={{ background: "rgba(10,20,40,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(56,189,248,0.15)" }}>
        <button onClick={handleSubmit as never} disabled={loading || !title || !payAmount}
          className="w-full rounded-2xl text-white py-4 font-bold disabled:opacity-30 transition-all"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
          {loading ? t("submitting") : t("submit")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-blue-100 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-2xl px-4 py-3 text-sm outline-none text-white placeholder:text-blue-400 bg-[rgba(255,255,255,0.07)] border border-[rgba(56,189,248,0.2)] focus:border-sky-400";
