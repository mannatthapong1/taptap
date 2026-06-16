"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, MapPin, Building2, LogOut, ChevronRight, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/ui/BottomNav";
import type { EmployerProfile } from "@/lib/types";

const BG = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)";

export default function EmployerProfilePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("employer_profiles").select("*").eq("user_id", user.id).single();
      setProfile(data as EmployerProfile);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/phone`);
  }

  const initial = profile?.name?.[0] ?? profile?.company_name?.[0] ?? "?";

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6" style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black text-white">โปรไฟล์</h1>
          <button onClick={() => router.push(`/${locale}/employer/edit-profile`)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8" }}>
            <Pencil size={12} /> แก้ไข
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="h-18 w-18 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)", width: 72, height: 72, border: "2px solid rgba(56,189,248,0.4)" }}>
            {initial}
          </div>
          <div>
            <p className="font-black text-white text-lg leading-tight">{profile?.name ?? "—"}</p>
            <p className="text-sm text-sky-300 mt-0.5">{profile?.company_name ?? ""}</p>
            <div className="flex items-center gap-1 text-sm text-amber-400 mt-1">
              <Star size={13} fill="currentColor" />
              <span>{(profile?.rating_avg ?? 0) > 0 ? (profile!.rating_avg.toFixed(1)) : "ยังไม่มีรีวิว"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Company info */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.15)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={15} className="text-sky-400" />
            <p className="text-sm font-bold text-white">ข้อมูลบริษัท</p>
          </div>
          <div>
            <p className="text-xs text-blue-400 mb-0.5">ชื่อบริษัท</p>
            <p className="text-sm text-white">{profile?.company_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-blue-400 mb-0.5">ชื่อผู้ติดต่อ</p>
            <p className="text-sm text-white">{profile?.name || "—"}</p>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.15)" }}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={15} className="text-sky-400" />
            <p className="text-sm font-bold text-white">สถานที่</p>
          </div>
          <p className="text-sm text-blue-300">{profile?.location_text || "—"}</p>
        </div>

        {/* Post new job shortcut */}
        <button
          onClick={() => router.push(`/${locale}/employer/post-job`)}
          className="w-full flex items-center justify-between rounded-2xl p-4 transition-all active:opacity-80"
          style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(3,105,161,0.15))", border: "1px solid rgba(56,189,248,0.3)" }}>
          <p className="text-sm font-bold text-sky-300">+ ลงประกาศงานใหม่</p>
          <ChevronRight size={16} className="text-sky-400" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 mt-2 font-semibold text-sm transition-all active:opacity-80"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
          <LogOut size={15} />
          ออกจากระบบ
        </button>
      </div>

      <BottomNav role="employer" />
    </div>
  );
}
