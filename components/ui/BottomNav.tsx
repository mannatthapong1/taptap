"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, MessageCircle, Heart, User } from "lucide-react";

interface Props {
  role: "seeker" | "employer";
}

export default function BottomNav({ role }: Props) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { locale } = useParams<{ locale: string }>();
  const base = `/${locale}/${role}`;

  const tabs = [
    { href: `${base}/home`, label: t("home"), icon: Home },
    { href: `${base}/matches`, label: t("matches"), icon: Heart },
    { href: `${base}/chat`, label: t("chat"), icon: MessageCircle },
    { href: `${base}/profile`, label: t("profile"), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50" style={{ background: "rgba(10,20,40,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(56,189,248,0.15)" }}>
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
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
              </div>
              <span className="font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
