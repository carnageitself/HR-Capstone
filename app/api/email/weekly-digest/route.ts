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
  const { kpi, workforce, intelligence, cultureHealth } = data;

  const weekOf    = getThisMonday().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const sentDate  = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const urgentActions   = (data.actionQueue ?? []).filter(a => a.urgency === "critical").slice(0, 5);
  const invisible       = intelligence.invisibleContributors.slice(0, 5);
  const lowDepts        = [...(cultureHealth ?? [])].sort((a, b) => a.health - b.health).slice(0, 3);
  const rising          = intelligence.risingStars.slice(0, 3);

  const trendSign  = kpi.momTrend > 0 ? "+" : "";
  const trendLabel = kpi.momTrend > 0 ? "up" : kpi.momTrend < 0 ? "down" : "flat";

  // Inline helper: status label without color
  const coverageStatus = workforce.coveragePct >= 88 ? "On target" : workforce.coveragePct >= 75 ? "Below target" : "Critical";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recognition Analytics — Weekly Digest</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #F5F5F5;
      color: #111;
      -webkit-font-smoothing: antialiased;
    }
    .outer { max-width: 640px; margin: 32px auto; padding: 0 16px 48px; }

    /* Header */
    .header { padding: 36px 0 28px; border-bottom: 2px solid #111; margin-bottom: 32px; }
    .header-label { font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #888; margin-bottom: 10px; }
    .header-title { font-size: 26px; font-weight: 700; letter-spacing: -.5px; color: #111; margin-bottom: 6px; }
    .header-sub { font-size: 13px; color: #555; }

    /* Section */
    .section { margin-bottom: 36px; }
    .section-label {
      font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
      color: #888; margin-bottom: 14px; padding-bottom: 8px;
      border-bottom: 1px solid #E0E0E0;
    }

    /* KPI row */
    .kpi-row { display: table; width: 100%; border-collapse: collapse; }
    .kpi-cell {
      display: table-cell; width: 33.33%;
      padding: 16px 0; vertical-align: top;
      border-right: 1px solid #E0E0E0;
    }
    .kpi-cell:last-child { border-right: none; padding-left: 20px; }
    .kpi-cell:first-child { padding-right: 20px; }
    .kpi-cell:nth-child(2) { padding: 16px 20px; }
    .kpi-value { font-size: 28px; font-weight: 700; letter-spacing: -1px; color: #111; line-height: 1; margin-bottom: 5px; }
    .kpi-name  { font-size: 11px; color: #777; }
    .kpi-note  { font-size: 10px; color: #999; margin-top: 2px; }

    /* Table */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th {
      text-align: left; padding: 8px 0; font-size: 9px;
      letter-spacing: .12em; text-transform: uppercase;
      color: #888; border-bottom: 1px solid #E0E0E0;
      font-weight: 500;
    }
    td { padding: 11px 0; border-bottom: 1px solid #F0F0F0; color: #333; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .td-name  { font-weight: 600; color: #111; }
    .td-meta  { color: #888; font-size: 11px; margin-top: 2px; }
    .td-right { text-align: right; color: #555; }
    .td-action { font-size: 11px; color: #555; padding-top: 3px; }

    /* Status indicator — text only, no color */
    .status { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #555; }

    /* Divider */
    .divider { border: none; border-top: 1px solid #E0E0E0; margin: 28px 0; }

    /* Footer */
    .footer { padding-top: 24px; border-top: 1px solid #E0E0E0; }
    .footer p { font-size: 11px; color: #AAA; line-height: 1.6; }

    /* Note box */
    .note { background: #FAFAFA; border-left: 3px solid #DDD; padding: 12px 16px; margin-bottom: 20px; }
    .note p { font-size: 12px; color: #555; line-height: 1.6; }
  </style>
</head>
<body>
<div class="outer">

  <!-- Header -->
  <div class="header">
    <div class="header-label">Recognition Analytics &nbsp;·&nbsp; Weekly Digest</div>
    <div class="header-title">Workforce Recognition Report</div>
    <div class="header-sub">Week of ${weekOf} &nbsp;·&nbsp; Prepared ${sentDate}</div>
  </div>

  <!-- 1. Headline KPIs -->
  <div class="section">
    <div class="section-label">Program Overview</div>
    <div class="kpi-row">
      <div class="kpi-cell">
        <div class="kpi-value">${workforce.coveragePct}%</div>
        <div class="kpi-name">Recognition Coverage</div>
        <div class="kpi-note">${coverageStatus} &nbsp;·&nbsp; target 88%</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-value">${workforce.participationPct}%</div>
        <div class="kpi-name">Participation Rate</div>
        <div class="kpi-note">Employees giving awards</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-value">${trendSign}${kpi.momTrend}%</div>
        <div class="kpi-name">Month-over-Month</div>
        <div class="kpi-note">Award volume ${trendLabel}</div>
      </div>
    </div>

    <hr class="divider" />

    <div class="kpi-row">
      <div class="kpi-cell">
        <div class="kpi-value">${kpi.totalAwards.toLocaleString()}</div>
        <div class="kpi-name">Total Awards YTD</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-value">$${kpi.avgAwardValue}</div>
        <div class="kpi-name">Average Award Value</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-value">${workforce.neverRecognized}</div>
        <div class="kpi-name">Never Recognized</div>
        <div class="kpi-note">${Math.round(workforce.neverRecognized / workforce.totalPeople * 100)}% of workforce</div>
      </div>
    </div>
  </div>

  <!-- 2. Priority Actions -->
  ${urgentActions.length > 0 ? `
  <div class="section">
    <div class="section-label">Priority Actions &nbsp;·&nbsp; ${urgentActions.length} item${urgentActions.length > 1 ? "s" : ""} require immediate attention</div>
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <colgroup>
        <col style="width:55%" />
        <col style="width:22%" />
        <col style="width:23%" />
      </colgroup>
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 12px 8px 0;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Item</th>
          <th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;background:#FAFAFA;">Department</th>
          <th style="text-align:left;padding:8px 0 8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;background:#FAFAFA;">Owner</th>
        </tr>
      </thead>
      <tbody>
        ${urgentActions.map(a => `
        <tr>
          <td style="padding:12px 12px 12px 0;border-bottom:1px solid #F0F0F0;vertical-align:top;">
            <div style="font-weight:600;color:#111;font-size:12px;line-height:1.4;">${a.title}</div>
            <div style="font-size:11px;color:#555;margin-top:4px;line-height:1.5;">${a.action}</div>
          </td>
          <td style="padding:12px;border-bottom:1px solid #F0F0F0;vertical-align:top;background:#FAFAFA;">
            <div style="font-size:12px;color:#333;font-weight:500;">${a.dept}</div>
          </td>
          <td style="padding:12px 0 12px 12px;border-bottom:1px solid #F0F0F0;vertical-align:top;background:#FAFAFA;">
            <div style="font-size:12px;color:#333;font-weight:500;">${a.owner}</div>
          </td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <!-- 3. Invisible Contributors -->
  ${invisible.length > 0 ? `
  <div class="section">
    <div class="section-label">Retention Risk &nbsp;·&nbsp; Employees giving recognition but never receiving it</div>
    <div class="note">
      <p>The ${invisible.length} employee${invisible.length > 1 ? "s" : ""} below have each nominated colleagues for recognition but have never been recognized themselves. Research consistently shows unreciprocated contribution is a leading predictor of voluntary attrition. Recommend manager outreach within 5 business days.</p>
    </div>
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <colgroup>
        <col style="width:38%" />
        <col style="width:20%" />
        <col style="width:28%" />
        <col style="width:14%" />
      </colgroup>
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 12px 8px 0;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Employee</th>
          <th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Level</th>
          <th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Department</th>
          <th style="text-align:right;padding:8px 0 8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Given</th>
        </tr>
      </thead>
      <tbody>
        ${invisible.map(p => `
        <tr>
          <td style="padding:10px 12px 10px 0;border-bottom:1px solid #F0F0F0;vertical-align:top;font-weight:600;color:#111;font-size:12px;">${p.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;vertical-align:top;font-size:12px;color:#555;">${p.seniority}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;vertical-align:top;font-size:12px;color:#555;">${p.dept}</td>
          <td style="padding:10px 0 10px 12px;border-bottom:1px solid #F0F0F0;vertical-align:top;font-size:12px;color:#111;font-weight:600;text-align:right;">${p.given}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <!-- 4. Department Health -->
  ${lowDepts.length > 0 ? `
  <div class="section">
    <div class="section-label">Department Health &nbsp;·&nbsp; Lowest performing departments this week</div>
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <colgroup>
        <col style="width:32%" />
        <col style="width:22%" />
        <col style="width:22%" />
        <col style="width:24%" />
      </colgroup>
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 12px 8px 0;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Department</th>
          <th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Health Score</th>
          <th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Participation</th>
          <th style="text-align:left;padding:8px 0 8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Cross-Dept</th>
        </tr>
      </thead>
      <tbody>
        ${lowDepts.map(d => `
        <tr>
          <td style="padding:10px 12px 10px 0;border-bottom:1px solid #F0F0F0;font-weight:600;color:#111;font-size:12px;">${d.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;font-size:12px;color:#333;">${d.health} / 100</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;font-size:12px;color:#333;">${d.participation}%</td>
          <td style="padding:10px 0 10px 12px;border-bottom:1px solid #F0F0F0;font-size:12px;color:#333;">${d.crossDeptPct}%</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <!-- 5. Rising Stars -->
  ${rising.length > 0 ? `
  <div class="section">
    <div class="section-label">Talent Pipeline &nbsp;·&nbsp; Employees with accelerating recognition trends</div>
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <colgroup>
        <col style="width:28%" />
        <col style="width:22%" />
        <col style="width:20%" />
        <col style="width:18%" />
        <col style="width:12%" />
      </colgroup>
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 12px 8px 0;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Employee</th>
          <th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Department</th>
          <th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Level</th>
          <th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Last 3 Mo.</th>
          <th style="text-align:right;padding:8px 0 8px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#888;border-bottom:1px solid #E0E0E0;font-weight:500;">Trend</th>
        </tr>
      </thead>
      <tbody>
        ${rising.map(p => `
        <tr>
          <td style="padding:10px 12px 10px 0;border-bottom:1px solid #F0F0F0;font-weight:600;color:#111;font-size:12px;">${p.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;font-size:12px;color:#555;">${p.dept}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;font-size:12px;color:#555;">${p.seniority}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;font-size:12px;color:#555;">${p.recent} awards</td>
          <td style="padding:10px 0 10px 12px;border-bottom:1px solid #F0F0F0;font-size:12px;color:#111;font-weight:600;text-align:right;">+${p.slope.toFixed(2)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    <p>
      This report is auto-generated by your HR Recognition Analytics platform and delivered every Monday morning.<br />
      Data reflects all recognition activity recorded in the system as of this morning.
    </p>
  </div>

</div>
</body>
</html>`;
}

// ── Send via Resend ───────────────────────────────────────────────────────────
async function sendEmail(html: string, subject: string): Promise<{ id: string; to: string[] }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set in environment variables");

  const recipients = (process.env.HR_EMAIL_RECIPIENTS ?? "")
    .split(",")
    .map(e => e.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("HR_EMAIL_RECIPIENTS not set — add comma-separated emails to .env");
  }

  const testMode = process.env.HR_EMAIL_TEST_MODE === "true";
  const owner    = process.env.HR_EMAIL_OWNER ?? recipients[0];
  const to       = testMode ? [owner] : recipients;

  const from = process.env.HR_EMAIL_FROM ?? "onboarding@resend.dev";

  console.log("[email] Sending to:", to, "from:", from, "subject:", subject);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  const result = await response.json() as { id?: string; message?: string; name?: string };

  if (!response.ok) {
    console.error("[email] Resend error:", result);
    throw new Error(result.message ?? `Resend API error ${response.status}`);
  }

  console.log("[email] Sent successfully. Resend ID:", result.id);
  return { id: result.id ?? "", to };
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