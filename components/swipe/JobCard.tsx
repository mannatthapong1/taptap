"use client";

import { useTranslations } from "next-intl";
import { MapPin, Clock, Zap } from "lucide-react";
import type { JobCardData } from "@/lib/types";

const PAY_TYPE_SHORT: Record<string, string> = {
  hourly: "/ชม.",
  daily: "/วัน",
  monthly: "/เดือน",
  fixed: "เหมา",
};
const PAY_TYPE_SHORT_EN: Record<string, string> = {
  hourly: "/hr",
  daily: "/day",
  monthly: "/mo",
  fixed: "fixed",
};

interface Props {
  job: JobCardData;
  locale: string;
  style?: React.CSSProperties;
  onDragEnd?: (direction: "left" | "right") => void;
  isTop?: boolean;
}

export default function JobCard({ job, locale, style, isTop }: Props) {
  const t = useTranslations("seeker.card");
  const payShort = locale === "th" ? PAY_TYPE_SHORT[job.pay_type] : PAY_TYPE_SHORT_EN[job.pay_type];
  const dayNames = locale === "th"
    ? ["อา","จ","อ","พ","พฤ","ศ","ส"]
    : ["Su","Mo","Tu","We","Th","Fr","Sa"];

  return (
    <div
      style={style}
      className={`absolute inset-x-0 bg-white rounded-3xl shadow-xl overflow-hidden select-none ${isTop ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {/* header gradient */}
      <div className="h-52 bg-gradient-to-br from-indigo-500 to-violet-600 relative flex items-end p-5">
        {job.urgent && (
          <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {t("urgent")}
          </span>
        )}
        <div>
          <p className="text-white/70 text-xs mb-1 font-medium">
            {job.employer?.company_name ?? "—"}
          </p>
          <h2 className="text-white text-2xl font-bold leading-tight">{job.title}</h2>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {/* pay + distance */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            ฿{job.pay_amount.toLocaleString()}
            <span className="text-sm font-normal text-gray-400 ml-1">{payShort}</span>
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin size={14} />
            {t("distance", { km: job.distance_km })}
          </span>
        </div>

        {/* match score */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${job.match_score}%` }} />
          </div>
          <span className="text-xs font-semibold text-indigo-600">{t("match", { pct: job.match_score })}</span>
        </div>

        {/* schedule chips */}
        {job.schedule.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Clock size={13} className="text-gray-400" />
            {job.schedule.map((s, i) => (
              <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {dayNames[s.day]} {s.from}–{s.to}
              </span>
            ))}
          </div>
        )}

        {/* skills */}
        {job.skills_needed.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {job.skills_needed.slice(0, 4).map((s) => (
              <span key={s} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
