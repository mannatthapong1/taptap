"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Star, MapPin, Clock, Wrench, Pencil, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/ui/BottomNav";
import ProfileScoreBadge from "@/components/ui/ProfileScoreBadge";
import type { SeekerProfile } from "@/lib/types";

const BG = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)";

export default function SeekerProfilePage() {
  const t = useTranslations("nav");
  const tOnboard = useTranslations("onboarding");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<SeekerProfile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("seeker_profiles").select("*").eq("user_id", user.id).single();
      setProfile(data as SeekerProfile);
    });
  }, [locale]);

  const dayNames = tOnboard.raw("step3.days") as string[];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/phone`);
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6" style={{ background: "rgba(15,23,42,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-white">{t("profile")}</h1>
          <button onClick={() => router.push(`/${locale}/seeker/edit-profile`)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8" }}>
            <Pencil size={12} /> แก้ไข
          </button>
        </div>
        {profile && (
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden shrink-0" style={{ border: "2px solid rgba(56,189,248,0.4)" }}>
              {profile.photo_url
                ? <Image src={profile.photo_url} alt={profile.name} fill className="object-cover" />
                : <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>{profile.name[0]}</div>
              }
            </div>
            <div>
              <p className="font-black text-white text-lg">{profile.name}</p>
              <div className="flex items-center gap-1 text-sm text-amber-400 mt-0.5">
                <Star size={13} fill="currentColor" />
                <span>{profile.rating_avg > 0 ? profile.rating_avg.toFixed(1) : "ยังไม่มีรีวิว"}</span>
              </div>
              <div className="mt-1">
                <ProfileScoreBadge score={profile.profile_score} />
              </div>
            </div>
          </div>
        )}
      </div>

      {profile && (
        <div className="px-4 pt-4 space-y-3">
          {/* Skills */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.15)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={15} className="text-sky-400" />
              <p className="text-sm font-bold text-white">ทักษะ</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8" }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.15)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-sky-400" />
              <p className="text-sm font-bold text-white">วันและเวลาที่ว่าง</p>
            </div>
            <div className="space-y-2">
              {profile.availability.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-blue-200 font-medium">{dayNames[a.day]}</span>
                  <span className="text-blue-300 text-xs">{a.from} – {a.to}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.15)" }}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={15} className="text-sky-400" />
              <p className="text-sm font-bold text-white">ที่อยู่</p>
            </div>
            <p className="text-sm text-blue-300 mt-1">{profile.location_text}</p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-sm transition-all active:opacity-80"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
            <LogOut size={15} />
            ออกจากระบบ
          </button>
        </div>
      )}

      <BottomNav role="seeker" />
    </div>
  );
}
