"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BG = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)";

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

export default function EmployerEditProfilePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("employer_profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setName(data.name ?? "");
        setCompanyName(data.company_name ?? "");
        setProvince(data.location_text ?? "");
      }
    });
  }, []);

  async function handleSave() {
    if (!name.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("employer_profiles").upsert({
      user_id: user.id,
      name: name.trim(),
      company_name: companyName.trim(),
      location_text: province,
    }, { onConflict: "user_id" });
    setSaved(true);
    setLoading(false);
    setTimeout(() => router.push(`/${locale}/employer/profile`), 800);
  }

  const inputCls = "w-full rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-blue-400";
  const inputStyle = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(56,189,248,0.2)" };

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4" style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="font-black text-white text-lg">แก้ไขโปรไฟล์</h1>
      </div>

      <div className="px-4 pt-5 space-y-5 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-semibold text-blue-100 mb-1.5">ชื่อผู้ติดต่อ</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อของคุณ" className={inputCls} style={inputStyle} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-blue-100 mb-1.5">ชื่อบริษัท / ร้าน</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="เช่น ร้านอาหารสมหวัง" className={inputCls} style={inputStyle} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-blue-100 mb-1.5">จังหวัด</label>
          <div className="flex items-center gap-2 rounded-2xl px-4 py-1" style={inputStyle}>
            <MapPin size={15} className="text-blue-300 shrink-0" />
            <select value={province} onChange={(e) => setProvince(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none py-3">
              <option value="" style={{ background: "#1e3a5f" }}>เลือกจังหวัด</option>
              {PROVINCES.map((p) => <option key={p} value={p} style={{ background: "#1e3a5f" }}>{p}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSave} disabled={loading || !name.trim()}
          className="w-full rounded-2xl py-4 font-bold text-white text-sm disabled:opacity-40 transition-all"
          style={{ background: saved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
          {saved ? "✓ บันทึกแล้ว!" : loading ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
        </button>
      </div>
    </div>
  );
}
