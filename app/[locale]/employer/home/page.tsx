"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Plus, SlidersHorizontal, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SwipeStack from "@/components/swipe/SwipeStack";
import CandidateCard from "@/components/swipe/CandidateCard";
import FilterDrawer, { type FilterState } from "@/components/employer/FilterDrawer";
import BottomNav from "@/components/ui/BottomNav";
import type { CandidateCardData } from "@/lib/types";

export default function EmployerHomePage() {
  const t = useTranslations("employer.home");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  async function loadCandidates(filters?: FilterState) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: swiped } = await supabase.from("swipes").select("target_id").eq("swiper_id", user.id).eq("target_type", "seeker");
    const swipedIds = swiped?.map((s) => s.target_id) ?? [];
    let query = supabase.from("seeker_profiles").select("*");
    if (swipedIds.length > 0) query = query.not("id", "in", `(${swipedIds.join(",")})`);
    if (filters?.minRating) query = query.gte("rating_avg", filters.minRating);
    if (filters?.skills?.length) query = query.overlaps("skills", filters.skills);
    const { data } = await query.limit(20);
    const enriched: CandidateCardData[] = (data ?? []).map((c) => ({
      ...c,
      distance_km: Math.round(Math.random() * 15 + 1),
      match_score: Math.round(Math.random() * 40 + 60),
    }));
    setCandidates(enriched);
    setLoading(false);
  }

  useEffect(() => { loadCandidates(); }, []);

  async function handleSwipe(candidate: CandidateCardData, direction: "left" | "right" | "save") {
    await fetch("/api/swipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target_id: candidate.id, target_type: "seeker", direction }) });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
          <p className="text-sm text-blue-300">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen pb-20" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4" style={{ background: "rgba(15,23,42,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-sky-400" />
          <h1 className="text-lg font-black text-white">{t("title")}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilterOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8" }}>
            <SlidersHorizontal size={13} />{t("filter")}
          </button>
          <button onClick={() => router.push(`/${locale}/employer/post-job`)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
            <Plus size={13} />{t("post_job")}
          </button>
        </div>
      </div>

      <SwipeStack
        items={candidates}
        renderCard={(c, style, isTop) => (
          <CandidateCard key={c.id} candidate={c} locale={locale} style={style} isTop={isTop} />
        )}
        onSwipe={handleSwipe}
        locale={locale}
      />

      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} onApply={(f) => { loadCandidates(f); }} />
      <BottomNav role="employer" />
    </div>
  );
}
