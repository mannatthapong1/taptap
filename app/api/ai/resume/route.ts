import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { resumeText, locale } = await req.json();
  const lang = locale === "th" ? "ภาษาไทย" : "English";

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `วิเคราะห์เรซูเม่นี้และตอบใน${lang}:

${resumeText}

ตอบใน JSON format:
{
  "score": <0-100>,
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}
ตอบเฉพาะ JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่ม`
    }]
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  try {
    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ score: 0, strengths: [], improvements: [] });
  }
}
