"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/ui/BottomNav";
import { markChatSeen } from "@/lib/hooks/useUnreadMessages";
import type { Match } from "@/lib/types";

const BG = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)";

export default function EmployerChatListPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    markChatSeen();
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: employer } = await supabase.from("employer_profiles").select("id").eq("user_id", user.id).single();
      if (!employer) return;
      const { data } = await supabase.from("matches")
        .select("*, job:jobs(title), seeker:seeker_profiles(name, photo_url)")
        .eq("employer_id", employer.id)
        .order("created_at", { ascending: false });
      setMatches((data as Match[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <div className="px-5 pt-12 pb-4" style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
        <h1 className="text-xl font-black text-white">ข้อความ</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {!loading && matches.length === 0 && (
          <div className="text-center mt-20">
            <MessageCircle size={48} className="mx-auto text-blue-800 mb-3" />
            <p className="text-white font-bold mb-1">ยังไม่มีการสนทนา</p>
            <p className="text-sm text-blue-400">รอให้ผู้สมัครแมทช์กับงานของคุณ</p>
          </div>
        )}
        {matches.map((m) => {
          const seeker = m.seeker as { name?: string; photo_url?: string } | null;
          const initial = (seeker?.name ?? "?")[0];
          return (
            <button key={m.id} onClick={() => router.push(`/${locale}/employer/chat/${m.id}`)}
              className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-all active:opacity-80"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.15)" }}>
              <div className="relative h-12 w-12 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-white font-black text-lg"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)", border: "1.5px solid rgba(56,189,248,0.4)" }}>
                {seeker?.photo_url
                  ? <img src={seeker.photo_url} alt={seeker.name} className="h-full w-full object-cover" />
                  : initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{seeker?.name ?? "—"}</p>
                <p className="text-xs text-blue-400 truncate mt-0.5">{(m.job as { title?: string } | null)?.title ?? ""}</p>
              </div>
              <MessageCircle size={18} className="text-sky-400 shrink-0" />
            </button>
          );
        })}
      </div>

      <BottomNav role="employer" />
    </div>
  );
}
