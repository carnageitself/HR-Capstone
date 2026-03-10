"use client";

import { useState, useMemo } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { CAT_COLORS, DEPT_COLORS } from "@/constants/colors";
import { SH } from "@/constants/primitives";
import { ExportButton, exportToCSV } from "@/utils/exportCSV";

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_NUM: Record<string, string> = {
  "01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun",
  "07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec",
};

function getDelta(a: number, b: number) {
  if (b === 0) return { pct: 0, up: true };
  const pct = Math.round(((a - b) / b) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

// ── Sentiment config — mirrors SENTIMENT_LABEL_CONFIG in loadDashboardData ───
const SENT_CFG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  "Highly Positive": { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: "💚" },
  "Positive":        { color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4", icon: "💙" },
  "Neutral":         { color: "#6C757D", bg: "#F8F9FA", border: "#E9ECEF", icon: "🩶" },
  "Negative":        { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "🟡" },
  "Highly Negative": { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "🔴" },
};

// ── Line Chart ────────────────────────────────────────────────────────────────
function LineChart({ d, color = "#00A98F" }: { d: DashboardData["monthly"]; color?: string }) {
  const [tip, setTip] = useState<{ x: number; y: number; d: DashboardData["monthly"][0] } | null>(null);

  if (!d || d.length === 0) {
    return (
      <div className="h-36 flex flex-col items-center justify-center gap-2 text-gray-400">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span className="text-[12px] font-medium">No data available for selected period</span>
      </div>
    );
  }

  const W = 700, H = 140, px = 24, py = 16;
  const vals = d.map(x => x.awards);
  const mx = Math.max(...vals, 1);
  const mn = Math.min(...vals);
  const rng = mx - mn || 1;

  const pts = d.map((x, i) => ({
    x: px + (i / Math.max(d.length - 1, 1)) * (W - px * 2),
    y: py + (1 - (x.awards - mn) / rng) * (H - py * 2),
    d: x,
  }));

  if (!pts.length) return null;

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const first = pts[0];
  const area = `${line} L${last.x},${H} L${first.x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: 140 }}>
      <defs>
        <linearGradient id="lc2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(t => {
        const y = py + t * (H - py * 2);
        return <line key={t} x1={px} y1={y} x2={W - px} y2={y} stroke="#E9ECEF" strokeWidth="1" />;
      })}
      <path d={area} fill="url(#lc2)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x} cy={p.y} r="4"
            fill="#fff" stroke={color} strokeWidth="2"
            style={{ opacity: tip?.d.month === p.d.month ? 1 : 0.35, transition: "opacity .15s" }}
          />
          <rect
            x={p.x - 16} y={0} width={32} height={H}
            fill="transparent"
            onMouseEnter={() => setTip(p)}
            onMouseLeave={() => setTip(null)}
          />
          <text x={p.x} y={H + 3} textAnchor="middle" fill="#ADB5BD" fontSize="9" fontFamily="monospace">
            {(p.d.label || "").slice(0, 3)}
          </text>
        </g>
      ))}
      {tip && (
        <g>
          <rect x={Math.min(tip.x - 44, W - 92)} y={tip.y - 48} width={88} height={36} rx="8" fill="#0B3954" />
          <text x={Math.min(tip.x, W - 48)} y={tip.y - 28} textAnchor="middle" fill={color} fontSize="13" fontFamily="monospace" fontWeight="600">
            {tip.d.awards}
          </text>
          <text x={Math.min(tip.x, W - 48)} y={tip.y - 15} textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="8" fontFamily="monospace">
            {tip.d.label}
          </text>
        </g>
      )}
    </svg>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, a, b, color }: { label: string; a: number; b: number; color: string }) {
  const { pct, up } = getDelta(a, b);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},${color}55)` }} />
      <div className="font-mono text-[8px] uppercase tracking-widest text-gray-500 mb-2">{label}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="font-extrabold text-2xl font-mono" style={{ color }}>{a.toLocaleString()}</div>
          <div className="font-mono text-[10px] text-gray-400 mt-0.5">vs {b.toLocaleString()}</div>
        </div>
        {pct > 0 && (
          <div className={`text-right ${up ? "text-green-600" : "text-red-500"}`}>
            <div className="font-bold text-lg">{up ? "▲" : "▼"} {pct}%</div>
            <div className="font-mono text-[9px]">{up ? "improvement" : "decline"}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Period Comparison ────────────────────────────────────────────────────────
const COLOR_A = "#F96400";
const COLOR_B = "#3B5BDB";

function buildPeriods(monthly: DashboardData["monthly"]) {
  const available = new Set(monthly.map(m => m.yearMonth).filter(Boolean));
  if (!available.size) return [];
  const years = [...new Set([...available].map(m => m.slice(0, 4)))].sort();
  const all: { id: string; label: string; months: string[] }[] = [];
  for (const y of years) {
    [
      { id: `q1_${y}`, label: `Q1 ${y}`, months: [`${y}-01`,`${y}-02`,`${y}-03`] },
      { id: `q2_${y}`, label: `Q2 ${y}`, months: [`${y}-04`,`${y}-05`,`${y}-06`] },
      { id: `q3_${y}`, label: `Q3 ${y}`, months: [`${y}-07`,`${y}-08`,`${y}-09`] },
      { id: `q4_${y}`, label: `Q4 ${y}`, months: [`${y}-10`,`${y}-11`,`${y}-12`] },
      { id: `h1_${y}`, label: `H1 ${y}`, months: [`${y}-01`,`${y}-02`,`${y}-03`,`${y}-04`,`${y}-05`,`${y}-06`] },
      { id: `h2_${y}`, label: `H2 ${y}`, months: [`${y}-07`,`${y}-08`,`${y}-09`,`${y}-10`,`${y}-11`,`${y}-12`] },
    ]
      .filter(p => p.months.some(m => available.has(m)))
      .forEach(p => all.push(p));
  }
  return all;
}

function getPeriodStats(months: string[], data: DashboardData) {
  const set = new Set(months);
  const matched = (data.monthly ?? []).filter(m => m.yearMonth && set.has(m.yearMonth));
  const totalAwards = matched.reduce((s, m) => s + m.awards, 0);
  const totalValue  = matched.reduce((s, m) => s + (m.value ?? 0), 0);
  const avgPerMonth = matched.length > 0 ? Math.round(totalAwards / matched.length) : 0;
  const peak        = matched.reduce(
    (b, m) => m.awards > b.awards ? m : b,
    matched[0] ?? { awards: 0, label: "—", month: "—", yearMonth: "", value: 0 }
  );
  // Real dept counts from employeeDirectory
  const depts: Record<string, number> = {};
  for (const emp of (data.employeeDirectory ?? [])) {
    for (const a of (emp.recentAwards ?? [])) {
      const ym = a.date?.slice(0, 7);
      if (ym && set.has(ym)) depts[emp.dept] = (depts[emp.dept] ?? 0) + 1;
    }
  }
  // Real category counts
  const cats: Record<string, number> = {};
  for (const emp of (data.employeeDirectory ?? [])) {
    for (const a of (emp.recentAwards ?? [])) {
      const ym = a.date?.slice(0, 7);
      if (ym && set.has(ym)) {
        const cat = a.category ?? "Unknown";
        cats[cat] = (cats[cat] ?? 0) + 1;
      }
    }
  }
  return { totalAwards, totalValue, avgPerMonth, peak, months: matched, depts, cats };
}

function DeltaBadge({ a, b }: { a: number; b: number }) {
  if (b === 0) return <span className="font-mono text-[10px] text-gray-400">—</span>;
  const pct = Math.round(((a - b) / b) * 100);
  if (pct === 0) return <span className="font-mono text-[10px] text-gray-400">—</span>;
  const up = pct > 0;
  return (
    <span className={`font-mono text-[10px] font-bold ${up ? "text-green-600" : "text-red-500"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

function PeriodComparison({ data }: { data: DashboardData }) {
  const periods = useMemo(() => buildPeriods(data.monthly ?? []), [data.monthly]);

  // Auto-suggest H1 vs H2, fall back to Q1 vs Q2
  const [defA, defB] = useMemo(() => {
    const h1 = periods.find(p => p.id.startsWith("h1_"));
    const h2 = periods.find(p => p.id.startsWith("h2_"));
    if (h1 && h2) return [h1.id, h2.id];
    return [periods[0]?.id ?? "", periods[1]?.id ?? ""];
  }, [periods]);

  const [pAId, setPAId] = useState(defA);
  const [pBId, setPBId] = useState(defB);

  const pA = periods.find(p => p.id === pAId) ?? periods[0];
  const pB = periods.find(p => p.id === pBId) ?? periods[1];

  const sA = useMemo(() => pA ? getPeriodStats(pA.months, data) : null, [pA, data]);
  const sB = useMemo(() => pB ? getPeriodStats(pB.months, data) : null, [pB, data]);

  if (!pA || !pB || !sA || !sB || periods.length < 2) return null;

  const maxAwards = Math.max(...sA.months.map(m => m.awards), ...sB.months.map(m => m.awards), 1);
  const maxLen    = Math.max(sA.months.length, sB.months.length);
  const allDepts  = [...new Set([...Object.keys(sA.depts), ...Object.keys(sB.depts)])].sort();
  const allCats   = [...new Set([...Object.keys(sA.cats), ...Object.keys(sB.cats)])]
    .sort((x, y) => (sB.cats[y] ?? 0) + (sA.cats[y] ?? 0) - ((sB.cats[x] ?? 0) + (sA.cats[x] ?? 0)));

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header + pickers */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[9px] text-[#8E44AD] uppercase tracking-widest mb-0.5">Period Comparison</div>
          <div className="font-bold text-[15px] text-[#0B3954]">
            {pA.label} vs {pB.label}
            {pAId === defA && pBId === defB && (
              <span className="ml-2 text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 align-middle">
                recommended
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { id: pAId, set: setPAId, block: pBId, color: COLOR_A, label: "A" },
            { id: pBId, set: setPBId, block: pAId, color: COLOR_B, label: "B" },
          ].map(({ id, set, block, color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
              <div className="flex gap-1">
                {periods.map(p => (
                  <button key={p.id}
                    onClick={() => { if (p.id !== block) set(p.id); }}
                    disabled={p.id === block}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background:  id === p.id ? color : "transparent",
                      color:       id === p.id ? "#fff" : "#6C757D",
                      borderColor: id === p.id ? color : "#E9ECEF",
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Awards",    a: sA.totalAwards, b: sB.totalAwards, pre: ""  },
            { label: "Monthly Average", a: sA.avgPerMonth, b: sB.avgPerMonth, pre: ""  },
            { label: "Total Value",     a: sA.totalValue,  b: sB.totalValue,  pre: "$" },
          ].map(({ label, a, b, pre }) => (
            <div key={label} className="rounded-xl p-4 relative overflow-hidden bg-gray-50 border border-gray-200">
              <div className="font-mono text-[8px] uppercase tracking-widest text-gray-500 mb-2">{label}</div>
              <div className="flex items-end gap-3">
                <div>
                  <div className="font-mono text-[8px] mb-0.5" style={{ color: COLOR_A }}>{pA.label}</div>
                  <div className="font-mono text-[20px] font-extrabold leading-none" style={{ color: COLOR_A }}>{pre}{a.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-mono text-[8px] mb-0.5" style={{ color: COLOR_B }}>{pB.label}</div>
                  <div className="font-mono text-[20px] font-extrabold leading-none" style={{ color: COLOR_B }}>{pre}{b.toLocaleString()}</div>
                </div>
                <div className="ml-auto self-center"><DeltaBadge a={b} b={a} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[9px] uppercase tracking-widest text-gray-500">Monthly Volume</div>
            <div className="flex gap-3">
              {[{ c: COLOR_A, l: pA.label }, { c: COLOR_B, l: pB.label }].map(({ c, l }) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                  <span className="font-mono text-[9px] font-semibold" style={{ color: c }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-1" style={{ height: 120 }}>
            {Array.from({ length: maxLen }).map((_, i) => {
              const mA = sA.months[i];
              const mB = sB.months[i];
              const vA = mA?.awards ?? 0;
              const vB = mB?.awards ?? 0;
              const hA = Math.round((vA / maxAwards) * 96);
              const hB = Math.round((vB / maxAwards) * 96);
              const moLabel = MONTH_NUM[(pA.months[i] ?? pB.months[i] ?? "").split("-")[1] ?? "01"];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5" style={{ height: 104 }}>
                    <div className="flex-1 rounded-t relative group transition-all duration-500"
                      style={{ height: Math.max(hA, vA > 0 ? 2 : 0), background: COLOR_A, opacity: vA > 0 ? 1 : 0.12 }}>
                      {vA > 0 && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[8px] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity"
                          style={{ color: COLOR_A }}>{vA}</div>
                      )}
                    </div>
                    <div className="flex-1 rounded-t relative group transition-all duration-500"
                      style={{ height: Math.max(hB, vB > 0 ? 2 : 0), background: COLOR_B, opacity: vB > 0 ? 1 : 0.12 }}>
                      {vB > 0 && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[8px] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity"
                          style={{ color: COLOR_B }}>{vB}</div>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[8px] text-gray-400">{moLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dept + Category tables side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Department */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <div className="font-mono text-[9px] text-[#8E44AD] uppercase tracking-widest mb-0.5">By Department</div>
            </div>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3.5 py-2 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Dept</th>
                  <th className="px-3 py-2 text-center font-mono text-[9px] tracking-widest uppercase font-semibold" style={{ color: COLOR_A }}>{pA.label}</th>
                  <th className="px-3 py-2 text-center font-mono text-[9px] tracking-widest uppercase font-semibold" style={{ color: COLOR_B }}>{pB.label}</th>
                  <th className="px-3 py-2 text-center font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Δ</th>
                </tr>
              </thead>
              <tbody>
                {allDepts.map((dept, i) => {
                  const dA = sA.depts[dept] ?? 0;
                  const dB = sB.depts[dept] ?? 0;
                  const color = DEPT_COLORS[dept] || "#888";
                  return (
                    <tr key={dept} className="hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: i < allDepts.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className="font-semibold text-[#0B3954] text-[11px]">{dept}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-[12px]" style={{ color: COLOR_A }}>{dA}</td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-[12px]" style={{ color: COLOR_B }}>{dB}</td>
                      <td className="px-3 py-2.5 text-center"><DeltaBadge a={dB} b={dA} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Category */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <div className="font-mono text-[9px] text-[#8E44AD] uppercase tracking-widest mb-0.5">By Award Category</div>
            </div>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3.5 py-2 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Category</th>
                  <th className="px-3 py-2 text-center font-mono text-[9px] tracking-widest uppercase font-semibold" style={{ color: COLOR_A }}>{pA.label}</th>
                  <th className="px-3 py-2 text-center font-mono text-[9px] tracking-widest uppercase font-semibold" style={{ color: COLOR_B }}>{pB.label}</th>
                  <th className="px-3 py-2 text-center font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Δ</th>
                </tr>
              </thead>
              <tbody>
                {allCats.map((cat, i) => {
                  const cA = sA.cats[cat] ?? 0;
                  const cB = sB.cats[cat] ?? 0;
                  return (
                    <tr key={cat} className="hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: i < allCats.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <td className="px-3.5 py-2.5 font-semibold text-[#0B3954] text-[11px]">{cat}</td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-[12px]" style={{ color: COLOR_A }}>{cA}</td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-[12px]" style={{ color: COLOR_B }}>{cB}</td>
                      <td className="px-3 py-2.5 text-center"><DeltaBadge a={cB} b={cA} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auto-generated insight */}
        <div className="rounded-xl px-4 py-3.5 bg-purple-50 border border-purple-200">
          <div className="font-mono text-[9px] text-purple-600 uppercase tracking-widest mb-1">Period Insight</div>
          <p className="text-[12px] text-[#0B3954] leading-relaxed">
            {(() => {
              if (sA.totalAwards === 0 && sB.totalAwards === 0) return "No award data available for the selected periods.";
              if (sB.totalAwards === sA.totalAwards) return `Recognition volume was consistent between ${pA.label} and ${pB.label} at ${sA.totalAwards} awards.`;
              const pct = Math.round(Math.abs(sB.totalAwards - sA.totalAwards) / Math.max(sA.totalAwards, 1) * 100);
              const dir = sB.totalAwards > sA.totalAwards ? "increased" : "decreased";
              const topDeptB = Object.entries(sB.depts).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "";
              return `Recognition volume ${dir} by ${pct}% from ${pA.label} (${sA.totalAwards} awards) to ${pB.label} (${sB.totalAwards} awards).${topDeptB ? ` ${topDeptB} led recognition in ${pB.label} with ${sB.depts[topDeptB]} awards.` : ""}`;
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Sentiment Section ─────────────────────────────────────────────────────────
function SentimentSection({ sentiment }: { sentiment: DashboardData["sentiment"] }) {
  const [view, setView] = useState<"overview" | "dept" | "category">("overview");

  if (!sentiment.available) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <SH eye="Message Quality" title="Recognition Sentiment Analysis" />
        <div className="mt-4 py-8 flex flex-col items-center gap-3 text-gray-400">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/>
          </svg>
          <div className="text-[12px] font-medium text-center">
            Sentiment data not available.<br/>
            <span className="text-[11px] text-gray-300">Run <code className="bg-gray-100 text-gray-500 px-1 rounded">sentiment_pipeline.py</code> to generate scores.</span>
          </div>
        </div>
      </div>
    );
  }

  // Compound score → friendly label
  const overallLabel = sentiment.avgCompound >= 0.6 ? "Highly Positive"
    : sentiment.avgCompound >= 0.2 ? "Positive"
    : sentiment.avgCompound >= -0.1 ? "Neutral"
    : sentiment.avgCompound >= -0.4 ? "Negative"
    : "Highly Negative";
  const overallCfg = SENT_CFG[overallLabel];
  const totalDist   = sentiment.distribution.reduce((s, d) => s + d.count, 0) || 1;
  const positiveAwards = sentiment.distribution
    .filter(d => d.label === "Highly Positive" || d.label === "Positive")
    .reduce((s, d) => s + d.count, 0);
  const positivePct = Math.round((positiveAwards / totalDist) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <SH eye="Message Quality" title="Recognition Sentiment Analysis" />
          {/* Sub-nav */}
          <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
            {(["overview", "dept", "category"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all border-none"
                style={{
                  background: view === v ? "#0B3954" : "transparent",
                  color: view === v ? "#fff" : "#6C757D",
                }}>
                {v === "overview" ? "Overview" : v === "dept" ? "By Dept" : "By Category"}
              </button>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            {
              label: "Overall Sentiment",
              value: overallLabel,
              sub: `avg score ${sentiment.avgCompound.toFixed(2)}`,
              color: overallCfg.color,
              bg: overallCfg.bg,
              border: overallCfg.border,
              large: true,
            },
            {
              label: "Positive Messages",
              value: `${positivePct}%`,
              sub: `${positiveAwards.toLocaleString()} awards`,
              color: "#16A34A",
              bg: "#F0FDF4",
              border: "#BBF7D0",
            },
            {
              label: "Avg Word Count",
              value: Math.round(sentiment.avgWordCount).toString(),
              sub: "words per message",
              color: "#0F766E",
              bg: "#F0FDFA",
              border: "#99F6E4",
            },
            {
              label: "Messages Analysed",
              value: totalDist.toLocaleString(),
              sub: "total award messages",
              color: "#3B5BDB",
              bg: "#EFF6FF",
              border: "#BFDBFE",
            },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-3 relative overflow-hidden"
              style={{ background: k.bg, border: `1px solid ${k.border}` }}>
              <div className="font-mono text-[8px] uppercase tracking-widest mb-1.5"
                style={{ color: k.color }}>{k.label}</div>
              <div className="font-extrabold leading-none mb-1"
                style={{ fontSize: k.large ? 13 : 20, color: k.color }}>{k.value}</div>
              <div className="font-mono text-[9px] text-gray-400">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* OVERVIEW: distribution bar + breakdown */}
      {view === "overview" && (
        <div className="p-5 flex flex-col gap-5">

          {/* Stacked bar */}
          <div>
            <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-3">
              Message sentiment distribution
            </div>
            <div className="flex h-8 rounded-lg overflow-hidden gap-px">
              {(() => {
                const totalDist = sentiment.distribution.reduce((s, d) => s + d.count, 0) || 1;
                return sentiment.distribution.map(d => {
                  if (d.count === 0) return null;
                  const pct = Math.round((d.count / totalDist) * 100);
                  const cfg = SENT_CFG[d.label] || { color: "#888", bg: "#F8F9FA", border: "#E9ECEF" };
                  return (
                    <div key={d.label} title={`${d.label}: ${d.count} (${pct}%)`}
                      className="relative group flex items-center justify-center transition-opacity hover:opacity-90"
                      style={{ flex: d.count, background: cfg.color }}>
                      {pct >= 8 && (
                        <span className="font-mono text-[9px] font-bold text-white">{pct}%</span>
                      )}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#0B3954] text-white text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                        {d.label}: {d.count} ({pct}%)
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="flex gap-4 mt-2 flex-wrap">
              {sentiment.distribution.map(d => {
                const cfg = SENT_CFG[d.label] || { color: "#888" };
                return (
                  <div key={d.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.color }} />
                    <span className="font-mono text-[9px] text-gray-500">{d.label} ({d.count})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-label detail cards */}
          <div className="grid grid-cols-5 gap-3">
            {(() => {
              const totalDist = sentiment.distribution.reduce((s, d) => s + d.count, 0) || 1;
              return sentiment.distribution.map(d => {
                const pct = Math.round((d.count / totalDist) * 100);
                const cfg = SENT_CFG[d.label] || { color: "#888", bg: "#F8F9FA", border: "#E9ECEF", icon: "•" };
                return (
                  <div key={d.label} className="rounded-xl p-3 text-center"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <div className="text-lg mb-1">{cfg.icon}</div>
                    <div className="font-extrabold text-xl font-mono mb-0.5" style={{ color: cfg.color }}>
                      {pct}%
                    </div>
                    <div className="font-mono text-[9px] font-semibold mb-0.5" style={{ color: cfg.color }}>
                      {d.label}
                    </div>
                    <div className="font-mono text-[9px] text-gray-400">{d.count} awards</div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Insight callout */}
          <div className="p-3.5 rounded-xl flex gap-3"
            style={{ background: overallCfg.bg, border: `1px solid ${overallCfg.border}` }}>
            <span className="text-base shrink-0">💡</span>
            <div>
              <div className="font-mono text-[8px] font-bold uppercase tracking-widest mb-1"
                style={{ color: overallCfg.color }}>Recognition Culture Insight</div>
              <p className="text-[11.5px] text-[#0B3954] leading-relaxed">
                {positivePct >= 70
                  ? `${positivePct}% of recognition messages score positive or highly positive — a strong signal that recognition is genuine and heartfelt, not just obligatory. Avg compound score: ${sentiment.avgCompound.toFixed(2)}.`
                  : positivePct >= 50
                  ? `${positivePct}% of messages are positive. The culture is generally warm, but ${100 - positivePct}% of messages are neutral or below — consider coaching managers to write more specific, personal recognition.`
                  : `Only ${positivePct}% of messages score positive. Most recognition appears routine or perfunctory. Specific training on writing meaningful recognition messages could significantly improve culture health.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BY DEPARTMENT */}
      {view === "dept" && (
        <div className="p-5">
          <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-3">
            Average sentiment score by department
          </div>
          <div className="flex flex-col gap-2.5">
            {sentiment.byDepartment.map((d, i) => {
              const label = d.avgCompound >= 0.6 ? "Highly Positive"
                : d.avgCompound >= 0.2 ? "Positive"
                : d.avgCompound >= -0.1 ? "Neutral"
                : d.avgCompound >= -0.4 ? "Negative" : "Highly Negative";
              const cfg = SENT_CFG[label];
              const barW = Math.max(0, Math.min(100, ((d.avgCompound + 1) / 2) * 100));
              return (
                <div key={d.dept} className="flex items-center gap-3">
                  <div className="w-28 text-[11px] font-semibold text-[#0B3954] truncate shrink-0">{d.dept}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div className="h-full rounded-lg transition-[width] duration-700"
                      style={{ width: `${barW}%`, background: cfg.color }} />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="font-mono text-[9px] font-bold text-white mix-blend-normal"
                        style={{ color: barW > 30 ? "#fff" : cfg.color }}>
                        {d.avgCompound >= 0 ? "+" : ""}{d.avgCompound.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="w-20 text-right shrink-0">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {label.split(" ").pop()}
                    </span>
                  </div>
                  <div className="w-12 font-mono text-[9px] text-gray-400 text-right shrink-0">
                    {d.count} awards
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
            <span className="text-sm">📊</span>
            <p className="text-[11px] text-gray-500">
              <strong className="text-[#0B3954]">{sentiment.byDepartment[0]?.dept}</strong> leads with the most heartfelt recognition language.{" "}
              {sentiment.byDepartment.at(-1) && (
                <><strong className="text-[#0B3954]">{sentiment.byDepartment.at(-1)?.dept}</strong> has the lowest avg score — worth reviewing recognition practices there.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* BY CATEGORY */}
      {view === "category" && (
        <div className="p-5">
          <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-3">
            Average sentiment score by award category
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sentiment.byCategory.map(c => {
              const label = c.avgCompound >= 0.6 ? "Highly Positive"
                : c.avgCompound >= 0.2 ? "Positive"
                : c.avgCompound >= -0.1 ? "Neutral"
                : c.avgCompound >= -0.4 ? "Negative" : "Highly Negative";
              const cfg = SENT_CFG[label];
              const barW = Math.max(0, Math.min(100, ((c.avgCompound + 1) / 2) * 100));
              return (
                <div key={c.category} className="rounded-xl p-3.5"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-semibold text-[#0B3954] leading-tight">{c.category}</div>
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "#fff", color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {c.avgCompound >= 0 ? "+" : ""}{c.avgCompound.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: `${barW}%`, background: cfg.color }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-[9px] text-gray-400">{c.count} awards</span>
                    <span className="font-mono text-[9px] font-semibold" style={{ color: cfg.color }}>
                      {c.avgCompound >= 0 ? "+" : ""}{c.avgCompound.toFixed(2)} avg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function RecognitionActivity({ data }: { data: DashboardData }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const filteredMonthly = data.monthly;
  const maxMo = filteredMonthly.length > 0 ? Math.max(...filteredMonthly.map(d => d.awards)) : 1;
  const minMo = filteredMonthly.length > 0 ? Math.min(...filteredMonthly.map(d => d.awards)) : 0;

  const filteredCategories = data.categories
    .filter(c => catFilter === "All" || c.id === catFilter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const filteredSubcategories = data.subcategories
    .filter(s => catFilter === "All" || s.categoryId === catFilter)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()));

  const hasSearch = search !== "" || catFilter !== "All";

  return (
    <div className="flex flex-col gap-4">

      {/* Search + filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search categories or subcategories…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-white text-[#0B3954] outline-none focus:border-teal-400 transition-colors" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...data.categories.map(c => c.id)].map(id => (
            <button key={id} onClick={() => setCatFilter(id)}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer"
              style={{
                borderColor: catFilter === id ? (CAT_COLORS[id] || "#0B3954") : "#E9ECEF",
                background:  catFilter === id ? (CAT_COLORS[id] || "#0B3954") + "18" : "white",
                color:       catFilter === id ? (CAT_COLORS[id] || "#0B3954") : "#6C757D",
              }}>
              {id === "All" ? "All Categories" : `${id}: ${data.categories.find(c => c.id === id)?.name.split(" ")[0] || id}`}
            </button>
          ))}
        </div>
        {hasSearch && (
          <button onClick={() => { setSearch(""); setCatFilter("All"); }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] text-gray-400 cursor-pointer hover:bg-gray-50">
            Clear
          </button>
        )}
      </div>

      {hasSearch && (
        <div className="font-mono text-[10px] text-gray-400 px-1">
          Showing filtered results for &quot;{search || catFilter}&quot;
        </div>
      )}

      {/* Categories + Subcategories */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <SH eye="Behaviours Valued" title="Recognition by Category" />
            <ExportButton onClick={() => exportToCSV("recognition_by_category.csv",
              data.categories.map(c => ({ Category: c.name, Count: c.count, Percentage: `${c.pct}%` }))
            )} />
          </div>
          <div className="flex flex-col gap-2.5">
            {(filteredCategories.length > 0 ? filteredCategories : data.categories).map(c => (
              <div key={c.id}>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[c.id] || "#888" }} />
                    <span className="text-xs font-medium text-[#0B3954]">{c.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">{c.count} · {c.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded transition-[width] duration-700"
                    style={{ width: `${c.pct}%`, background: CAT_COLORS[c.id] || "#F96400" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Detail" title="Top Behaviour Subcategories" />
          <div className="flex flex-col gap-2">
            {(filteredSubcategories.length > 0 ? filteredSubcategories : data.subcategories).slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded grid place-items-center shrink-0"
                  style={{ background: CAT_COLORS[s.categoryId] || "#888" }}>
                  <span className="font-mono text-[8px] text-white font-bold">{s.id}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[11px] text-[#0B3954] font-medium">{s.name}</span>
                    <span className="font-mono text-[10px] text-gray-500">{s.count}</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full rounded"
                      style={{ width: `${(s.count / (data.subcategories[0]?.count || 1)) * 100}%`, background: CAT_COLORS[s.categoryId] || "#888" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <SH eye="Activity Trend" title="Recognition Frequency Over Time"
          right={<span className="font-mono text-[10px] text-gray-500">Peak {maxMo} · Low {minMo} events/month</span>} />
        <LineChart d={filteredMonthly} />
      </div>

      {/* ── SENTIMENT ANALYSIS ──────────────────────────────────────────────── */}
      <SentimentSection sentiment={data.sentiment} />

      {/* Period Comparison */}
      <PeriodComparison data={data} />

    </div>
  );
}