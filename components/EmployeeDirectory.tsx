"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { CAT_COLORS, CAT_LABELS, DEPT_COLORS } from "@/constants/colors";
import { EmployeeSentimentPanel } from "./SentimentalAnalysis";

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG — unchanged from original
// ─────────────────────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  thriving:         { label: "Thriving",         bg: "#EAFAF1", c: "#27AE60", dot: "#27AE60", cls: "bg-green-50 text-green-700" },
  active:           { label: "Active",           bg: "#E8F8F5", c: "#00A98F", dot: "#00A98F", cls: "bg-teal-50 text-teal-700" },
  passive:          { label: "Passive",          bg: "#FEF9E7", c: "#B7770D", dot: "#F39C12", cls: "bg-yellow-50 text-yellow-700" },
  at_risk:          { label: "At Risk",          bg: "#FFF4EE", c: "#F96400", dot: "#F96400", cls: "bg-orange-50 text-orange-700" },
  never_recognized: { label: "Never Recognized", bg: "#FDEDEC", c: "#E74C3C", dot: "#E74C3C", cls: "bg-red-50 text-red-700" },
};

export type SortKey = "name" | "received" | "given" | "engagementScore" | "daysSinceLast";

// ─────────────────────────────────────────────────────────────────────────────
// SORT TH — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export function SortTh({ col, label, sortBy, sortDir, onSort }: {
  col: SortKey; label: string; sortBy: SortKey; sortDir: 1 | -1; onSort: (col: SortKey) => void;
}) {
  return (
    <th
      className={`px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase font-normal cursor-pointer select-none ${sortBy === col ? "text-[#0B3954] bg-blue-50" : "text-gray-500 bg-gray-50"}`}
      onClick={() => onSort(col)}>
      {label}{sortBy === col ? (sortDir === -1 ? " ↓" : " ↑") : ""}
    </th>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAT BAR — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export function DirCatBar({ breakdown }: { breakdown: { id: string; count: number }[] }) {
  return (
    <div className="flex h-1.5 rounded overflow-hidden gap-px min-w-[60px]">
      {breakdown.map(c => (
        <div key={c.id} title={`${CAT_LABELS[c.id]}: ${c.count}`} style={{ flex: c.count, background: CAT_COLORS[c.id] || "#ccc" }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION BAR — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export function DirPaginationBar({ safePage, totalPages, start, end, total, setPage }: {
  safePage: number; totalPages: number; start: number; end: number; total: number;
  setPage: (fn: (p: number) => number | number) => void;
}) {
  return (
    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-3 flex-wrap">
      <span className="font-mono text-[10px] text-gray-500">{total === 0 ? "No results" : `${start}–${end} of ${total} employees`}</span>
      <div className="flex items-center gap-1">
        {[{ label: "«", fn: () => 1, dis: safePage === 1 }, { label: "‹", fn: () => Math.max(1, safePage - 1), dis: safePage === 1 }].map(b => (
          <button key={b.label} onClick={() => setPage(() => b.fn())} disabled={b.dis}
            className={`px-2 py-1 rounded-md border border-gray-200 bg-white font-mono text-[11px] ${b.dis ? "text-gray-300 cursor-not-allowed" : "text-[#0B3954] cursor-pointer hover:bg-gray-50"}`}>{b.label}</button>
        ))}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 2)
          .reduce<(number | "…")[]>((acc, n, i, arr) => {
            if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(n); return acc;
          }, [])
          .map((n, i) =>
            n === "…"
              ? <span key={`e${i}`} className="px-1.5 font-mono text-[11px] text-gray-400">…</span>
              : <button key={n} onClick={() => setPage(() => n as number)}
                className={`px-2 py-1 min-w-[28px] rounded-md border font-mono text-[11px] cursor-pointer ${safePage === n ? "border-teal-500 bg-[#00A98F] text-white font-bold" : "border-gray-200 bg-white text-[#0B3954] hover:bg-gray-50"}`}>
                {n}
              </button>
          )}
        {[{ label: "›", fn: () => Math.min(totalPages, safePage + 1), dis: safePage === totalPages }, { label: "»", fn: () => totalPages, dis: safePage === totalPages }].map(b => (
          <button key={b.label} onClick={() => setPage(() => b.fn())} disabled={b.dis}
            className={`px-2 py-1 rounded-md border border-gray-200 bg-white font-mono text-[11px] ${b.dis ? "text-gray-300 cursor-not-allowed" : "text-[#0B3954] cursor-pointer hover:bg-gray-50"}`}>{b.label}</button>
        ))}
      </div>
      <span className="font-mono text-[10px] text-gray-500">Page {safePage} of {totalPages}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMOTION READINESS — new, derived from recognition signals
// ─────────────────────────────────────────────────────────────────────────────
type PromotionSignal = "strong" | "emerging" | "stable" | "watch" | "insufficient";
const PROMO_CONFIG: Record<PromotionSignal, { label: string; color: string; bg: string; border: string }> = {
  strong:       { label: "Promotion Ready",   color: "#1E8449", bg: "#EAFAF1", border: "#A9DFBF" },
  emerging:     { label: "High Potential",    color: "#1A5276", bg: "#EBF5FB", border: "#AED6F1" },
  stable:       { label: "Performing Well",   color: "#5D6D7E", bg: "#F2F3F4", border: "#D5DBDB" },
  watch:        { label: "Needs Attention",   color: "#BA4A00", bg: "#FEF5E7", border: "#FAD7A0" },
  insufficient: { label: "Insufficient Data", color: "#7D6608", bg: "#FEF9E7", border: "#F9E79F" },
};

function derivePromotion(p: DashboardData["employeeDirectory"][0], data: DashboardData) {
  const reasons: string[] = [];
  const concerns: string[] = [];
  const isRising    = data.intelligence.risingStars.find(r => r.id === p.id);
  const isDeclining = data.intelligence.decliningRecognition.find(r => r.id === p.id);
  const isConnector = data.intelligence.orgConnectors.find(c => c.id === p.id);

  // ── Positive signals ──────────────────────────────────────────────────────
  if (p.received >= 5)
    reasons.push(`Peer-validated impact — ${p.received} recognitions show consistent, visible contributions that colleagues and managers notice`);
  if (p.given >= 4)
    reasons.push(`Culture leadership — ${p.given} recognitions given signals someone who actively builds team morale, a key trait at senior levels`);
  if (p.categoryBreakdown.length >= 3) {
    const catNames = p.categoryBreakdown.slice(0, 3).map(c => CAT_LABELS[c.id] || c.id).join(", ");
    reasons.push(`Broad impact — recognized across ${p.categoryBreakdown.length} behavior categories (${catNames}), showing versatility beyond a single skill`);
  }
  if (p.daysSinceLast <= 60 && p.received > 0)
    reasons.push(`Sustained relevance — recognized within the last 60 days, meaning their impact is current, not historical`);
  if (isRising)
    reasons.push(`Accelerating trajectory — recognition frequency is increasing, indicating growing responsibility or influence`);
  if (p.engagementScore >= 70)
    reasons.push(`High engagement (${p.engagementScore}%) — actively participates as both giver and receiver in the recognition ecosystem`);
  if (isConnector && isConnector.uniqueDeptsReached >= 3)
    reasons.push(`Cross-functional influence — recognized across ${isConnector.uniqueDeptsReached} departments, a hallmark of leadership-ready individuals`);

  // ── Concern signals ───────────────────────────────────────────────────────
  if (p.received === 0)
    concerns.push(`Zero recognition received — their work is not visible to peers or managers; promotion without visibility is a retention risk`);
  if (p.given === 0)
    concerns.push(`Never given recognition — leaders are expected to celebrate others; this gap may reflect disengagement from team culture`);
  if (p.daysSinceLast > 120 && p.received > 0)
    concerns.push(`${p.daysSinceLast}-day recognition gap — prolonged absence often correlates with reduced output or declining peer perception`);
  if (isDeclining)
    concerns.push(`Declining recognition trend — frequency has dropped recently, suggesting reduced visibility or early disengagement`);
  if (p.engagementScore < 30)
    concerns.push(`Low engagement score (${p.engagementScore}%) — below the threshold where promotion conversations are typically productive`);

  let signal: PromotionSignal;
  if      (reasons.length >= 4 && concerns.length === 0) signal = "strong";
  else if (reasons.length >= 3 && concerns.length <= 1)  signal = "emerging";
  else if (reasons.length >= 1 && concerns.length <= 1)  signal = "stable";
  else if (concerns.length >= 2)                         signal = "watch";
  else                                                   signal = "insufficient";

  // ── Promotion case — why they're ready ───────────────────────────────────
  const promotionCase = (signal === "strong" || signal === "emerging") ? (() => {
    const whyLines: string[] = [];
    whyLines.push(`${p.name.split(" ")[0]} meets ${reasons.length} of the key promotion indicators for a ${p.seniority} → next-level transition.`);
    if (reasons.length >= 2) whyLines.push(`Strongest evidence: ${reasons[0].split(" — ")[0]} and ${reasons[1].split(" — ")[0].toLowerCase()}.`);
    if (isConnector) whyLines.push(`Their cross-functional reach across ${isConnector.uniqueDeptsReached} departments demonstrates the org-wide influence expected at the next level.`);
    whyLines.push(`Recommended: open a promotion conversation with their manager in the next 30-day review cycle.`);
    return whyLines;
  })() : null;

  // ── Decline diagnosis + improvement plan ─────────────────────────────────
  const declineCase = isDeclining ? (() => {
    const rootCauses: string[] = [];
    if (p.given === 0)            rootCauses.push("withdrawal from team culture (no recognition given)");
    if (p.daysSinceLast > 90)     rootCauses.push("reduced output visibility to peers and managers");
    if (p.engagementScore < 50)   rootCauses.push(`low overall engagement score (${p.engagementScore}%)`);
    if (rootCauses.length === 0)  rootCauses.push("unclear — requires a direct conversation to diagnose");
    const recentDesc = isDeclining.recent !== undefined && isDeclining.early !== undefined
      ? `down from ~${isDeclining.early} awards/period earlier to ~${isDeclining.recent} recently`
      : "declining in recent months";
    const improvements: string[] = [
      "Schedule a 1-on-1 within 2 weeks to understand workload, satisfaction, and career goals",
      "Ask their manager to nominate them for one specific recent contribution this week — restarting recognition momentum is proven to lift engagement",
    ];
    if (p.given === 0)
      improvements.push("Invite them to a peer recognition workshop — rebuilding the habit of giving often restores the habit of being seen");
    if (p.categoryBreakdown.length <= 1)
      improvements.push("Encourage visibility across more project types to broaden their recognition footprint beyond a single area");
    return { recentDesc, rootCauses, improvements };
  })() : null;

  return { signal, ...PROMO_CONFIG[signal], reasons, concerns, isRising, isDeclining, promotionCase, declineCase };
}

// ─────────────────────────────────────────────────────────────────────────────
// TREND MINI CHART — new
// ─────────────────────────────────────────────────────────────────────────────
function TrendMini({ pts, color }: { pts: { period: string; awards: number }[]; color: string }) {
  if (pts.length < 2) return null;
  const W = 220, H = 44, pad = 4;
  const vals = pts.map(p => p.awards);
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
  const coords = pts.map((p, i) => ({
    x: pad + (i / (pts.length - 1)) * (W - pad * 2),
    y: pad + (1 - (p.awards - mn) / rng) * (H - pad * 2),
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1].x},${H} L${coords[0].x},${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      <path d={area} fill={`${color}18`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r="3" fill="#fff" stroke={color} strokeWidth="1.5" />)}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE PROFILE PANEL — original UI + new sections, no activity history
// ─────────────────────────────────────────────────────────────────────────────
export function EmployeeProfilePanel({
  p, data, onClose,
}: {
  p: DashboardData["employeeDirectory"][0];
  data: DashboardData;
  onClose: () => void;
}) {
  const sc    = STATUS_CONFIG[p.status];
  const color = DEPT_COLORS[p.dept] || "#888";
  const promo = derivePromotion(p, data);
  const trendPts   = (promo.isRising ?? promo.isDeclining)?.monthlyData ?? [];
  const trendColor = promo.isRising ? "#00A98F" : promo.isDeclining ? "#E74C3C" : "#ADB5BD";

  return (
    <div className="flex flex-col gap-3 sticky top-20">

      {/* ── Header card — ORIGINAL ────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full grid place-items-center font-extrabold shrink-0 font-mono"
            style={{ width: 52, height: 52, background: color + "22", border: `3px solid ${color}`, fontSize: 16, color }}>
            {p.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-base text-[#0B3954] tracking-tight">{p.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{p.title}</div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: color + "18", color }}>{p.dept}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">{p.seniority}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${sc.cls}`}>{sc.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full border border-gray-200 grid place-items-center cursor-pointer text-gray-500 text-sm bg-gray-50 shrink-0">✕</button>
        </div>

        {/* KPI row — ORIGINAL */}
        <div className="grid grid-cols-4 gap-2 mb-3.5">
          {[
            { l: "Received",   v: p.received,                           c: p.received >= 5 ? "text-green-600" : p.received === 0 ? "text-red-500" : "text-[#0B3954]" },
            { l: "Given",      v: p.given,                              c: p.given >= 4 ? "text-teal-600" : p.given === 0 ? "text-yellow-600" : "text-[#0B3954]" },
            { l: "Total Value",v: `$${p.valueReceived.toLocaleString()}`,c: "text-[#F96400]" },
            { l: "Engagement", v: p.engagementScore + "%",              c: p.engagementScore >= 70 ? "text-green-600" : p.engagementScore >= 40 ? "text-teal-600" : "text-yellow-600" },
          ].map(s => (
            <div key={s.l} className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="font-mono text-[7px] text-gray-500 uppercase tracking-widest mb-1">{s.l}</div>
              <div className={`font-extrabold text-[15px] ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Last recognition — ORIGINAL */}
        <div className="px-3 py-2 rounded-lg border"
          style={{ background: p.daysSinceLast > 120 ? "#FDEDEC" : p.daysSinceLast > 60 ? "#FEF9E7" : "#EAFAF1", borderColor: p.daysSinceLast > 120 ? "#F5B7B1" : p.daysSinceLast > 60 ? "#FAD7A0" : "#A9DFBF" }}>
          <div className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Last Recognition</div>
          <div className="text-xs font-semibold text-[#0B3954]">
            {p.lastAwardDate ? `${p.lastAwardDate} · ${p.daysSinceLast} days ago` : "Never received recognition"}
          </div>
        </div>
      </div>

      {/* ── Skills — ORIGINAL ─────────────────────────────────────────── */}
      {p.skills.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-2">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {p.skills.map((s: string) => (
              <span key={s} className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium border border-indigo-200">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Category breakdown — ORIGINAL ────────────────────────────── */}
      {p.categoryBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-2.5">Recognition by Category</div>
          <div className="flex flex-col gap-2">
            {p.categoryBreakdown.map(c => (
              <div key={c.id}>
                <div className="flex justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[c.id] || "#888" }} />
                    <span className="text-[11px] text-[#0B3954] font-medium">{CAT_LABELS[c.id]} ({c.id})</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold" style={{ color: CAT_COLORS[c.id] || "#888" }}>{c.count}</span>
                </div>
                <div className="h-1 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${(c.count / Math.max(p.received, 1)) * 100}%`, background: CAT_COLORS[c.id] || "#888" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PROMOTION READINESS ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest">Promotion Readiness</div>
          <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: promo.bg, color: promo.color, border: `1px solid ${promo.border}` }}>
            {promo.label}
          </span>
        </div>

        {/* Why they're ready — promotion case narrative */}
        {promo.promotionCase && (
          <div className="mb-2.5 p-2.5 rounded-lg" style={{ background: promo.bg, border: `1px solid ${promo.border}` }}>
            <div className="font-mono text-[8px] font-bold text-green-700 uppercase tracking-wider mb-1.5">Why They're Ready</div>
            <div className="flex flex-col gap-1.5">
              {promo.promotionCase.map((line, i) => (
                <p key={i} className="text-[11px] text-[#0B3954] leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Positive signals */}
        {promo.reasons.length > 0 && (
          <div className="mb-2">
            <div className="font-mono text-[8px] font-bold text-green-600 uppercase tracking-wider mb-1.5">✓ Supporting evidence</div>
            <div className="flex flex-col gap-1.5">
              {promo.reasons.map((r, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span className="text-green-500 text-[10px] leading-5 shrink-0">•</span>
                  <span className="text-[11px] text-[#0B3954] leading-5">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Watch points */}
        {promo.concerns.length > 0 && (
          <div>
            <div className="font-mono text-[8px] font-bold text-red-500 uppercase tracking-wider mb-1.5">⚠ Watch points</div>
            <div className="flex flex-col gap-1.5">
              {promo.concerns.map((c, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span className="text-amber-500 text-[10px] leading-5 shrink-0">•</span>
                  <span className="text-[11px] text-[#0B3954] leading-5">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RECOGNITION TREND ────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest">Recognition Trend</div>
          {promo.isRising    && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200">↑ Accelerating</span>}
          {promo.isDeclining && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">↓ Declining</span>}
          {!promo.isRising && !promo.isDeclining && <span className="font-mono text-[9px] text-gray-400">Stable</span>}
        </div>

        {trendPts.length >= 2 ? (
          <>
            <TrendMini pts={trendPts} color={trendColor} />
            <div className="flex justify-between mt-1 mb-2">
              <span className="font-mono text-[8px] text-gray-400">{trendPts[0]?.period}</span>
              <span className="font-mono text-[8px] text-gray-400">{trendPts[trendPts.length - 1]?.period}</span>
            </div>

            {/* Decline diagnosis */}
            {promo.declineCase && (
              <div className="flex flex-col gap-2">
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
                  <div className="font-mono text-[8px] font-bold text-red-600 uppercase tracking-wider mb-1">Why It's Declining</div>
                  <p className="text-[11px] text-[#0B3954] leading-relaxed mb-1.5">
                    Recognition is {promo.declineCase.recentDesc}.
                  </p>
                  <div className="font-mono text-[8px] font-semibold text-red-500 uppercase tracking-wider mb-1">Likely root causes</div>
                  {promo.declineCase.rootCauses.map((rc, i) => (
                    <div key={i} className="flex gap-1.5 items-start mb-0.5">
                      <span className="text-red-400 text-[10px] leading-5 shrink-0">•</span>
                      <span className="text-[11px] text-[#0B3954] leading-5">{rc}</span>
                    </div>
                  ))}
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="font-mono text-[8px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">How to Improve</div>
                  {promo.declineCase.improvements.map((imp, i) => (
                    <div key={i} className="flex gap-1.5 items-start mb-1">
                      <span className="text-blue-500 text-[10px] leading-5 shrink-0">{i + 1}.</span>
                      <span className="text-[11px] text-[#0B3954] leading-5">{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rising interpretation */}
            {promo.isRising && !promo.declineCase && (
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Recognition frequency is growing — strong signal of increasing visibility and contribution. This trajectory supports a promotion conversation.
              </p>
            )}
          </>
        ) : (
          <p className="text-[11px] text-gray-400 italic py-1">
            {p.received === 0 ? "No recognitions received — no trend to display." : "Not enough data points for a trend yet."}
          </p>
        )}
      </div>

      {/* ── RECOGNITION SENTIMENT ───────────────────────────────────── */}
      <EmployeeSentimentPanel recipientId={p.id}/>

      {/* ── HR INSIGHT ───────────────────────────────────────────────── */}
      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex gap-2.5">
        <span className="text-base">💡</span>
        <div>
          <div className="font-mono text-[8px] text-indigo-600 uppercase tracking-widest mb-1">HR INSIGHT</div>
          <p className="text-[11px] text-[#0B3954] leading-relaxed">
            {p.status === "never_recognized"
              ? `${p.name.split(" ")[0]} has never received recognition. Reach out to their manager to initiate a recognition this week — visibility is critical for retention.`
              : p.status === "at_risk"
                ? `Last recognized ${p.daysSinceLast} days ago — above the 120-day threshold. Prompt their manager to recognise a recent contribution before this becomes a flight risk.`
                : promo.signal === "strong"
                  ? `${p.name.split(" ")[0]} is promotion-ready based on ${promo.reasons.length} recognition signals. Open the promotion conversation with their manager in the next review cycle before a recruiter gets there first.`
                  : promo.signal === "emerging"
                    ? `${p.name.split(" ")[0]} is on a strong trajectory. ${promo.reasons.length >= 2 ? `Key strengths: ${promo.reasons[0].split(" — ")[0]} and ${promo.reasons[1].split(" — ")[0].toLowerCase()}. ` : ""}Give them a stretch assignment to close the remaining gap to promotion-ready.`
                    : promo.signal === "watch" && promo.declineCase
                      ? `${p.name.split(" ")[0]}'s recognition is declining (${promo.declineCase.recentDesc}). Root causes: ${promo.declineCase.rootCauses.join("; ")}. Immediate action: ${promo.declineCase.improvements[0].toLowerCase()}.`
                      : promo.signal === "watch"
                        ? `Recognition patterns suggest possible disengagement. Schedule a 1-on-1 within 2 weeks to understand workload, satisfaction, and career trajectory.`
                        : p.status === "passive"
                          ? `${p.name.split(" ")[0]} receives recognition but never gives it. Invite them to a peer recognition workshop — leaders are expected to celebrate others.`
                          : `${p.name.split(" ")[0]} is engaged with ${p.received} received and ${p.given} given. Continue monitoring for promotion readiness signals.`}
          </p>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE DIRECTORY — original UI, passes data to panel
// ─────────────────────────────────────────────────────────────────────────────
export function EmployeeDirectory({ data }: { data: DashboardData }) {
  const PAGE_SIZE = 25;
  const dir = data.employeeDirectory;
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deptF, setDeptF] = useState("All");
  const [senF, setSenF] = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("received");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(1);

  const depts   = ["All", ...Array.from(new Set(dir.map(p => p.dept))).sort()];
  const seniors = ["All", "IC", "Senior IC", "Manager", "Senior Manager", "Director", "VP"];

  const filtered = dir
    .filter(p => deptF === "All" || p.dept === deptF)
    .filter(p => senF === "All" || p.seniority === senF)
    .filter(p => statusF === "All" || p.status === statusF)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.title.toLowerCase().includes(search.toLowerCase()) || p.skills.some((s: string) => s.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      const av = a[sortBy] as number | string, bv = b[sortBy] as number | string;
      if (typeof av === "string") return (av as string).localeCompare(bv as string) * sortDir;
      return ((av as number) - (bv as number)) * sortDir;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const start      = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end        = Math.min(safePage * PAGE_SIZE, filtered.length);
  const resetPage  = () => setPage(1);
  const selPerson  = selected ? dir.find(p => p.id === selected) : null;
  const toggleSort = (col: SortKey) => {
    if (sortBy === col) setSortDir(d => d === 1 ? -1 : 1);
    else { setSortBy(col); setSortDir(-1); }
    resetPage();
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Status summary — ORIGINAL */}
      <div className="grid grid-cols-5 gap-2.5">
        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG["thriving"]][]).map(([k, cfg]) => {
          const count = dir.filter(p => p.status === k).length;
          return (
            <button key={k} onClick={() => { setStatusF(statusF === k ? "All" : k); resetPage(); }}
              className="p-2.5 rounded-xl border-2 cursor-pointer text-left transition-all"
              style={{ borderColor: statusF === k ? cfg.c : "#E9ECEF", background: statusF === k ? cfg.bg : "white" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                <span className="text-[10px] font-semibold" style={{ color: cfg.c }}>{cfg.label}</span>
              </div>
              <div className="font-mono text-xl font-extrabold text-[#0B3954]">{count}</div>
              <div className="font-mono text-[9px] text-gray-500">{Math.round(count / dir.length * 100)}% of workforce</div>
            </button>
          );
        })}
      </div>

      {/* Filters — ORIGINAL */}
      <div className="flex gap-2 items-center flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); resetPage(); }}
          placeholder="Search name, title, or skill…"
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-[#0B3954] outline-none focus:border-teal-400" />
        <select value={deptF} onChange={e => { setDeptF(e.target.value); resetPage(); }}
          className="px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] bg-white cursor-pointer text-[#0B3954]">
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={senF} onChange={e => { setSenF(e.target.value); resetPage(); }}
          className="px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] bg-white cursor-pointer text-[#0B3954]">
          {seniors.map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || deptF !== "All" || senF !== "All" || statusF !== "All") && (
          <button onClick={() => { setSearch(""); setDeptF("All"); setSenF("All"); setStatusF("All"); resetPage(); }}
            className="px-3.5 py-2 rounded-lg border border-gray-200 text-[11px] cursor-pointer text-gray-500 bg-white hover:bg-gray-50">
            Clear filters
          </button>
        )}
        <span className="font-mono text-[10px] text-gray-500 ml-auto">{filtered.length} of {dir.length} employees</span>
      </div>

      {/* Table + panel — ORIGINAL layout */}
      <div className={`grid gap-4 items-start ${selPerson ? "grid-cols-[1fr_420px]" : "grid-cols-1"}`}>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={`px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase font-normal cursor-pointer select-none ${sortBy === "name" ? "text-[#0B3954] bg-blue-50" : "text-gray-500 bg-gray-50"}`}
                  onClick={() => toggleSort("name")}>Name{sortBy === "name" ? (sortDir === -1 ? " ↓" : " ↑") : ""}</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Department</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Title & Seniority</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Skills</th>
                <SortTh col="received"       label="Received"   sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortTh col="given"          label="Given"      sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortTh col="engagementScore"label="Engagement" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortTh col="daysSinceLast"  label="Last Rec."  sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Categories</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(p => {
                const sc       = STATUS_CONFIG[p.status];
                const isSel    = selected === p.id;
                const depColor = DEPT_COLORS[p.dept] || "#888";
                return (
                  <tr key={p.id} onClick={() => setSelected(isSel ? null : p.id)}
                    className="border-b border-gray-100 cursor-pointer hover:bg-orange-50 transition-colors"
                    style={{ background: isSel ? "#E8F8F5" : undefined, borderLeft: isSel ? "3px solid #00A98F" : "3px solid transparent" }}>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full grid place-items-center font-bold font-mono shrink-0 text-[10px]"
                          style={{ width: 30, height: 30, background: depColor + "22", border: `2px solid ${depColor}`, color: depColor }}>
                          {p.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                        </div>
                        <span className="font-semibold text-[#0B3954] text-xs">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-xl font-semibold"
                        style={{ background: depColor + "18", color: depColor }}>{p.dept}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="text-[11px] text-[#0B3954] font-medium">{p.title}</div>
                      <div className="text-[9px] text-gray-500 font-mono mt-0.5">{p.seniority}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex gap-1 flex-wrap max-w-[140px]">
                        {p.skills.slice(0, 2).map((s: string) => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 whitespace-nowrap">{s}</span>
                        ))}
                        {p.skills.length > 2 && <span className="text-[9px] text-gray-400">+{p.skills.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-base font-extrabold"
                        style={{ color: p.received >= 5 ? "#27AE60" : p.received === 0 ? "#E74C3C" : "#0B3954" }}>{p.received}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-base font-extrabold"
                        style={{ color: p.given >= 4 ? "#00A98F" : p.given === 0 ? "#F39C12" : "#0B3954" }}>{p.given}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="relative w-9 h-9">
                        <svg width={36} height={36} viewBox="0 0 36 36">
                          <circle cx={18} cy={18} r={14} fill="none" stroke="#E9ECEF" strokeWidth={4} />
                          <circle cx={18} cy={18} r={14} fill="none"
                            stroke={p.engagementScore >= 70 ? "#27AE60" : p.engagementScore >= 40 ? "#00A98F" : "#F39C12"}
                            strokeWidth={4}
                            strokeDasharray={`${p.engagementScore / 100 * 88} 88`}
                            strokeLinecap="round"
                            transform="rotate(-90 18 18)" />
                        </svg>
                        <div className="absolute inset-0 grid place-items-center font-mono text-[8px] font-bold text-[#0B3954]">{p.engagementScore}</div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-[11px]"
                        style={{ color: p.daysSinceLast > 120 ? "#E74C3C" : p.daysSinceLast > 60 ? "#F39C12" : "#00A98F" }}>
                        {p.received === 0 ? "—" : p.daysSinceLast === 999 ? "—" : `${p.daysSinceLast}d ago`}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      {p.categoryBreakdown.length > 0 ? <DirCatBar breakdown={p.categoryBreakdown} /> : <span className="text-gray-400 text-[10px]">—</span>}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${sc.cls}`}>{sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <DirPaginationBar safePage={safePage} totalPages={totalPages} start={start} end={end} total={filtered.length} setPage={setPage} />
        </div>

        {selPerson && (
          <EmployeeProfilePanel p={selPerson} data={data} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}