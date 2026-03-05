import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { count: rawCount, error: rawErr } = await supabase
      .from("awards")
      .select("*", { count: "exact", head: true });

    const { count: enrichedCount, error: enrichedErr } = await supabase
      .from("awards_enriched")
      .select("*", { count: "exact", head: true });

    if (rawErr || enrichedErr) {
      return NextResponse.json(
        { status: "error", rawErr, enrichedErr },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "connected",
      tables: {
        awards: { rows: rawCount },
        awards_enriched: { rows: enrichedCount },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: String(err) },
      { status: 500 }
    );
  }
}