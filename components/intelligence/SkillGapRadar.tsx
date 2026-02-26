"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { DEPT_COLORS } from "@/constants/colors";

export function SkillGapRadar({ intel }: { intel: DashboardData["intelligence"] }) {
  const [view, setView] = useState<"all" | "rare" | "moderate" | "common">("all");
  const [selDept, setSelDept] = useState("All");
  const depts = ["All", ...intel.depts];
  const filtered = intel.skillGaps.filter(s => view === "all" || s.rarity === view).filter(s => selDept === "All" || s.depts.includes(selDept));
  const maxCount = Math.max(...intel.skillGaps.map(s => s.count), 1);
  const RARITY: Record<string, { cls: string; c: string; label: string }> = {
    rare: { cls: "bg-red-50 text-red-600", c: "#E74C3C", label: "Rare" },
    moderate: { cls: "bg-yellow-50 text-yellow-600", c: "#F39C12", label: "Moderate" },
    common: { cls: "bg-green-50 text-green-600", c: "#27AE60", label: "Common" },
  };
  const rareCt = intel.skillGaps.filter(s => s.rarity === "rare").length;
  const modCt = intel.skillGaps.filter(s => s.rarity === "moderate").length;
  const commonCt = intel.skillGaps.filter(s => s.rarity === "common").length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[{ key: "rare" as const, label: "Rare Skills", sub: "Under-represented org-wide", count: rareCt, activeCls: "border-red-500 bg-red-50", c: "text-red-600" },
        { key: "moderate" as const, label: "Moderate Skills", sub: "Present but not widespread", count: modCt, activeCls: "border-yellow-400 bg-yellow-50", c: "text-yellow-600" },
        { key: "common" as const, label: "Core Skills", sub: "Widely recognized across org", count: commonCt, activeCls: "border-green-500 bg-green-50", c: "text-green-700" }].map(s => (
          <button key={s.key} onClick={() => setView(view === s.key ? "all" : s.key)}
            className={`p-3.5 rounded-xl border-2 cursor-pointer text-left transition-all ${view === s.key ? s.activeCls : "border-gray-200 bg-white"}`}>
            <div className={`font-bold text-[13px] mb-1 ${s.c}`}>{s.label}</div>
            <div className="font-mono text-2xl font-extrabold text-[#0B3954]">{s.count}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.sub}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-3.5 flex-wrap items-center">
        <select value={selDept} onChange={e => setSelDept(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[11px] bg-white text-[#0B3954] cursor-pointer">
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <span className="font-mono text-[10px] text-gray-500">{filtered.length} skills shown</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              {["Skill", "Frequency", "Departments", "Rarity", "Dept Breakdown"].map(h => (
                <th key={h} className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const rs = RARITY[s.rarity] || RARITY.common;
              return (
                <tr key={s.skill} className="border-b border-gray-100">
                  <td className="px-3.5 py-3 font-semibold text-[#0B3954] text-[13px]">{s.skill}</td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded overflow-hidden"><div className="h-full rounded" style={{ width: `${(s.count / maxCount) * 100}%`, background: rs.c }} /></div>
                      <span className="font-mono text-[11px] font-bold text-[#0B3954]">{s.count}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 font-mono text-[11px]">{s.deptCount}/12</td>
                  <td className="px-3.5 py-3"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${rs.cls}`}>{rs.label}</span></td>
                  <td className="px-3.5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {s.depts.slice(0, 4).map(d => (
                        <span key={d} className="text-[8px] px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap"
                          style={{ background: (DEPT_COLORS[d] || "#888") + "18", color: DEPT_COLORS[d] || "#888" }}>{d}</span>
                      ))}
                      {s.depts.length > 4 && <span className="text-[9px] text-gray-400">+{s.depts.length - 4}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3.5 p-3.5 bg-yellow-50 rounded-xl border border-yellow-200 flex gap-2.5">
        <span className="text-base">🎯</span>
        <p className="text-[11px] text-yellow-800 leading-relaxed">
          <strong>{rareCt} rare skills</strong> are under-represented across the org. Consider targeted L&D programmes for skills like{" "}
          <strong>{intel.skillGaps.filter(s => s.rarity === "rare").slice(0, 3).map(s => s.skill).join(", ")}</strong>.
        </p>
      </div>
    </div>
  );
}
