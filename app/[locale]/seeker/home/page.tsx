"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Sparkles, X, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SwipeStack from "@/components/swipe/SwipeStack";
import JobCard from "@/components/swipe/JobCard";
import MatchScreen from "@/components/swipe/MatchScreen";
import BottomNav from "@/components/ui/BottomNav";
import type { JobCardData, Match } from "@/lib/types";

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

export default function SeekerHomePage() {
  const t = useTranslations("seeker.home");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<{ matchId: string; jobTitle: string } | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: seeker } = await supabase.from("seeker_profiles").select("*").eq("user_id", user.id).single();
      const { data: swiped } = await supabase.from("swipes").select("target_id").eq("swiper_id", user.id).eq("target_type", "job");
      const swipedIds = swiped?.map((s) => s.target_id) ?? [];
      let query = supabase.from("jobs").select("*, employer_profiles(*)").eq("active", true);
      if (swipedIds.length > 0) query = query.not("id", "in", `(${swipedIds.join(",")})`);
      if (selectedProvince) query = query.ilike("location_text", `%${selectedProvince}%`);
      const { data: rawJobs } = await query.limit(20);
      const seekerSkills = seeker?.skills ?? [];
      const enriched: JobCardData[] = (rawJobs ?? []).map((j) => ({
        ...j,
        employer: j.employer_profiles,
        distance_km: Math.round(Math.random() * 15 + 1),
        match_score: Math.max(10, Math.round((j.skills_needed?.filter((s: string) => seekerSkills.includes(s)).length / Math.max(j.skills_needed?.length, 1)) * 100)),
      }));
      setJobs(enriched);
      setLoading(false);
    }
    load();
  }, [selectedProvince]);

  async function handleSwipe(job: JobCardData, direction: "left" | "right" | "save") {
    const res = await fetch("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: job.id, target_type: "job", direction }),
    });
    if (direction === "right") {
      const data = await res.json();
      if (data.matched && data.match) setMatch({ matchId: (data.match as Match).id, jobTitle: job.title });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
          <p className="text-sm text-blue-300">กำลังโหลดงาน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen pb-20" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4" style={{ background: "rgba(15,23,42,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-sky-400" />
          <h1 className="text-lg font-black text-white">{t("title")}</h1>
        </div>
        <button onClick={() => setShowFilter(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
          style={selectedProvince
            ? { background: "rgba(14,165,233,0.3)", border: "1px solid #0ea5e9", color: "white" }
            : { background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8" }}>
          <SlidersHorizontal size={13} />
          {selectedProvince || "กรอง"}
        </button>
      </div>

      {/* AI tools toolbar */}
      <div className="flex gap-2 px-4 py-3">
        <button onClick={() => router.push(`/${locale}/seeker/ai-chat`)}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold transition-all active:opacity-80"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(14,165,233,0.25))", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
          <Sparkles size={15} /> AI Advisor
        </button>
        <button onClick={() => router.push(`/${locale}/seeker/resume`)}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold transition-all active:opacity-80"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(56,189,248,0.3)", color: "#7dd3fc" }}>
          <FileText size={15} /> Resume
        </button>
      </div>

      <SwipeStack
        items={jobs}
        renderCard={(job, style, isTop) => (
          <JobCard key={job.id} job={job} locale={locale} style={style} isTop={isTop} />
        )}
        onSwipe={handleSwipe}
        locale={locale}
      />

      {match && (
        <MatchScreen matchId={match.matchId} jobTitle={match.jobTitle} onClose={() => setMatch(null)} />
      )}

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowFilter(false)}>
          <div className="w-full rounded-t-3xl overflow-hidden" style={{ background: "#0f172a", border: "1px solid rgba(56,189,248,0.2)", maxHeight: "75vh" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
              <p className="font-black text-white text-base">กรองตามจังหวัด</p>
              <button onClick={() => setShowFilter(false)} className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* All provinces */}
            <div className="overflow-y-auto px-4 py-3 space-y-1" style={{ maxHeight: "calc(75vh - 130px)" }}>
              <button
                onClick={() => { setSelectedProvince(""); setShowFilter(false); setLoading(true); }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={!selectedProvince
                  ? { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "white" }
                  : { color: "rgba(148,163,184,0.8)" }}>
                ทั้งหมด (ทุกจังหวัด)
              </button>
              {PROVINCES.map((p) => (
                <button key={p}
                  onClick={() => { setSelectedProvince(p); setShowFilter(false); setLoading(true); }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={selectedProvince === p
                    ? { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "white" }
                    : { color: "rgba(148,163,184,0.8)" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav role="seeker" />
    </div>
  );
}
