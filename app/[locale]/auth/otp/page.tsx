"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OtpPage() {
  const t = useTranslations("auth.otp");
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("taptap_email");
    if (!stored) { router.replace(`/${locale}/auth/phone`); return; }
    setEmail(stored);
    inputRefs.current[0]?.focus();
  }, [locale, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = ["", "", "", "", "", ""];
    text.split("").forEach((d, i) => (next[i] = d));
    setOtp(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.join("");
    if (token.length !== 6) return;
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (authError) {
      setError(authError.message.includes("expired") ? t("error_expired") : t("error_invalid"));
      setLoading(false);
      return;
    }

    sessionStorage.removeItem("taptap_email");
    router.push(`/${locale}/role-select`);
  }

  async function handleResend() {
    if (countdown > 0) return;
    const supabase = createClient();
    await supabase.auth.signInWithOtp({ email });
    setCountdown(60);
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  }

  const filled = otp.join("").length === 6;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-3xl shadow-lg">
            📬
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {t("subtitle")}{" "}
            <span className="font-semibold text-gray-800">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div onPaste={handlePaste} className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-13 w-12 rounded-2xl border-2 border-gray-200 bg-white text-center text-xl font-bold outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            ))}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!filled || loading}
            className="w-full rounded-2xl bg-indigo-600 py-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {loading ? t("verifying") : t("submit")}
          </button>
        </form>

        <div className="mt-5 text-center">
          {countdown > 0 ? (
            <p className="text-sm text-gray-400">{t("resend_in", { seconds: countdown })}</p>
          ) : (
            <button onClick={handleResend} className="text-sm font-medium text-indigo-600 hover:underline">
              {t("resend")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
