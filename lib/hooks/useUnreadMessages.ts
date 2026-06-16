"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

type Role = "seeker" | "employer";

const LAST_SEEN_KEY = "taptap_chat_last_seen";

export function getLastSeen(): number {
  if (typeof window === "undefined") return Date.now();
  const v = localStorage.getItem(LAST_SEEN_KEY);
  if (v) return Number(v);
  // First run: start counting from now so old messages don't flood the badge
  const now = Date.now();
  localStorage.setItem(LAST_SEEN_KEY, String(now));
  return now;
}

export function markChatSeen() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  window.dispatchEvent(new Event("taptap-chat-seen"));
}

/**
 * Counts unread messages across all of the user's matches.
 * "Unread" = message from someone else, created after the last time the
 * user opened the chat list (stored in localStorage).
 * Returns the live count plus the most recent incoming message (for toasts).
 */
export function useUnreadMessages(role: Role) {
  const [count, setCount] = useState(0);
  const [latest, setLatest] = useState<Message | null>(null);

  const recompute = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const table = role === "seeker" ? "seeker_profiles" : "employer_profiles";
    const idField = role === "seeker" ? "seeker_id" : "employer_id";
    const { data: profile } = await supabase.from(table).select("id").eq("user_id", user.id).single();
    if (!profile) return;

    const { data: matches } = await supabase.from("matches").select("id").eq(idField, profile.id);
    const matchIds = (matches ?? []).map((m) => m.id);
    if (matchIds.length === 0) { setCount(0); return; }

    const lastSeen = new Date(getLastSeen()).toISOString();
    const { count: unread } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("match_id", matchIds)
      .neq("sender_id", user.id)
      .gt("created_at", lastSeen);

    setCount(unread ?? 0);
  }, [role]);

  useEffect(() => {
    recompute();

    const supabase = createClient();
    let userId = "";
    supabase.auth.getUser().then(({ data }) => { userId = data.user?.id ?? ""; });

    // Realtime: any new message the user is allowed to see (RLS filters to own matches)
    const channel = supabase
      .channel("global-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === userId) return; // my own message
          setLatest(msg);
          recompute();
        })
      .subscribe();

    const onSeen = () => recompute();
    window.addEventListener("taptap-chat-seen", onSeen);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("taptap-chat-seen", onSeen);
    };
  }, [recompute]);

  return { count, latest, refresh: recompute };
}
