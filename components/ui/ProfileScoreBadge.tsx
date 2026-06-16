"use client";

import { useTranslations } from "next-intl";

interface Props { score: number }

export default function ProfileScoreBadge({ score }: Props) {
  const t = useTranslations("onboarding");
  const color = score >= 80 ? "text-green-600 bg-green-50" : score >= 50 ? "text-amber-600 bg-amber-50" : "text-red-500 bg-red-50";

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${color}`}>
      <div className="relative h-5 w-5">
        <svg viewBox="0 0 20 20" className="absolute inset-0">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeDasharray={`${(score / 100) * 50.3} 50.3`}
            strokeLinecap="round"
            transform="rotate(-90 10 10)"
          />
        </svg>
      </div>
      {t("profile_score", { score })}
    </div>
  );
}
