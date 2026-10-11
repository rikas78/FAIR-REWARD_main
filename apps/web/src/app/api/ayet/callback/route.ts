import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function canonicalizeParams(params: URLSearchParams) {
  // ayeT requires callback parameters to be sorted alphabetically before HMAC.
  const entries = [...params.entries()]
    .filter(([key]) => key !== "security_hash")
    .sort(([keyA, valueA], [keyB, valueB]) =>
      keyA === keyB
        ? valueA.localeCompare(valueB)
        : keyA.localeCompare(keyB),
    );

  return new URLSearchParams(entries).toString();
}

function verifySignature(
  raw: string,
  signature: string | null,
  secret: string | undefined,
) {
  // A required signature must never silently pass when the secret is absent.
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(raw).digest();
  const suppliedHex = signature.trim().replace(/^sha256=/i, "");

  if (!/^[0-9a-f]{64}$/i.test(suppliedHex)) return false;

  const supplied = Buffer.from(suppliedHex, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function finiteParam(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  if (raw == null || raw.trim() === "") return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

async function handleCallback(request: NextRequest) {
  const params =
    request.method === "GET"
      ? new URLSearchParams(request.nextUrl.searchParams)
      : new URLSearchParams(await request.text());

  const transactionId = params.get("transaction_id")?.trim();
  const externalIdentifier = params.get("external_identifier")?.trim();

  if (!transactionId || !externalIdentifier) {
    return NextResponse.json(
      { ok: false, error: "missing_transaction_or_user" },
      { status: 400 },
    );
  }

  const callbackType = (params.get("callback_type") ?? "").trim().toLowerCase();
  const isChargeback =
    callbackType === "chargeback" ||
    params.get("is_chargeback") === "1";

  const payoutUsd = finiteParam(params, "payout_usd");
  const currencyAmount = finiteParam(params, "currency_amount");

  if (payoutUsd == null || currencyAmount == null) {
    return NextResponse.json(
      { ok: false, error: "invalid_amount" },
      { status: 400 },
    );
  }

  const apiKey = process.env.AYET_API_KEY;
  const signature =
    request.headers.get("x-ayetstudios-security-hash") ??
    params.get("security_hash");

  if (process.env.AYET_CALLBACK_HMAC_REQUIRED === "true") {
    if (!verifySignature(canonicalizeParams(params), signature, apiKey)) {
      return NextResponse.json(
        { ok: false, error: "invalid_signature" },
        { status: 401 },
      );
    }
  }

  // ayeT optional callbacks can share transaction_id with the paid conversion.
  // They are notifications, not additional user credits; do not overwrite the
  // financial transaction row or credit them as a conversion.
  const nonFinancialCallbackTypes = new Set([
    "optional",
    "installation",
    "iap",
    "iaa",
  ]);
  if (!isChargeback && nonFinancialCallbackTypes.has(callbackType)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const eventType = isChargeback
    ? "chargeback"
    : callbackType || params.get("status") || params.get("event") || "conversion";

  const effectivePayoutUsd = isChargeback ? -Math.abs(payoutUsd) : payoutUsd;
  const effectiveCurrencyAmount = isChargeback
    ? -Math.abs(currencyAmount)
    : currencyAmount;
  const currencyIdentifier =
    params.get("currency_identifier") ??
    process.env.AYET_CURRENCY_IDENTIFIER ??
    "";
  const metadata = Object.fromEntries(params.entries());
  const supabase = getSupabaseServerClient();

  const { error: conversionError } = await supabase
    .from("ayet_conversions")
    .upsert(
      {
        transaction_id: transactionId,
        external_identifier: externalIdentifier,
        event_type: eventType,
        payout_usd: effectivePayoutUsd,
        currency_amount: effectiveCurrencyAmount,
        currency_identifier: currencyIdentifier,
        raw_payload: metadata,
      },
      { onConflict: "transaction_id" },
    );

  if (conversionError) {
    console.error("ayeT conversion storage failed", conversionError);
    return NextResponse.json(
      { ok: false, error: "conversion_storage_failed" },
      { status: 500 },
    );
  }

  if (isChargeback || eventType === "reversal") {
    const { error: ledgerError } = await supabase
      .from("user_reward_ledger")
      .upsert(
        {
          external_identifier: externalIdentifier,
          transaction_id: transactionId,
          entry_type: "reversal",
          amount: -Math.abs(effectiveCurrencyAmount),
          currency_identifier: currencyIdentifier,
          provider_payout_usd: -Math.abs(effectivePayoutUsd),
          metadata,
        },
        { onConflict: "transaction_id" },
      );

    if (ledgerError) {
      console.error("ayeT reversal ledger write failed", ledgerError);
      return NextResponse.json(
        { ok: false, error: "ledger_storage_failed" },
        { status: 500 },
      );
    }

    const { error: revenueError } = await supabase
      .from("platform_revenue")
      .upsert(
        {
          transaction_id: transactionId,
          revenue_type: "chargeback",
          provider_payout_usd: -Math.abs(effectivePayoutUsd),
          metadata,
        },
        { onConflict: "transaction_id" },
      );

    if (revenueError) {
      console.error("ayeT chargeback revenue write failed", revenueError);
      return NextResponse.json(
        { ok: false, error: "revenue_storage_failed" },
        { status: 500 },
      );
    }
  } else {
    const { error: ledgerError } = await supabase
      .from("user_reward_ledger")
      .upsert(
        {
          external_identifier: externalIdentifier,
          transaction_id: transactionId,
          entry_type: "credit",
          amount: effectiveCurrencyAmount,
          currency_identifier: currencyIdentifier,
          provider_payout_usd: effectivePayoutUsd,
          metadata,
        },
        { onConflict: "transaction_id" },
      );

    if (ledgerError) {
      console.error("ayeT conversion ledger write failed", ledgerError);
      return NextResponse.json(
        { ok: false, error: "ledger_storage_failed" },
        { status: 500 },
      );
    }

    const { error: revenueError } = await supabase
      .from("platform_revenue")
      .upsert(
        {
          transaction_id: transactionId,
          revenue_type: "provider_conversion",
          provider_payout_usd: effectivePayoutUsd,
          metadata,
        },
        { onConflict: "transaction_id" },
      );

    if (revenueError) {
      console.error("ayeT conversion revenue write failed", revenueError);
      return NextResponse.json(
        { ok: false, error: "revenue_storage_failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}
