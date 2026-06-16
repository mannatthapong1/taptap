import { useTranslations } from "next-intl";

export default function TypingIndicator() {
  const t = useTranslations("chat");
  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <span className="text-xs text-gray-400">{t("typing")}</span>
    </div>
  );
}
