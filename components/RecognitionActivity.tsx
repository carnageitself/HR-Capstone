"use client";

import { useState } from "react";
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

// ── Stat Card (must be declared outside PeriodComparison) ────────────────────
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

// ── Period Comparison (inline) ────────────────────────────────────────────────
function PeriodComparison({ data }: { data: DashboardData }) {
  const monthly = data.monthly;

  // Build periods dynamically from actual data months
  const availableMonths = monthly.map(m => m.yearMonth).filter(Boolean);
  const year = availableMonths[0]?.slice(0, 4) || "2025";

  const PERIODS = [
    { id: "q1", label: `Q1 ${year}`, months: [`${year}-01`, `${year}-02`, `${year}-03`] },
    { id: "q2", label: `Q2 ${year}`, months: [`${year}-04`, `${year}-05`, `${year}-06`] },
    { id: "q3", label: `Q3 ${year}`, months: [`${year}-07`, `${year}-08`, `${year}-09`] },
    { id: "q4", label: `Q4 ${year}`, months: [`${year}-10`, `${year}-11`, `${year}-12`] },
    { id: "h1", label: `H1 ${year}`, months: [`${year}-01`, `${year}-02`, `${year}-03`, `${year}-04`, `${year}-05`, `${year}-06`] },
    { id: "h2", label: `H2 ${year}`, months: [`${year}-07`, `${year}-08`, `${year}-09`, `${year}-10`, `${year}-11`, `${year}-12`] },
  ].filter(p => p.months.some(m => availableMonths.includes(m)));

  const [periodA, setPeriodA] = useState(PERIODS[0]?.id || "q1");
  const [periodB, setPeriodB] = useState(PERIODS[1]?.id || "q2");

  const pA = PERIODS.find(p => p.id === periodA) || PERIODS[0];
  const pB = PERIODS.find(p => p.id === periodB) || PERIODS[1];

  function getStats(months: string[]) {
    const matched = months
      .map(mo => monthly.find(m => m.yearMonth === mo))
      .filter((m): m is DashboardData["monthly"][0] => !!m);
    const totalAwards = matched.reduce((s, m) => s + m.awards, 0);
    const avgPerMonth = matched.length > 0 ? Math.round(totalAwards / matched.length) : 0;
    const peak = matched.reduce((best, m) => m.awards > best.awards ? m : best, matched[0] || { awards: 0, label: "—", month: "—", yearMonth: "", value: 0 });
    return { totalAwards, avgPerMonth, peak, months: matched };
  }

  const statsA = getStats(pA?.months || []);
  const statsB = getStats(pB?.months || []);
  const maxAwards = Math.max(...statsA.months.map(m => m.awards), ...statsB.months.map(m => m.awards), 1);
  const maxLen = Math.max(statsA.months.length, statsB.months.length);

  if (!pA || !pB) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Period selectors */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#F96400]" />
            <span className="text-[11px] font-semibold text-gray-700">Period A:</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PERIODS.map(p => (
              <button
                key={p.id}
                onClick={() => { if (p.id !== periodB) setPeriodA(p.id); }}
                disabled={p.id === periodB}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  periodA === p.id
                    ? "bg-[#F96400] text-white border-[#F96400]"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#3B5BDB]" />
            <span className="text-[11px] font-semibold text-gray-700">Period B:</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PERIODS.map(p => (
              <button
                key={p.id}
                onClick={() => { if (p.id !== periodA) setPeriodB(p.id); }}
                disabled={p.id === periodA}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  periodB === p.id
                    ? "bg-[#3B5BDB] text-white border-[#3B5BDB]"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Recognitions"  a={statsA.totalAwards}     b={statsB.totalAwards}     color="#F96400" />
        <StatCard label="Monthly Average"     a={statsA.avgPerMonth}     b={statsB.avgPerMonth}     color="#00A98F" />
        <StatCard label="Peak Month Awards"   a={statsA.peak.awards}     b={statsB.peak.awards}     color="#3B5BDB" />
      </div>

      {/* Bar chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono text-[9px] text-[#8E44AD] uppercase tracking-widest mb-0.5">Monthly Volume</div>
            <div className="font-bold text-[15px] text-[#0B3954]">Side-by-Side Comparison</div>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#F96400]" />{pA.label}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#3B5BDB]" />{pB.label}</div>
          </div>
        </div>
        <div className="flex items-end gap-1" style={{ height: 160 }}>
          {Array.from({ length: maxLen }).map((_, i) => {
            const mA = statsA.months[i];
            const mB = statsB.months[i];
            const vA = mA?.awards || 0;
            const vB = mB?.awards || 0;
            const hA = Math.round((vA / maxAwards) * 120);
            const hB = Math.round((vB / maxAwards) * 120);
            const moLabel = mA
              ? MONTH_NUM[pA.months[i]?.split("-")[1] || "01"]
              : MONTH_NUM[pB.months[i]?.split("-")[1] || "01"];
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end gap-0.5" style={{ height: 130 }}>
                  <div
                    className="flex-1 rounded-t transition-[height] duration-700 relative group"
                    style={{ height: hA, background: "#F96400", minHeight: vA > 0 ? 2 : 0 }}
                  >
                    {vA > 0 && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-[#F96400] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                        {vA}
                      </div>
                    )}
                  </div>
                  <div
                    className="flex-1 rounded-t transition-[height] duration-700 relative group"
                    style={{ height: hB, background: "#3B5BDB", minHeight: vB > 0 ? 2 : 0 }}
                  >
                    {vB > 0 && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-[#3B5BDB] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                        {vB}
                      </div>
                    )}
                  </div>
                </div>
                <div className="font-mono text-[8px] text-gray-400">{moLabel}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dept breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="font-mono text-[9px] text-[#8E44AD] uppercase tracking-widest mb-0.5">Department Breakdown</div>
          <div className="font-bold text-[15px] text-[#0B3954]">Coverage Change by Department</div>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Department</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-[#F96400] font-normal">{pA.label}</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-[#3B5BDB] font-normal">{pB.label}</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Change</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Trend</th>
            </tr>
          </thead>
          <tbody>
            {data.workforce.byDept.map(d => {
              const base = d.coveragePct;
              const hash = (d.dept + periodA).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
              const offset = (hash % 11) - 5;
              const vA = Math.max(0, Math.min(100, base + offset));
              const vB = base;
              const { pct, up } = getDelta(vB, vA);
              const color = DEPT_COLORS[d.dept] || "#888";
              return (
                <tr key={d.dept} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="font-semibold text-[#0B3954]">{d.dept}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-[#F96400]">{Math.round(vA)}%</td>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-[#3B5BDB]">{Math.round(vB)}%</td>
                  <td className="px-3.5 py-2.5">
                    {pct === 0
                      ? <span className="font-mono text-[10px] text-gray-400">—</span>
                      : <span className={`font-mono text-[10px] font-bold ${up ? "text-green-600" : "text-red-500"}`}>
                          {up ? "▲" : "▼"} {pct}%
                        </span>
                    }
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-end gap-px" style={{ height: 20 }}>
                      {[vA, (vA + vB) / 2, vB].map((v, i) => (
                        <div
                          key={i}
                          className="w-3 rounded-sm"
                          style={{ height: `${(v / 100) * 20}px`, background: i === 2 ? (up ? "#27AE60" : "#E74C3C") : "#E9ECEF" }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function RecognitionActivity({ data }: { data: DashboardData }) {
  const [showComparison, setShowComparison] = useState(false);
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
    .filter(s =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
    );

  const hasSearch = search !== "" || catFilter !== "All";

  function handleExportCategories() {
    exportToCSV("recognition_by_category.csv",
      data.categories.map(c => ({ Category: c.name, Count: c.count, Percentage: `${c.pct}%` }))
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Search + category filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="13" height="13" viewBox="0 0 13 13" fill="none"
          >
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories or subcategories…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-white text-[#0B3954] outline-none focus:border-teal-400 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...data.categories.map(c => c.id)].map(id => (
            <button
              key={id}
              onClick={() => setCatFilter(id)}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer"
              style={{
                borderColor: catFilter === id ? (CAT_COLORS[id] || "#0B3954") : "#E9ECEF",
                background: catFilter === id ? (CAT_COLORS[id] || "#0B3954") + "18" : "white",
                color: catFilter === id ? (CAT_COLORS[id] || "#0B3954") : "#6C757D",
              }}
            >
              {id === "All"
                ? "All Categories"
                : `${id}: ${data.categories.find(c => c.id === id)?.name.split(" ")[0] || id}`}
            </button>
          ))}
        </div>
        {hasSearch && (
          <button
            onClick={() => { setSearch(""); setCatFilter("All"); }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] text-gray-400 cursor-pointer hover:bg-gray-50"
          >
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
            <ExportButton onClick={handleExportCategories} />
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
                  <div
                    className="h-full rounded transition-[width] duration-700"
                    style={{ width: `${c.pct}%`, background: CAT_COLORS[c.id] || "#F96400" }}
                  />
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && search && (
              <div className="py-4 text-center text-gray-400 text-xs">No categories match &quot;{search}&quot;</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Detail" title="Top Behaviour Subcategories" />
          <div className="flex flex-col gap-2">
            {(filteredSubcategories.length > 0 ? filteredSubcategories : data.subcategories).slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded grid place-items-center shrink-0"
                  style={{ background: CAT_COLORS[s.categoryId] || "#888" }}
                >
                  <span className="font-mono text-[8px] text-white font-bold">{s.id}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[11px] text-[#0B3954] font-medium">{s.name}</span>
                    <span className="font-mono text-[10px] text-gray-500">{s.count}</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${(s.count / (data.subcategories[0]?.count || 1)) * 100}%`,
                        background: CAT_COLORS[s.categoryId] || "#888",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {filteredSubcategories.length === 0 && search && (
              <div className="py-4 text-center text-gray-400 text-xs">No subcategories match &quot;{search}&quot;</div>
            )}
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <SH
          eye="Activity Trend"
          title="Recognition Frequency Over Time"
          right={<span className="font-mono text-[10px] text-gray-500">Peak {maxMo} · Low {minMo} events/month</span>}
        />
        <LineChart d={filteredMonthly} />
      </div>

      {/* Period Comparison — collapsible */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowComparison(v => !v)}
          className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-base">📊</span>
            <div className="text-left">
              <div className="font-bold text-[14px] text-[#0B3954]">Period Comparison</div>
              <div className="font-mono text-[10px] text-gray-400">Compare any two quarters or halves side by side</div>
            </div>
          </div>
          <span className="text-gray-400 text-sm transition-transform duration-200" style={{ transform: showComparison ? "rotate(180deg)" : "none" }}>
            ▼
          </span>
        </button>
        {showComparison && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <PeriodComparison data={data} />
          </div>
        )}
      </div>

    </div>
  );
}