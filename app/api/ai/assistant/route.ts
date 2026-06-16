import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { messages, locale, seekerProfile } = await req.json();
  const lang = locale === "th" ? "ภาษาไทย" : "English";

  const system = `คุณคือ TapTap AI ผู้ช่วยหางานสำหรับ App TapTap ตอบใน${lang} สั้น กระชับ และเป็นมิตร
ข้อมูลผู้ใช้: ชื่อ ${seekerProfile?.name ?? "—"} ทักษะ: ${seekerProfile?.skills?.join(", ") ?? "—"}
ช่วยเรื่อง: แนะนำงาน, เขียน email สมัครงาน, เตรียมสัมภาษณ์, อธิบาย TapTap`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ reply: text });
}
