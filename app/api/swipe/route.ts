import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Auth via user session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_id, target_type, direction } = await req.json();

  // Service-role client to bypass RLS for cross-user reads & match creation.
  // (RLS only lets a user see their OWN swipes, so we cannot verify a mutual
  //  swipe or create a match using the user-scoped client.)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  await admin.from("swipes").upsert({
    swiper_id: user.id,
    target_id,
    target_type,
    direction,
  }, { onConflict: "swiper_id,target_id" });

  if (direction !== "right") return NextResponse.json({ matched: false });

  // ---- Seeker swiped right on a Job ----
  if (target_type === "job") {
    const { data: job } = await admin
      .from("jobs")
      .select("id, employer_id, employer_profiles!inner(user_id)")
      .eq("id", target_id)
      .single();
    if (!job) return NextResponse.json({ matched: false });

    const { data: seeker } = await admin.from("seeker_profiles").select("id").eq("user_id", user.id).single();
    if (!seeker) return NextResponse.json({ matched: false });

    const jobData = job as unknown as { id: string; employer_id: string; employer_profiles: { user_id: string } };

    // Did the employer already swipe right on this seeker?
    const { data: counterSwipe } = await admin.from("swipes")
      .select("id")
      .eq("swiper_id", jobData.employer_profiles.user_id)
      .eq("target_id", seeker.id)
      .eq("target_type", "seeker")
      .eq("direction", "right")
      .maybeSingle();

    if (counterSwipe) {
      const { data: match } = await admin.from("matches").upsert({
        seeker_id: seeker.id,
        employer_id: jobData.employer_id,
        job_id: target_id,
        status: "matched",
      }, { onConflict: "seeker_id,job_id" }).select().single();

      return NextResponse.json({ matched: true, match });
    }
  }

  // ---- Employer swiped right on a Seeker ----
  if (target_type === "seeker") {
    const { data: employer } = await admin.from("employer_profiles").select("id").eq("user_id", user.id).single();
    if (!employer) return NextResponse.json({ matched: false });

    const { data: jobs } = await admin.from("jobs").select("id").eq("employer_id", employer.id).eq("active", true);
    if (!jobs || jobs.length === 0) return NextResponse.json({ matched: false });

    const jobIds = jobs.map((j) => j.id);

    // Get the seeker's user_id
    const { data: seekerProfile } = await admin.from("seeker_profiles").select("user_id").eq("id", target_id).single();
    if (!seekerProfile) return NextResponse.json({ matched: false });

    // Did this seeker swipe right on any of the employer's jobs?
    const { data: seekerSwipes } = await admin.from("swipes")
      .select("target_id")
      .eq("swiper_id", seekerProfile.user_id)
      .eq("target_type", "job")
      .eq("direction", "right")
      .in("target_id", jobIds);

    if (!seekerSwipes || seekerSwipes.length === 0) return NextResponse.json({ matched: false });

    const jobId = seekerSwipes[0].target_id;

    const { data: match } = await admin.from("matches").upsert({
      seeker_id: target_id,
      employer_id: employer.id,
      job_id: jobId,
      status: "matched",
    }, { onConflict: "seeker_id,job_id" }).select().single();

    return NextResponse.json({ matched: true, match });
  }

  return NextResponse.json({ matched: false });
}
