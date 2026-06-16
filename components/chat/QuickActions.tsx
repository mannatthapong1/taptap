"use client";

import { useTranslations } from "next-intl";
import { Calendar, CheckCircle, FileText } from "lucide-react";

interface Props {
  onAction: (type: "schedule_interview" | "accept_job" | "send_resume") => void;
}

export default function QuickActions({ onAction }: Props) {
  const t = useTranslations("chat");

  const actions = [
    { key: "schedule_interview" as const, icon: Calendar, color: "text-indigo-600 bg-indigo-50" },
    { key: "accept_job" as const, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { key: "send_resume" as const, icon: FileText, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
      {actions.map(({ key, icon: Icon, color }) => (
        <button
          key={key}
          onClick={() => onAction(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${color}`}
        >
          <Icon size={13} />
          {t(key)}
        </button>
      ))}
    </div>
  );
}
