"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/ui/BottomNav";
import type { Match } from "@/lib/types";

const BG = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)";

export default function SeekerChatListPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: seeker } = await supabase.from("seeker_profiles").select("id").eq("user_id", user.id).single();
      if (!seeker) return;
      const { data } = await supabase.from("matches")
        .select("*, jobs(title, pay_amount, pay_type), employer_profiles(name, company_name)")
        .eq("seeker_id", seeker.id)
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
            <p className="text-sm text-blue-400">แมทช์กับงานที่ชอบเพื่อเริ่มแชท</p>
          </div>
        )}
        {matches.map((m) => (
          <button key={m.id} onClick={() => router.push(`/${locale}/seeker/chat/${m.id}`)}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-all active:opacity-80"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.15)" }}>
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)", border: "1.5px solid rgba(56,189,248,0.4)" }}>
              <Briefcase size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{(m.job as { title?: string } | null)?.title ?? "—"}</p>
              <p className="text-xs text-blue-400 truncate mt-0.5">
                {(m.employer as { company_name?: string } | null)?.company_name ?? ""}
              </p>
            </div>
            <MessageCircle size={18} className="text-sky-400 shrink-0" />
          </button>
        ))}
      </div>

      <BottomNav role="seeker" />
    </div>
  );
}
