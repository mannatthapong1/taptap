"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";

interface Props {
  matchId: string;
  jobTitle: string;
  onClose: () => void;
}

export default function MatchScreen({ matchId, jobTitle, onClose }: Props) {
  const t = useTranslations("seeker.home");
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    confetti({ particleCount: 160, spread: 80, origin: { y: 0.55 } });
    setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { y: 0.4 } }), 400);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("match_title")}</h2>
        <p className="text-gray-500 text-sm mb-1">{t("match_subtitle")}</p>
        <p className="font-semibold text-indigo-600 mb-6">{jobTitle}</p>
        <button
          onClick={() => router.push(`/${locale}/seeker/chat/${matchId}`)}
          className="w-full rounded-2xl bg-indigo-600 text-white py-3.5 font-semibold mb-3 hover:bg-indigo-700 transition"
        >
          {t("match_chat")}
        </button>
        <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600">
          {t("match_later")}
        </button>
      </div>
    </div>
  );
}
