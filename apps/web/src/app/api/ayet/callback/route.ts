import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function verifySignature(
  raw: string,
  signature: string | null,
  secret: string | undefined,
) {
  if (!secret) return true;
  if (!signature) return false;

  const expected = createHmac("sha256", secret)
    .update(raw)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);

  return a.length === b.length && timingSafeEqual(a, b);
}

async function handleCallback(request: NextRequest) {
  const params =
    request.method === "GET"
      ? request.nextUrl.searchParams
      : new URLSearchParams(await request.text());

  const transactionId = params.get("transaction_id");
  const externalIdentifier = params.get("external_identifier");

  if (!transactionId || !externalIdentifier) {
    return NextResponse.json(
      { ok: false, error: "missing_transaction_or_user" },
      { status: 400 },
    );
  }

  const apiKey = process.env.AYET_API_KEY;
  const signature =
    request.headers.get("x-ayetstudios-security-hash") ??
    params.get("security_hash");

  if (
    process.env.AYET_CALLBACK_HMAC_REQUIRED === "true" &&
    !verifySignature(params.toString(), signature, apiKey)
  ) {
    return NextResponse.json(
      { ok: false, error: "invalid_signature" },
      { status: 401 },
    );
  }

  const payoutUsd = Number(params.get("payout_usd") ?? 0);
  const currencyAmount = Number(params.get("currency_amount") ?? 0);
  const currencyIdentifier =
    params.get("currency_identifier") ??
    process.env.AYET_CURRENCY_IDENTIFIER ??
    "";

  const eventType =
    params.get("status") ??
    params.get("event") ??
    "conversion";

  const supabase = await getSupabaseServerClient();

  const { error: conversionError } = await supabase
    .from("ayet_conversions")
    .upsert(
      {
        transaction_id: transactionId,
        external_identifier: externalIdentifier,
        event_type: eventType,
        payout_usd: payoutUsd,
        currency_amount: currencyAmount,
        currency_identifier: currencyIdentifier,
        raw_payload: Object.fromEntries(params.entries()),
      },
      { onConflict: "transaction_id" },
    );

  if (conversionError) {
    console.error("ayeT conversion error", conversionError);
    return NextResponse.json(
      { ok: false, error: "conversion_storage_failed" },
      { status: 500 },
    );
  }

  if (eventType === "chargeback" || eventType === "reversal") {
    await supabase.from("user_reward_ledger").insert({
      external_identifier: externalIdentifier,
      transaction_id: transactionId,
      entry_type: "reversal",
      amount: -Math.abs(currencyAmount),
      currency_identifier: currencyIdentifier,
      provider_payout_usd: -Math.abs(payoutUsd),
      metadata: Object.fromEntries(params.entries()),
    });

    await supabase.from("platform_revenue").insert({
      transaction_id: transactionId,
      revenue_type: "chargeback",
      provider_payout_usd: -Math.abs(payoutUsd),
      metadata: Object.fromEntries(params.entries()),
    });
  } else {
    await supabase.from("user_reward_ledger").upsert(
      {
        external_identifier: externalIdentifier,
        transaction_id: transactionId,
        entry_type: "credit",
        amount: currencyAmount,
        currency_identifier: currencyIdentifier,
        provider_payout_usd: payoutUsd,
        metadata: Object.fromEntries(params.entries()),
      },
      { onConflict: "transaction_id" },
    );

    await supabase.from("platform_revenue").upsert(
      {
        transaction_id: transactionId,
        revenue_type: "provider_conversion",
        provider_payout_usd: payoutUsd,
        metadata: Object.fromEntries(params.entries()),
      },
      { onConflict: "transaction_id" },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}
