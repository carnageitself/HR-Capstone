"use client";

import { useEffect, useRef, useCallback } from "react";
import { apiPollStatus, apiGetResults, type JobStatus, type PipelineResult } from "../Evaluations";

const PHASE_LABELS: Record<number, string> = {
  0: "Queued",
  1: "Phase 1 — Taxonomy Discovery",
  2: "Phase 2 — Bulk Classification",
  3: "Phase 3 — Taxonomy Finalization",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  queued:    { bg: "bg-gray-50",   text: "text-gray-500",   dot: "bg-gray-400" },
  running:   { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500" },
  completed: { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
  failed:    { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500" },
};

export function RunningStep({
  jobs,
  onUpdateJob,
  onAddResult,
  onAllComplete,
}: {
  jobs: Record<string, JobStatus>;
  onUpdateJob: (jobId: string, job: JobStatus) => void;
  onAddResult: (configId: string, result: PipelineResult) => void;
  onAllComplete: () => void;
}) {
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const fetchedResults = useRef<Set<string>>(new Set());
  const jobsRef = useRef(jobs);

  // Keep ref in sync without triggering poll effect
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const poll = useCallback(async () => {
    const entries = Object.entries(jobsRef.current);
    let allDone = true;

    for (const [jobId, job] of entries) {
      if (job.status === "completed" || job.status === "failed") {
        if (job.status === "completed" && !fetchedResults.current.has(jobId)) {
          fetchedResults.current.add(jobId);
          try {
            const result = await apiGetResults(jobId);
            onAddResult(job.config_id, result);
          } catch (e) {
            console.error("Failed to fetch results:", e);
          }
        }
        continue;
      }

      allDone = false;

      try {
        const updated = await apiPollStatus(jobId);
        onUpdateJob(jobId, updated);
      } catch (e) {
        console.error("Poll error:", e);
      }
    }

    if (allDone && entries.length > 0) {
      if (pollRef.current) clearInterval(pollRef.current);
      setTimeout(onAllComplete, 1500);
    }
  }, [onUpdateJob, onAddResult, onAllComplete]);

  useEffect(() => {
    poll(); // immediate first poll
    pollRef.current = setInterval(poll, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [poll]);

  const jobList = Object.values(jobs);
  const completedCount = jobList.filter(j => j.status === "completed").length;
  const failedCount = jobList.filter(j => j.status === "failed").length;
  const totalDone = completedCount + failedCount;

  return (
    <div className="flex flex-col gap-4">
      {/* Overall progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-[14px] text-[#0B3954]">Pipeline Execution</div>
            <div className="font-mono text-[10px] text-gray-400">
              {totalDone} of {jobList.length} configurations complete
            </div>
          </div>
          {totalDone === jobList.length ? (
            <div className="px-3 py-1.5 bg-green-50 rounded-lg font-mono text-[10px] text-green-600 font-bold">
              ✓ All Complete
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#F96400] border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[10px] text-[#F96400]">Running...</span>
            </div>
          )}
        </div>

        {/* Overall progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F96400] to-[#00A98F] transition-[width] duration-700"
            style={{ width: `${jobList.length > 0 ? Math.round(totalDone / jobList.length * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* Per-job cards */}
      <div className="grid grid-cols-1 gap-3">
        {jobList.map(job => {
          const style = STATUS_STYLES[job.status] || STATUS_STYLES.queued;
          const color = job.config_snapshot?.color || "#888";

          return (
            <div key={job.job_id} className={`border border-gray-200 rounded-xl overflow-hidden ${style.bg}`}>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full" style={{ background: color }} />
                  <div>
                    <div className="font-bold text-[13px] text-[#0B3954]">
                      {job.config_id.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="font-mono text-[10px] text-gray-400">
                      {PHASE_LABELS[job.current_phase] || "Unknown phase"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${style.bg}`}>
                    <div className={`w-2 h-2 rounded-full ${style.dot} ${job.status === "running" ? "animate-pulse" : ""}`} />
                    <span className={`font-mono text-[10px] font-semibold ${style.text}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  <span className="font-mono text-[15px] font-extrabold text-[#0B3954]">
                    {job.progress_pct}%
                  </span>
                </div>
              </div>

              {/* Phase progress bar */}
              <div className="px-4 pb-3">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${job.progress_pct}%`,
                      background: job.status === "failed" ? "#E74C3C" :
                                  job.status === "completed" ? "#27AE60" : color,
                    }}
                  />
                </div>

                <div className="flex justify-between mt-2">
                  {[1, 2, 3].map(phase => {
                    const done = job.current_phase > phase || job.status === "completed";
                    const active = job.current_phase === phase && job.status === "running";
                    return (
                      <div key={phase} className="flex items-center gap-1">
                        <div className={`w-4 h-4 rounded-full grid place-items-center text-[8px] font-bold ${
                          done   ? "bg-green-500 text-white" :
                          active ? "text-white" :
                                  "bg-gray-200 text-gray-400"
                        }`}
                          style={active ? { background: color } : undefined}
                        >
                          {done ? "✓" : phase}
                        </div>
                        <span className={`font-mono text-[9px] ${done || active ? "text-[#0B3954]" : "text-gray-400"}`}>
                          P{phase}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {job.status === "failed" && job.error_message && (
                <div className="px-4 pb-3">
                  <div className="p-2.5 bg-red-100 border border-red-200 rounded-lg text-[11px] text-red-700">
                    {job.error_message}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}