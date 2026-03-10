// app/api/automation/sentiment-check/route.ts
//
// Weekly check: compares row count in awards_enriched vs awards_enriched_with_sentiment.
// If the gap is > 50 new awards, logs an alert for the admin to re-run sentiment_pipeline.py.
// Future: could auto-trigger the Python script via a webhook.

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";

export const maxDuration = 30;

const CHECK_PATH = path.join(process.cwd(), "data", "sentiment-check.json");

interface SentimentCheck {
  lastChecked: string;
  awardsTotal: number;
  sentimentTotal: number;
  gap: number;
  needsUpdate: boolean;
}

function writeCheck(check: SentimentCheck): void {
  try {
    const dir = path.dirname(CHECK_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CHECK_PATH, JSON.stringify(check, null, 2));
  } catch (err) { console.error("[sentiment-check] Write failed:", err); }
}

export async function GET() {
  try {
    // Count rows in both tables
    const [{ count: awardsCount }, { count: sentimentCount }] = await Promise.all([
      supabase.from("awards_enriched").select("*", { count: "exact", head: true }),
      supabase.from("awards_enriched_with_sentiment").select("*", { count: "exact", head: true }),
    ]);

    const total    = awardsCount ?? 0;
    const scored   = sentimentCount ?? 0;
    const gap      = total - scored;
    const needsUpdate = gap > 50;

    const check: SentimentCheck = {
      lastChecked: new Date().toISOString(),
      awardsTotal: total,
      sentimentTotal: scored,
      gap,
      needsUpdate,
    };

    writeCheck(check);

    if (needsUpdate) {
      console.warn(`[sentiment-check] ${gap} awards not yet sentiment-scored. Run sentiment_pipeline.py`);
    } else {
      console.log(`[sentiment-check] Sentiment data up to date (gap: ${gap})`);
    }

    return NextResponse.json(check);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}