"use client";

import type { DashboardData } from "@/lib/loadDashboardData";
import { DEPT_COLORS } from "@/constants/colors";
import { SH } from "@/constants/primitives";

export function Departments({ data }: { data: DashboardData }) {
  const wf = data.workforce;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {wf.byDept.map(d => {
          const color = DEPT_COLORS[d.dept] || "#888";
          const covColor = d.coveragePct >= 90 ? "#27AE60" : d.coveragePct >= 75 ? "#F39C12" : "#E74C3C";
          return (
            <div key={d.dept} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="font-bold text-[13px] text-[#0B3954]">{d.dept}</span>
                <span className="font-mono text-[9px] text-gray-500 ml-auto">{d.headcount} people</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-gray-500">Recognition coverage</span>
                  <span className="font-mono text-[10px] font-bold" style={{ color: covColor }}>{d.coveragePct}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded transition-[width] duration-700" style={{ width: `${d.coveragePct}%`, background: covColor }} />
                </div>
              </div>
              <div className="mb-2.5">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-gray-500">Peer participation</span>
                  <span className="font-mono text-[10px] font-bold text-[#00A98F]">{d.participationPct}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded bg-[#00A98F] transition-[width] duration-700" style={{ width: `${d.participationPct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[{ l: "Avg awards", v: `${d.avgAwards}×` }, { l: "Recognized", v: d.recognized }, { l: "Unrecognized", v: d.headcount - d.recognized }].map(s => (
                  <div key={s.l} className="text-center p-1.5 bg-gray-50 rounded-lg">
                    <div className="font-mono text-[7px] text-gray-500 uppercase mb-0.5">{s.l}</div>
                    <div className="font-bold text-[13px] text-[#0B3954]">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200"><SH eye="Summary" title="Department Recognition Health" /></div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              {["#", "Department", "Headcount", "Coverage", "Participation", "Avg Awards", "Recognized", "Unrecognized"].map(h => (
                <th key={h} className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {wf.byDept.map((d, i) => {
              const covColor = d.coveragePct >= 90 ? "text-green-600" : d.coveragePct >= 75 ? "text-yellow-600" : "text-red-500";
              return (
                <tr key={d.dept} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                  <td className="px-3.5 py-3 font-mono text-[11px] text-gray-400">{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: DEPT_COLORS[d.dept] || "#888" }} />
                      <span className="font-semibold">{d.dept}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 font-mono">{d.headcount}</td>
                  <td className="px-3.5 py-3"><span className={`font-bold font-mono ${covColor}`}>{d.coveragePct}%</span></td>
                  <td className="px-3.5 py-3"><span className="font-bold font-mono text-teal-600">{d.participationPct}%</span></td>
                  <td className="px-3.5 py-3"><span className="font-mono">{d.avgAwards}×</span></td>
                  <td className="px-3.5 py-3"><span className="font-mono text-green-600">{d.recognized}</span></td>
                  <td className="px-3.5 py-3"><span className={`font-mono ${d.headcount - d.recognized > 0 ? "text-red-500" : "text-gray-400"}`}>{d.headcount - d.recognized}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}