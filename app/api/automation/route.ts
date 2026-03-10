// app/api/automation/route.ts
//
// Master automation orchestrator — called on every dashboard page load.
// Checks all automation triggers and fires any that are due.
// All checks are non-blocking (fire-and-forget), page load is instant.
//
// Automations managed here:
//   1. AI insights refresh     — stale after 4am daily
//   2. Action queue refresh    — stale after 4am daily
//   3. Weekly email digest     — due every Monday 7am
//   4. Sentiment drift check   — weekly, checks if new awards need scoring
//   5. Rising star alerts      — checks for 2+ consecutive high-slope employees
//
// GET → returns status of all automations + triggers any due ones

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const maxDuration = 10; // orchestrator is fast — just checks & triggers

const DATA_DIR = path.join(process.cwd(), "data");

// ── Generic stale check ───────────────────────────────────────────────────────
function readJson<T>(filename: string): T | null {
  try {
    const p = path.join(DATA_DIR, filename);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch { return null; }
}

function isStaleAfter4am(generatedAt: string | null | undefined): boolean {
  if (!generatedAt) return true;
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(4, 0, 0, 0);
  if (now < cutoff) cutoff.setDate(cutoff.getDate() - 1);
  return new Date(generatedAt) < cutoff;
}

function isMonday7am(): boolean {
  const now = new Date();
  return now.getDay() === 1 && now.getHours() >= 7;
}

// ── Fire a background trigger (non-blocking) ─────────────────────────────────
function fireBackground(url: string, method: "GET" | "POST" = "GET"): void {
  void fetch(url, { method }).catch(err =>
    console.error(`[orchestrator] Failed to trigger ${url}:`, err)
  );
}

// ── GET — check all automations, trigger stale ones ──────────────────────────
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const triggered: string[] = [];
  const upToDate: string[] = [];

  // 1. AI Insights
  const aiCache = readJson<{ generatedAt?: string }>("ai-insights-cache.json");
  if (isStaleAfter4am(aiCache?.generatedAt)) {
    fireBackground(`${origin}/api/ai-insights`);
    triggered.push("ai-insights");
  } else { upToDate.push("ai-insights"); }

  // 2. Action Queue
  const queueCache = readJson<{ generatedAt?: string }>("action-queue-cache.json");
  if (isStaleAfter4am(queueCache?.generatedAt)) {
    fireBackground(`${origin}/api/action-queue/refresh`);
    triggered.push("action-queue");
  } else { upToDate.push("action-queue"); }

  // 3. Weekly Email (Monday 7am+, not already sent this week)
  const emailCache = readJson<{ weekOf?: string }>("last-email-sent.json");
  const thisMonday = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  })();
  if (isMonday7am() && emailCache?.weekOf !== thisMonday) {
    fireBackground(`${origin}/api/email/weekly-digest`);
    triggered.push("weekly-email");
  } else { upToDate.push("weekly-email"); }

  // 4. Sentiment drift check (weekly — check if awards_enriched has new rows not yet scored)
  const sentimentCheck = readJson<{ lastChecked?: string; rowsScored?: number }>("sentiment-check.json");
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  if (!sentimentCheck?.lastChecked || sentimentCheck.lastChecked < weekAgo) {
    fireBackground(`${origin}/api/automation/sentiment-check`);
    triggered.push("sentiment-check");
  } else { upToDate.push("sentiment-check"); }

  // 5. Rising star alerts (daily, after insights refresh)
  const risingAlerts = readJson<{ lastChecked?: string }>("rising-star-alerts.json");
  if (isStaleAfter4am(risingAlerts?.lastChecked)) {
    fireBackground(`${origin}/api/automation/rising-star-alerts`);
    triggered.push("rising-star-alerts");
  } else { upToDate.push("rising-star-alerts"); }

  return NextResponse.json({
    triggered,
    upToDate,
    timestamp: new Date().toISOString(),
  });
}