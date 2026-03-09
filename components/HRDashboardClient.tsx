"use client";

import { useState, useMemo } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { Num } from "@/constants/primitives";

import { Departments }        from "./Departments";
import { RecognitionActivity } from "./RecognitionActivity";
import { EmployeeDirectory }  from "./EmployeeDirectory";
import { HRIntelligence }     from "./HRIntelligence";
import { TeamLens }           from "./TeamLens";
import { Evaluations }        from "./Evaluations";
import { ActionQueue }        from "./ActionQueue";

import { DateRangeProvider, DateRangeFilter, useDateRange } from "@/utils/DateRangeFilter";
import { Overview } from "./Overview";

// ── Sidebar icons ─────────────────────────────────────────────────────────────
const Icons = {
  overview:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  employees:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg>,
  departments: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  recognition: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  intelligence:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.3 6l-.7 4H9l-.7-4A7 7 0 0112 2z"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  workforce:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="23" y2="17"/><line x1="20" y1="14" x2="26" y2="14"/></svg>,
  evaluation:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/><path d="M12 7v5l3 3"/><path d="M8 12h.01"/><path d="M16 12h.01"/></svg>,
  people:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/></svg>,
  actions:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
};

export function HRDashboardClient({ data }: { data: DashboardData }) {
  return (
    <DateRangeProvider allMonths={data.monthly.map(m => m.yearMonth)}>
      <DashboardShell data={data} />
    </DateRangeProvider>
  );
}

function NoData({ message = "No data available for selected period" }: { message?: string }) {
  return (
    <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center",
      justifyContent:"center", padding:"64px 24px", background:"#fff",
      border:"1px solid #E9ECEF", borderRadius:12 }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0"
        strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:12 }}>
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
      </svg>
      <div style={{ fontWeight:600, color:"#9CA3AF", fontSize:14 }}>{message}</div>
      <div style={{ color:"#D1D5DB", fontSize:12, marginTop:4 }}>Try selecting a wider date range</div>
    </div>
  );
}

function DashboardShell({ data }: { data: DashboardData }) {
  type Tab =
    | "overview" | "employees" | "departments" | "recognition"
    | "intelligence" | "manager" | "evaluations" | "actions";

  const [tab, setTab] = useState<Tab>("overview");
  const { start, end, isActive } = useDateRange();
  const wf = data.workforce;

  // ── Filtered data ───────────────────────────────────────────────────────────
  const filteredData = useMemo((): DashboardData => {
    if (!isActive) return data;
    const monthly     = data.monthly.filter(m => m.yearMonth >= start && m.yearMonth <= end);
    const totalAwards = monthly.reduce((s, m) => s + m.awards, 0);
    const totalValue  = monthly.reduce((s, m) => s + m.value,  0);
    const avgMonthly  = monthly.length > 0 ? Math.round(totalAwards / monthly.length) : 0;
    const last3  = monthly.slice(-3).reduce((s, m) => s + m.awards, 0) / Math.max(Math.min(monthly.length, 3), 1);
    const prev3  = monthly.length >= 6 ? monthly.slice(-6, -3).reduce((s, m) => s + m.awards, 0) / 3 : last3;
    const momTrend = prev3 > 0 ? Math.round((last3 - prev3) / prev3 * 100) : 0;
    return {
      ...data, monthly,
      kpi: {
        ...data.kpi, totalAwards, totalMonetary: totalValue,
        avgAwardValue: totalAwards > 0 ? Math.round(totalValue / totalAwards) : 0,
        momTrend, avgMonthlyAwards: avgMonthly,
      },
    };
  }, [data, start, end, isActive]);

  const fm      = filteredData.monthly;
  const hasData = fm.length > 0;

  // ── KPI rows (passed to Overview) ───────────────────────────────────────────
  const kpiRow1 = isActive ? [
    { eye:"Awards in Period", v:filteredData.kpi.totalAwards,                              bar:"#F96400" },
    { eye:"Value in Period",  v:filteredData.kpi.totalMonetary,                            bar:"#00A98F" },
    { eye:"Months Shown",     v:fm.length,                                                 bar:"#3B5BDB" },
    { eye:"Avg / Month",      v:filteredData.kpi.avgMonthlyAwards,                         bar:"#8E44AD" },
    { eye:"Peak Month",       v:fm.length > 0 ? Math.max(...fm.map(m => m.awards)) : 0,   bar:"#27AE60" },
    { eye:"Total Employees",  v:wf.totalPeople,                                            bar:"#ADB5BD" },
  ] : [
    { eye:"Total Employees",  v:wf.totalPeople,                bar:"#0B3954" },
    { eye:"Departments",      v:data.kpi.uniqueDepartments,    bar:"#3B5BDB" },
    { eye:"High Performers",  v:data.kpi.highPerformers,       bar:"#27AE60" },
    { eye:"Culture Carriers", v:data.kpi.cultureCarriers,      bar:"#00A98F" },
    { eye:"At Risk",          v:data.kpi.atRiskCount,          bar:"#F39C12" },
    { eye:"Never Recognized", v:data.kpi.neverRecognizedCount, bar:"#E74C3C" },
  ];

  const kpiRow2 = [
    { eye:"Recognition Cover", v:wf.coveragePct,             suf:"%", bar:"#00A98F" },
    { eye:"Participation",     v:wf.participationPct,         suf:"%", bar:"#27AE60" },
    { eye:"Cross-Dept Rate",   v:data.kpi.crossDeptPct,       suf:"%", bar:"#3B5BDB" },
    { eye:"Peer Recognition",  v:data.kpi.peerRecognitionPct, suf:"%", bar:"#8E44AD" },
    { eye:"IC Ratio",          v:data.kpi.icRatio,            suf:"%", bar:"#0B3954" },
    {
      eye: "MoM Trend",
      v:   Math.abs(filteredData.kpi.momTrend),
      suf: `% ${filteredData.kpi.momTrend >= 0 ? "▲" : "▼"}`,
      bar: filteredData.kpi.momTrend >= 0 ? "#27AE60" : "#E74C3C",
    },
  ];

  type NavItem = { id: Tab; label: string; icon: React.ReactNode; badge?: string | null };

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const openCount = 108 - dismissed.size;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const NAV_WORKFORCE: NavItem[] = [
    { id:"overview"     as Tab, label:"Overview",             icon:Icons.overview     },
    { id:"employees"    as Tab, label:"Employees",            icon:Icons.employees    },
    { id:"departments"  as Tab, label:"Departments",          icon:Icons.departments  },
    { id:"actions"      as Tab, label:"Action Queue",         icon:Icons.actions,  badge: openCount > 0 ? String(openCount) : null },
    { id:"recognition"  as Tab, label:"Recognition Activity", icon:Icons.recognition  },
  ];

  const NAV_FEATURES: NavItem[] = [
    { id:"intelligence" as Tab, label:"HR Intelligence",      icon:Icons.intelligence },
    { id:"manager"      as Tab, label:"Team Lens",            icon:Icons.workforce    },
    { id:"evaluations"  as Tab, label:"Evaluation Metrics",   icon:Icons.evaluation   },
  ];

  const ALL_NAV = [...NAV_WORKFORCE, ...NAV_FEATURES];

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside className="w-[230px] shrink-0 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-5 pb-3.5 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <img src="/Northeastern Logo.png" alt="Northeastern University"
              className="w-9 h-9 object-contain shrink-0" />
            <div>
              <div className="font-extrabold text-[15px] text-[#0B3954]">Capstone</div>
              <div className="font-mono text-[9px] text-gray-500 tracking-widest uppercase">
                Master&apos;s Project
              </div>
            </div>
          </div>
        </div>

        <nav className="px-2 py-2.5 flex-1">
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-gray-400 px-1.5 py-2">
            Workforce
          </div>
          {NAV_WORKFORCE.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 border-none ${
                tab === n.id
                  ? "bg-orange-50 text-[#F96400] font-bold"
                  : "text-gray-500 hover:bg-orange-50 hover:text-[#F96400]"
              }`}>
              <span className="w-4 flex items-center justify-center shrink-0">{n.icon}</span>
              {n.label}
              {n.badge && (
                <span className="ml-auto font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#F96400] text-white">
                  {n.badge}
                </span>
              )}
            </button>
          ))}

          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-gray-400 px-1.5 pt-4 pb-1 flex items-center gap-1.5">
            New Features
            <span className="bg-[#F96400] text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
          </div>
          {NAV_FEATURES.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 border-none ${
                tab === n.id
                  ? "bg-orange-50 text-[#F96400] font-bold"
                  : "text-gray-500 hover:bg-orange-50 hover:text-[#F96400]"
              }`}>
              <span className="w-4 flex items-center justify-center shrink-0">{n.icon}</span>
              {n.label}
              {n.badge && (
                <span className="ml-auto font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#F96400] text-white">
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3.5 py-3 border-t border-gray-200 font-mono text-[9px] text-gray-400">
          <div>{wf.totalPeople} employees · {data.kpi.uniqueDepartments} depts</div>
          <div className="mt-0.5">Group 2</div>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-7 shrink-0">
          <div>
            <div className="text-[15px] font-bold text-[#0B3954]">
              {ALL_NAV.find(n => n.id === tab)?.label}
            </div>
            <div className="font-mono text-[10px] text-gray-500 mt-0.5">
              {isActive
                ? `${filteredData.kpi.totalAwards} awards · ${fm[0]?.label ?? ""} – ${fm[fm.length - 1]?.label ?? ""}`
                : `${wf.totalPeople} employees · ${wf.coveragePct}% recognition coverage · FY 2025`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DateRangeFilter />
            <div className="px-3 py-1.5 bg-teal-50 rounded-lg font-mono text-[10px] text-[#00A98F] font-semibold">
              HR ANALYTICS
            </div>
          </div>
        </header>

        <main
          className="flex-1 px-7 py-6 overflow-y-auto"
          style={{ scrollbarWidth:"none", msOverflowStyle:"none" } as React.CSSProperties}>

          {tab === "overview" && (
            hasData || !isActive
              ? <Overview
                  data={filteredData}
                  kpiRow1={kpiRow1}
                  kpiRow2={kpiRow2}
                  isActive={isActive}
                  hasData={hasData}
                  onNavigate={(t) => setTab(t as Tab)}
                />
              : <NoData />
          )}

          {tab === "employees"    && <EmployeeDirectory   data={data} />}
          {tab === "departments"  && <Departments         data={data} />}
          {tab === "actions"      && <ActionQueue dismissed={dismissed} setDismissed={setDismissed} />}
          {tab === "recognition"  && (hasData || !isActive ? <RecognitionActivity data={filteredData} /> : <NoData />)}
          {tab === "intelligence" && <HRIntelligence      data={data} />}
          {tab === "manager"      && <TeamLens            data={data} />}
          {tab === "evaluations"  && <Evaluations         data={data} />}

        </main>
      </div>
    </div>
  );
}