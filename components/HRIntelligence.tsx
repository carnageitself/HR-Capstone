"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { InvisibleRadar }   from "./intelligence/InvisibleRadar";
import { MomentumTracker }  from "./intelligence/MomentumTracker";
import { CrossDeptMap }     from "./intelligence/CrossDeptmap";
import { EquityLens }       from "./intelligence/EquityLens";
import { ValueEquityAudit } from "./intelligence/ValueEquityAudit";

export function HRIntelligence({ data }: { data: DashboardData }) {
  const [active, setActive] = useState<
    "invisible" | "momentum" | "crossdept" | "equity" | "valueaudit"
  >("invisible");

  const intel = data.intelligence;

  const TABS = [
    {
      id:        "invisible" as const,
      label:     "Invisible Contributors",
      sub:       `${intel.invisibleContributors.length} employees at risk`,
      activeBar: "#EF4444",
      activeBg:  "#FEF2F2",
      activeText:"#DC2626",
    },
    {
      id:        "momentum" as const,
      label:     "Momentum Tracker",
      sub:       `${intel.risingStars.length} rising · ${intel.decliningRecognition?.length ?? 0} declining`,
      activeBar: "#10B981",
      activeBg:  "#F0FDF4",
      activeText:"#059669",
    },
    {
      id:        "crossdept" as const,
      label:     "Influence Map",
      sub:       `${intel.crossDeptFlow.length} cross-dept flows`,
      activeBar: "#00A98F",
      activeBg:  "#F0FDFA",
      activeText:"#0F766E",
    },
    {
      id:        "equity" as const,
      label:     "Equity Lens",
      sub:       `${intel.equityData.length} seniority levels`,
      activeBar: "#3B5BDB",
      activeBg:  "#EFF6FF",
      activeText:"#1D4ED8",
    },
    {
      id:        "valueaudit" as const,
      label:     "Value Equity Audit",
      sub:       `Gini coefficient ${intel.valueEquity.concentration.giniCoeff}`,
      activeBar: "#8B5CF6",
      activeBg:  "#F5F3FF",
      activeText:"#7C3AED",
    },
  ];

  const current = TABS.find(t => t.id === active)!;

  return (
    <div className="flex flex-col gap-5">

      {/* Full-width tab grid — 5 equal columns */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
        {TABS.map(t => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="flex flex-col items-start gap-1 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left w-full"
              style={{
                borderColor:     isActive ? t.activeBar : "#E9ECEF",
                background:      isActive ? t.activeBg  : "#fff",
                borderTopWidth:  isActive ? 3 : 2,
              }}>
              <div
                className="text-[12px] font-bold leading-tight"
                style={{ color: isActive ? t.activeText : "#0B3954" }}>
                {t.label}
              </div>
              <div
                className="font-mono text-[9px] leading-snug"
                style={{ color: isActive ? t.activeText : "#9CA3AF", opacity: isActive ? 0.85 : 1 }}>
                {t.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active panel — white card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Panel header strip */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3"
          style={{ borderLeft: `4px solid ${current.activeBar}` }}>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
              style={{ color: current.activeText }}>{current.label}</div>
            <div className="font-mono text-[10px] text-gray-400">{current.sub}</div>
          </div>
        </div>

        <div className="p-6">
          {active === "invisible"  && <InvisibleRadar   intel={intel} />}
          {active === "momentum"   && <MomentumTracker  intel={intel} />}
          {active === "crossdept"  && <CrossDeptMap     intel={intel} />}
          {active === "equity"     && <EquityLens       intel={intel} />}
          {active === "valueaudit" && <ValueEquityAudit intel={intel} />}
        </div>
      </div>
    </div>
  );
}