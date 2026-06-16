"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, MessageCircle, Heart, User } from "lucide-react";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";
import type { Message } from "@/lib/types";

interface Props {
  role: "seeker" | "employer";
}

export default function BottomNav({ role }: Props) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const base = `/${locale}/${role}`;
  const { count, latest } = useUnreadMessages(role);

  const [toast, setToast] = useState<Message | null>(null);
  const lastToastId = useRef<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ask for browser notification permission once
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Show in-app toast + browser notification on a new incoming message
  useEffect(() => {
    if (!latest || latest.id === lastToastId.current) return;
    lastToastId.current = latest.id;
    setToast(latest);

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("ข้อความใหม่ใน TapTap", { body: latest.content, icon: "/icon.png" });
      } catch {}
    }

    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, [latest]);

  const tabs = [
    { href: `${base}/home`, label: t("home"), icon: Home, badge: 0 },
    { href: `${base}/matches`, label: t("matches"), icon: Heart, badge: 0 },
    { href: `${base}/chat`, label: t("chat"), icon: MessageCircle, badge: count },
    { href: `${base}/profile`, label: t("profile"), icon: User, badge: 0 },
  ];

  return (
    <>
      {/* New-message toast */}
      {toast && (
        <button
          onClick={() => { setToast(null); router.push(`${base}/chat`); }}
          className="fixed left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-2xl px-4 py-3 text-left animate-[slideDown_0.3s_ease-out] w-[92%] max-w-md"
          style={{
            top: "max(12px, env(safe-area-inset-top))",
            background: "rgba(15,23,42,0.97)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(56,189,248,0.4)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
            <MessageCircle size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">ข้อความใหม่</p>
            <p className="text-xs text-blue-200 truncate">{toast.content}</p>
          </div>
        </button>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-50" style={{ background: "rgba(10,20,40,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(56,189,248,0.15)" }}>
        <div className="flex">
          {tabs.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-1 flex-1 py-3 text-xs transition-all"
                style={{ color: active ? "#38bdf8" : "rgba(148,163,184,0.6)" }}>
                <div className="relative flex items-center justify-center">
                  {active && (
                    <div className="absolute inset-0 rounded-full blur-md" style={{ background: "rgba(56,189,248,0.3)", transform: "scale(1.8)" }} />
                  )}
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} style={{ position: "relative" }} />
                  {badge > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 flex items-center justify-center rounded-full text-white font-bold"
                      style={{
                        minWidth: 18, height: 18, fontSize: 10, padding: "0 5px",
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        boxShadow: "0 0 8px rgba(239,68,68,0.6)",
                        border: "1.5px solid rgba(10,20,40,0.95)",
                      }}>
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span className="font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <style>{`@keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </>
  );
}
