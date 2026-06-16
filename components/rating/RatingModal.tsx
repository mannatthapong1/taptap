"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

interface Props {
  matchId: string;
  rateeId: string;
  onSubmit: (stars: number, comment: string) => Promise<void>;
  onSkip: () => void;
}

export default function RatingModal({ matchId: _matchId, rateeId: _rateeId, onSubmit, onSkip }: Props) {
  const t = useTranslations("rating");
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!stars) return;
    setLoading(true);
    await onSubmit(stars, comment);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="text-xl font-bold text-gray-900 text-center">{t("title")}</h2>
        <p className="text-sm text-gray-500 text-center mt-1 mb-6">{t("subtitle")}</p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(s)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={36}
                className={(hover || stars) >= s ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("comment_placeholder")}
          rows={3}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 resize-none mb-4"
        />

        <button
          onClick={handleSubmit}
          disabled={!stars || loading}
          className="w-full rounded-2xl bg-indigo-600 text-white py-3.5 font-semibold disabled:opacity-40 mb-3"
        >
          {loading ? "..." : t("submit")}
        </button>
        <button onClick={onSkip} className="w-full text-sm text-gray-400 hover:text-gray-600">
          {t("skip")}
        </button>
      </div>
    </div>
  );
}
