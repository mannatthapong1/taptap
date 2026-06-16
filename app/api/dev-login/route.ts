import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: "noobb.bbcom@gmail.com",
  });

  if (error || !data.properties?.action_link) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  const actionLink = data.properties.action_link;
  const url = new URL(actionLink);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const redirectUrl = `http://localhost:3000/th/auth/callback?token_hash=${token_hash}&type=${type}`;
  return NextResponse.redirect(redirectUrl);
}
