"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGetResults, type PipelineResult } from "../Evaluations";
import { DataQualityBadge } from "./DataQualityBadge";
import { CostBadge } from "./CostBadge";
import { TaxonomyModal } from "./TaxonomyModal";
import { CompareModal } from "./CompareModal";
import { STATUS_BADGE, fmtTime, fmtDate, HistoryJob } from "./types";

function PromptBadge({ job }: { job: HistoryJob }) {
  const [expanded, setExpanded] = useState(false);
  const pc = job.prompt_config;

  if (!pc) {
    return <span className="font-mono text-[10px] text-gray-300">Default</span>;
  }

  const label = pc.preset_used || "Custom";
  const isCustom = label === "Custom";
  const seedCount = pc.category_seeds?.length || 0;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="flex items-center gap-1.5 cursor-pointer group"
      >
        <span
          className={[
            "px-2 py-0.5 rounded-full text-[9px] font-bold border",
            isCustom
              ? "bg-amber-50 text-amber-600 border-amber-200"
              : "bg-violet-50 text-violet-600 border-violet-200",
          ].join(" ")}
        >
          {label}
        </span>
        {seedCount > 0 && (
          <span className="text-[8px] text-gray-400">{seedCount} seeds</span>
        )}
        <svg
          className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Popover */}
      {expanded && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="font-bold text-[11px] text-[#0B3954]">Prompt Configuration</div>
              <span className="font-mono text-[8px] text-gray-300">{pc.mode}</span>
            </div>

            {/* Task instruction preview */}
            <div className="mb-2">
              <div className="font-mono text-[8px] text-gray-400 uppercase tracking-wider mb-0.5">Task</div>
              <div className="text-[10px] text-gray-600 leading-relaxed line-clamp-3">
                {pc.task_instruction || "Default"}
              </div>
            </div>

            {/* Seeds */}
            {seedCount > 0 && (
              <div className="mb-2">
                <div className="font-mono text-[8px] text-gray-400 uppercase tracking-wider mb-0.5">Seeds</div>
                <div className="flex flex-wrap gap-1">
                  {pc.category_seeds!.map((s, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 text-[9px] text-gray-500">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Constraints */}
            {pc.additional_constraints && (
              <div className="mb-2">
                <div className="font-mono text-[8px] text-gray-400 uppercase tracking-wider mb-0.5">Constraints</div>
                <div className="text-[10px] text-gray-600 leading-relaxed line-clamp-2">
                  {pc.additional_constraints}
                </div>
              </div>
            )}

            {/* Hash */}
            <div className="pt-2 border-t border-gray-100">
              <span className="font-mono text-[8px] text-gray-300">{pc.prompt_hash}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function HistoryDashboard({
  onNewRun,
  onCurateRun,
}: {
  onNewRun: () => void;
  onCurateRun: (result: PipelineResult) => void;
}) {
  const [jobs, setJobs] = useState<HistoryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultCache, setResultCache] = useState<Record<string, PipelineResult>>({});
  const [viewingTaxonomy, setViewingTaxonomy] = useState<PipelineResult | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [comparing, setComparing] = useState<[PipelineResult, PipelineResult] | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline/history?limit=50");
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const loadResult = useCallback(async (jobId: string): Promise<PipelineResult | null> => {
    if (resultCache[jobId]) return resultCache[jobId];
    try {
      const result = await apiGetResults(jobId);
      setResultCache((prev) => ({ ...prev, [jobId]: result }));
      return result;
    } catch {
      return null;
    }
  }, [resultCache]);

  const handleViewTaxonomy = async (jobId: string) => {
    const result = await loadResult(jobId);
    if (result) setViewingTaxonomy(result);
  };

  const handleCurate = async (jobId: string) => {
    const result = await loadResult(jobId);
    if (result) onCurateRun(result);
  };

  const toggleCompareSelect = (jobId: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(jobId)) return prev.filter((id) => id !== jobId);
      if (prev.length >= 2) return [prev[1], jobId];
      return [...prev, jobId];
    });
  };

  const handleCompare = async () => {
    if (compareSelection.length !== 2) return;
    const [a, b] = await Promise.all(compareSelection.map((id) => loadResult(id)));
    if (a && b) setComparing([a, b]);
  };

  const completedJobs = jobs.filter((j) => j.status === "completed");
  const failedJobs = jobs.filter((j) => j.status === "failed");
  const runningJobs = jobs.filter((j) => j.status === "running" || j.status === "queued");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#F96400] border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-500">Loading pipeline history...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-[16px] text-[#0B3954]">Pipeline History</div>
          <div className="font-mono text-[10px] text-gray-400">
            {jobs.length} total runs · {completedJobs.length} completed · {failedJobs.length} failed
          </div>
        </div>
        <div className="flex gap-2">
          {completedJobs.length >= 2 && (
            <button
              onClick={() => { setCompareMode(!compareMode); setCompareSelection([]); }}
              className={[
                "px-4 py-2 rounded-lg text-[11px] font-bold cursor-pointer border transition-all",
                compareMode
                  ? "bg-indigo-50 text-indigo-600 border-indigo-300"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              {compareMode ? "Cancel Compare" : "Compare Runs"}
            </button>
          )}
          <button
            onClick={onNewRun}
            className="px-5 py-2 rounded-lg text-[12px] font-bold bg-[#F96400] text-white hover:bg-[#E05A00] cursor-pointer shadow-sm"
          >
            + New Run
          </button>
        </div>
      </div>

      {/* Compare bar */}
      {compareMode && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">⚖️</span>
            <span className="text-xs text-indigo-800">
              Select <strong>2 completed runs</strong> to compare. ({compareSelection.length}/2 selected)
            </span>
          </div>
          {compareSelection.length === 2 && (
            <button
              onClick={handleCompare}
              className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700"
            >
              Compare →
            </button>
          )}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { eye: "Total Runs", v: jobs.length, bar: "#0B3954" },
          { eye: "Completed", v: completedJobs.length, bar: "#27AE60" },
          { eye: "In Progress", v: runningJobs.length, bar: "#3B5BDB" },
          { eye: "Failed", v: failedJobs.length, bar: "#E74C3C" },
        ].map((k) => (
          <div key={k.eye} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${k.bar},${k.bar}55)` }} />
            <div className="font-mono text-[8px] tracking-widest uppercase text-gray-500 mb-1">{k.eye}</div>
            <div className="text-[22px] font-extrabold leading-none" style={{ color: k.bar }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-xl">
          <span className="text-4xl mb-3">🔬</span>
          <div className="text-sm font-semibold text-gray-400 mb-1">No pipeline runs yet</div>
          <div className="text-xs text-gray-300 mb-4">Upload a CSV to get started</div>
          <button
            onClick={onNewRun}
            className="px-5 py-2 rounded-lg text-[12px] font-bold bg-[#F96400] text-white hover:bg-[#E05A00] cursor-pointer"
          >
            + Start First Run
          </button>
        </div>
      )}

      {/* Job list */}
      {jobs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                {compareMode && <th className="px-3 py-2.5 w-8" />}
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Configuration</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Prompt</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Status</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Started</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Duration</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Records / Quality</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Tokens / Cost</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Progress</th>
                <th className="px-3.5 py-2.5 text-right font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const badge = STATUS_BADGE[job.status] || STATUS_BADGE.queued;
                const color = job.config_snapshot?.color || "#888";
                const isCompareSelected = compareSelection.includes(job.job_id);
                let duration = "—";
                if (job.started_at && job.completed_at) {
                  const secs = (new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000;
                  duration = fmtTime(secs);
                }
                return (
                  <tr
                    key={job.job_id}
                    className={[
                      "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                      isCompareSelected ? "bg-indigo-50" : "",
                    ].join(" ")}
                  >
                    {compareMode && (
                      <td className="px-3 py-3">
                        {job.status === "completed" && (
                          <button
                            onClick={() => toggleCompareSelect(job.job_id)}
                            className={[
                              "w-5 h-5 rounded border-2 grid place-items-center cursor-pointer text-[10px]",
                              isCompareSelected
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-white border-gray-300",
                            ].join(" ")}
                          >
                            {isCompareSelected && "✓"}
                          </button>
                        )}
                      </td>
                    )}
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1 h-8 rounded-full" style={{ background: color }} />
                        <div>
                          <div className="text-[12px] font-bold text-[#0B3954]">
                            {job.config_snapshot?.display_name ||
                              job.config_id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                          <div className="font-mono text-[9px] text-gray-400">{job.job_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <PromptBadge job={job} />
                    </td>
                    <td className="px-3.5 py-3">
                      <span className={["px-2 py-0.5 rounded-full text-[9px] font-bold border", badge.cls].join(" ")}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-[10px] text-gray-500">{fmtDate(job.started_at || job.created_at)}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-[10px] text-gray-500">{duration}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <DataQualityBadge job={job} />
                    </td>
                    <td className="px-3.5 py-3">
                      <CostBadge job={job} />
                    </td>
                    <td className="px-3.5 py-3">
                      {job.status === "completed" ? (
                        <div className="font-mono text-[10px] text-green-600">✓ Phase {job.current_phase}</div>
                      ) : job.status === "running" ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span className="font-mono text-[10px] text-blue-500">P{job.current_phase} · {job.progress_pct}%</span>
                        </div>
                      ) : job.status === "failed" ? (
                        <span className="font-mono text-[10px] text-red-500">✕ Failed</span>
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      {job.status === "completed" && (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleViewTaxonomy(job.job_id)}
                            className="px-2.5 py-1 rounded-md text-[9px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
                          >
                            View Taxonomy
                          </button>
                          <button
                            onClick={() => handleCurate(job.job_id)}
                            className="px-2.5 py-1 rounded-md text-[9px] font-bold border border-teal-300 text-[#00A98F] hover:bg-teal-50 cursor-pointer"
                          >
                            Curate
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
      )}

      {/* Modals */}
      {viewingTaxonomy && (
        <TaxonomyModal result={viewingTaxonomy} onClose={() => setViewingTaxonomy(null)} />
      )}
      {comparing && (
        <CompareModal results={comparing} onClose={() => { setComparing(null); setCompareMode(false); setCompareSelection([]); }} />
      )}
    </div>
  );
}