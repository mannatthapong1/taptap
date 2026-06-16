"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

export interface FilterState {
  skills: string[];
  maxDistance: number;
  minRating: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (f: FilterState) => void;
}

const POPULAR = ["เสิร์ฟ","ทำอาหาร","แคชเชียร์","ขับรถ","ทำความสะอาด","บริการลูกค้า"];

export default function FilterDrawer({ open, onClose, onApply }: Props) {
  const t = useTranslations("employer.filter");
  const [skills, setSkills] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(20);
  const [minRating, setMinRating] = useState(0);

  function toggleSkill(s: string) {
    setSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function reset() {
    setSkills([]); setMaxDistance(20); setMinRating(0);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{t("title")}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <p className="text-sm font-medium text-gray-700 mb-2">{t("skills")}</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {POPULAR.map((s) => (
            <button
              key={s}
              onClick={() => toggleSkill(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${skills.includes(s) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200"}`}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="text-sm font-medium text-gray-700 mb-1">{t("distance")}: {maxDistance} กม.</p>
        <input type="range" min={1} max={100} value={maxDistance} onChange={(e) => setMaxDistance(+e.target.value)}
          className="w-full accent-indigo-600 mb-5" />

        <p className="text-sm font-medium text-gray-700 mb-1">{t("min_rating")}: {minRating > 0 ? `${minRating}+` : "ทั้งหมด"}</p>
        <div className="flex gap-2 mb-6">
          {[0, 3, 3.5, 4, 4.5].map((r) => (
            <button key={r} onClick={() => setMinRating(r)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition ${minRating === r ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200"}`}>
              {r === 0 ? "ทั้งหมด" : `${r}★`}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={reset} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-600">{t("reset")}</button>
          <button onClick={() => { onApply({ skills, maxDistance, minRating }); onClose(); }}
            className="flex-2 flex-[2] rounded-2xl bg-indigo-600 text-white py-3 text-sm font-semibold">{t("apply")}</button>
        </div>
      </div>
    </div>
  );
}
