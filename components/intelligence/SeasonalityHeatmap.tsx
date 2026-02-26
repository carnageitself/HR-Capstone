"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { CAT_COLORS } from "@/constants/colors";

export function SeasonalityHeatmap({ intel }: { intel: DashboardData["intelligence"] }) {
  const [metric, setMetric] = useState<"total" | string>("total");
  const cats = ["A", "B", "C", "D", "E", "F"];
  const CAT_FULL: Record<string, string> = { A: "Leadership", B: "Innovation", C: "Customer", D: "Collaboration", E: "Growth", F: "Operations" };
  const months = intel.seasonality;
  const getCellVal = (m: typeof months[0]) => metric === "total" ? m.total : (m.byCategory[metric] || 0);
  const maxCell = Math.max(...months.map(m => getCellVal(m)), 1);

  const heatColor = (v: number, max: number, catId?: string) => {
    const t = v / max;
    const baseColor = catId ? CAT_COLORS[catId] : "#0B3954";
    if (t === 0) return "transparent";
    const hex = baseColor.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${0.1 + t * 0.85})`;
  };

  return (
    <div>
      <div className="bg-gradient-to-br from-indigo-50 to-teal-50 border border-indigo-200 rounded-xl p-3.5 mb-4 flex gap-2.5">
        <span className="text-lg">📅</span>
        <p className="text-[11px] text-[#0B3954] leading-relaxed">
          <strong>Recognition behaviour has seasonal patterns.</strong> Understanding when each category peaks helps HR time manager nudges and review cycles.
        </p>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setMetric("total")}
          className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${metric === "total" ? "bg-[#0B3954] border-[#0B3954] text-white" : "bg-white border-gray-200 text-gray-500"}`}>
          Total Volume
        </button>
        {cats.map(c => (
          <button key={c} onClick={() => setMetric(c)}
            className="px-3.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all"
            style={{ borderColor: metric === c ? CAT_COLORS[c] : "#E9ECEF", background: metric === c ? CAT_COLORS[c] + "18" : "white", color: metric === c ? CAT_COLORS[c] : "#6C757D" }}>
            {c}: {CAT_FULL[c]}
          </button>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="grid gap-1" style={{ gridTemplateColumns: "80px repeat(12,1fr)", alignItems: "center" }}>
          <div className="font-mono text-[8px] text-gray-500 uppercase">Month</div>
          {months.map(m => <div key={m.month} className="text-center font-mono text-[9px] text-gray-500 font-medium">{m.monthName}</div>)}
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-wide">Volume</div>
          {months.map(m => {
            const v = getCellVal(m); const t = v / maxCell;
            return (
              <div key={m.month} className="flex flex-col items-center gap-0.5">
                <div className="w-full h-10 bg-gray-50 rounded-md overflow-hidden flex items-end">
                  <div className="w-full rounded opacity-90 transition-[height] duration-300"
                    style={{ height: `${t * 100}%`, background: metric === "total" ? "#3B5BDB" : CAT_COLORS[metric] || "#3B5BDB" }} />
                </div>
                <span className="font-mono text-[9px] font-bold text-[#0B3954]">{v}</span>
              </div>
            );
          })}
          {cats.map(cat => (
            <>
              <div key={`l${cat}`} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CAT_COLORS[cat] }} />
                <span className="font-mono text-[8px] text-gray-500">{cat}</span>
              </div>
              {months.map(m => {
                const v = m.byCategory[cat] || 0;
                const maxCat = Math.max(...months.map(mo => mo.byCategory[cat] || 0), 1);
                const t = v / maxCat;
                const isDom = m.dominantCategory === cat;
                return (
                  <div key={`${cat}${m.month}`} title={`${CAT_FULL[cat]} in ${m.monthName}: ${v} awards`}
                    className="h-6 rounded-md grid place-items-center"
                    style={{ background: heatColor(v, maxCat, cat), border: isDom ? `1px solid ${CAT_COLORS[cat]}` : "1px solid transparent" }}>
                    {v > 0 && <span className="font-mono text-[8px] font-bold" style={{ color: t > 0.5 ? "white" : "#0B3954" }}>{v}</span>}
                  </div>
                );
              })}
            </>
          ))}
        </div>
        <div className="mt-3.5 flex gap-4 flex-wrap">
          {cats.map(c => {
            const peakMonth = months.reduce((best, m) => (m.byCategory[c] || 0) > (best.byCategory[c] || 0) ? m : best, months[0]);
            return (
              <div key={c} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[c] }} />
                <span className="text-[10px] text-gray-500">{CAT_FULL[c]}: peaks <strong className="text-[#0B3954]">{peakMonth?.monthName}</strong></span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
