import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let offerId = "";
  try {
    const body = (await request.json()) as { offerId?: unknown };
    offerId = String(body.offerId ?? "");
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!/^\d{1,18}$/.test(offerId)) {
    return NextResponse.json({ error: "invalid_offer_id" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const { data: click, error } = await supabase
    .from("ayet_clicks")
    .insert({ user_id: auth.user.id, offer_id: offerId })
    .select("click_id")
    .single();
  if (error || !click) {
    console.error("ayeT click registration failed", error?.code, error?.message);
    return NextResponse.json({ error: "click_registration_failed" }, { status: 500 });
  }
  return NextResponse.json({ url: `/api/ayet/launch?offerId=${encodeURIComponent(offerId)}&click=${click.click_id}` });
}
