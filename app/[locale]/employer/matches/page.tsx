"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/ui/BottomNav";
import type { Match } from "@/lib/types";

export default function EmployerMatchesPage() {
  const t = useTranslations("nav");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: employer } = await supabase.from("employer_profiles").select("id").eq("user_id", user.id).single();
      if (!employer) return;
      const { data } = await supabase.from("matches")
        .select("*, jobs(title), seeker_profiles(name, photo_url, skills)")
        .eq("employer_id", employer.id)
        .order("created_at", { ascending: false });
      setMatches((data as Match[]) ?? []);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="px-5 pt-12 pb-4 bg-white">
        <h1 className="text-xl font-bold text-gray-900">{t("matches")}</h1>
      </div>
      <div className="px-4 pt-4 space-y-3">
        {matches.length === 0 && <p className="text-center text-sm text-gray-400 mt-16">ยังไม่มีแมทช์</p>}
        {matches.map((m) => (
          <button key={m.id} onClick={() => router.push(`/${locale}/employer/chat/${m.id}`)}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 text-left">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">
              {(m.seeker?.name ?? "?")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{m.seeker?.name}</p>
              <p className="text-xs text-gray-400 truncate">{m.job?.title}</p>
            </div>
            <MessageCircle size={18} className="text-rose-400 shrink-0" />
          </button>
        ))}
      </div>
      <BottomNav role="employer" />
    </div>
  );
}
