"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";

const DEPT_COLORS: Record<string, string> = {
  "Customer Service": "#FF6B6B", "Data Science": "#4ECDC4", "Design": "#45B7D1",
  "Engineering": "#96CEB4",     "Finance": "#FFEAA7",       "HR": "#DDA15E",
  "IT": "#6C5CE7",              "Legal": "#A29BFE",          "Marketing": "#FD79A8",
  "Operations": "#74B9FF",      "Product": "#00CEC9",        "Sales": "#FDCB6E",
};

export function CrossDeptMap({ intel }: { intel: DashboardData["intelligence"] }) {
  const [highlight, setHighlight] = useState<string | null>(null);
  const [view, setView] = useState<"matrix" | "givers" | "receivers">("matrix");

  const depts = intel.depts;

  // Build matrix lookup
  const matrix: Record<string, Record<string, number>> = {};
  intel.crossDeptFlow.forEach(f => {
    if (!matrix[f.from]) matrix[f.from] = {};
    matrix[f.from][f.to] = f.value;
  });
  const getVal = (from: string, to: string) =>
    from === to ? null : (matrix[from]?.[to] ?? 0);

  const maxFlow = Math.max(...intel.crossDeptFlow.map(f => f.value), 1);

  const heatBg = (v: number) => {
    const t = v / maxFlow;
    const r = Math.round(249 * t + 240 * (1 - t));
    const g = Math.round(100 * t + 240 * (1 - t));
    return `rgb(${r},${g},${Math.round(240 * (1 - t))})`;
  };

  const givers = depts
    .map(d => ({ dept: d, total: depts.reduce((s, r) => d !== r ? s + (getVal(d, r) ?? 0) : s, 0) }))
    .sort((a, b) => b.total - a.total);

  const receivers = depts
    .map(d => ({
      dept: d,
      total: depts.reduce((s, g) => d !== g ? s + (getVal(g, d) ?? 0) : s, 0),
      sources: depts.filter(g => d !== g && (getVal(g, d) ?? 0) > 0).length,
    }))
    .sort((a, b) => b.total - a.total);

  const maxG = givers[0]?.total || 1;
  const maxR = receivers[0]?.total || 1;

  return (
    <div className="flex flex-col gap-4">

      {/* Callout */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
        style={{ background: "linear-gradient(135deg,#E8F8F5,#EDF2FF)", border: "1px solid #B2EBE3" }}>
        <p className="text-[12px] text-[#0B3954] leading-relaxed m-0">
          <strong>Cross-dept recognition reveals your org&apos;s informal influence network.</strong>{" "}
          High-outflow depts are culture amplifiers. Low inflow depts may be siloed.
        </p>
      </div>

      {/* View switcher */}
      <div className="flex gap-2">
        {([
          { id: "matrix"    as const, label: "Heat Map"      },
          { id: "givers"    as const, label: "Top Givers"    },
          { id: "receivers" as const, label: "Top Receivers" },
        ]).map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className="px-4 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-all"
            style={{
              borderColor: view === v.id ? "#00A98F" : "#E9ECEF",
              background:  view === v.id ? "#E8F8F5"  : "#fff",
              color:       view === v.id ? "#00A98F"  : "#6C757D",
            }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* MATRIX VIEW — full width */}
      {view === "matrix" && (
        <div className="overflow-x-auto">
          <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
            <colgroup>
              {/* Row label column — fixed width */}
              <col style={{ width: 110 }} />
              {/* Data columns — equal share of remaining space */}
              {depts.map(d => <col key={d} />)}
            </colgroup>
            <thead>
              <tr>
                <th style={{
                  padding: "6px 8px", fontFamily: "monospace", fontSize: 8,
                  color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".1em",
                  borderBottom: "2px solid #E9ECEF", textAlign: "left",
                }}>
                  FROM ↓ TO →
                </th>
                {depts.map(d => (
                  <th key={d}
                    onClick={() => setHighlight(highlight === d ? null : d)}
                    style={{
                      padding: "4px 2px",
                      fontFamily: "monospace", fontSize: 7,
                      color: highlight === d ? (DEPT_COLORS[d] || "#0B3954") : "#9CA3AF",
                      fontWeight: highlight === d ? 700 : 400,
                      textAlign: "center", cursor: "pointer",
                      borderBottom: "2px solid #E9ECEF",
                      textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
                    }}>
                    {d.length > 7 ? d.slice(0, 6) + "…" : d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {depts.map(from => (
                <tr key={from}>
                  <td
                    onClick={() => setHighlight(highlight === from ? null : from)}
                    style={{
                      padding: "3px 8px",
                      fontFamily: "monospace", fontSize: 9,
                      color: highlight === from ? (DEPT_COLORS[from] || "#0B3954") : "#6C757D",
                      fontWeight: highlight === from ? 700 : 400,
                      borderBottom: "1px solid #F3F4F6",
                      cursor: "pointer", whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                    {from}
                  </td>
                  {depts.map(to => {
                    const v = getVal(from, to);
                    const isSelf = from === to;
                    const isHL = highlight && (highlight === from || highlight === to);
                    return (
                      <td key={to} style={{
                        padding: "3px 2px", textAlign: "center",
                        borderBottom: "1px solid #F3F4F6",
                        background: isSelf ? "#F8F9FA" : v ? heatBg(v) : "transparent",
                        opacity: highlight && !isHL ? 0.15 : 1,
                        transition: "opacity .2s",
                      }}>
                        {isSelf
                          ? <span style={{ color: "#E9ECEF" }}>—</span>
                          : v
                            ? <span style={{
                                fontFamily: "monospace", fontSize: 9, fontWeight: 700,
                                color: v >= maxFlow * 0.6 ? "white" : v >= maxFlow * 0.35 ? "#B03A2E" : "#6C757D",
                              }}>{v}</span>
                            : <span style={{ color: "#E9ECEF", fontSize: 8 }}>·</span>
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GIVERS VIEW */}
      {view === "givers" && (
        <div className="flex flex-col gap-2">
          {givers.map((g, i) => (
            <div key={g.dept} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: i === 0 ? "#E8F8F5" : "#FAFBFC",
                border: `1px solid ${i === 0 ? "#B2EBE3" : "#E9ECEF"}`,
              }}>
              <div className="w-7 h-7 rounded-lg grid place-items-center text-white font-extrabold text-[11px] shrink-0"
                style={{ background: DEPT_COLORS[g.dept] || "#888" }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-[#0B3954]">{g.dept}</div>
                <div className="font-mono text-[10px] text-gray-500">Champions {g.total} cross-dept recognitions</div>
              </div>
              <div className="w-32 h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div className="h-full rounded-full" style={{ width: `${(g.total / maxG) * 100}%`, background: DEPT_COLORS[g.dept] || "#888" }} />
              </div>
              <div className="font-mono font-extrabold text-[15px] shrink-0 w-8 text-right"
                style={{ color: i === 0 ? "#00A98F" : "#0B3954" }}>{g.total}</div>
            </div>
          ))}
        </div>
      )}

      {/* RECEIVERS VIEW */}
      {view === "receivers" && (
        <div className="flex flex-col gap-2">
          {receivers.map((r, i) => (
            <div key={r.dept} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: i === 0 ? "#FFF4EE" : "#FAFBFC",
                border: `1px solid ${i === 0 ? "#FDDCC9" : "#E9ECEF"}`,
              }}>
              <div className="w-7 h-7 rounded-lg grid place-items-center text-white font-extrabold text-[11px] shrink-0"
                style={{ background: DEPT_COLORS[r.dept] || "#888" }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-[#0B3954]">{r.dept}</div>
                <div className="font-mono text-[10px] text-gray-500">
                  Recognized by {r.sources} depts · {r.total} total cross-dept awards
                </div>
              </div>
              <div className="w-32 h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div className="h-full rounded-full" style={{ width: `${(r.total / maxR) * 100}%`, background: DEPT_COLORS[r.dept] || "#888" }} />
              </div>
              <div className="font-mono font-extrabold text-[15px] shrink-0 w-8 text-right"
                style={{ color: i === 0 ? "#F96400" : "#0B3954" }}>{r.total}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}