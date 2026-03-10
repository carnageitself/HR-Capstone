// app/api/ai-insights/route.ts
//
// GET  → returns cache instantly. If stale (past today's 4am), kicks off background refresh.
// POST → run analysis synchronously, save cache, return result.
//        Called by the client on first load when no cache exists.
//
// Cache: {project_root}/data/ai-insights-cache.json
// Self-healing: stale cache triggers a background refresh on first visit after 4am.

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadDashboardData, type DashboardData } from "@/lib/loadDashboardData";

export const maxDuration = 60;

const CACHE_PATH = path.join(process.cwd(), "data", "ai-insights-cache.json");

// Bump this whenever buildDataSummary or the data shape changes.
// Any cache written with a different version is automatically discarded.
const CACHE_VERSION = 5;

let refreshInFlight = false;

// ── Types ─────────────────────────────────────────────────────────────────────

interface AiInsight {
  severity: "critical" | "warning" | "positive" | "insight";
  category: string;
  title: string;
  metric: string;
  metricSub: string;
  finding: string;
  action: string;
  tab?: string;
}

interface Cache {
  insights: AiInsight[];
  generatedAt: string;
  version?: number;
}

interface AnthropicError {
  error?: { message?: string };
}

interface AnthropicResponse {
  content: { type: string; text?: string }[];
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

function readCache(): Cache | null {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;
    const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) as Cache;
    // Discard cache if it was written by an older version of this route
    if ((cache.version ?? 0) !== CACHE_VERSION) return null;
    return cache;
  } catch {
    return null;
  }
}

function writeCache(cache: Cache): void {
  try {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify({ ...cache, version: CACHE_VERSION }, null, 2), "utf-8");
  } catch (err) {
    console.error("[ai-insights] Cache write failed:", err);
  }
}

function deleteCache(): void {
  try {
    if (fs.existsSync(CACHE_PATH)) fs.unlinkSync(CACHE_PATH);
  } catch (err) {
    console.error("[ai-insights] Cache delete failed:", err);
  }
}

function isStale(cache: Cache | null): boolean {
  if (!cache) return true;
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(4, 0, 0, 0);
  if (now < cutoff) cutoff.setDate(cutoff.getDate() - 1);
  return new Date(cache.generatedAt) < cutoff;
}

// ── Build data summary from live DashboardData ────────────────────────────────
function buildDataSummary(data: DashboardData): string {
  const { kpi, workforce, intelligence, categories, monthly, departments,
          topRecipients, wordCloud, cultureHealth, sentiment } = data;

  // Top departments
  const topDepts = departments.slice(0, 6).map(d =>
    `${d.name}: ${d.awards} awards, ${d.uniqueRecipients} recipients, avg $${d.avgValue}`
  ).join("; ");

  // Top award categories
  const topCats = categories.slice(0, 6).map(c =>
    `${c.name}: ${c.count} (${c.pct}%)`
  ).join(", ");

  // Top recognized employees
  const topEmp = topRecipients.slice(0, 5).map(e =>
    `${e.name} (${e.dept}, ${e.title}): ${e.awards} awards`
  ).join("; ");

  // Monthly trend (last 6 months)
  const last6 = monthly.slice(-6);
  const trend = last6.map(m => `${m.label}: ${m.awards}`).join(", ");

  // Top message words
  const topWords = (wordCloud ?? []).slice(0, 20)
    .map(w => `${w.word}(${w.count})`).join(", ");

  // Culture health
  const culture = (cultureHealth ?? []).slice(0, 6).map(c =>
    `${c.name}: health=${c.health}%, crossDept=${c.crossDeptPct}%, participation=${c.participation}%`
  ).join("; ");

  // Invisible contributors
  const invisible = intelligence.invisibleContributors.slice(0, 5).map(p =>
    `${p.name} (${p.dept}): gave ${p.given} awards, received 0`
  ).join("; ");

  // Rising stars
  const rising = intelligence.risingStars.slice(0, 3).map(p =>
    `${p.name} (${p.dept}): slope +${p.slope}, ${p.recent} awards in last 3 months`
  ).join("; ");

  // Equity by seniority
  const equity = intelligence.equityData.map(e =>
    `${e.recipient_seniority}: ${e.count} awards, avg $${e.avg_value}, ${e.high_value_pct}% high-value`
  ).join(", ");

  // Sentiment
  const sentLine = sentiment.available
    ? `avg sentiment score ${sentiment.avgCompound.toFixed(2)}, avg message length ${sentiment.avgWordCount} words`
    : "sentiment data not available";

  // Action queue — read persisted statuses to include outstanding items
  let actionQueueSection = "";
  try {
    const STATUS_PATH = path.join(process.cwd(), "data", "action-queue-status.json");
    if (fs.existsSync(STATUS_PATH)) {
      const statusMap = JSON.parse(fs.readFileSync(STATUS_PATH, "utf-8")) as Record<string, { status: string; deferredUntil?: string }>;
      const completed = Object.entries(statusMap).filter(([, v]) => v.status === "completed").map(([id]) => id);
      const deferred  = Object.entries(statusMap).filter(([, v]) => v.status === "deferred").map(([id]) => id);

      // Match ids back to action items
      const completedItems = (data.actionQueue ?? []).filter(a => completed.includes(a.id));
      const deferredItems  = (data.actionQueue ?? []).filter(a => deferred.includes(a.id));

      if (completedItems.length > 0 || deferredItems.length > 0) {
        actionQueueSection = `
ACTION QUEUE STATUS (from yesterday):
- Completed by HR (${completedItems.length}): ${completedItems.slice(0, 5).map(a => a.title).join("; ") || "none"}
- Deferred to today (${deferredItems.length}): ${deferredItems.slice(0, 5).map(a => a.title).join("; ") || "none"}
- Still outstanding critical items: ${(data.actionQueue ?? []).filter(a => a.urgency === "critical" && !completed.includes(a.id)).length}`;
      }
    }
  } catch { /* non-fatal */ }

  // Overall action queue counts
  const criticalActions = (data.actionQueue ?? []).filter(a => a.urgency === "critical").length;
  const warningActions  = (data.actionQueue ?? []).filter(a => a.urgency === "warning").length;

  return `HR RECOGNITION DATA SNAPSHOT — ${new Date().toDateString()}

WORKFORCE OVERVIEW:
- Total people in system: ${workforce.totalPeople}
- Total awards issued: ${kpi.totalAwards}
- Total monetary value: $${kpi.totalMonetary.toLocaleString()}
- Average award value: $${kpi.avgAwardValue}
- Unique recipients: ${kpi.uniqueRecipients} | Unique nominators: ${kpi.uniqueNominators}
- Recognition coverage: ${workforce.coveragePct}% (${workforce.neverRecognized} employees never recognized)
- Participation rate: ${workforce.participationPct}% (${workforce.neverGiven} employees never gave an award)
- Peer recognition rate: ${kpi.peerRecognitionPct}%
- Cross-department recognition: ${kpi.crossDeptPct}%
- High performers (5+ awards received): ${kpi.highPerformers}
- Culture carriers (5+ awards given): ${kpi.cultureCarriers}
- At-risk employees (>120 days no recognition): ${kpi.atRiskCount}
- IC ratio: ${kpi.icRatio}% | Exec ratio: ${kpi.execRatio}%
- Month-over-month trend: ${kpi.momTrend > 0 ? "+" : ""}${kpi.momTrend}%
- Avg monthly awards: ${kpi.avgMonthlyAwards}
- Open action items: ${criticalActions} critical, ${warningActions} warnings
${actionQueueSection}

TOP DEPARTMENTS:
${topDepts}

AWARD CATEGORIES:
${topCats}

TOP RECOGNIZED EMPLOYEES:
${topEmp}

MONTHLY TREND (last 6 months):
${trend}

SENIORITY EQUITY:
${equity}

INVISIBLE CONTRIBUTORS (gave awards, received none):
${invisible || "None identified"}

RISING STARS:
${rising || "None identified"}

CULTURE HEALTH BY DEPARTMENT:
${culture}

MESSAGE SENTIMENT:
${sentLine}

TOP WORDS IN AWARD MESSAGES:
${topWords}`;
}

// ── Call Claude ───────────────────────────────────────────────────────────────
async function runClaude(dataSummary: string): Promise<AiInsight[]> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("CLAUDE_API_KEY is not set");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are an expert HR analytics consultant analyzing employee recognition data.
Surface the most important, actionable insights for HR leaders and executives.
Respond ONLY with a valid JSON array — no markdown, no backticks, no preamble, nothing else.
Each element must match exactly this shape:
{
  "severity": "critical" | "warning" | "positive" | "insight",
  "category": string,
  "title": string,
  "metric": string,
  "metricSub": string,
  "finding": string,
  "action": string,
  "tab": string
}

FIELD RULES:
severity "critical"  = urgent retention or culture risk requiring immediate action this week
severity "warning"   = monitor closely, issue forming that needs attention within 30 days
severity "positive"  = celebrate and share with leadership
severity "insight"   = strategic opportunity or observation worth acting on
metric: a short concrete stat directly from the data — keep it under 12 characters (e.g. "23%", "$450", "12 people", "88% & 92%") — never use long sentences or "?" or "Unknown"
metricSub: 2–4 words labeling the metric (e.g. "recognition gap", "avg award value")
title: 1 plain-language executive sentence — specific, not generic
finding: 2–3 sentences using actual numbers from the data, explain the business impact
action: 1–2 concrete sentences — what HR should do THIS WEEK

TAB ROUTING — "tab" must be exactly one of these strings based on the insight topic:
"actions"       → invisible contributors, unrecognized employees, retention risks, at-risk employees, long-tenured unrecognized, inactive managers — any insight where someone specific needs immediate attention
"employees"     → individual employee engagement patterns, never-recognized employees, employee status breakdown, stale high performers, engagement scores
"departments"   → department-level coverage gaps, department health scores, low-participation departments, department comparison
"recognition"   → award category distribution, monthly trends, MoM trend, award volume patterns, recognition frequency, sentiment analysis, message language
"intelligence"  → invisible contributors analysis, rising stars, declining recognition, cross-department recognition flow, equity by seniority, skill gaps, org connectors, value equity audit — use this for analytical deep-dives
"manager"       → manager effectiveness, Team Lens, managers who never nominate, manager reach across departments, manager-driven vs peer-driven recognition ratio
"evaluations"   → taxonomy pipeline, award quality assessment, recognition program evaluation metrics

ROUTING EXAMPLES:
- "12 employees gave 3+ awards but received none" → "actions" (needs immediate action) OR "intelligence" (for analysis)
- "Legal department has 78% coverage" → "departments"
- "Recognition dropped 15% last quarter" → "recognition"
- "Senior ICs receive 40% less award value than Directors" → "intelligence"
- "5 managers have never nominated anyone" → "manager"
- "Peer recognition is only 23%" → "recognition"
- "Rising stars in Engineering trending up" → "intelligence"
- "61 employees never recognized" → "employees" if general, "actions" if urgent

Generate exactly 6 insights. Use only numbers from the data. Route each insight to the tab where HR will find the most relevant data to act on it.`,
      messages: [{
        role: "user",
        content: `Analyze this HR recognition data and return exactly 6 JSON insights:\n\n${dataSummary}`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as AnthropicError;
    throw new Error(err.error?.message ?? `Anthropic API error ${response.status}`);
  }

  const result = await response.json() as AnthropicResponse;
  const text = result.content
    .map(b => (b.type === "text" ? (b.text ?? "") : ""))
    .join("");

  return JSON.parse(text.replace(/```json|```/g, "").trim()) as AiInsight[];
}

// ── Clear completed action items after AI has ingested them ──────────────────
function clearCompletedActions(): void {
  try {
    const statusPath = path.join(process.cwd(), "data", "action-queue-status.json");
    if (!fs.existsSync(statusPath)) return;
    const map = JSON.parse(fs.readFileSync(statusPath, "utf-8")) as Record<string, { status: string }>;
    const cleaned: typeof map = {};
    for (const [id, entry] of Object.entries(map)) {
      if (entry.status !== "completed") cleaned[id] = entry;
    }
    fs.writeFileSync(statusPath, JSON.stringify(cleaned, null, 2), "utf-8");
    console.log("[ai-insights] Cleared completed action items.");
  } catch (err) {
    console.error("[ai-insights] Failed to clear completed actions:", err);
  }
}

// ── Background refresh (fire-and-forget) ─────────────────────────────────────
function triggerBackgroundRefresh(): void {
  if (refreshInFlight) return;
  refreshInFlight = true;
  console.log("[ai-insights] Background refresh started.");

  void (async () => {
    try {
      const data     = await loadDashboardData();
      const summary  = buildDataSummary(data);
      const insights = await runClaude(summary);
      writeCache({ insights, generatedAt: new Date().toISOString() });
      // Clear completed action items now that AI has read and reflected them
      clearCompletedActions();
      console.log(`[ai-insights] Refresh complete — ${insights.length} insights saved.`);
    } catch (err) {
      console.error("[ai-insights] Refresh failed:", err);
    } finally {
      refreshInFlight = false;
    }
  })();
}

// ── GET — serve cache instantly, refresh in background if stale ───────────────
export async function GET() {
  const cache = readCache();
  if (isStale(cache)) triggerBackgroundRefresh();

  if (!cache) {
    return NextResponse.json({ insights: [], generatedAt: null, refreshing: true });
  }

  return NextResponse.json({ ...cache, stale: isStale(cache), refreshing: refreshInFlight });
}

// ── DELETE — clear cache (called when client detects bad/stale data) ──────────
export async function DELETE() {
  deleteCache();
  refreshInFlight = false;
  return NextResponse.json({ ok: true });
}
export async function POST(_req: NextRequest) {
  try {
    const data     = await loadDashboardData();
    const summary  = buildDataSummary(data);
    const insights = await runClaude(summary);
    const cache: Cache = { insights, generatedAt: new Date().toISOString() };
    writeCache(cache);
    clearCompletedActions();
    refreshInFlight = false;
    return NextResponse.json(cache);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}