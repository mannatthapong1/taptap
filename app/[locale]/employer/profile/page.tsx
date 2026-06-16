"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/ui/BottomNav";
import type { EmployerProfile } from "@/lib/types";

export default function EmployerProfilePage() {
  const t = useTranslations("nav");
  const [profile, setProfile] = useState<EmployerProfile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("employer_profiles").select("*").eq("user_id", user.id).single();
      setProfile(data as EmployerProfile);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-5 pt-12 pb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">{t("profile")}</h1>
        {profile && (
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-rose-100 flex items-center justify-center text-2xl font-bold text-rose-500">
              {profile.name[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">{profile.name}</p>
              <p className="text-sm text-gray-500">{profile.company_name}</p>
              <div className="flex items-center gap-1 text-sm text-amber-500 mt-0.5">
                <Star size={13} fill="currentColor" />
                <span>{profile.rating_avg > 0 ? profile.rating_avg.toFixed(1) : "ยังไม่มีรีวิว"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {profile && (
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">สถานที่</p>
            <p className="text-sm text-gray-500">{profile.location_text || "—"}</p>
          </div>
        </div>
      )}
      <BottomNav role="employer" />
    </div>
  );
}
