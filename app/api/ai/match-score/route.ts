import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { job, candidate } = await req.json();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 128,
    messages: [{
      role: "user",
      content: `Score this candidate-job match 0-100. Reply ONLY with the number.

Job: ${job.title}, skills: ${job.skills_needed?.join(",")}
Candidate skills: ${candidate.skills?.join(",")}, availability: ${JSON.stringify(candidate.availability)}`
    }]
  });

  const text = message.content[0].type === "text" ? message.content[0].text.trim() : "50";
  const score = Math.min(100, Math.max(0, parseInt(text) || 50));
  return NextResponse.json({ score });
}
