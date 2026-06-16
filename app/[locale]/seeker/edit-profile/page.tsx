"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Camera, X, Plus, MapPin } from "lucide-react";
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

export default function SeekerEditProfilePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("seeker_profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setName(data.name ?? "");
        setPhotoUrl(data.photo_url ?? null);
        setSkills(data.skills ?? []);
        setProvince(data.location_text ?? "");
      }
    });
  }, []);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((p) => [...p, s]);
    setSkillInput("");
  }

  async function handleSave() {
    if (!name.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let photo_url = photoUrl;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      await supabase.storage.from("avatars").upload(path, photoFile, { upsert: true });
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      photo_url = data.publicUrl;
    }

    await supabase.from("seeker_profiles").upsert({
      user_id: user.id,
      name: name.trim(),
      photo_url,
      skills,
      location_text: province,
    }, { onConflict: "user_id" });

    setSaved(true);
    setLoading(false);
    setTimeout(() => router.push(`/${locale}/seeker/profile`), 800);
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4" style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="font-black text-white text-lg">แก้ไขโปรไฟล์</h1>
      </div>

      <div className="px-4 pt-5 space-y-5 max-w-md mx-auto">
        {/* Photo */}
        <div className="flex justify-center">
          <button onClick={() => fileRef.current?.click()}
            className="relative h-24 w-24 rounded-3xl overflow-hidden flex items-center justify-center"
            style={{ border: "2px dashed rgba(56,189,248,0.5)", background: "rgba(255,255,255,0.05)" }}>
            {photoUrl
              ? <Image src={photoUrl} alt="avatar" fill className="object-cover" unoptimized={photoUrl.startsWith("blob:")} />
              : <Camera size={28} className="text-blue-300" />}
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
              <Camera size={20} className="text-white" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-blue-100 mb-1.5">ชื่อ-นามสกุล</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อของคุณ"
            className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-blue-400"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(56,189,248,0.2)" }} />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-semibold text-blue-100 mb-1.5">ทักษะ</label>
          <div className="flex gap-2 mb-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="เพิ่มทักษะ"
              className="flex-1 rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-blue-400"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(56,189,248,0.2)" }} />
            <button onClick={addSkill} className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8" }}>
                {s}
                <button onClick={() => setSkills((p) => p.filter((x) => x !== s))}><X size={11} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Province */}
        <div>
          <label className="block text-sm font-semibold text-blue-100 mb-1.5">จังหวัด</label>
          <div className="flex items-center gap-2 rounded-2xl px-4 py-1" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(56,189,248,0.2)" }}>
            <MapPin size={15} className="text-blue-300 shrink-0" />
            <select value={province} onChange={(e) => setProvince(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none py-3">
              <option value="" style={{ background: "#1e3a5f" }}>เลือกจังหวัด</option>
              {PROVINCES.map((p) => <option key={p} value={p} style={{ background: "#1e3a5f" }}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={loading || !name.trim()}
          className="w-full rounded-2xl py-4 font-bold text-white text-sm disabled:opacity-40 transition-all"
          style={{ background: saved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
          {saved ? "✓ บันทึกแล้ว!" : loading ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
        </button>
      </div>
    </div>
  );
}
