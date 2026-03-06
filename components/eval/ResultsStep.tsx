"use client";

import { useState } from "react";
import {
  apiApplyTaxonomy,
  type EvalState,
  type CategoryAction,
  type PipelineResult,
} from "../Evaluations";

const CAT_PALETTE = ["#F96400", "#00A98F", "#3B5BDB", "#8E44AD", "#27AE60", "#E74C3C", "#F39C12", "#45B7D1"];

function fmtTime(s: number) {
  if (s < 60) return `${s.toFixed(1)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  return `${(s / 3600).toFixed(1)}h`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtCost(usd: number): string {
  if (usd === 0) return "Free";
  if (usd < 0.01) return `${usd.toFixed(4)}`;
  if (usd < 1) return `${usd.toFixed(3)}`;
  return `${usd.toFixed(2)}`;
}

function Scorecard({ results }: { results: Record<string, PipelineResult> }) {
  const runs = Object.entries(results);
  if (runs.length === 0) return null;

  const metrics = [
    { label: "Categories", fn: (r: PipelineResult) => r.pipeline_summary.results.final_categories, higher: true },
    { label: "Subcategories", fn: (r: PipelineResult) => r.pipeline_summary.results.total_subcategories, higher: true },
    { label: "Candidates Found", fn: (r: PipelineResult) => r.pipeline_summary.results.candidates_found, higher: true },
    { label: "Changes Applied", fn: (r: PipelineResult) => r.pipeline_summary.results.changes_applied, higher: true },
    { label: "Run Time", fn: (r: PipelineResult) => r.pipeline_summary.pipeline.total_time_seconds, higher: false, fmt: (v: number) => fmtTime(v) },
    { label: "Total Tokens", fn: (r: PipelineResult) => r.token_usage?.totals?.total_tokens || 0, higher: false, fmt: (v: number) => fmtTokens(v) },
    { label: "Input Tokens", fn: (r: PipelineResult) => r.token_usage?.totals?.input_tokens || 0, higher: false, fmt: (v: number) => fmtTokens(v) },
    { label: "Output Tokens", fn: (r: PipelineResult) => r.token_usage?.totals?.output_tokens || 0, higher: false, fmt: (v: number) => fmtTokens(v) },
    { label: "Estimated Cost", fn: (r: PipelineResult) => r.token_usage?.totals?.estimated_cost_usd || 0, higher: false, fmt: (v: number) => fmtCost(v) },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="font-bold text-[14px] text-[#0B3954]">Pipeline Scorecard</div>
        <div className="font-mono text-[10px] text-gray-400">Compare performance across configurations</div>
      </div>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="px-4 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Metric</th>
            {runs.map(([id, r]) => (
              <th key={id} className="px-4 py-2.5 text-center font-mono text-[9px] tracking-widest uppercase font-semibold"
                style={{ color: r.config_snapshot?.color || "#0B3954" }}>
                {r.config_id.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(m => {
            const vals = runs.map(([, r]) => m.fn(r));
            const best = m.higher ? Math.max(...vals) : Math.min(...vals);
            return (
              <tr key={m.label} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-semibold text-[#0B3954] text-[12px]">{m.label}</td>
                {vals.map((v, i) => (
                  <td key={i} className="px-4 py-2.5 text-center font-mono text-[13px] font-bold"
                    style={{ color: v === best ? "#27AE60" : "#0B3954" }}>
                    {m.fmt ? m.fmt(v) : v}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CostBreakdown({ results }: { results: Record<string, PipelineResult> }) {
  const runs = Object.entries(results).filter(([, r]) => r.token_usage?.totals);
  if (runs.length === 0) return null;

  const PHASE_COLORS = { phase_1: "#F96400", phase_2: "#00A98F", phase_3: "#3B5BDB" };
  const PHASE_NAMES = { phase_1: "P1: Discovery", phase_2: "P2: Classification", phase_3: "P3: Finalization" };

  const maxTokens = Math.max(...runs.map(([, r]) => r.token_usage?.totals?.total_tokens || 0));
  const maxCost = Math.max(...runs.map(([, r]) => r.token_usage?.totals?.estimated_cost_usd || 0));

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="font-bold text-[14px] text-[#0B3954]">Cost & Token Breakdown</div>
        <div className="font-mono text-[10px] text-gray-400">Per-phase token usage and estimated costs across configurations</div>
      </div>
      <div className="p-4 flex flex-col gap-5">
        {runs.map(([id, r]) => {
          const tu = r.token_usage!;
          const totals = tu.totals!;
          const color = r.config_snapshot?.color || "#888";

          return (
            <div key={id}>
              {/* Run header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full" style={{ background: color }} />
                  <div>
                    <div className="text-[12px] font-bold text-[#0B3954]">
                      {id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    <div className="font-mono text-[9px] text-gray-400">
                      {fmtTokens(totals.total_tokens)} tokens · {fmtCost(totals.estimated_cost_usd)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[18px] font-extrabold" style={{ color: totals.estimated_cost_usd === 0 ? "#27AE60" : "#F96400" }}>
                    {fmtCost(totals.estimated_cost_usd)}
                  </div>
                </div>
              </div>

              {/* Phase bars */}
              <div className="flex flex-col gap-1.5">
                {(["phase_1", "phase_2", "phase_3"] as const).map((pk) => {
                  const phase = tu[pk];
                  if (!phase) return null;
                  const phaseCost = totals.cost_by_phase?.[pk] || 0;
                  const tokenPct = maxTokens > 0 ? (phase.total_tokens / maxTokens) * 100 : 0;
                  const phaseColor = PHASE_COLORS[pk];

                  return (
                    <div key={pk} className="flex items-center gap-2">
                      <div className="w-28 shrink-0">
                        <div className="text-[9px] font-semibold text-[#0B3954]">{PHASE_NAMES[pk]}</div>
                        <div className="font-mono text-[8px] text-gray-400">{phase.provider}/{phase.model?.split(":")[0] || "?"}</div>
                      </div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-[width] duration-700"
                          style={{ width: `${Math.max(2, tokenPct)}%`, background: phaseColor }}
                        />
                      </div>
                      <div className="w-16 text-right shrink-0">
                        <div className="font-mono text-[10px] font-bold text-[#0B3954]">{fmtTokens(phase.total_tokens)}</div>
                      </div>
                      <div className="w-14 text-right shrink-0">
                        <span className="font-mono text-[9px] font-bold" style={{ color: phaseCost === 0 ? "#27AE60" : phaseColor }}>
                          {fmtCost(phaseCost)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hybrid savings callout */}
              {(totals.cost_by_phase?.phase_2 || 0) === 0 && totals.estimated_cost_usd > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <span className="text-sm">💰</span>
                  <span className="text-[10px] text-green-800">
                    Phase 2 ran <strong>locally for free</strong> — hybrid approach saved an estimated {fmtCost(totals.estimated_cost_usd * 3)}–{fmtCost(totals.estimated_cost_usd * 8)} vs pure API
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Cost comparison bar chart (if multiple runs) */}
        {runs.length > 1 && maxCost > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="font-mono text-[8px] tracking-widest uppercase text-gray-400 mb-2">Cost Comparison</div>
            <div className="flex flex-col gap-2">
              {runs.map(([id, r]) => {
                const cost = r.token_usage?.totals?.estimated_cost_usd || 0;
                const pct = maxCost > 0 ? (cost / maxCost) * 100 : 0;
                const color = r.config_snapshot?.color || "#888";
                return (
                  <div key={id}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] font-medium text-[#0B3954]">
                        {id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <span className="font-mono text-[10px] font-bold" style={{ color }}>{fmtCost(cost)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${Math.max(2, pct)}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaxonomySelector({
  results,
  selectedId,
  onSelect,
}: {
  results: Record<string, PipelineResult>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="font-bold text-[14px] text-[#0B3954] mb-3">Select a Taxonomy to Curate</div>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(results).map(([id, r]) => {
          const tax = r.final_taxonomy;
          const active = selectedId === id;
          const color = r.config_snapshot?.color || "#888";
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                active ? "shadow-md" : "border-gray-200 hover:border-gray-300"
              }`}
              style={active ? { borderColor: color, background: color + "08" } : undefined}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full border-2"
                  style={{ borderColor: color, background: active ? color : "transparent" }} />
                <span className="font-bold text-[12px] text-[#0B3954]">
                  {id.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div className="font-mono text-[10px] text-gray-400 mb-2">
                {tax.categories.length} categories · {tax.categories.reduce((s, c) => s + c.subcategories.length, 0)} subcategories
              </div>
              <div className="flex flex-wrap gap-1">
                {tax.categories.slice(0, 4).map((c, i) => (
                  <span key={c.id} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
                    style={{ background: CAT_PALETTE[i % CAT_PALETTE.length] + "15", color: CAT_PALETTE[i % CAT_PALETTE.length] }}>
                    {c.name}
                  </span>
                ))}
                {tax.categories.length > 4 && (
                  <span className="text-[9px] px-1.5 py-0.5 text-gray-400">+{tax.categories.length - 4}</span>
                )}
              </div>
              {active && (
                <div className="mt-2 text-[10px] font-bold" style={{ color }}>✓ Selected for curation</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TaxonomyCurator({
  result,
  categoryActions,
  subcategoryActions,
  onCategoryAction,
  onSubcategoryAction,
}: {
  result: PipelineResult;
  categoryActions: Record<string, CategoryAction>;
  subcategoryActions: Record<string, "keep" | "bin">;
  onCategoryAction: (catId: string, action: CategoryAction) => void;
  onSubcategoryAction: (subId: string, action: "keep" | "bin") => void;
}) {
  const tax = result.final_taxonomy;
  const cats = tax.categories;

  const keptCount = Object.values(categoryActions).filter(a => a === "keep").length;
  const binnedCount = Object.values(categoryActions).filter(a => a === "bin").length;
  const mergedCount = Object.values(categoryActions).filter(a => typeof a === "object").length;

  // Get merge target options (only "keep" categories)
  const mergeTargets = cats.filter(c => categoryActions[c.id] === "keep");

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <div className="font-mono text-[8px] tracking-widest uppercase text-gray-400 mb-1">Total</div>
          <div className="font-extrabold text-[20px] text-[#0B3954]">{cats.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <div className="font-mono text-[8px] tracking-widest uppercase text-green-600 mb-1">Keeping</div>
          <div className="font-extrabold text-[20px] text-green-600">{keptCount}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <div className="font-mono text-[8px] tracking-widest uppercase text-red-500 mb-1">Binned</div>
          <div className="font-extrabold text-[20px] text-red-500">{binnedCount}</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
          <div className="font-mono text-[8px] tracking-widest uppercase text-indigo-600 mb-1">Merged</div>
          <div className="font-extrabold text-[20px] text-indigo-600">{mergedCount}</div>
        </div>
      </div>

      {/* Category cards */}
      {cats.map((cat, ci) => {
        const color = CAT_PALETTE[ci % CAT_PALETTE.length];
        const action = categoryActions[cat.id] || "keep";
        const isBinned = action === "bin";
        const isMerged = typeof action === "object";
        const mergeTarget = isMerged ? (action as { merge: string }).merge : "";

        return (
          <div
            key={cat.id}
            className={`border rounded-xl overflow-hidden transition-all ${
              isBinned ? "opacity-50 border-red-200 bg-red-50" :
              isMerged ? "border-indigo-200 bg-indigo-50" :
                         "border-gray-200 bg-white"
            }`}
          >
            {/* Category header */}
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                style={{ background: color + "18", border: `2px solid ${color}` }}>
                <span className="font-mono text-[11px] font-bold" style={{ color }}>{cat.id}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-[#0B3954]">{cat.name}</div>
                <div className="text-[10px] text-gray-500">{cat.description}</div>
                <div className="font-mono text-[9px] text-gray-400 mt-0.5">{cat.subcategories.length} subcategories</div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => onCategoryAction(cat.id, "keep")}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${
                    action === "keep"
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-green-600 border-green-300 hover:bg-green-50"
                  }`}
                >
                  Keep
                </button>
                <button
                  onClick={() => onCategoryAction(cat.id, "bin")}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${
                    isBinned
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-red-500 border-red-300 hover:bg-red-50"
                  }`}
                >
                  Bin
                </button>
                {mergeTargets.length > 0 && !isBinned && (
                  <select
                    value={isMerged ? mergeTarget : ""}
                    onChange={(e) => {
                      if (e.target.value) onCategoryAction(cat.id, { merge: e.target.value });
                      else onCategoryAction(cat.id, "keep");
                    }}
                    className="px-2 py-1.5 rounded-lg text-[10px] border border-indigo-300 bg-white text-indigo-600 cursor-pointer"
                  >
                    <option value="">Merge into...</option>
                    {mergeTargets.filter(t => t.id !== cat.id).map(t => (
                      <option key={t.id} value={t.id}>{t.id}: {t.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Subcategories (only if keeping or merging) */}
            {!isBinned && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                <div className="flex flex-col gap-2">
                  {cat.subcategories.map(sub => {
                    const subAction = subcategoryActions[sub.id] || "keep";
                    const subBinned = subAction === "bin";
                    return (
                      <div
                        key={sub.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                          subBinned ? "opacity-50 bg-red-50 border-red-200" : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="w-5 h-5 rounded grid place-items-center shrink-0" style={{ background: color }}>
                          <span className="font-mono text-[7px] text-white font-bold">{sub.id}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-[#0B3954]">{sub.name}</div>
                          <div className="text-[10px] text-gray-500 truncate">{sub.description}</div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => onSubcategoryAction(sub.id, "keep")}
                            className={`px-2 py-1 rounded text-[9px] font-bold cursor-pointer border ${
                              !subBinned ? "bg-green-500 text-white border-green-500" : "bg-white text-green-600 border-green-300"
                            }`}
                          >
                            Keep
                          </button>
                          <button
                            onClick={() => onSubcategoryAction(sub.id, "bin")}
                            className={`px-2 py-1 rounded text-[9px] font-bold cursor-pointer border ${
                              subBinned ? "bg-red-500 text-white border-red-500" : "bg-white text-red-500 border-red-300"
                            }`}
                          >
                            Bin
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Export Taxonomy ───────────────────────────────────────────────────────────
function buildCuratedTaxonomy(
  result: PipelineResult,
  categoryActions: Record<string, CategoryAction>,
  subcategoryActions: Record<string, "keep" | "bin">,
): Record<string, unknown> {
  const original = result.final_taxonomy;
  const curated: typeof original.categories = [];

  for (const cat of original.categories) {
    const action = categoryActions[cat.id];
    if (action === "bin") continue;

    if (typeof action === "object" && "merge" in action) {
      // Find target and append subcategories
      const target = curated.find(c => c.id === action.merge);
      if (target) {
        const keptSubs = cat.subcategories.filter(s => subcategoryActions[s.id] !== "bin");
        target.subcategories.push(...keptSubs);
      }
      continue;
    }

    // Keep — filter subcategories
    const keptSubs = cat.subcategories.filter(s => subcategoryActions[s.id] !== "bin");
    curated.push({ ...cat, subcategories: keptSubs });
  }

  return { categories: curated, reasoning: original.reasoning };
}

// ── Main Results Step ────────────────────────────────────────────────────────
export function ResultsStep({
  state,
  onSelectTaxonomy,
  onCategoryAction,
  onSubcategoryAction,
  onBack,
}: {
  state: EvalState;
  onSelectTaxonomy: (id: string | null) => void;
  onCategoryAction: (catId: string, action: CategoryAction) => void;
  onSubcategoryAction: (subId: string, action: "keep" | "bin") => void;
  onBack: () => void;
}) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { results, selectedTaxonomyId, categoryActions, subcategoryActions } = state;
  const selectedResult = selectedTaxonomyId ? results[selectedTaxonomyId] : null;

  const handleExport = () => {
    if (!selectedResult) return;
    const curated = buildCuratedTaxonomy(selectedResult, categoryActions, subcategoryActions);
    const blob = new Blob([JSON.stringify(curated, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curated_taxonomy_${selectedTaxonomyId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApply = async () => {
    if (!selectedResult || !state.upload) return;
    setApplying(true);
    setError(null);
    try {
      const curated = buildCuratedTaxonomy(selectedResult, categoryActions, subcategoryActions);
      await apiApplyTaxonomy({
        job_id: selectedResult.job_id,
        file_id: state.upload.file_id,
        category_actions: categoryActions,
        subcategory_actions: subcategoryActions,
        final_taxonomy: curated,
      });
      setApplied(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply taxonomy");
    } finally {
      setApplying(false);
    }
  };

  const hasResults = Object.keys(results).length > 0;

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-xl">
        <span className="text-3xl mb-3">⏳</span>
        <div className="text-sm font-semibold text-gray-400">Waiting for results...</div>
        <div className="text-xs text-gray-300 mt-1">Pipeline runs are still in progress</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Scorecard */}
      <Scorecard results={results} />

      {/* Cost & Token Breakdown */}
      <CostBreakdown results={results} />

      {/* Taxonomy selection */}
      <TaxonomySelector results={results} selectedId={selectedTaxonomyId} onSelect={onSelectTaxonomy} />

      {/* Curation (only when a taxonomy is selected) */}
      {selectedResult && (
        <>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="font-mono text-[9px] tracking-widest uppercase text-gray-400">Taxonomy Curation</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <TaxonomyCurator
            result={selectedResult}
            categoryActions={categoryActions}
            subcategoryActions={subcategoryActions}
            onCategoryAction={onCategoryAction}
            onSubcategoryAction={onSubcategoryAction}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-[12px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              ← Back to History
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 rounded-lg text-[12px] font-bold border border-indigo-300 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
              >
                Export JSON
              </button>

              {!applied ? (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className={`px-6 py-2 rounded-lg text-[12px] font-bold shadow-sm cursor-pointer ${
                    applying
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#00A98F] text-white hover:bg-[#008F78]"
                  }`}
                >
                  {applying ? "Applying..." : "Apply Taxonomy ✓"}
                </button>
              ) : (
                <div className="px-6 py-2 rounded-lg text-[12px] font-bold bg-green-50 text-green-600 border border-green-200">
                  ✓ Taxonomy Applied & Saved
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}