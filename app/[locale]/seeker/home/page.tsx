"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SwipeStack from "@/components/swipe/SwipeStack";
import JobCard from "@/components/swipe/JobCard";
import MatchScreen from "@/components/swipe/MatchScreen";
import BottomNav from "@/components/ui/BottomNav";
import type { JobCardData, Match } from "@/lib/types";

export default function SeekerHomePage() {
  const t = useTranslations("seeker.home");
  const { locale } = useParams<{ locale: string }>();
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<{ matchId: string; jobTitle: string } | null>(null);

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
  }, []);

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
        <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8" }}>
          <SlidersHorizontal size={13} />
          กรอง
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

      <BottomNav role="seeker" />
    </div>
  );
}
