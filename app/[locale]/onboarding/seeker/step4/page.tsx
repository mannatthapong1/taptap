"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { MapPin, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcProfileScore } from "@/lib/profileScore";
import ProfileScoreBadge from "@/components/ui/ProfileScoreBadge";

const BG = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0369a1 100%)";

const PROVINCES = [
  "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา",
  "ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก",
  "นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน",
  "บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา",
  "พะเยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต",
  "มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี",
  "ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ",
  "สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี",
  "สุรินทร์","หนองคาย","หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี",
];

export default function Step4Page() {
  const t = useTranslations("onboarding");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const score = calcProfileScore({ name: "x", photo_url: "x", skills: ["x","x","x"], availability: [{}] as never, location_text: province });

  async function handleFinish() {
    if (!province) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("seeker_profiles").upsert({
      user_id: user.id,
      location_text: province,
      profile_score: score,
    }, { onConflict: "user_id" });
    router.push(`/${locale}/seeker/home`);
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-8 max-w-md mx-auto" style={{ background: BG }}>
      {/* Progress */}
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
        <p className="text-sm text-blue-200 mt-1">เลือกจังหวัดที่ต้องการหางาน</p>
      </div>

      <div className="mb-auto">
        <label className="block text-sm font-semibold text-blue-100 mb-2">จังหวัด</label>
        <div className="flex items-center gap-2 rounded-2xl px-4 py-1" style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(56,189,248,0.3)" }}>
          <MapPin size={16} className="text-blue-300 shrink-0" />
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none py-3"
            style={{ color: province ? "white" : "#60a5fa" }}
          >
            <option value="" style={{ background: "#1e3a5f" }}>เลือกจังหวัด</option>
            {PROVINCES.map((p) => <option key={p} value={p} style={{ background: "#1e3a5f" }}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={() => router.back()} className="flex-1 rounded-2xl py-4 text-sm font-semibold flex items-center justify-center gap-1" style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.15)", color: "#93c5fd" }}>
          <ChevronLeft size={16} />{t("back")}
        </button>
        <button onClick={handleFinish} disabled={!province || loading}
          className="flex-[2] rounded-2xl py-4 font-bold text-white flex items-center justify-center gap-2 disabled:opacity-30"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
          {loading ? "..." : "🎉 " + t("finish")}
        </button>
      </div>
    </div>
  );
}
