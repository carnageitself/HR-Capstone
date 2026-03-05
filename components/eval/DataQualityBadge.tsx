"use client";

import { useState, useRef } from "react";
import type { HistoryJob } from "./types";

export function DataQualityBadge({ job }: { job: HistoryJob }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const rows = job.upload?.row_count || job.eda_report?.basic?.total_rows || 0;
  const nulls = job.eda_report?.basic?.null_counts || {};
  const columns = job.eda_report?.basic?.columns || job.upload?.columns || [];
  const totalNulls = Object.values(nulls).reduce((s, v) => s + v, 0);
  const completeness = rows > 0 && columns.length > 0
    ? Math.round((1 - totalNulls / (rows * columns.length)) * 100)
    : 100;

  const color = completeness >= 95 ? "#27AE60" : completeness >= 80 ? "#F39C12" : "#E74C3C";

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: Math.min(rect.left, window.innerWidth - 300) });
    }
    setOpen(!open);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1.5 cursor-pointer group"
      >
        <span className="font-mono text-[11px] font-bold text-[#0B3954]">
          {rows.toLocaleString()}
        </span>
        <span className="font-mono text-[9px]" style={{ color }}>
          {completeness}%
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-gray-400 group-hover:text-gray-600">
          <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <text x="5" y="7.5" textAnchor="middle" fontSize="7" fill="currentColor">i</text>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-[280px] max-h-[400px] overflow-y-auto"
            style={{ top: pos.top, left: pos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-[12px] text-[#0B3954]">Data Quality</div>
                <div className="font-mono text-[9px] text-gray-400">{job.upload?.filename || "—"}</div>
              </div>
              <div className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: color + "18", color }}>
                {completeness}% complete
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[8px] tracking-widest uppercase text-gray-400">Records Processed</span>
                <span className="font-mono text-[15px] font-extrabold text-[#F96400]">{rows.toLocaleString()}</span>
              </div>
            </div>

            <div className="font-mono text-[8px] tracking-widest uppercase text-gray-400 mb-2">Missing Data by Column</div>
            <div className="flex flex-col gap-1.5">
              {columns.map((col) => {
                const missing = nulls[col] || 0;
                const pct = rows > 0 ? (missing / rows) * 100 : 0;
                const barColor = pct === 0 ? "#27AE60" : pct < 5 ? "#F39C12" : "#E74C3C";
                return (
                  <div key={col}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-[#0B3954] font-medium truncate flex-1">{col}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[9px]" style={{ color: barColor }}>
                          {missing === 0 ? "✓" : `${missing} missing`}
                        </span>
                        <span className="font-mono text-[9px] text-gray-400 w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-200 rounded overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${Math.max(1, 100 - pct)}%`, background: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {totalNulls > 0 && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-[10px] text-amber-800">
                  <strong>{totalNulls}</strong> total missing values across{" "}
                  {Object.values(nulls).filter((v) => v > 0).length} columns
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}