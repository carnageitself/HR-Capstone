"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { DEPT_COLORS } from "@/constants/colors";
import { RiskBadge, IntelAvatar } from "@/constants/primitives";

export function InvisibleRadar({ intel }: { intel: DashboardData["intelligence"] }) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const depts = ["All", ...new Set(intel.invisibleContributors.map(x => x.dept))];
  const filtered = filter === "All" ? intel.invisibleContributors : intel.invisibleContributors.filter(x => x.dept === filter);
  const sel = selected ? intel.invisibleContributors.find(x => x.id === selected) : null;

  return (
    <div>
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-orange-200 rounded-xl p-3.5 mb-4 flex gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <div className="font-bold text-[13px] text-red-700 mb-1">{intel.invisibleContributors.length} Invisible Contributors Detected</div>
          <p className="text-[11px] text-red-600 leading-relaxed">People who actively nominate colleagues but have <strong>never been recognized themselves</strong>. Unrecognized givers are 3× more likely to disengage within 6 months.</p>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-3.5">
        {depts.map(d => (
          <button key={d} onClick={() => setFilter(d)}
            className="px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all"
            style={{ borderColor: filter === d ? (DEPT_COLORS[d] || "#0B3954") : "#E9ECEF", background: filter === d ? (DEPT_COLORS[d] || "#0B3954") + "18" : "white", color: filter === d ? (DEPT_COLORS[d] || "#0B3954") : "#6C757D" }}>
            {d}
          </button>
        ))}
      </div>
      <div className={`grid gap-4 ${selected ? "grid-cols-[1fr_340px]" : "grid-cols-1"}`}>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                {["Person", "Dept", "Title", "Seniority", "Given", "Risk", "Action"].map(h => (
                  <th key={h} className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}
                  className="border-b border-gray-100 cursor-pointer transition-colors"
                  style={{ background: selected === p.id ? "#FFF4EE" : i % 2 === 0 ? "white" : "#FAFBFC" }}>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2"><IntelAvatar name={p.name} dept={p.dept} size={26} /><span className="font-semibold text-xs text-[#0B3954]">{p.name}</span></div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-xl font-semibold" style={{ background: (DEPT_COLORS[p.dept] || "#888") + "18", color: DEPT_COLORS[p.dept] || "#888" }}>{p.dept}</span>
                  </td>
                  <td className="px-3.5 py-3 text-[11px] text-gray-500">{p.title}</td>
                  <td className="px-3.5 py-3 text-[11px] text-gray-500">{p.seniority}</td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-extrabold text-base text-[#F96400]">{p.given}</span>
                      <div className="w-10 h-1 bg-gray-200 rounded">
                        <div className="h-full bg-gradient-to-r from-[#F96400] to-[#FFAB73] rounded" style={{ width: `${(p.given / 7) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-3"><RiskBadge score={p.riskScore} /></td>
                  <td className="px-3.5 py-3">
                    <button className="text-[10px] px-2.5 py-1 rounded-md bg-[#F96400] text-white font-semibold">Nominate →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sel && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3.5">
              <IntelAvatar name={sel.name} dept={sel.dept} size={40} />
              <div><div className="font-bold text-sm text-[#0B3954]">{sel.name}</div><div className="text-[11px] text-gray-500">{sel.title} · {sel.dept}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3.5">
              {[{ l: "Given", v: sel.given, c: "text-[#F96400]" }, { l: "Received", v: sel.received, c: "text-red-500" }, { l: "Seniority", v: sel.seniority, c: "text-indigo-600" }, { l: "Risk", v: sel.riskScore + "%", c: "text-red-500" }].map(s => (
                <div key={s.l} className="p-2 bg-gray-50 rounded-lg">
                  <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-0.5">{s.l}</div>
                  <div className={`font-extrabold text-base ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="bg-teal-50 rounded-lg p-2.5 mb-2.5">
              <div className="font-mono text-[8px] text-teal-600 uppercase tracking-widest mb-1">💡 RECOMMENDED ACTION</div>
              <p className="text-[11px] text-[#0B3954] leading-relaxed">
                {sel.seniority === "VP" || sel.seniority === "Director"
                  ? `Senior leaders rarely get recognized upward. Prompt their skip-level to call out ${sel.name.split(" ")[0]}'s generosity in the next all-hands.`
                  : `Reach out to ${sel.name.split(" ")[0]}'s manager. They've given ${sel.given} nominations — ask the manager to submit recognition this week.`}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="w-full py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-500 cursor-pointer">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}