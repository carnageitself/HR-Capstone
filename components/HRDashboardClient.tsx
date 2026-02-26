"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { Num } from "@/constants/primitives";

import { EmployeeDirectory } from "./EmployeeDirectory";
import { HRIntelligence } from "./HRIntelligence";
import { Overview } from "./Overview";
import { Departments } from "./Departments";
import { RecognitionActivity } from "./RecognitionActivity";

export function HRDashboardClient({ data }: { data: DashboardData }) {
  type Tab = "overview" | "departments" | "recognition" | "employees" | "intelligence";
  const [tab, setTab] = useState<Tab>("overview");

  const NAV = [
    { id: "overview"      as Tab, label: "Overview",            icon: "⊞" },
    { id: "employees"     as Tab, label: "Employees",           icon: "◎" },
    { id: "departments"   as Tab, label: "Departments",         icon: "◫" },
    { id: "recognition"   as Tab, label: "Recognition Activity",icon: "◈" },
    { id: "intelligence"  as Tab, label: "HR Intelligence",     icon: "🧠", isNew: true },
  ];

  const wf = data.workforce;

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <aside className="w-[230px] shrink-0 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-5 pb-3.5 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <img src="/Northeastern Logo.png" alt="Northeastern University" className="w-9 h-9 object-contain shrink-0" />
            <div>
              <div className="font-extrabold text-[15px] text-[#0B3954]">Capstone</div>
              <div className="font-mono text-[9px] text-gray-500 tracking-widest uppercase">Master&apos;s Project</div>
            </div>
          </div>
        </div>
        <nav className="px-2 py-2.5 flex-1">
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-gray-400 px-1.5 py-2">Workforce</div>
          {NAV.filter(n => !n.isNew).map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 border-none ${tab === n.id ? "bg-orange-50 text-[#F96400] font-bold" : "text-gray-500 hover:bg-orange-50 hover:text-[#F96400]"}`}>
              <span className="text-[13px] w-4 text-center">{n.icon}</span>{n.label}
            </button>
          ))}
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-gray-400 px-1.5 pt-4 pb-1 flex items-center gap-1.5">
            Intelligence
            <span className="bg-[#F96400] text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
          </div>
          {NAV.filter(n => n.isNew).map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 border-none ${tab === n.id ? "bg-orange-50 text-[#F96400] font-bold" : "text-gray-500 hover:bg-orange-50 hover:text-[#F96400]"}`}>
              <span className="text-[13px] w-4 text-center">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="px-3.5 py-3 border-t border-gray-200 font-mono text-[9px] text-gray-400">
          <div>{wf.totalPeople} employees · {data.kpi.uniqueDepartments} depts</div>
          <div className="mt-0.5">FY 2025 · 1,000 recognitions</div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-7 shrink-0">
          <div>
            <div className="text-[15px] font-bold text-[#0B3954]">{NAV.find(n => n.id === tab)?.label}</div>
            <div className="font-mono text-[10px] text-gray-500 mt-0.5">{wf.totalPeople} employees · {wf.coveragePct}% recognition coverage · FY 2025</div>
          </div>
          <div className="px-3 py-1.5 bg-teal-50 rounded-lg font-mono text-[10px] text-[#00A98F] font-semibold">HR ANALYTICS</div>
        </header>

        <main className="flex-1 px-7 py-6 overflow-y-auto">

          {/* ── KPI STRIP ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2.5 mb-6">
            <div className="flex gap-1.5 items-center mb-0.5">
              <div className="font-mono text-[8px] tracking-[.14em] uppercase text-gray-400">Workforce Health</div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-6 gap-2.5 mb-1.5">
              {[
                { eye: "Total Employees",  v: wf.totalPeople,                a: "text-[#0B3954]", bar: "#0B3954" },
                { eye: "Departments",      v: data.kpi.uniqueDepartments,    a: "text-[#3B5BDB]", bar: "#3B5BDB" },
                { eye: "High Performers",  v: data.kpi.highPerformers,       a: "text-green-600", bar: "#27AE60" },
                { eye: "Culture Carriers", v: data.kpi.cultureCarriers,      a: "text-teal-600",  bar: "#00A98F" },
                { eye: "At Risk",          v: data.kpi.atRiskCount,          a: "text-[#F39C12]", bar: "#F39C12" },
                { eye: "Never Recognized", v: data.kpi.neverRecognizedCount, a: "text-red-500",   bar: "#E74C3C" },
              ].map(k => (
                <div key={k.eye} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${k.bar},${k.bar}55)` }} />
                  <div className="font-mono text-[8px] tracking-widest uppercase text-gray-500 mb-1.5 leading-tight">{k.eye}</div>
                  <div className={`text-[22px] font-extrabold leading-none tracking-tight ${k.a}`}><Num to={k.v} /></div>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 items-center mb-0.5">
              <div className="font-mono text-[8px] tracking-[.14em] uppercase text-gray-400">Organisation Dynamics</div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-6 gap-2.5">
              {[
                { eye: "Recognition Cover", v: wf.coveragePct,             suf: "%", bar: "#00A98F" },
                { eye: "Participation",     v: wf.participationPct,         suf: "%", bar: "#27AE60" },
                { eye: "Cross-Dept Rate",   v: data.kpi.crossDeptPct,       suf: "%", bar: "#3B5BDB" },
                { eye: "Peer Recognition",  v: data.kpi.peerRecognitionPct, suf: "%", bar: "#8E44AD" },
                { eye: "IC Ratio",          v: data.kpi.icRatio,            suf: "%", bar: "#0B3954" },
                { eye: "MoM Trend",         v: Math.abs(data.kpi.momTrend), suf: `% ${data.kpi.momTrend >= 0 ? "▲" : "▼"}`, bar: data.kpi.momTrend >= 0 ? "#27AE60" : "#E74C3C" },
              ].map(k => (
                <div key={k.eye} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${k.bar},${k.bar}55)` }} />
                  <div className="font-mono text-[8px] tracking-widest uppercase text-gray-500 mb-1.5 leading-tight">{k.eye}</div>
                  <div className="text-[22px] font-extrabold text-[#0B3954] leading-none tracking-tight">
                    <Num to={k.v} /><span className="text-[13px] font-semibold" style={{ color: k.bar }}>{k.suf}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TAB CONTENT ───────────────────────────────────────────── */}
          {tab === "overview"     && <Overview            data={data} />}
          {tab === "departments"  && <Departments         data={data} />}
          {tab === "recognition"  && <RecognitionActivity data={data} />}
          {tab === "employees"    && <EmployeeDirectory   data={data} />}
          {tab === "intelligence" && <HRIntelligence      data={data} />}

        </main>
      </div>
    </div>
  );
}