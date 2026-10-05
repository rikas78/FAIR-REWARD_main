import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { count, error } = await supabase
      .from("wallets")
      .select("user_id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          provider: "supabase",
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      provider: "supabase",
      table: "wallets",
      rows: count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        provider: "supabase",
        error:
          error instanceof Error ? error.message : "Unknown Supabase error",
      },
      { status: 500 },
    );
  }
}
