"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(`/${locale}/role-select`);
      } else {
        router.replace(`/${locale}/auth/phone`);
      }
    });
  }, [locale, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm text-gray-500">กำลังเข้าสู่ระบบ...</p>
      </div>
    </div>
  );
}
