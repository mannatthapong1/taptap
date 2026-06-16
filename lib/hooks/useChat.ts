"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

export function useChat(matchId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user_id === userId) return;
        setTypingUsers((prev) => [...new Set([...prev, payload.user_id])]);
        setTimeout(() => setTypingUsers((prev) => prev.filter((id) => id !== payload.user_id)), 3000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, userId]);

  async function sendMessage(content: string) {
    await supabase.from("messages").insert({ match_id: matchId, sender_id: userId, content, type: "text" });
  }

  async function broadcastTyping() {
    const channel = supabase.channel(`chat:${matchId}`);
    await channel.send({ type: "broadcast", event: "typing", payload: { user_id: userId } });
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }

  return { messages, typingUsers, loading, sendMessage, broadcastTyping };
}
