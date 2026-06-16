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

  // Seeker swiped right on a Job
  if (target_type === "job") {
    const { data: job } = await supabase
      .from("jobs")
      .select("id, employer_id, employer_profiles!inner(user_id)")
      .eq("id", target_id)
      .single();
    if (!job) return NextResponse.json({ matched: false });

    const { data: seeker } = await supabase.from("seeker_profiles").select("id").eq("user_id", user.id).single();
    if (!seeker) return NextResponse.json({ matched: false });

    const jobData = job as unknown as { id: string; employer_id: string; employer_profiles: { user_id: string } };

    // Check if employer already swiped right on this seeker
    const { data: counterSwipe } = await supabase.from("swipes")
      .select("id")
      .eq("swiper_id", jobData.employer_profiles.user_id)
      .eq("target_id", seeker.id)
      .eq("target_type", "seeker")
      .eq("direction", "right")
      .maybeSingle();

    if (counterSwipe) {
      const { data: match } = await supabase.from("matches").upsert({
        seeker_id: seeker.id,
        employer_id: jobData.employer_id,
        job_id: target_id,
        status: "matched",
      }, { onConflict: "seeker_id,job_id" }).select().single();

      return NextResponse.json({ matched: true, match });
    }
  }

  // Employer swiped right on a Seeker
  if (target_type === "seeker") {
    const { data: employer } = await supabase.from("employer_profiles").select("id").eq("user_id", user.id).single();
    if (!employer) return NextResponse.json({ matched: false });

    // Find all jobs this employer has posted
    const { data: jobs } = await supabase.from("jobs").select("id").eq("employer_id", employer.id).eq("active", true);
    if (!jobs || jobs.length === 0) return NextResponse.json({ matched: false });

    const jobIds = jobs.map((j) => j.id);

    // Check if this seeker swiped right on any of employer's jobs
    const { data: seekerSwipes } = await supabase.from("swipes")
      .select("target_id")
      .eq("swiper_id", (await supabase.from("seeker_profiles").select("user_id").eq("id", target_id).single()).data?.user_id ?? "")
      .eq("target_type", "job")
      .eq("direction", "right")
      .in("target_id", jobIds);

    if (!seekerSwipes || seekerSwipes.length === 0) return NextResponse.json({ matched: false });

    // Create match for the first mutual job
    const jobId = seekerSwipes[0].target_id;

    const { data: match } = await supabase.from("matches").upsert({
      seeker_id: target_id,
      employer_id: employer.id,
      job_id: jobId,
      status: "matched",
    }, { onConflict: "seeker_id,job_id" }).select().single();

    return NextResponse.json({ matched: true, match });
  }

  return NextResponse.json({ matched: false });
}
