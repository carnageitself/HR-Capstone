"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { InvisibleRadar }     from "./intelligence/InvisibleRadar";
import { MomentumTracker }    from "./intelligence/MomentumTracker";

import { EquityLens }         from "./intelligence/EquityLens";
import { SkillGapRadar }      from "./intelligence/SkillGapRadar";
import { SeasonalityHeatmap } from "./intelligence/SeasonalityHeatmap";
import { OrgConnectors }      from "./intelligence/OrgConnectors";
import { ValueEquityAudit }   from "./intelligence/ValueEquityAudit";
import { CrossDeptMap } from "./intelligence/CrossDeptmap";

export function HRIntelligence({ data }: { data: DashboardData }) {
  const [active, setActive] = useState<"invisible" | "momentum" | "crossdept" | "equity" | "skillgap" | "seasonality" | "connectors" | "valueaudit">("invisible");
  const intel = data.intelligence;

  const TABS = [
    { id: "invisible"   as const, icon: "👁️",  label: "Invisible Contributors", sub: `${intel.invisibleContributors.length} at risk`,                          activeCls: "border-red-500 bg-red-50",      labelCls: "text-red-600",    subCls: "text-red-400"    },
    { id: "momentum"    as const, icon: "📈",  label: "Momentum Tracker",        sub: `${intel.risingStars.length} rising`,                                     activeCls: "border-green-500 bg-green-50",  labelCls: "text-green-700",  subCls: "text-green-400"  },
    { id: "crossdept"   as const, icon: "🗺️", label: "Influence Map",           sub: `${intel.crossDeptFlow.length} flows`,                                    activeCls: "border-teal-500 bg-teal-50",    labelCls: "text-teal-700",   subCls: "text-teal-400"   },
    { id: "equity"      as const, icon: "⚖️",  label: "Equity Lens",             sub: "6 seniority levels",                                                     activeCls: "border-indigo-500 bg-indigo-50", labelCls: "text-indigo-700", subCls: "text-indigo-400" },
    { id: "skillgap"    as const, icon: "🎯",  label: "Skill Gap Radar",         sub: `${intel.skillGaps.filter(s => s.rarity === "rare").length} rare skills`, activeCls: "border-red-400 bg-red-50",      labelCls: "text-red-600",    subCls: "text-red-300"    },
    { id: "seasonality" as const, icon: "📅",  label: "Seasonality Heatmap",     sub: "12 months · 6 categories",                                               activeCls: "border-purple-500 bg-purple-50", labelCls: "text-purple-700", subCls: "text-purple-400" },
    { id: "connectors"  as const, icon: "🕸️", label: "Org Connectors",          sub: `${intel.orgConnectors.length} connectors`,                               activeCls: "border-orange-500 bg-orange-50", labelCls: "text-orange-700", subCls: "text-orange-400" },
    { id: "valueaudit"  as const, icon: "💰",  label: "Value Equity Audit",      sub: `Gini ${intel.valueEquity.concentration.giniCoeff}`,                      activeCls: "border-green-500 bg-green-50",  labelCls: "text-green-700",  subCls: "text-green-400"  },
  ];

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 cursor-pointer transition-all duration-200 ${active === t.id ? t.activeCls : "border-gray-200 bg-white"}`}>
            <span className="text-sm">{t.icon}</span>
            <div className="text-left">
              <div className={`text-[11px] font-bold leading-tight ${active === t.id ? t.labelCls : "text-[#0B3954]"}`}>{t.label}</div>
              <div className={`font-mono text-[8px] ${active === t.id ? t.subCls : "text-gray-400"}`}>{t.sub}</div>
            </div>
          </button>
        ))}
      </div>
      {active === "invisible"   && <InvisibleRadar     intel={intel} />}
      {active === "momentum"    && <MomentumTracker    intel={intel} />}
      {active === "crossdept"   && <CrossDeptMap       intel={intel} />}
      {active === "equity"      && <EquityLens         intel={intel} />}
      {active === "skillgap"    && <SkillGapRadar      intel={intel} />}
      {active === "seasonality" && <SeasonalityHeatmap intel={intel} />}
      {active === "connectors"  && <OrgConnectors      intel={intel} />}
      {active === "valueaudit"  && <ValueEquityAudit   intel={intel} />}
    </div>
  );
}