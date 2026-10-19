import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const externalIdentifier = request.cookies.get("fr_ext_id")?.value;

  if (!externalIdentifier || !/^fr_[0-9a-f-]{36}$/.test(externalIdentifier)) {
    return NextResponse.json({ activities: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ayet_conversions")
    .select("transaction_id,event_type,currency_amount,currency_identifier,raw_payload,created_at")
    .eq("external_identifier", externalIdentifier)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("FairReward activity history query failed", error);
    return NextResponse.json({ error: "activity_history_unavailable" }, { status: 500 });
  }

  const activities = (data ?? []).map((row) => {
    const payload = row.raw_payload && typeof row.raw_payload === "object"
      ? row.raw_payload as Record<string, unknown>
      : {};
    const event = String(row.event_type ?? "conversion");
    const title = String(payload.offer_name ?? payload.offer_title ?? payload.offer_id ?? "Offerta ayeT");
    const isReversal = /chargeback|reversal/i.test(event) || Number(row.currency_amount ?? 0) < 0;

    return {
      transactionId: String(row.transaction_id),
      title,
      status: isReversal ? "Storno / rettifica" : "Conversione ricevuta · in verifica contabile",
      amount: Number(row.currency_amount ?? 0),
      currency: String(row.currency_identifier ?? ""),
      createdAt: row.created_at ? String(row.created_at) : null,
    };
  });

  return NextResponse.json({ activities }, { headers: { "Cache-Control": "no-store" } });
}
