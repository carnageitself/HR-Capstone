"use client";

import { useState, useRef } from "react";
import type { HistoryJob } from "./types";

const PHASE_COLORS: Record<string, string> = {
  phase_1: "#F96400",
  phase_2: "#00A98F",
  phase_3: "#3B5BDB",
};

const PHASE_LABELS: Record<string, string> = {
  phase_1: "Phase 1 — Discovery",
  phase_2: "Phase 2 — Classification",
  phase_3: "Phase 3 — Finalization",
};

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtCost(usd: number): string {
  if (usd === 0) return "Free";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

export function CostBadge({ job }: { job: HistoryJob }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const tu = job.token_usage;
  const totals = tu?.totals;
  const totalTokens = totals?.total_tokens || 0;
  const totalCost = totals?.estimated_cost_usd || 0;

  if (!tu || totalTokens === 0) {
    return <span className="font-mono text-[10px] text-gray-400">—</span>;
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - 320),
      });
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
          {fmtTokens(totalTokens)}
        </span>
        <span
          className="font-mono text-[9px] font-bold"
          style={{ color: totalCost === 0 ? "#27AE60" : "#F96400" }}
        >
          {fmtCost(totalCost)}
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
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-[310px] max-h-[500px] overflow-y-auto"
            style={{ top: pos.top, left: pos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-[12px] text-[#0B3954]">Token Usage & Cost</div>
              <div
                className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                style={{
                  background: totalCost === 0 ? "#27AE6018" : "#F9640018",
                  color: totalCost === 0 ? "#27AE60" : "#F96400",
                }}
              >
                {fmtCost(totalCost)} total
              </div>
            </div>

            {/* Totals strip */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                <div className="font-mono text-[7px] tracking-widest uppercase text-gray-400 mb-0.5">Input</div>
                <div className="font-mono text-[13px] font-extrabold text-[#0B3954]">
                  {fmtTokens(totals?.input_tokens || 0)}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                <div className="font-mono text-[7px] tracking-widest uppercase text-gray-400 mb-0.5">Output</div>
                <div className="font-mono text-[13px] font-extrabold text-[#0B3954]">
                  {fmtTokens(totals?.output_tokens || 0)}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                <div className="font-mono text-[7px] tracking-widest uppercase text-gray-400 mb-0.5">Total</div>
                <div className="font-mono text-[13px] font-extrabold text-[#F96400]">
                  {fmtTokens(totalTokens)}
                </div>
              </div>
            </div>

            {/* Per-phase breakdown */}
            <div className="font-mono text-[8px] tracking-widest uppercase text-gray-400 mb-2">
              Breakdown by Phase
            </div>
            <div className="flex flex-col gap-2.5">
              {(["phase_1", "phase_2", "phase_3"] as const).map((phaseKey) => {
                const phase = tu[phaseKey];
                if (!phase) return null;

                const color = PHASE_COLORS[phaseKey];
                const label = PHASE_LABELS[phaseKey];
                const phaseCost = totals?.cost_by_phase?.[phaseKey] || 0;
                const phasePct = totalTokens > 0 ? (phase.total_tokens / totalTokens) * 100 : 0;

                return (
                  <div key={phaseKey} className="border border-gray-200 rounded-lg p-2.5">
                    {/* Phase header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: color }}
                        />
                        <span className="text-[10px] font-bold text-[#0B3954]">{label}</span>
                      </div>
                      <span
                        className="font-mono text-[10px] font-bold"
                        style={{ color: phaseCost === 0 ? "#27AE60" : color }}
                      >
                        {fmtCost(phaseCost)}
                      </span>
                    </div>

                    {/* Model info */}
                    <div className="font-mono text-[8px] text-gray-400 mb-1.5">
                      {phase.provider}/{phase.model} · {phase.calls} call{phase.calls !== 1 ? "s" : ""}
                    </div>

                    {/* Token bar */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(2, phasePct)}%`, background: color }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-gray-500 w-10 text-right shrink-0">
                        {phasePct.toFixed(0)}%
                      </span>
                    </div>

                    {/* In/out tokens */}
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[8px] text-gray-400">IN:</span>
                        <span className="font-mono text-[9px] font-bold text-[#0B3954]">
                          {fmtTokens(phase.input_tokens)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[8px] text-gray-400">OUT:</span>
                        <span className="font-mono text-[9px] font-bold text-[#0B3954]">
                          {fmtTokens(phase.output_tokens)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cost insight */}
            {totalCost > 0 && (
              <div className="mt-3 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="font-mono text-[8px] tracking-widest uppercase text-orange-500 mb-1">
                  Cost Insight
                </div>
                <div className="text-[10px] text-[#0B3954] leading-relaxed">
                  {(totals?.cost_by_phase?.phase_2 || 0) === 0 ? (
                    <>
                      Phase 2 ran <strong className="text-[#27AE60]">locally for free</strong> using Ollama.
                      Without the hybrid approach, this run would have cost an estimated{" "}
                      <strong className="text-[#E74C3C]">
                        ~{fmtCost(totalCost * 3)}–{fmtCost(totalCost * 10)}
                      </strong>{" "}
                      on a pure API pipeline.
                    </>
                  ) : (
                    <>
                      All phases used cloud APIs.
                      Consider using a <strong>local SLM for Phase 2</strong> to reduce costs.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}