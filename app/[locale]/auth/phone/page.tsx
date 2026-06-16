"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowRight, Sparkles } from "lucide-react";

type Tab = "login" | "register";

export default function AuthPage() {
  const { locale } = useParams<{ locale: string }>();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleMagicLink(e: React.FormEvent) {
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

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });
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
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl" style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)" }}>
            <Sparkles size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">TapTap</h1>
          <p className="mt-1 text-sm text-blue-200">แอปหางานที่ใช่ สไตล์ที่ชอบ</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6 shadow-2xl" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.15)" }}>

          {/* Tabs */}
          <div className="flex rounded-2xl p-1 mb-6" style={{ background: "rgba(0,0,0,0.2)" }}>
            <button onClick={() => setTab("login")}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={tab === "login" ? { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "white" } : { color: "rgba(148,163,184,0.8)" }}>
              เข้าสู่ระบบ
            </button>
            <button onClick={() => setTab("register")}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={tab === "register" ? { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "white" } : { color: "rgba(148,163,184,0.8)" }}>
              สมัครสมาชิก
            </button>
          </div>

          {/* Google Button */}
          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 mb-4 font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: "white", color: "#1f2937" }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "กำลังเชื่อมต่อ..." : tab === "login" ? "เข้าสู่ระบบด้วย Google" : "สมัครด้วย Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
            <span className="text-xs text-blue-300">หรือใช้อีเมล</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* Email Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-blue-100">อีเมล</label>
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

            <button type="submit" disabled={loading}
              className="w-full rounded-2xl py-4 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
              {loading ? "กำลังส่ง..." : <>
                {tab === "login" ? "รับ Magic Link เพื่อเข้าสู่ระบบ" : "รับ Magic Link เพื่อสมัคร"}
                <ArrowRight size={16} />
              </>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-blue-300 mt-5">ปลอดภัย · ไม่ต้องจำรหัสผ่าน · ฟรี</p>
      </div>
    </div>
  );
}
