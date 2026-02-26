"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { DEPT_COLORS } from "@/constants/colors";

export function CrossDeptMap({ intel }: { intel: DashboardData["intelligence"] }) {
  const [highlight, setHighlight] = useState<string | null>(null);
  const [view, setView] = useState<"matrix" | "givers" | "receivers">("matrix");
  const depts = intel.depts;
  const matrix: Record<string, Record<string, number>> = {};
  intel.crossDeptFlow.forEach(f => { if (!matrix[f.from]) matrix[f.from] = {}; matrix[f.from][f.to] = f.value; });
  const getVal = (from: string, to: string) => from === to ? null : (matrix[from]?.[to] || 0);
  const maxFlow = Math.max(...intel.crossDeptFlow.map(f => f.value), 1);
  const heatBg = (v: number) => { const t = v / maxFlow; return `rgb(${Math.round(249 * t + 240 * (1 - t))},${Math.round(100 * t + 240 * (1 - t))},${Math.round(240 * (1 - t))})`; };
  const givers = depts.map(d => ({ dept: d, total: depts.reduce((s, r) => d !== r ? s + (getVal(d, r) || 0) : s, 0) })).sort((a, b) => b.total - a.total);
  const receivers = depts.map(d => ({ dept: d, total: depts.reduce((s, g) => d !== g ? s + (getVal(g, d) || 0) : s, 0), sources: depts.filter(g => d !== g && (getVal(g, d) || 0) > 0).length })).sort((a, b) => b.total - a.total);
  const maxG = givers[0]?.total || 1, maxR = receivers[0]?.total || 1;

  return (
    <div>
      <div className="bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-200 rounded-xl p-3 mb-4 flex gap-2">
        <span className="text-lg">🗺️</span>
        <p className="text-[11px] text-[#0B3954] leading-relaxed"><strong>Cross-dept recognition reveals your org&apos;s informal influence network.</strong> High-outflow depts are culture amplifiers. Low inflow depts may be siloed.</p>
      </div>
      <div className="flex gap-1.5 mb-3.5">
        {([{ id: "matrix" as const, label: "Heat Map" }, { id: "givers" as const, label: "🏆 Top Givers" }, { id: "receivers" as const, label: "⭐ Top Receivers" }]).map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${view === v.id ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 bg-white text-gray-500"}`}>
            {v.label}
          </button>
        ))}
      </div>
      {view === "matrix" && (
        <div className="overflow-x-auto">
          <table className="border-collapse text-[10px]" style={{ minWidth: 600 }}>
            <thead><tr>
              <th className="px-2 py-1.5 font-mono text-[8px] text-gray-500 uppercase border-b-2 border-gray-200 text-left min-w-[90px]">FROM↓ TO→</th>
              {depts.map(d => (
                <th key={d} onClick={() => setHighlight(highlight === d ? null : d)}
                  className="px-1 py-1 font-mono text-[7px] text-center border-b-2 border-gray-200 cursor-pointer min-w-[48px] transition-colors"
                  style={{ color: highlight === d ? (DEPT_COLORS[d] || "#0B3954") : "#6C757D", fontWeight: highlight === d ? 700 : 400 }}>
                  {d.slice(0, 7)}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {depts.map(from => (
                <tr key={from}>
                  <td onClick={() => setHighlight(highlight === from ? null : from)}
                    className="px-2 py-0.5 font-mono text-[8px] border-b border-gray-100 cursor-pointer whitespace-nowrap"
                    style={{ color: highlight === from ? (DEPT_COLORS[from] || "#0B3954") : "#6C757D", fontWeight: highlight === from ? 700 : 400 }}>
                    {from}
                  </td>
                  {depts.map(to => {
                    const v = getVal(from, to); const isSelf = from === to;
                    const isHL = highlight && (highlight === from || highlight === to);
                    return (
                      <td key={to} className="px-1 py-0.5 text-center border-b border-gray-100 transition-opacity"
                        style={{ background: isSelf ? "#F8F9FA" : v ? heatBg(v) : "transparent", opacity: highlight && !isHL ? 0.2 : 1 }}>
                        {isSelf ? <span className="text-gray-200">—</span> : v ? <span className="font-mono text-[9px] font-bold" style={{ color: v >= maxFlow * 0.6 ? "white" : v >= maxFlow * 0.35 ? "#B03A2E" : "#6C757D" }}>{v}</span> : <span className="text-gray-200 text-[8px]">·</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view === "givers" && (
        <div className="flex flex-col gap-2">
          {givers.map((g, i) => (
            <div key={g.dept} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border ${i === 0 ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200"}`}>
              <div className="w-6 h-6 rounded-md grid place-items-center text-white font-extrabold text-[10px] shrink-0" style={{ background: DEPT_COLORS[g.dept] || "#888" }}>{i + 1}</div>
              <div className="flex-1"><div className="font-semibold text-xs text-[#0B3954]">{g.dept}</div><div className="text-[10px] text-gray-500">Champions {g.total} employees in other depts</div></div>
              <div className="w-24 h-1.5 bg-gray-200 rounded overflow-hidden"><div className="h-full rounded" style={{ width: `${(g.total / maxG) * 100}%`, background: DEPT_COLORS[g.dept] || "#888" }} /></div>
              <div className="font-mono font-extrabold text-sm min-w-[20px] text-right" style={{ color: i === 0 ? "#00A98F" : "#0B3954" }}>{g.total}</div>
            </div>
          ))}
        </div>
      )}
      {view === "receivers" && (
        <div className="flex flex-col gap-2">
          {receivers.map((r, i) => (
            <div key={r.dept} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border ${i === 0 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
              <div className="w-6 h-6 rounded-md grid place-items-center text-white font-extrabold text-[10px] shrink-0" style={{ background: DEPT_COLORS[r.dept] || "#888" }}>{i + 1}</div>
              <div className="flex-1"><div className="font-semibold text-xs text-[#0B3954]">{r.dept}</div><div className="text-[10px] text-gray-500">Recognized by {r.sources} depts · {r.total} cross-dept awards</div></div>
              <div className="w-24 h-1.5 bg-gray-200 rounded overflow-hidden"><div className="h-full rounded" style={{ width: `${(r.total / maxR) * 100}%`, background: DEPT_COLORS[r.dept] || "#888" }} /></div>
              <div className="font-mono font-extrabold text-sm min-w-[20px] text-right" style={{ color: i === 0 ? "#F96400" : "#0B3954" }}>{r.total}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
