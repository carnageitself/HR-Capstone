"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { DEPT_COLORS } from "@/constants/colors";
import { Spark, IntelAvatar } from "@/constants/primitives";

export function MomentumTracker({ intel }: { intel: DashboardData["intelligence"] }) {
  const [view, setView] = useState<"rising" | "declining">("rising");
  const people = view === "rising" ? intel.risingStars : intel.decliningRecognition;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-green-50 border border-green-200">
          <div className="font-bold text-xs text-green-700 mb-1">🚀 {intel.risingStars.length} Rising Stars</div>
          <p className="text-[11px] text-green-600 leading-relaxed">Recognition accelerating — high potential for promotion pipeline.</p>
        </div>
        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
          <div className="font-bold text-xs text-red-700 mb-1">⚠️ {intel.decliningRecognition.length} Declining</div>
          <p className="text-[11px] text-red-600 leading-relaxed">Recognition falling — possible early disengagement signal.</p>
        </div>
      </div>
      <div className="flex gap-2 mb-3.5">
        {([{ id: "rising" as const, label: "🚀 Rising Stars", activeCls: "border-green-500 bg-green-50 text-green-700" }, { id: "declining" as const, label: "⚠️ Declining", activeCls: "border-red-500 bg-red-50 text-red-700" }]).map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-semibold border-2 cursor-pointer transition-all ${view === v.id ? v.activeCls : "border-gray-200 bg-white text-gray-500"}`}>
            {v.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {people.slice(0, 12).map(p => {
          const isRising = view === "rising";
          return (
            <div key={p.id} className={`p-3.5 rounded-xl border bg-white shadow-sm ${isRising ? "border-green-200" : "border-red-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <IntelAvatar name={p.name} dept={p.dept} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[11px] text-[#0B3954] truncate">{p.name}</div>
                  <div className="text-[9px] text-gray-500">{p.dept}</div>
                </div>
              </div>
              <div className="mb-2"><Spark data={p.monthlyData} color={isRising ? "#27AE60" : "#E74C3C"} h={28} w={110} /></div>
              <div className="grid grid-cols-3 gap-1">
                {[{ l: "Total", v: p.total, cls: "text-[#0B3954]" }, { l: "Slope", v: (isRising ? "+" : "") + p.slope.toFixed(2), cls: isRising ? "text-green-600" : "text-red-500" }, { l: "Recent", v: p.recent, cls: "text-[#0B3954]" }].map(s => (
                  <div key={s.l} className="text-center p-1 bg-gray-50 rounded-md">
                    <div className="font-mono text-[7px] text-gray-500 uppercase mb-0.5">{s.l}</div>
                    <div className={`font-bold text-[13px] ${s.cls}`}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="font-mono text-[8px] text-gray-400 mt-2">{p.seniority} · {p.months} months</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}