"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { X, Star, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface SwipeStackProps<T> {
  items: T[];
  renderCard: (item: T, style: React.CSSProperties, isTop: boolean) => React.ReactNode;
  onSwipe: (item: T, direction: "left" | "right" | "save") => Promise<void>;
  locale: string;
}

function SwipeCard<T>({ item, renderCard, onSwipe, zIndex }: {
  item: T;
  renderCard: (item: T, style: React.CSSProperties, isTop: boolean) => React.ReactNode;
  onSwipe: (item: T, dir: "left" | "right" | "save") => void;
  zIndex: number;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const rightOpacity = useTransform(x, [20, 100], [0, 1]);
  const leftOpacity = useTransform(x, [-100, -20], [1, 0]);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 100) onSwipe(item, "right");
    else if (info.offset.x < -100) onSwipe(item, "left");
  }

  const isTopCard = zIndex === 10;

  return (
    <motion.div
      style={{ x, rotate, zIndex, position: "absolute", inset: 0 }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ scale: isTopCard ? 1 : 0.95 }}
    >
      {/* like indicator */}
      <motion.div style={{ opacity: rightOpacity }} className="absolute top-8 left-6 z-10 rotate-[-20deg] border-4 border-green-500 text-green-500 font-black text-2xl px-3 py-1 rounded-xl pointer-events-none">
        LIKE
      </motion.div>
      {/* nope indicator */}
      <motion.div style={{ opacity: leftOpacity }} className="absolute top-8 right-6 z-10 rotate-[20deg] border-4 border-red-500 text-red-500 font-black text-2xl px-3 py-1 rounded-xl pointer-events-none">
        NOPE
      </motion.div>
      {renderCard(item, {}, isTopCard)}
    </motion.div>
  );
}

export default function SwipeStack<T extends { id: string }>({ items, renderCard, onSwipe, locale: _locale }: SwipeStackProps<T>) {
  const t = useTranslations("seeker.home");
  const [stack, setStack] = useState(items);
  const [processing, setProcessing] = useState(false);

  async function handleSwipe(item: T, dir: "left" | "right" | "save") {
    if (processing) return;
    setProcessing(true);
    setStack((prev) => prev.filter((c) => c.id !== item.id));
    await onSwipe(item, dir);
    setProcessing(false);
  }

  const top = stack[stack.length - 1];

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 mx-4 mt-2">
        <AnimatePresence>
          {stack.slice(-2).map((item, i, arr) => (
            <SwipeCard
              key={(item as T & { id: string }).id}
              item={item}
              renderCard={renderCard}
              onSwipe={handleSwipe}
              zIndex={i === arr.length - 1 ? 10 : 5}
              isTop={i === arr.length - 1}
            />
          ))}
        </AnimatePresence>
        {stack.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-center text-gray-400 text-sm">
            {t("empty")}
          </div>
        )}
      </div>

      {/* action buttons */}
      <div className="flex items-center justify-center gap-5 py-6">
        <button
          onClick={() => top && handleSwipe(top, "left")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg border border-gray-100 text-red-400 hover:scale-110 transition-transform"
        >
          <X size={26} />
        </button>
        <button
          onClick={() => top && handleSwipe(top, "save")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-100 text-amber-400 hover:scale-110 transition-transform"
        >
          <Star size={22} />
        </button>
        <button
          onClick={() => top && handleSwipe(top, "right")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-lg text-white hover:scale-110 transition-transform"
        >
          <Check size={26} />
        </button>
      </div>
    </div>
  );
}
