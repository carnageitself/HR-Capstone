"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";

export function EquityLens({ intel }: { intel: DashboardData["intelligence"] }) {
  const [metric, setMetric] = useState<"count" | "avg_value" | "high_value_pct">("count");
  const ORDER = ["IC", "Senior IC", "Manager", "Senior Manager", "Director", "VP"];
  const sorted = [...intel.equityData].sort((a, b) => ORDER.indexOf(a.recipient_seniority) - ORDER.indexOf(b.recipient_seniority));
  const vals = sorted.map(x => metric === "count" ? x.count : metric === "avg_value" ? x.avg_value : x.high_value_pct);
  const maxVal = Math.max(...vals, 1);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
  const cv = ((std / mean) * 100).toFixed(1);
  const SEN_COLORS: Record<string, string> = { "IC": "#45B7D1", "Senior IC": "#4ECDC4", "Manager": "#F9CA24", "Senior Manager": "#F96400", "Director": "#FF6B6B", "VP": "#6C5CE7" };
  const getRowVal = (row: typeof sorted[0]) => metric === "count" ? { v: row.count, fmt: String(row.count) } : metric === "avg_value" ? { v: row.avg_value, fmt: `$${row.avg_value}` } : { v: row.high_value_pct, fmt: `${row.high_value_pct}%` };
  const isGood = parseFloat(cv) < 15;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className={`p-3 rounded-xl border ${isGood ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
          <div className={`font-mono text-[8px] uppercase tracking-widest mb-1 ${isGood ? "text-green-700" : "text-yellow-700"}`}>Equity Score</div>
          <div className={`font-extrabold text-2xl ${isGood ? "text-green-600" : "text-yellow-500"}`}>{isGood ? "✓ Fair" : "~ Moderate"}</div>
          <div className={`text-[10px] mt-0.5 ${isGood ? "text-green-700" : "text-yellow-700"}`}>CV = {cv}%</div>
        </div>
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
          <div className="font-mono text-[8px] text-indigo-600 uppercase tracking-widest mb-1">Most Recognized</div>
          <div className="font-bold text-[13px] text-[#0B3954]">{[...intel.equityData].sort((a, b) => b.count - a.count)[0]?.recipient_seniority}</div>
          <div className="text-[10px] text-indigo-600">{[...intel.equityData].sort((a, b) => b.count - a.count)[0]?.count} awards</div>
        </div>
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
          <div className="font-mono text-[8px] text-orange-500 uppercase tracking-widest mb-1">Highest Avg Value</div>
          <div className="font-bold text-[13px] text-[#0B3954]">{[...intel.equityData].sort((a, b) => b.avg_value - a.avg_value)[0]?.recipient_seniority}</div>
          <div className="text-[10px] text-orange-500">${[...intel.equityData].sort((a, b) => b.avg_value - a.avg_value)[0]?.avg_value} avg</div>
        </div>
      </div>
      <div className="flex gap-1.5 mb-3.5">
        {([{ id: "count" as const, label: "Award Count" }, { id: "avg_value" as const, label: "Avg Value" }, { id: "high_value_pct" as const, label: "High-Value Rate" }]).map(m => (
          <button key={m.id} onClick={() => setMetric(m.id)}
            className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${metric === m.id ? "bg-[#0B3954] border-[#0B3954] text-white" : "bg-white border-gray-200 text-gray-500"}`}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3.5">
        <div className="flex flex-col gap-3">
          {sorted.map(row => {
            const { v, fmt } = getRowVal(row); const pct = (v / maxVal) * 100; const color = SEN_COLORS[row.recipient_seniority] || "#888";
            return (
              <div key={row.recipient_seniority}>
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-semibold text-[#0B3954]">{row.recipient_seniority}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold" style={{ color }}>{fmt}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded transition-[width] duration-700" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-indigo-50 rounded-xl p-3.5 flex gap-2">
        <span className="text-base">⚖️</span>
        <p className="text-[11px] text-[#0B3954] leading-relaxed">Distribution across seniority levels shows CV of <strong>{cv}%</strong>. {isGood ? " Recognition is distributed equitably — not skewed toward senior employees." : " Consider reviewing whether ICs are being overlooked relative to VPs."} Benchmark target: all levels within <strong>±15%</strong>.</p>
      </div>
    </div>
  );
}
