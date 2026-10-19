import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function resolveExternalIdentifier(request: NextRequest) {
  const existing = request.cookies.get("fr_ext_id")?.value;
  if (existing && /^fr_[0-9a-f-]{36}$/.test(existing)) {
    return { value: existing, setCookie: false };
  }
  return { value: `fr_${crypto.randomUUID()}`, setCookie: true };
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const user = authData.user;
  if (authError || !user) {
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }

  const identity = resolveExternalIdentifier(request);
  const { data: existing, error: lookupError } = await supabase
    .from("user_external_identifiers")
    .select("user_id")
    .eq("external_identifier", identity.value)
    .maybeSingle();

  if (lookupError) {
    console.error("FairReward identity lookup failed", lookupError);
    return NextResponse.json({ error: "identity_link_unavailable" }, { status: 500 });
  }
  if (existing && existing.user_id !== user.id) {
    return NextResponse.json({ error: "identity_already_linked" }, { status: 409 });
  }

  if (!existing) {
    const { error: insertError } = await supabase
      .from("user_external_identifiers")
      .insert({ external_identifier: identity.value, user_id: user.id });
    if (insertError) {
      console.error("FairReward identity link failed", insertError);
      return NextResponse.json({ error: "identity_link_failed" }, { status: 500 });
    }
  }

  const { error: reconcileError } = await supabase.rpc("reconcile_ayet_wallet", {
    p_external_identifier: identity.value,
  });
  if (reconcileError) {
    console.error("FairReward wallet reconciliation failed", reconcileError);
    return NextResponse.json({ error: "wallet_reconciliation_failed" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  if (identity.setCookie) {
    response.cookies.set("fr_ext_id", identity.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
