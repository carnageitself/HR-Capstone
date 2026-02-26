"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { CAT_COLORS } from "@/constants/colors";
import { SH } from "@/constants/primitives";

export function SkillsTab({ data }: { data: DashboardData }) {
  const [selDept, setSelDept] = useState<string | null>(null);
  const si = data.skillInsights;
  const maxSkill = si.topSkills[0]?.count || 1;
  const depts = Object.keys(si.byDepartment).sort();

  return (
    <div>
      <SH eye="Skill Intelligence" title="Skills & Recognition Correlation" eyeColorCls="text-[#3B5BDB]" />
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="font-mono text-[9px] tracking-[.14em] uppercase text-[#3B5BDB] mb-1">MOST RECOGNIZED SKILLS</div>
          <div className="text-[14px] font-bold text-[#0B3954] mb-4">Top 15 Skills</div>
          <div className="flex flex-col gap-2.5">
            {si.topSkills.slice(0, 15).map(s => (
              <div key={s.skill}>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[s.dominantCategory] || "#888" }} />
                    <span className="text-xs text-[#0B3954] font-medium">{s.skill}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">{s.count}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${(s.count / maxSkill) * 100}%`, background: CAT_COLORS[s.dominantCategory] || "#3B5BDB" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="font-mono text-[9px] tracking-[.14em] uppercase text-[#3B5BDB] mb-1">SKILLS BY DEPARTMENT</div>
          <div className="text-[14px] font-bold text-[#0B3954] mb-3.5">Click a department to explore</div>
          <div className="flex gap-1.5 flex-wrap mb-3.5">
            {depts.map(d => (
              <button key={d}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all ${selDept === d ? "bg-[#0B3954] text-white border-[#0B3954]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}
                onClick={() => setSelDept(selDept === d ? null : d)}>
                {d}
              </button>
            ))}
          </div>
          {selDept && si.byDepartment[selDept] && (
            <div className="flex flex-col gap-2">
              <div className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">{selDept} · Top Skills</div>
              {si.byDepartment[selDept].map((s, i) => (
                <div key={s.skill} className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] text-gray-400 w-4 text-right">{i + 1}</span>
                  <span className="text-xs text-[#0B3954] flex-1 font-medium">{s.skill}</span>
                  <span className="font-mono text-[10px] text-[#F96400] font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          )}
          {!selDept && <div className="py-6 text-center text-gray-500 text-xs">Select a department above to see its top skills</div>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 overflow-x-auto">
        <div className="font-mono text-[9px] tracking-[.14em] uppercase text-[#3B5BDB] mb-1">SKILL × CATEGORY HEATMAP</div>
        <div className="text-[14px] font-bold text-[#0B3954] mb-4">Where each skill is most frequently recognized</div>
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th className="font-mono text-[9px] text-gray-500 uppercase tracking-widest px-3 py-1.5 text-left border-b border-gray-200 w-40">Skill</th>
              {data.categories.map(c => (
                <th key={c.id} className="font-mono text-[9px] uppercase tracking-widest px-2 py-1.5 text-center border-b border-gray-200"
                  style={{ color: CAT_COLORS[c.id] }}>
                  {c.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {si.skillCategoryMatrix.map(row => {
              const maxVal = Math.max(...Object.values(row.categories), 1);
              return (
                <tr key={row.skill}>
                  <td className="text-xs px-3 py-2 text-[#0B3954] font-medium border-b border-gray-100">{row.skill}</td>
                  {data.categories.map(c => {
                    const val = row.categories[c.id] || 0;
                    const intensity = val / maxVal;
                    const hex = (CAT_COLORS[c.id] || "#888").replace("#", "");
                    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
                    const bg = val > 0 ? `rgba(${r},${g},${b},${0.1 + intensity * 0.7})` : "transparent";
                    return (
                      <td key={c.id} className="text-center px-2 py-2 border-b border-gray-100">
                        {val > 0 && (
                          <div className="rounded px-1 py-0.5 font-mono text-[10px] font-bold inline-block min-w-[28px]"
                            style={{ background: bg, color: intensity > 0.4 ? "#fff" : "#6C757D" }}>
                            {val}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-2.5 font-mono text-[9px] text-gray-400">
          Colour intensity = frequency relative to row max · A=Leadership · B=Innovation · C=Customer · D=Collaboration · E=Growth · F=Operations
        </div>
      </div>
    </div>
  );
}