import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST() {
  // Identify the currently logged-in user from their session cookie
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use service role to remove all data + the auth user
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const userId = user.id;

  // Clean up related rows (in case FKs are not set to cascade)
  await admin.from("swipes").delete().eq("swiper_id", userId);
  await admin.from("ratings").delete().eq("rater_id", userId);
  await admin.from("ratings").delete().eq("ratee_id", userId);

  const { data: seeker } = await admin.from("seeker_profiles").select("id").eq("user_id", userId).maybeSingle();
  const { data: employer } = await admin.from("employer_profiles").select("id").eq("user_id", userId).maybeSingle();

  if (seeker?.id) {
    await admin.from("matches").delete().eq("seeker_id", seeker.id);
  }
  if (employer?.id) {
    await admin.from("jobs").delete().eq("employer_id", employer.id);
    await admin.from("matches").delete().eq("employer_id", employer.id);
  }

  await admin.from("seeker_profiles").delete().eq("user_id", userId);
  await admin.from("employer_profiles").delete().eq("user_id", userId);

  // Remove uploaded avatar(s)
  try {
    const { data: files } = await admin.storage.from("avatars").list(userId);
    if (files && files.length > 0) {
      await admin.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
    }
  } catch {}

  // Finally delete the auth user
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
