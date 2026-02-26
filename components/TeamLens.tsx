"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { DEPT_COLORS } from "@/constants/colors";
import { SH } from "@/constants/primitives";
import { ExportButton, exportToCSV } from "@/utils/exportCSV";

const SENIORITY_COLORS = ["#45B7D1", "#4ECDC4", "#F9CA24", "#F96400", "#FF6B6B", "#6C5CE7"];

export function TeamLens({ data }: { data: DashboardData }) {
  const depts = [...new Set(data.employeeDirectory.map(e => e.dept))].sort();
  const [selectedDept, setSelectedDept] = useState(depts[0] || "");

  const teamMembers = data.employeeDirectory.filter(e => e.dept === selectedDept);
  const totalTeam = teamMembers.length;
  const recognized = teamMembers.filter(e => e.received > 0).length;
  const atRisk = teamMembers.filter(e => e.status === "at_risk" || e.status === "never_recognized").length;
  const avgEngagement = totalTeam > 0 ? Math.round(teamMembers.reduce((s, e) => s + e.engagementScore, 0) / totalTeam) : 0;
  const avgReceived = totalTeam > 0 ? (teamMembers.reduce((s, e) => s + e.received, 0) / totalTeam).toFixed(1) : "0";
  const coveragePct = totalTeam > 0 ? Math.round((recognized / totalTeam) * 100) : 0;
  const totalGiven = teamMembers.reduce((s, e) => s + e.given, 0);

  const deptHealth = data.cultureHealth?.find(d => d.name === selectedDept);
  const color = DEPT_COLORS[selectedDept] || "#888";

  const atRiskList = teamMembers
    .filter(e => e.status === "at_risk" || e.status === "never_recognized")
    .sort((a, b) => b.daysSinceLast - a.daysSinceLast);

  const topContributors = [...teamMembers]
    .sort((a, b) => b.given - a.given)
    .slice(0, 5);

  function handleExport() {
    exportToCSV(`${selectedDept.replace(/\s+/g, "_")}_team_report.csv`,
      teamMembers.map(e => ({
        Name: e.name,
        Title: e.title,
        Seniority: e.seniority,
        Status: e.status,
        "Awards Received": e.received,
        "Awards Given": e.given,
        "Engagement Score": e.engagementScore,
        "Days Since Last Recognition": e.daysSinceLast === 999 ? "Never" : e.daysSinceLast,
        "Total Value Received ($)": e.valueReceived,
      }))
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Department selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest">View team:</div>
        <div className="flex gap-2 flex-wrap">
          {depts.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDept(d)}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer"
              style={{
                borderColor: selectedDept === d ? (DEPT_COLORS[d] || "#0B3954") : "#E9ECEF",
                background: selectedDept === d ? (DEPT_COLORS[d] || "#0B3954") + "18" : "white",
                color: selectedDept === d ? (DEPT_COLORS[d] || "#0B3954") : "#6C757D",
              }}
            >{d}</button>
          ))}
        </div>
        <div className="ml-auto">
          <ExportButton label="Export Team Report" onClick={handleExport} />
        </div>
      </div>

      {/* Team header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl grid place-items-center text-white font-extrabold text-lg shrink-0"
          style={{ background: color }}>
          {selectedDept.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-extrabold text-lg text-[#0B3954]">{selectedDept}</div>
          <div className="font-mono text-[10px] text-gray-500">{totalTeam} team members · FY 2025</div>
        </div>
        {deptHealth && (
          <div className="text-right">
            <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">Culture Health</div>
            <div className="font-extrabold text-3xl font-mono"
              style={{ color: deptHealth.health >= 80 ? "#27AE60" : deptHealth.health >= 65 ? "#00A98F" : deptHealth.health >= 50 ? "#F39C12" : "#E74C3C" }}>
              {deptHealth.health}
            </div>
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { l: "Team Size",       v: totalTeam,      c: "#0B3954", suf: "" },
          { l: "Coverage",        v: coveragePct,    c: coveragePct >= 80 ? "#27AE60" : "#E74C3C", suf: "%" },
          { l: "Avg Received",    v: avgReceived,    c: "#F96400", suf: "", isStr: true },
          { l: "Avg Engagement",  v: avgEngagement,  c: avgEngagement >= 60 ? "#00A98F" : "#F39C12", suf: "" },
          { l: "At Risk",         v: atRisk,         c: atRisk > 0 ? "#E74C3C" : "#27AE60", suf: "" },
        ].map(k => (
          <div key={k.l} className="bg-white border border-gray-200 rounded-xl p-3.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${k.c},${k.c}55)` }} />
            <div className="font-mono text-[8px] uppercase tracking-widest text-gray-500 mb-1.5">{k.l}</div>
            <div className="font-extrabold text-2xl leading-none tracking-tight" style={{ color: k.c }}>
              {k.isStr ? k.v : k.v}{k.suf}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* At-risk members */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="font-mono text-[9px] text-red-500 uppercase tracking-widest mb-0.5">ACTION REQUIRED</div>
              <div className="font-bold text-[14px] text-[#0B3954]">At-Risk Team Members</div>
            </div>
            <span className="bg-red-50 text-red-600 text-[11px] font-bold px-2 py-0.5 rounded-full">{atRisk} people</span>
          </div>
          {atRiskList.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              🎉 No at-risk members — great coverage!
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {atRiskList.map(e => (
                <div key={e.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="rounded-full grid place-items-center font-bold text-[10px] font-mono shrink-0"
                    style={{ width: 30, height: 30, background: color + "22", border: `2px solid ${color}`, color }}>
                    {e.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-[#0B3954] truncate">{e.name}</div>
                    <div className="text-[10px] text-gray-500">{e.title}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[11px] font-bold font-mono ${e.status === "never_recognized" ? "text-red-500" : "text-[#F39C12]"}`}>
                      {e.status === "never_recognized" ? "Never" : `${e.daysSinceLast}d ago`}
                    </div>
                    <div className="text-[9px] text-gray-400">last recognized</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top contributors */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="font-mono text-[9px] text-teal-600 uppercase tracking-widest mb-0.5">RECOGNITION CULTURE</div>
            <div className="font-bold text-[14px] text-[#0B3954]">Top Nominators in Team</div>
          </div>
          <div className="divide-y divide-gray-100">
            {topContributors.map((e, i) => (
              <div key={e.id} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md grid place-items-center text-white font-extrabold text-[10px] shrink-0 ${i === 0 ? "bg-[#00A98F]" : "bg-gray-300"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[#0B3954] truncate">{e.name}</div>
                  <div className="text-[10px] text-gray-500">{e.seniority}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-extrabold text-base text-[#00A98F]">{e.given}</div>
                  <div className="font-mono text-[9px] text-gray-400">nominations</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full team table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <SH eye="Team Roster" title={`${selectedDept} · All Members`} />
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              {["Name", "Title", "Seniority", "Received", "Given", "Engagement", "Last Recognition", "Status"].map(h => (
                <th key={h} className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamMembers.sort((a, b) => b.received - a.received).map(e => {
              const statusCls: Record<string, string> = {
                thriving: "bg-green-50 text-green-700",
                active: "bg-teal-50 text-teal-700",
                passive: "bg-yellow-50 text-yellow-700",
                at_risk: "bg-orange-50 text-orange-700",
                never_recognized: "bg-red-50 text-red-700",
              };
              const statusLabel: Record<string, string> = {
                thriving: "Thriving", active: "Active", passive: "Passive",
                at_risk: "At Risk", never_recognized: "Never Recognized",
              };
              return (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3.5 py-2.5 font-semibold text-[#0B3954]">{e.name}</td>
                  <td className="px-3.5 py-2.5 text-gray-500">{e.title}</td>
                  <td className="px-3.5 py-2.5 text-gray-500">{e.seniority}</td>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-[#F96400]">{e.received}</td>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-[#00A98F]">{e.given}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-14 bg-gray-200 rounded overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${e.engagementScore}%`, background: e.engagementScore >= 70 ? "#27AE60" : e.engagementScore >= 40 ? "#00A98F" : "#F39C12" }} />
                      </div>
                      <span className="font-mono text-[10px] text-gray-600">{e.engagementScore}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px]"
                    style={{ color: e.daysSinceLast > 120 ? "#E74C3C" : e.daysSinceLast > 60 ? "#F39C12" : "#00A98F" }}>
                    {e.received === 0 ? "—" : e.daysSinceLast === 999 ? "—" : `${e.daysSinceLast}d ago`}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusCls[e.status] || "bg-gray-100 text-gray-600"}`}>
                      {statusLabel[e.status] || e.status}
                    </span>
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