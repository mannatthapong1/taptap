import type { Message } from "@/lib/types";
import { format } from "date-fns";

interface Props {
  message: Message;
  isMine: boolean;
}

export default function ChatBubble({ message, isMine }: Props) {
  if (message.type === "system") {
    return (
      <div className="text-center text-xs text-gray-400 my-3 px-4">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex mb-2 px-4 ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p className={`text-[10px] mt-1 ${isMine ? "text-indigo-200" : "text-gray-400"}`}>
          {format(new Date(message.created_at), "HH:mm")}
        </p>
      </div>
    </div>
  );
}
