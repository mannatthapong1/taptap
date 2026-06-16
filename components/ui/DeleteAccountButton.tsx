"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAccountButton() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/delete-account", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "ลบบัญชีไม่สำเร็จ ลองใหม่อีกครั้ง");
      setLoading(false);
      return;
    }
    // sign out locally then go to login
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/phone`);
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-sm transition-all active:opacity-80"
        style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", color: "#fca5a5" }}>
        <Trash2 size={15} />
        ลบบัญชี
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
      <div className="flex items-start gap-2 mb-3">
        <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-300">ยืนยันการลบบัญชี?</p>
          <p className="text-xs text-red-300/70 mt-0.5">ข้อมูลทั้งหมดจะถูกลบถาวร กู้คืนไม่ได้</p>
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.08)", color: "#cbd5e1" }}>
          ยกเลิก
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
          {loading ? "กำลังลบ..." : "ลบถาวร"}
        </button>
      </div>
    </div>
  );
}
