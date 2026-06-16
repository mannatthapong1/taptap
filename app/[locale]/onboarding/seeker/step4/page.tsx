"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { MapPin, Navigation, ChevronLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcProfileScore } from "@/lib/profileScore";
import ProfileScoreBadge from "@/components/ui/ProfileScoreBadge";

const BG = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0369a1 100%)";

export default function Step4Page() {
  const t = useTranslations("onboarding");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [locationText, setLocationText] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [loading, setLoading] = useState(false);
  const score = calcProfileScore({ name: "x", photo_url: "x", skills: ["x","x","x"], availability: [{}] as never, location_text: locationText });

  function useGPS() {
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationText(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGpsLoading(false);
      },
      () => { setGpsError(t("step4.gps_error")); setGpsLoading(false); }
    );
  }

  async function handleFinish() {
    if (!locationText.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("seeker_profiles").upsert({
      user_id: user.id, location_text: locationText, lat, lng,
      profile_score: calcProfileScore({ name: "x", photo_url: "x", skills: ["x","x","x"], availability: [{}] as never, location_text: locationText }),
    }, { onConflict: "user_id" });
    router.push(`/${locale}/seeker/home`);
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-8 max-w-md mx-auto" style={{ background: BG }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-2 rounded-full" style={{ width: "32px", background: "#38bdf8" }} />
          ))}
        </div>
        <ProfileScoreBadge score={score} />
      </div>

      <div className="mb-8">
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-1">ขั้นตอน 4 จาก 4</p>
        <h1 className="text-2xl font-black text-white">{t("step4.title")}</h1>
        <p className="text-sm text-blue-200 mt-1">{t("step4.subtitle")}</p>
      </div>

      {/* GPS Button */}
      <button onClick={useGPS} disabled={gpsLoading}
        className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 font-semibold mb-4 transition-all disabled:opacity-60"
        style={{ background: lat ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.08)", border: `2px solid ${lat ? "#38bdf8" : "rgba(255,255,255,0.2)"}`, color: lat ? "#38bdf8" : "#93c5fd" }}>
        {lat ? <CheckCircle size={18} /> : <Navigation size={18} />}
        {gpsLoading ? t("step4.gps_loading") : lat ? "ตำแหน่งถูกบันทึกแล้ว" : t("step4.use_gps")}
      </button>

      {gpsError && <p className="text-xs text-red-400 mb-3 text-center">{gpsError}</p>}

      <div className="mb-auto">
        <label className="block text-sm font-semibold text-blue-100 mb-2">{t("step4.manual_label")}</label>
        <div className="flex items-center gap-2 rounded-2xl px-4 py-4" style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(56,189,248,0.3)" }}>
          <MapPin size={16} className="text-blue-300 shrink-0" />
          <input
            value={locationText}
            onChange={(e) => { setLocationText(e.target.value); setLat(null); setLng(null); }}
            placeholder={t("step4.manual_placeholder")}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-blue-400"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={() => router.back()} className="flex-1 rounded-2xl py-4 text-sm font-semibold flex items-center justify-center gap-1" style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.15)", color: "#93c5fd" }}>
          <ChevronLeft size={16} />{t("back")}
        </button>
        <button onClick={handleFinish} disabled={!locationText.trim() || loading}
          className="flex-[2] rounded-2xl py-4 font-bold text-white flex items-center justify-center gap-2 disabled:opacity-30"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
          {loading ? "..." : "🎉 " + t("finish")}
        </button>
      </div>
    </div>
  );
}
