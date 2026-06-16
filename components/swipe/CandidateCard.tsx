"use client";

import { useTranslations } from "next-intl";
import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import type { CandidateCardData } from "@/lib/types";

interface Props {
  candidate: CandidateCardData;
  locale: string;
  style?: React.CSSProperties;
  isTop?: boolean;
}

export default function CandidateCard({ candidate, locale, style, isTop }: Props) {
  const t = useTranslations("seeker.card");
  const dayNames = locale === "th"
    ? ["อา","จ","อ","พ","พฤ","ศ","ส"]
    : ["Su","Mo","Tu","We","Th","Fr","Sa"];

  return (
    <div
      style={style}
      className={`absolute inset-x-0 bg-white rounded-3xl shadow-xl overflow-hidden select-none ${isTop ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="h-56 bg-gradient-to-br from-rose-400 to-pink-600 relative flex items-end p-5">
        {candidate.photo_url && (
          <Image src={candidate.photo_url} alt={candidate.name} fill className="object-cover opacity-50" />
        )}
        <div className="relative">
          <div className="flex items-center gap-1 text-white/70 text-xs mb-1">
            <Star size={12} fill="currentColor" />
            <span>{candidate.rating_avg > 0 ? candidate.rating_avg.toFixed(1) : "—"}</span>
          </div>
          <h2 className="text-white text-2xl font-bold">{candidate.name}</h2>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin size={14} />
            {t("distance", { km: candidate.distance_km })}
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-pink-500 rounded-full" style={{ width: `${candidate.match_score}%` }} />
            </div>
            <span className="text-xs font-semibold text-pink-600">{t("match", { pct: candidate.match_score })}</span>
          </span>
        </div>

        {candidate.skills.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {candidate.skills.slice(0, 5).map((s) => (
              <span key={s} className="bg-rose-50 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-medium">{s}</span>
            ))}
          </div>
        )}

        {candidate.availability.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {candidate.availability.map((a, i) => (
              <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {dayNames[a.day]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
