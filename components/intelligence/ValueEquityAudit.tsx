"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { DEPT_COLORS } from "@/constants/colors";

export function ValueEquityAudit({ intel }: { intel: DashboardData["intelligence"] }) {
  const [view, setView] = useState<"dept" | "seniority">("dept");
  const ve = intel.valueEquity;
  const maxDeptVal = Math.max(...ve.byDept.map(d => d.total), 1);
  const gini = ve.concentration.giniCoeff;
  const equityLevel = gini < 0.3 ? "Highly Equitable" : gini < 0.45 ? "Moderately Equitable" : "Concentrated";
  const equityCls = gini < 0.3 ? "text-green-600" : gini < 0.45 ? "text-yellow-500" : "text-red-500";

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">Gini Coefficient</div>
          <div className={`font-extrabold text-2xl font-mono ${equityCls}`}>{gini}</div>
          <div className={`text-[10px] font-semibold mt-1 ${equityCls}`}>{equityLevel}</div>
          <div className="text-[9px] text-gray-400 mt-0.5">0 = perfect equality · 1 = maximum concentration</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">Top 10 Earners</div>
          <div className="font-extrabold text-2xl font-mono text-[#F96400]">{ve.concentration.top10Pct}%</div>
          <div className="text-[10px] text-gray-500 mt-1">${ve.concentration.top10Value.toLocaleString()} of total value</div>
          <div className={`text-[9px] font-semibold mt-0.5 ${ve.concentration.top10Pct < 20 ? "text-green-600" : "text-yellow-500"}`}>
            {ve.concentration.top10Pct < 20 ? "Healthy distribution" : "Worth reviewing"}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">Dept Value Range</div>
          <div className="font-extrabold text-2xl font-mono text-[#3B5BDB]">
            {Math.round((ve.byDept[0]?.total || 0) / (ve.byDept[ve.byDept.length - 1]?.total || 1) * 10) / 10}×
          </div>
          <div className="text-[10px] text-gray-500 mt-1">${(ve.byDept[ve.byDept.length - 1]?.total || 0).toLocaleString()} → ${(ve.byDept[0]?.total || 0).toLocaleString()}</div>
        </div>
      </div>
      <div className="flex gap-2 mb-3.5">
        {([{ id: "dept" as const, label: "By Department" }, { id: "seniority" as const, label: "By Seniority" }]).map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${view === v.id ? "bg-[#0B3954] border-[#0B3954] text-white" : "bg-white border-gray-200 text-gray-500"}`}>
            {v.label}
          </button>
        ))}
      </div>
      {view === "dept" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex flex-col gap-3">
            {ve.byDept.map(d => {
              const color = DEPT_COLORS[d.dept] || "#888";
              return (
                <div key={d.dept}>
                  <div className="flex justify-between mb-1 items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-xs font-semibold text-[#0B3954]">{d.dept}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="font-mono text-[10px] text-gray-500">${d.perPerson.toLocaleString()}/person</span>
                      <span className="font-mono text-[11px] font-bold" style={{ color }}>${d.total.toLocaleString()}</span>
                      <span className="font-mono text-[9px] text-gray-400 w-9 text-right">{d.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full rounded transition-[width] duration-700" style={{ width: `${(d.total / maxDeptVal) * 100}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {view === "seniority" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex flex-col gap-3.5">
            {ve.bySeniority.map((s, i) => {
              const colors = ["#45B7D1", "#4ECDC4", "#F9CA24", "#F96400", "#FF6B6B", "#6C5CE7"];
              const c = colors[i] || "#888";
              const maxAvg = Math.max(...ve.bySeniority.map(x => x.avg), 1);
              return (
                <div key={s.level}>
                  <div className="flex justify-between mb-1.5 items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                      <span className="text-xs font-semibold text-[#0B3954]">{s.level}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="font-mono text-[10px] text-gray-500">High-value: <strong style={{ color: c }}>{s.highValuePct}%</strong></span>
                      <span className="font-mono text-[11px] font-bold" style={{ color: c }}>${s.avg} avg</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(s.avg / maxAvg) * 100}%`, background: c }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex gap-2">
            <span>⚖️</span>
            <p className="text-[11px] text-[#0B3954] leading-relaxed">
              Gini coefficient of <strong>{gini}</strong> indicates <strong>{equityLevel.toLowerCase()}</strong> value distribution.
              {gini < 0.35 ? " Recognition value is fairly spread — no seniority tier is disproportionately advantaged." : " Consider reviewing whether award value thresholds are calibrated consistently across seniority levels."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
