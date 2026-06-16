"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Building2, HardHat, ChevronRight } from "lucide-react";

type Role = "employer" | "worker";

export default function RoleSelectPage() {
  const t = useTranslations("roleSelect");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!selected || loading) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.auth.updateUser({ data: { role: selected } });
    if (selected === "worker") {
      await supabase.from("seeker_profiles").upsert({ user_id: user.id, name: "" }, { onConflict: "user_id" });
      router.push(`/${locale}/onboarding/seeker/step1`);
    } else {
      await supabase.from("employer_profiles").upsert({ user_id: user.id, name: "" }, { onConflict: "user_id" });
      router.push(`/${locale}/employer/home`);
    }
  }

  const roles: { key: Role; icon: React.ReactNode; gradient: string }[] = [
    { key: "employer", icon: <Building2 size={28} className="text-white" />, gradient: "linear-gradient(135deg, #0ea5e9, #0369a1)" },
    { key: "worker", icon: <HardHat size={28} className="text-white" />, gradient: "linear-gradient(135deg, #38bdf8, #0284c7)" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0369a1 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl text-4xl" style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)" }}>
            👋
          </div>
          <h1 className="text-3xl font-black text-white">{t("title")}</h1>
          <p className="mt-2 text-sm text-blue-200">{t("subtitle")}</p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4 mb-8">
          {roles.map(({ key, icon, gradient }) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className="w-full text-left transition-all duration-200"
            >
              <div
                className="rounded-3xl p-5 flex items-center gap-4 transition-all"
                style={{
                  background: selected === key ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                  border: selected === key ? "2px solid #38bdf8" : "2px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                  boxShadow: selected === key ? "0 0 30px rgba(56,189,248,0.2)" : "none",
                }}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg" style={{ background: gradient }}>
                  {icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-base">{t(key)}</p>
                  <p className="text-sm text-blue-200 mt-0.5">{t(`${key}_desc`)}</p>
                </div>
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: selected === key ? "#38bdf8" : "transparent",
                    border: selected === key ? "2px solid #38bdf8" : "2px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {selected === key && (
                    <svg viewBox="0 0 16 16" fill="white" className="h-3 w-3">
                      <path d="M13.3 4.3L6.5 11l-3.8-3.7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!selected || loading}
          className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-30"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}
        >
          {loading ? "กำลังโหลด..." : <>{t("confirm")} <ChevronRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}
