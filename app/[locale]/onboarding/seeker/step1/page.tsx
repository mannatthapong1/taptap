"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Camera, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcProfileScore } from "@/lib/profileScore";
import ProfileScoreBadge from "@/components/ui/ProfileScoreBadge";

export default function Step1Page() {
  const t = useTranslations("onboarding");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const score = calcProfileScore({ name, photo_url: photoUrl ?? undefined });

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  }

  async function handleNext() {
    if (!name.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let photo_url: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, photoFile, { upsert: true });
      if (!upErr) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        photo_url = `${data.publicUrl}?t=${Date.now()}`;
      }
    }

    await supabase.from("seeker_profiles").upsert({
      user_id: user.id,
      name: name.trim(),
      photo_url,
      profile_score: calcProfileScore({ name, photo_url }),
    }, { onConflict: "user_id" });

    router.push(`/${locale}/onboarding/seeker/step2`);
  }

  return (
    <div
      className="min-h-screen flex flex-col px-5 pt-10 pb-8 max-w-md mx-auto"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0369a1 100%)" }}
    >
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          {[1,2,3,4].map(i => (
            <div
              key={i}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === 1 ? "32px" : "8px",
                background: i === 1 ? "#38bdf8" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
        <ProfileScoreBadge score={score} />
      </div>

      {/* Title */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-1">ขั้นตอน 1 จาก 4</p>
        <h1 className="text-2xl font-black text-white">{t("step1.title")}</h1>
      </div>

      {/* Photo Upload */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative h-32 w-32 rounded-3xl overflow-hidden flex items-center justify-center group transition-all"
          style={{
            background: photoUrl ? "transparent" : "rgba(255,255,255,0.08)",
            border: "2px dashed rgba(56,189,248,0.5)",
            boxShadow: "0 0 30px rgba(56,189,248,0.1)",
          }}
        >
          {photoUrl ? (
            <Image src={photoUrl} alt="avatar" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Camera size={28} className="text-blue-300" />
              <span className="text-xs text-blue-300">เพิ่มรูป</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" style={{ background: "rgba(0,0,0,0.5)" }}>
            <span className="text-white text-xs font-bold">เปลี่ยนรูป</span>
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      </div>

      {/* Name Input */}
      <div className="mb-auto">
        <label className="block text-sm font-semibold text-blue-100 mb-2">{t("step1.name_label")}</label>
        <div
          className="flex items-center rounded-2xl px-4 py-4"
          style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(56,189,248,0.3)" }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("step1.name_placeholder")}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-blue-400"
          />
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={!name.trim() || loading}
        className="mt-8 w-full rounded-2xl py-4 font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-30"
        style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}
      >
        {loading ? "กำลังบันทึก..." : <>{t("next")} <ChevronRight size={18} /></>}
      </button>
    </div>
  );
}
