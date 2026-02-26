"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { DEPT_COLORS } from "@/constants/colors";

export function OrgConnectors({ intel }: { intel: DashboardData["intelligence"] }) {
  const [selDept, setSelDept] = useState("All");
  const connectors = intel.orgConnectors;
  const depts = ["All", ...new Set(connectors.map(c => c.dept))].sort();
  const filtered = selDept === "All" ? connectors : connectors.filter(c => c.dept === selDept);
  const maxScore = connectors[0]?.collaborationScore || 1;

  return (
    <div>
      <div className="bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-200 rounded-xl p-3.5 mb-4 flex gap-2.5">
        <span className="text-lg">🕸️</span>
        <p className="text-[11px] text-[#0B3954] leading-relaxed">
          <strong>Org Connectors are your informal culture brokers</strong> — people who actively recognize colleagues across multiple teams. Losing even one can fragment collaboration patterns.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Total Connectors", v: connectors.length, sub: "recognized 3+ unique people", c: "text-[#00A98F]" },
          { label: "Cross-Dept Connectors", v: connectors.filter(c => c.uniqueDeptsReached >= 3).length, sub: "reached 3+ departments", c: "text-[#3B5BDB]" },
          { label: "Super Connectors", v: connectors.filter(c => c.uniquePeopleRecognized >= 5).length, sub: "recognized 5+ unique people", c: "text-[#F96400]" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
            <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">{s.label}</div>
            <div className={`font-extrabold text-2xl font-mono ${s.c}`}>{s.v}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-3.5 items-center">
        <select value={selDept} onChange={e => setSelDept(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[11px] bg-white text-[#0B3954] cursor-pointer">
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <span className="font-mono text-[10px] text-gray-500">{filtered.length} connectors</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {filtered.map(c => {
          const color = DEPT_COLORS[c.dept] || "#888";
          return (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-0.5" style={{ background: color }} />
              <div className="pl-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full grid place-items-center font-extrabold text-[10px] font-mono shrink-0"
                    style={{ width: 32, height: 32, background: color + "22", border: `2px solid ${color}`, color }}>
                    {c.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[#0B3954] truncate">{c.name}</div>
                    <div className="text-[9px] text-gray-500">{c.dept}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 mb-2.5">
                  {[{ l: "People", v: c.uniquePeopleRecognized }, { l: "Depts", v: c.uniqueDeptsReached }, { l: "Given", v: c.totalGiven }].map(s => (
                    <div key={s.l} className="text-center p-1 bg-gray-50 rounded-md">
                      <div className="font-mono text-[7px] text-gray-500 uppercase mb-0.5">{s.l}</div>
                      <div className="font-extrabold text-sm text-[#0B3954]">{s.v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[9px] text-gray-500">Collaboration Score</span>
                    <span className="font-mono text-[9px] font-bold" style={{ color }}>{c.collaborationScore}</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(c.collaborationScore / maxScore) * 100}%`, background: color }} />
                  </div>
                </div>
                <div className="font-mono text-[9px] text-gray-400 mt-1">{c.seniority} · {c.title}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
