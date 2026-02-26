"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { CAT_COLORS } from "@/constants/colors";
import { SH } from "@/constants/primitives";

export function HealthScorecard({ data }: { data: DashboardData }) {
  const [selected, setSelected] = useState<string | null>(data.cultureHealth[0]?.name || null);
  const depts = data.cultureHealth;

  const scoreColor = (s: number) => s >= 80 ? "#27AE60" : s >= 65 ? "#00A98F" : s >= 50 ? "#F39C12" : "#E74C3C";
  const scoreBg = (s: number) => s >= 80 ? "#EAFAF1" : s >= 65 ? "#E8F8F5" : s >= 50 ? "#FEF9E7" : "#FDEDEC";
  const scoreLabel = (s: number) => s >= 80 ? "Thriving" : s >= 65 ? "Healthy" : s >= 50 ? "Developing" : "Needs Focus";
  const sel = depts.find(d => d.name === selected) || depts[0];

  const SCORE_DIMS = [
    { key: "diversity" as const, label: "Category Diversity", color: "#3B5BDB" },
    { key: "participation" as const, label: "Peer Participation", color: "#00A98F" },
    { key: "volume" as const, label: "Recognition Volume", color: "#F96400" },
    { key: "generosity" as const, label: "Award Generosity", color: "#27AE60" },
  ];

  return (
    <div>
      <SH eye="Culture Intelligence" title="Department Health Scorecard" eyeColorCls="text-[#27AE60]"
        right={<div className="font-mono text-[10px] text-gray-500">4 signals · click dept for detail</div>} />

      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {[...depts].sort((a, b) => b.health - a.health).map(d => {
          const col = scoreColor(d.health);
          const isSel = selected === d.name;
          return (
            <div key={d.name} onClick={() => setSelected(isSel ? null : d.name)}
              className="p-3.5 rounded-lg cursor-pointer transition-all duration-200 bg-white shadow-sm"
              style={{ border: `2px solid ${isSel ? col : "#E9ECEF"}`, background: isSel ? scoreBg(d.health) : "white", boxShadow: isSel ? "0 4px 12px rgba(11,57,84,.08)" : "0 1px 3px rgba(11,57,84,.06)" }}
              onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.borderColor = col; }}
              onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.borderColor = "#E9ECEF"; }}>
              <div className="font-mono text-[8px] tracking-widest uppercase text-gray-500 mb-1.5">{d.name}</div>
              <div className="font-extrabold text-3xl font-mono tracking-tight leading-none mb-0.5" style={{ color: col }}>{d.health}</div>
              <div className="font-mono text-[9px] text-gray-400 mb-2.5">{scoreLabel(d.health)}</div>
              <div className="flex h-1 rounded overflow-hidden gap-px">
                {d.categorySpread.map(c => (
                  <div key={c.id} style={{ flex: c.count, background: CAT_COLORS[c.id] || "#888" }} title={`${c.name}: ${c.count}`} />
                ))}
              </div>
              <div className="font-mono text-[9px] text-gray-500 mt-1.5">{d.totalAwards} awards · ${(d.totalValue / 1000).toFixed(0)}K</div>
            </div>
          );
        })}
      </div>

      {sel && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="text-[44px] font-extrabold font-mono tracking-tight leading-none" style={{ color: scoreColor(sel.health) }}>{sel.health}</div>
              <div>
                <div className="font-bold text-base text-[#0B3954]">{sel.name}</div>
                <div className="font-mono text-[10px] text-gray-500 mt-0.5">{scoreLabel(sel.health)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                { l: "Awards", v: sel.totalAwards, c: "text-[#F96400]" },
                { l: "Recipients", v: sel.uniqueRecipients, c: "text-[#00A98F]" },
                { l: "Nominators", v: sel.uniqueNominators, c: "text-[#0B3954]" },
                { l: "Total Value", v: `$${(sel.totalValue / 1000).toFixed(0)}K`, c: "text-[#27AE60]" },
                { l: "Avg Value", v: `$${sel.avgValue}`, c: "text-[#3B5BDB]" },
                { l: "Cross-Dept", v: `${sel.crossDeptPct}%`, c: "text-[#8E44AD]" },
              ].map(s => (
                <div key={s.l} className="p-2.5 bg-gray-50 rounded-lg">
                  <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1">{s.l}</div>
                  <div className={`font-bold text-lg ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {SCORE_DIMS.map(dim => (
                <div key={dim.key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-[#0B3954] font-medium">{dim.label}</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: dim.color }}>{sel.scores[dim.key]}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full rounded transition-[width] duration-1000" style={{ width: `${sel.scores[dim.key]}%`, background: dim.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="font-mono text-[9px] tracking-[.14em] uppercase text-[#27AE60] mb-1">AWARD CATEGORY SPREAD</div>
            <div className="text-[14px] font-bold text-[#0B3954] mb-4">Recognition Type Breakdown</div>
            {sel.categorySpread.map(c => (
              <div key={c.id} className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[c.id] || "#888" }} />
                    <span className="text-[11px] text-[#0B3954] font-medium">{c.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">{c.count}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${(c.count / sel.totalAwards) * 100}%`, background: CAT_COLORS[c.id] || "#888" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}