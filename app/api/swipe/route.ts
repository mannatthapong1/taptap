import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_id, target_type, direction } = await req.json();

  await supabase.from("swipes").upsert({
    swiper_id: user.id,
    target_id,
    target_type,
    direction,
  }, { onConflict: "swiper_id,target_id" });

  if (direction !== "right") return NextResponse.json({ matched: false });

  // check mutual match
  if (target_type === "job") {
    const { data: job } = await supabase.from("jobs").select("employer_id, employer_profiles!inner(user_id)").eq("id", target_id).single();
    if (!job) return NextResponse.json({ matched: false });

    const { data: seeker } = await supabase.from("seeker_profiles").select("id").eq("user_id", user.id).single();
    if (!seeker) return NextResponse.json({ matched: false });

    // check if employer already swiped right on this seeker
    const jobAny = job as unknown as { employer_id: string; employer_profiles: { user_id: string } };
    const { data: counterSwipe } = await supabase.from("swipes")
      .select("id")
      .eq("swiper_id", jobAny.employer_profiles.user_id)
      .eq("target_id", seeker.id)
      .eq("direction", "right")
      .maybeSingle();

    if (counterSwipe) {
      const ep = (job as unknown as { employer_profiles: { user_id: string } }).employer_profiles;
      if (!ep) return NextResponse.json({ matched: false });

      const { data: match } = await supabase.from("matches").upsert({
        seeker_id: seeker.id,
        employer_id: job.employer_id,
        job_id: target_id,
        status: "matched",
      }, { onConflict: "seeker_id,job_id" }).select().single();

      return NextResponse.json({ matched: true, match });
    }
  }

  return NextResponse.json({ matched: false });
}
