"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace(`/${locale}/auth/phone`);
        return;
      }
      const user = session.user;
      const role = user.user_metadata?.role;

      if (role === "worker") {
        const { data: seeker } = await supabase.from("seeker_profiles").select("name").eq("user_id", user.id).single();
        if (seeker?.name) {
          router.replace(`/${locale}/seeker/home`);
        } else {
          router.replace(`/${locale}/onboarding/seeker/step1`);
        }
      } else if (role === "employer") {
        const { data: employer } = await supabase.from("employer_profiles").select("name").eq("user_id", user.id).single();
        if (employer?.name) {
          router.replace(`/${locale}/employer/home`);
        } else {
          router.replace(`/${locale}/role-select`);
        }
      } else {
        router.replace(`/${locale}/role-select`);
      }
    });
  }, [locale, router]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
        <p className="text-sm text-blue-300">กำลังเข้าสู่ระบบ...</p>
      </div>
    </div>
  );
}
