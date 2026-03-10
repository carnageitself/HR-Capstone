// app/api/email/weekly-digest/route.ts
//
// Generates and sends a weekly HR recognition digest email.
// Called automatically every Monday at 7:00 AM via the self-healing trigger,
// or manually via POST.
//
// Uses Resend (resend.com) — add RESEND_API_KEY and HR_EMAIL_RECIPIENTS to .env
//
// .env variables needed:
//   RESEND_API_KEY=re_...
//   HR_EMAIL_RECIPIENTS=hr@company.com,manager@company.com
//   HR_EMAIL_FROM=analytics@yourapp.com   (optional, defaults below)

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadDashboardData } from "@/lib/loadDashboardData";

export const maxDuration = 60;

const EMAIL_CACHE_PATH = path.join(process.cwd(), "data", "last-email-sent.json");

interface EmailCache {
  sentAt: string;
  weekOf: string; // ISO week start (Monday)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getThisMonday(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function readEmailCache(): EmailCache | null {
  try {
    if (!fs.existsSync(EMAIL_CACHE_PATH)) return null;
    return JSON.parse(fs.readFileSync(EMAIL_CACHE_PATH, "utf-8")) as EmailCache;
  } catch { return null; }
}

function writeEmailCache(): void {
  try {
    const dir = path.dirname(EMAIL_CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const cache: EmailCache = {
      sentAt: new Date().toISOString(),
      weekOf: getThisMonday().toISOString(),
    };
    fs.writeFileSync(EMAIL_CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch (err) { console.error("[email] Cache write failed:", err); }
}

function alreadySentThisWeek(): boolean {
  const cache = readEmailCache();
  if (!cache) return false;
  const thisMonday = getThisMonday().toISOString();
  return cache.weekOf === thisMonday;
}

// ── Build HTML email ──────────────────────────────────────────────────────────
function buildEmailHTML(data: Awaited<ReturnType<typeof loadDashboardData>>): string {
  const { kpi, workforce, intelligence, departments, cultureHealth } = data;

  const weekOf = getThisMonday().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // Top 3 urgent actions
  const urgentActions = (data.actionQueue ?? [])
    .filter(a => a.urgency === "critical")
    .slice(0, 3);

  // New invisible contributors this week (all of them for now)
  const invisible = intelligence.invisibleContributors.slice(0, 5);

  // Bottom 3 departments by coverage
  const lowCoverageDepts = [...(cultureHealth ?? [])]
    .sort((a, b) => a.health - b.health)
    .slice(0, 3);

  // Rising stars
  const rising = intelligence.risingStars.slice(0, 3);

  const coverageColor = workforce.coveragePct >= 88 ? "#27AE60" : workforce.coveragePct >= 75 ? "#F39C12" : "#E74C3C";
  const participationColor = workforce.participationPct >= 80 ? "#27AE60" : "#F39C12";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Weekly Recognition Digest</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #F8F9FA; color: #0B3954; }
    .wrapper { max-width: 620px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #fff; border-radius: 12px; border: 1px solid #E9ECEF; margin-bottom: 16px; overflow: hidden; }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #F3F4F6; }
    .card-body { padding: 16px 20px; }
    .eyebrow { font-family: monospace; font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: #9CA3AF; margin-bottom: 4px; }
    .title { font-size: 14px; font-weight: 700; color: #0B3954; }
    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; padding: 16px 20px; }
    .kpi { text-align: center; }
    .kpi-value { font-size: 24px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .kpi-label { font-family: monospace; font-size: 8px; text-transform: uppercase; letter-spacing: .1em; color: #9CA3AF; }
    .action-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
    .action-row:last-child { border-bottom: none; }
    .action-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
    .action-title { font-size: 12px; font-weight: 600; color: #0B3954; margin-bottom: 2px; }
    .action-meta { font-size: 11px; color: #6C757D; }
    .pill { display: inline-block; font-family: monospace; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .dept-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F3F4F6; }
    .dept-row:last-child { border-bottom: none; }
    .footer { text-align: center; font-family: monospace; font-size: 10px; color: #ADB5BD; padding: 16px 0; }
    h1 { font-size: 22px; font-weight: 800; color: #0B3954; }
    .header-bar { background: linear-gradient(135deg, #0B3954, #1A5276); padding: 28px 28px 24px; border-radius: 12px; margin-bottom: 20px; }
    .header-bar h1 { color: #fff; margin-bottom: 4px; }
    .header-bar .sub { font-family: monospace; font-size: 10px; color: rgba(255,255,255,.55); letter-spacing: .1em; text-transform: uppercase; }
    .badge-critical { background: #FEF2F2; color: #DC2626; }
    .badge-warning  { background: #FFFBEB; color: #D97706; }
    .badge-positive { background: #F0FDF4; color: #059669; }
    .trend-up   { color: #27AE60; }
    .trend-down { color: #E74C3C; }
  </style>
</head>
<body>
<div class="wrapper">

  <!-- Header -->
  <div class="header-bar">
    <div class="sub">Weekly Digest · Week of ${weekOf}</div>
    <h1>Recognition Intelligence</h1>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
      <span class="pill" style="background:rgba(255,255,255,.15);color:#fff;">${kpi.totalAwards} total awards</span>
      <span class="pill" style="background:rgba(255,255,255,.15);color:#fff;">$${kpi.totalMonetary.toLocaleString()} distributed</span>
      <span class="pill" style="background:rgba(255,255,255,.15);color:#fff;">${workforce.totalPeople} employees</span>
    </div>
  </div>

  <!-- KPI Snapshot -->
  <div class="card">
    <div class="card-header">
      <div class="eyebrow">Workforce Health</div>
      <div class="title">Recognition Coverage Snapshot</div>
    </div>
    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-value" style="color:${coverageColor}">${workforce.coveragePct}%</div>
        <div class="kpi-label">Coverage</div>
      </div>
      <div class="kpi">
        <div class="kpi-value" style="color:${participationColor}">${workforce.participationPct}%</div>
        <div class="kpi-label">Participation</div>
      </div>
      <div class="kpi">
        <div class="kpi-value" style="color:${kpi.momTrend >= 0 ? "#27AE60" : "#E74C3C"}">${kpi.momTrend > 0 ? "+" : ""}${kpi.momTrend}%</div>
        <div class="kpi-label">MoM Trend</div>
      </div>
      <div class="kpi">
        <div class="kpi-value" style="color:#E74C3C">${workforce.neverRecognized}</div>
        <div class="kpi-label">Never Recognized</div>
      </div>
      <div class="kpi">
        <div class="kpi-value" style="color:#F39C12">${kpi.atRiskCount}</div>
        <div class="kpi-label">At Risk (&gt;120d)</div>
      </div>
      <div class="kpi">
        <div class="kpi-value" style="color:#00A98F">${kpi.cultureCarriers}</div>
        <div class="kpi-label">Culture Carriers</div>
      </div>
    </div>
  </div>

  <!-- Urgent Actions -->
  ${urgentActions.length > 0 ? `
  <div class="card">
    <div class="card-header" style="background:#FFF8F8;">
      <div class="eyebrow" style="color:#DC2626;">🔴 Requires Immediate Action</div>
      <div class="title">${urgentActions.length} urgent item${urgentActions.length > 1 ? "s" : ""} need your attention this week</div>
    </div>
    <div class="card-body">
      ${urgentActions.map(a => `
      <div class="action-row">
        <div class="action-dot" style="background:#DC2626;"></div>
        <div>
          <div class="action-title">${a.title}</div>
          <div class="action-meta">${a.detail} · <em>${a.action}</em></div>
        </div>
      </div>`).join("")}
    </div>
  </div>` : ""}

  <!-- Invisible Contributors -->
  ${invisible.length > 0 ? `
  <div class="card">
    <div class="card-header">
      <div class="eyebrow">Retention Risk</div>
      <div class="title">👁️ ${invisible.length} Invisible Contributors Identified</div>
    </div>
    <div class="card-body">
      <p style="font-size:12px;color:#6C757D;margin-bottom:12px;">These employees are actively nominating others but have never been recognized themselves — high flight risk.</p>
      ${invisible.map(p => `
      <div class="action-row">
        <div class="action-dot" style="background:#F96400;"></div>
        <div>
          <div class="action-title">${p.name}</div>
          <div class="action-meta">${p.seniority} · ${p.dept} · gave ${p.given} awards, received 0</div>
        </div>
      </div>`).join("")}
    </div>
  </div>` : ""}

  <!-- Department Health -->
  ${lowCoverageDepts.length > 0 ? `
  <div class="card">
    <div class="card-header">
      <div class="eyebrow">Department Health</div>
      <div class="title">📊 Departments Needing Attention</div>
    </div>
    <div class="card-body">
      ${lowCoverageDepts.map(d => {
        const color = d.health >= 80 ? "#27AE60" : d.health >= 60 ? "#F39C12" : "#E74C3C";
        return `
      <div class="dept-row">
        <div>
          <div style="font-size:13px;font-weight:600;color:#0B3954;">${d.name}</div>
          <div style="font-size:11px;color:#6C757D;">${d.uniqueNominators} active nominators · ${d.crossDeptPct}% cross-dept</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px;font-weight:800;color:${color};">${d.health}</div>
          <div style="font-family:monospace;font-size:9px;color:#9CA3AF;">health score</div>
        </div>
      </div>`;
      }).join("")}
    </div>
  </div>` : ""}

  <!-- Rising Stars -->
  ${rising.length > 0 ? `
  <div class="card">
    <div class="card-header">
      <div class="eyebrow">Talent Pipeline</div>
      <div class="title">📈 Rising Stars — Recognition Accelerating</div>
    </div>
    <div class="card-body">
      ${rising.map(p => `
      <div class="action-row">
        <div class="action-dot" style="background:#27AE60;"></div>
        <div>
          <div class="action-title">${p.name}</div>
          <div class="action-meta">${p.seniority} · ${p.dept} · ${p.recent} awards in last 3 months · slope +${p.slope}</div>
        </div>
      </div>`).join("")}
    </div>
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    <p>HR Recognition Analytics · Auto-generated weekly digest</p>
    <p style="margin-top:4px;">View full dashboard for complete data and actions</p>
  </div>

</div>
</body>
</html>`;
}

// ── Send via Resend ───────────────────────────────────────────────────────────
async function sendEmail(html: string, subject: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set in environment variables");

  const recipients = (process.env.HR_EMAIL_RECIPIENTS ?? "")
    .split(",")
    .map(e => e.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("HR_EMAIL_RECIPIENTS not set — add comma-separated emails to .env");
  }

  const from = process.env.HR_EMAIL_FROM ?? "HR Analytics <analytics@updates.yourapp.com>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Resend API error ${response.status}`);
  }
}

// ── GET — check if email is due, send if so (self-healing Monday trigger) ─────
export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "true";

  if (!force && alreadySentThisWeek()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Already sent this week" });
  }

  const today = new Date();
  const isMonday = today.getDay() === 1;

  // Only auto-send on Mondays unless forced
  if (!force && !isMonday) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Not Monday — use ?force=true to send now" });
  }

  try {
    const data = await loadDashboardData();
    const html = buildEmailHTML(data);
    const weekOf = getThisMonday().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const subject = `Weekly Recognition Digest — Week of ${weekOf}`;

    await sendEmail(html, subject);
    writeEmailCache();

    const recipients = (process.env.HR_EMAIL_RECIPIENTS ?? "").split(",").filter(Boolean);
    console.log(`[email] Weekly digest sent to ${recipients.length} recipient(s)`);

    return NextResponse.json({ ok: true, sentAt: new Date().toISOString(), recipients: recipients.length });
  } catch (err) {
    console.error("[email] Failed to send weekly digest:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── POST — force send immediately (for testing / manual trigger) ──────────────
export async function POST(_req: NextRequest) {
  try {
    const data = await loadDashboardData();
    const html = buildEmailHTML(data);
    const weekOf = getThisMonday().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const subject = `Weekly Recognition Digest — Week of ${weekOf}`;

    await sendEmail(html, subject);
    writeEmailCache();

    return NextResponse.json({ ok: true, sentAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}