import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function canonicalize(params: URLSearchParams) {
  const entries = [...params.entries()]
    .filter(([key]) => key !== "security_hash")
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  return new URLSearchParams(entries).toString();
}

function verifySignature(raw: string, signature: string | null, secret: string | undefined) {
  if (!signature || !secret) return false;
  const hex = signature.trim().replace(/^sha256=/i, "");
  if (!/^[0-9a-f]{64}$/i.test(hex)) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  const supplied = Buffer.from(hex, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function amount(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function handle(request: NextRequest) {
  // ayeT documents the HMAC over all callback request parameters. Include
  // query-string and form-body parameters so GET and POST callbacks are treated consistently.
  const params = new URLSearchParams(request.nextUrl.searchParams);
  if (request.method === "POST") {
    const body = await request.text();
    const bodyParams = new URLSearchParams(body);
    for (const [key, value] of bodyParams.entries()) params.append(key, value);
  }

  const callbackType = (params.get("callback_type") ?? "").trim().toLowerCase();
  if (["optional", "installation", "iap", "iaa"].includes(callbackType)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const secret = process.env.AYET_API_KEY;
  const signature = request.headers.get("x-ayetstudios-security-hash") ?? params.get("security_hash");
  if (process.env.NODE_ENV === "production" || process.env.AYET_CALLBACK_HMAC_REQUIRED === "true") {
    if (!verifySignature(canonicalize(params), signature, secret)) {
      return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
    }
  }

  // ayeT sandbox callbacks are for testing only and must never touch the real wallet.
  if (params.get("is_sandbox") === "1") {
    return NextResponse.json({ ok: true, ignored: true, reason: "sandbox_callback" });
  }

  const transactionId = params.get("transaction_id")?.trim();
  const externalIdentifier = params.get("external_identifier")?.trim();
  if (!transactionId || !externalIdentifier) {
    return NextResponse.json({ ok: false, error: "missing_transaction_or_user" }, { status: 400 });
  }
  const payoutUsd = amount(params, "payout_usd");
  const currencyAmount = amount(params, "currency_amount");
  if (payoutUsd == null || currencyAmount == null) {
    return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }
  const statusHint = (params.get("status") ?? params.get("event") ?? "").trim().toLowerCase();
  const isChargeback = ["chargeback", "reversal"].includes(callbackType) ||
    ["chargeback", "reversal"].includes(statusHint) ||
    params.get("is_chargeback") === "1" || payoutUsd < 0 || currencyAmount < 0;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("ayet_apply_callback", {
    p_transaction_id: transactionId,
    p_external_identifier: externalIdentifier,
    p_callback_type: callbackType || statusHint || "conversion",
    p_is_chargeback: isChargeback,
    p_payout_usd: payoutUsd,
    p_currency_amount: currencyAmount,
    p_currency_identifier: params.get("currency_identifier"),
    p_offer_id: params.get("offer_id"),
    p_custom_1: params.get("custom_1"),
    p_payload: Object.fromEntries(params.entries()),
  });
  if (error) {
    console.error("ayeT callback processing failed", { code: error.code, message: error.message });
    return NextResponse.json({ ok: false, error: "callback_processing_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...(data && typeof data === "object" ? data as Record<string, unknown> : {}) });
}

export async function GET(request: NextRequest) { return handle(request); }
export async function POST(request: NextRequest) { return handle(request); }
