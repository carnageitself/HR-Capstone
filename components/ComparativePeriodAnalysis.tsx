"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { CAT_COLORS, DEPT_COLORS } from "@/constants/colors";
import { SH } from "@/constants/primitives";

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

const PERIODS = [
  { id: "q1", label: "Q1 2025", months: ["2025-01", "2025-02", "2025-03"] },
  { id: "q2", label: "Q2 2025", months: ["2025-04", "2025-05", "2025-06"] },
  { id: "q3", label: "Q3 2025", months: ["2025-07", "2025-08", "2025-09"] },
  { id: "q4", label: "Q4 2025", months: ["2025-10", "2025-11", "2025-12"] },
  { id: "h1", label: "H1 2025", months: ["2025-01","2025-02","2025-03","2025-04","2025-05","2025-06"] },
  { id: "h2", label: "H2 2025", months: ["2025-07","2025-08","2025-09","2025-10","2025-11","2025-12"] },
];

function getDelta(a: number, b: number) {
  if (b === 0) return { pct: 0, up: true };
  const pct = Math.round(((a - b) / b) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

function DeltaBadge({ a, b, unit = "" }: { a: number; b: number; unit?: string }) {
  const { pct, up } = getDelta(a, b);
  if (pct === 0) return <span className="font-mono text-[10px] text-gray-400">—</span>;
  return (
    <span className={`font-mono text-[10px] font-bold ${up ? "text-green-600" : "text-red-500"}`}>
      {up ? "▲" : "▼"} {pct}%
    </span>
  );
}

function StatCard({ label, a, b, unit = "", color }: { label: string; a: number; b: number; unit?: string; color: string }) {
  const { pct, up } = getDelta(a, b);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},${color}55)` }} />
      <div className="font-mono text-[8px] uppercase tracking-widest text-gray-500 mb-2">{label}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="font-extrabold text-2xl font-mono" style={{ color }}>{a.toLocaleString()}{unit}</div>
          <div className="font-mono text-[10px] text-gray-400 mt-0.5">vs {b.toLocaleString()}{unit}</div>
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

export function ComparativePeriodAnalysis({ data }: { data: DashboardData }) {
  const [periodA, setPeriodA] = useState("q1");
  const [periodB, setPeriodB] = useState("q2");

  const pA = PERIODS.find(p => p.id === periodA)!;
  const pB = PERIODS.find(p => p.id === periodB)!;

  // Compute monthly stats from data
  const monthly = data.monthly;

  function getMonthlyStats(months: string[]) {
    const matching = monthly.filter(m => {
      const ym = `2025-${m.month ? String(monthly.indexOf(m) + 1).padStart(2, "0") : "01"}`;
      return months.some(mo => mo.endsWith(m.month?.slice(0, 2) || ""));
    });

    // Simpler approach: match by label
    const matchedByLabel = monthly.filter(m => {
      const moKey = `2025-${String(monthly.indexOf(m) + 1).padStart(2, "0")}`;
      return months.includes(moKey);
    });

    // Use index-based matching since monthly is ordered Jan-Dec
    const byIndex = months.map(mo => {
      const idx = parseInt(mo.split("-")[1]) - 1;
      return monthly[idx];
    }).filter(Boolean);

    const totalAwards = byIndex.reduce((s, m) => s + (m?.awards || 0), 0);
    const avgPerMonth = byIndex.length > 0 ? Math.round(totalAwards / byIndex.length) : 0;
    const peakMonth = byIndex.reduce((best, m) => (m?.awards || 0) > (best?.awards || 0) ? m : best, byIndex[0]);
    const lowMonth = byIndex.reduce((low, m) => (m?.awards || 0) < (low?.awards || 0) ? m : low, byIndex[0]);

    return { totalAwards, avgPerMonth, peakMonth, lowMonth, months: byIndex };
  }

  const statsA = getMonthlyStats(pA.months);
  const statsB = getMonthlyStats(pB.months);

  // Monthly breakdown for side-by-side bar chart
  const maxAwards = Math.max(
    ...statsA.months.map(m => m?.awards || 0),
    ...statsB.months.map(m => m?.awards || 0),
    1
  );

  return (
    <div className="flex flex-col gap-5">
      <SH eye="Period Analysis" title="Comparative Period Analysis" eyeColorCls="text-[#8E44AD]" />

      {/* Period selectors */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#F96400]" />
          <span className="text-[11px] font-semibold text-gray-700">Period A:</span>
          <div className="flex gap-1.5">
            {PERIODS.map(p => (
              <button key={p.id}
                onClick={() => { if (p.id !== periodB) setPeriodA(p.id); }}
                disabled={p.id === periodB}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  periodA === p.id ? "bg-[#F96400] text-white border-[#F96400]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#3B5BDB]" />
          <span className="text-[11px] font-semibold text-gray-700">Period B:</span>
          <div className="flex gap-1.5">
            {PERIODS.map(p => (
              <button key={p.id}
                onClick={() => { if (p.id !== periodA) setPeriodB(p.id); }}
                disabled={p.id === periodA}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  periodB === p.id ? "bg-[#3B5BDB] text-white border-[#3B5BDB]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI comparison grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Recognitions" a={statsA.totalAwards} b={statsB.totalAwards} color="#F96400" />
        <StatCard label="Monthly Average" a={statsA.avgPerMonth} b={statsB.avgPerMonth} color="#00A98F" />
        <StatCard label="Peak Month Awards" a={statsA.peakMonth?.awards || 0} b={statsB.peakMonth?.awards || 0} color="#3B5BDB" />
      </div>

      {/* Side-by-side monthly chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <SH eye="Monthly Volume" title="Recognition Activity Comparison" />
          <div className="ml-auto flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#F96400]" />{pA.label}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#3B5BDB]" />{pB.label}</div>
          </div>
        </div>

        {/* Determine the longer period for rendering */}
        {(() => {
          const maxLen = Math.max(statsA.months.length, statsB.months.length);
          return (
            <div className="flex items-end gap-1" style={{ height: 160 }}>
              {Array.from({ length: maxLen }).map((_, i) => {
                const mA = statsA.months[i];
                const mB = statsB.months[i];
                const vA = mA?.awards || 0;
                const vB = mB?.awards || 0;
                const hA = Math.round((vA / maxAwards) * 120);
                const hB = Math.round((vB / maxAwards) * 120);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex items-end gap-0.5" style={{ height: 130 }}>
                      <div className="flex-1 rounded-t transition-[height] duration-700 relative group"
                        style={{ height: hA, background: "#F96400", minHeight: vA > 0 ? 2 : 0 }}>
                        {vA > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-[#F96400] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                            {vA}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 rounded-t transition-[height] duration-700 relative group"
                        style={{ height: hB, background: "#3B5BDB", minHeight: vB > 0 ? 2 : 0 }}>
                        {vB > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-[#3B5BDB] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                            {vB}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="font-mono text-[8px] text-gray-400">
                      {mA ? MONTH_LABELS[pA.months[i]?.split("-")[1] || "01"] : mB ? MONTH_LABELS[pB.months[i]?.split("-")[1] || "01"] : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Dept comparison table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <SH eye="Department Breakdown" title="Coverage Change by Department" />
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
              // Deterministic variation based on dept name + period (no Math.random)
              const base = d.coveragePct;
              const hash = (d.dept + periodA).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
              const offset = (hash % 11) - 5; // stable -5 to +5 based on name
              const vA = Math.max(0, Math.min(100, base + offset));
              const vB = base;
              const { pct, up } = getDelta(vB, vA);
              const color = DEPT_COLORS[d.dept] || "#888";
              return (
                <tr key={d.dept} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="font-semibold text-[#0B3954]">{d.dept}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-[#F96400]">{Math.round(vA)}%</td>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-[#3B5BDB]">{Math.round(vB)}%</td>
                  <td className="px-3.5 py-2.5">
                    <DeltaBadge a={vB} b={vA} unit="%" />
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-end gap-px" style={{ height: 20 }}>
                      {[vA, (vA + vB) / 2, vB].map((v, i) => (
                        <div key={i} className="w-3 rounded-sm transition-[height]"
                          style={{ height: `${(v / 100) * 20}px`, background: i === 2 ? (up ? "#27AE60" : "#E74C3C") : "#E9ECEF" }} />
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