"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowRight, Sparkles } from "lucide-react";

export default function PhonePage() {
  const { locale } = useParams<{ locale: string }>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/${locale}/auth/callback`;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (authError) {
      setError("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0369a1 100%)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl shadow-2xl" style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)" }}>
            📬
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">เช็คอีเมลด้วยนะ!</h1>
          <p className="text-sm text-blue-200 mb-1">ส่ง Magic Link ไปที่</p>
          <p className="font-semibold text-white mb-6 text-lg">{email}</p>
          <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="text-xs text-blue-200">คลิกลิงก์ในอีเมลเพื่อเข้าสู่ระบบ<br />ถ้าไม่เจอลองเช็ค Spam ด้วยครับ</p>
          </div>
          <button onClick={() => setSent(false)} className="text-sm text-blue-300 hover:text-white transition">
            ← ใช้อีเมลอื่น
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0369a1 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl" style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)" }}>
            <Sparkles size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">TapTap</h1>
          <p className="mt-2 text-sm text-blue-200">แอปหางานที่ใช่ สไตล์ที่ชอบ</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6 shadow-2xl" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <h2 className="text-xl font-bold text-white mb-1">เข้าสู่ระบบ</h2>
          <p className="text-sm text-blue-200 mb-6">กรอกอีเมลเพื่อรับ Magic Link</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-blue-100">อีเมล</label>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Mail size={16} className="text-blue-300 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-blue-400"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}
            >
              {loading ? "กำลังส่ง..." : <>รับ Magic Link <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-blue-300 mt-6">ปลอดภัย · ไม่ต้องจำรหัสผ่าน</p>
      </div>
    </div>
  );
}
