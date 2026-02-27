"use client";

import { useState, useEffect } from "react";
import { PipelineRun } from "@/lib/pipelineTypes";
import TaxonomyTree from "./TaxonomyTree";
import CategoryDetails from "./CategoryDetails";
import PipelineComparison from "./PipelineComparison";

export default function CompareSection() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunIndices, setSelectedRunIndices] = useState<number[]>([0]);
  const [comparisonMode, setComparisonMode] = useState<"single" | "dual">(
    "single"
  );

  useEffect(() => {
    fetchRuns();
    // Poll every 2 seconds to catch new runs immediately
    const interval = setInterval(fetchRuns, 2000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRuns() {
    try {
      const res = await fetch("/api/pipeline/runs");
      const data = await res.json();
      if (data.ok) {
        const newRuns = data.runs;
        setRuns(newRuns);
        // Auto-select latest run (most recent) on first load or when new run appears
        if (newRuns.length > 0 && selectedRunIndices[0] === undefined) {
          setSelectedRunIndices([newRuns.length - 1]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch runs:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading pipeline runs...</div>;
  }

  if (runs.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-blue-800 font-medium">No pipeline runs found yet.</p>
        <p className="text-sm text-blue-600 mt-2">
          Go to "Run Pipeline" to start a comparison between Groq and Gemini.
        </p>
      </div>
    );
  }

  const selectedRuns = selectedRunIndices
    .map((idx) => runs[idx])
    .filter(Boolean);

  const handleRunSelect = (idx: number, event: React.ChangeEvent<HTMLSelectElement>) => {
    const newIdx = parseInt(event.target.value);
    const newIndices = [...selectedRunIndices];
    newIndices[idx] = newIdx;
    setSelectedRunIndices(newIndices);
  };

  const toggleComparisonMode = () => {
    if (comparisonMode === "single") {
      setComparisonMode("dual");
      if (selectedRunIndices.length === 1) {
        // Find a different run to compare
        const otherIdx = runs.findIndex(
          (_, i) => i !== selectedRunIndices[0]
        );
        if (otherIdx >= 0) {
          setSelectedRunIndices([selectedRunIndices[0], otherIdx]);
        }
      }
    } else {
      setComparisonMode("single");
      setSelectedRunIndices([selectedRunIndices[0]]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">View Mode</h3>
            <p className="text-xs text-gray-500 mt-1">
              {comparisonMode === "single"
                ? "Viewing single run details"
                : "Comparing two runs side-by-side"}
            </p>
          </div>
          <button
            onClick={toggleComparisonMode}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              comparisonMode === "dual"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {comparisonMode === "single" ? "Compare Two Runs" : "Back to Single"}
          </button>
        </div>
      </div>

      {/* Run Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div
          className={`grid gap-4 ${
            comparisonMode === "dual" ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {comparisonMode === "single" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Run
              </label>
              <select
                value={selectedRunIndices[0] || 0}
                onChange={(e) => handleRunSelect(0, e)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {runs.map((run, idx) => (
                  <option key={idx} value={idx}>
                    {run.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Run 1 (Left)
                </label>
                <select
                  value={selectedRunIndices[0] || 0}
                  onChange={(e) => handleRunSelect(0, e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {runs.map((run, idx) => (
                    <option key={idx} value={idx}>
                      {run.name} ({run.provider})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Run 2 (Right)
                </label>
                <select
                  value={selectedRunIndices[1] ?? (runs.length > 1 ? 1 : 0)}
                  onChange={(e) => handleRunSelect(1, e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {runs.map((run, idx) => (
                    <option key={idx} value={idx}>
                      {run.name} ({run.provider})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Display */}
      {selectedRuns.length > 0 && (
        <>
          {comparisonMode === "single" ? (
            <SingleRunView run={selectedRuns[0]} />
          ) : (
            <DualRunComparison runs={selectedRuns} />
          )}
        </>
      )}
    </div>
  );
}

function SingleRunView({ run }: { run: PipelineRun }) {
  const [detailsTab, setDetailsTab] = useState<"tree" | "details">("tree");

  // Extract provider from run name (e.g., "demo_groq_final" → "groq")
  const provider = run.name.includes("gemini")
    ? "Gemini"
    : run.name.includes("groq")
      ? "Groq"
      : run.name.includes("claude")
        ? "Claude"
        : "Unknown";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {run.summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pipeline Summary</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {provider}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {run.summary.pipeline.total_time_seconds}s
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-orange-600">
                {run.summary.results.final_categories}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Subcategories</p>
              <p className="text-2xl font-bold text-blue-600">
                {run.summary.results.total_subcategories}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Classification Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {run.phase2
                  ? (
                      (run.phase2.metadata.total_classified /
                        run.phase2.metadata.total_messages) *
                      100
                    ).toFixed(0)
                  : "0"}
                %
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Phases Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-900">Pipeline Phases & Models</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded p-4 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Taxonomy Discovery</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {provider} LLM analyzes sample award messages and automatically discovers what types of recognition exist in your company data
                </p>
                <p className="text-xs text-blue-700 font-medium mt-2">
                  Why: Cloud LLMs are best at understanding nuance and discovering new patterns
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded p-4 border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Award Classification</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Local Llama (llama3:8b) classifies ALL your awards into the discovered categories using keyword matching
                </p>
                <p className="text-xs text-green-700 font-medium mt-2">
                  Why: Local model is fast, free, and processes 100% of data without API costs
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded p-4 border-l-4 border-purple-500">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Taxonomy Refinement</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {provider} LLM polishes the taxonomy based on what was learned from classifying all 100% of awards
                </p>
                <p className="text-xs text-purple-700 font-medium mt-2">
                  Why: Cloud LLM improves accuracy with full context from Phase 2 results
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Taxonomy View - Tabs */}
      {run.taxonomy && (
        <div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setDetailsTab("tree")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  detailsTab === "tree"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Taxonomy Structure
              </button>
              <button
                onClick={() => setDetailsTab("details")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  detailsTab === "details"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Category & Annotations
              </button>
            </div>
          </div>

          {detailsTab === "tree" ? (
            <TaxonomyTree taxonomy={run.taxonomy} />
          ) : (
            <CategoryDetails taxonomy={run.taxonomy} />
          )}
        </div>
      )}

      {/* Classification Results */}
      {run.phase2 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Classification Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Messages</p>
              <p className="text-lg font-semibold">
                {run.phase2.metadata.total_messages}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Classified</p>
              <p className="text-lg font-semibold text-green-600">
                {run.phase2.metadata.total_classified}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-lg font-semibold">
                {(
                  (run.phase2.metadata.total_classified /
                    run.phase2.metadata.total_messages) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Confidence</p>
              <p className="text-lg font-semibold">
                {run.phase2.metadata.average_confidence?.toFixed(2) || "N/A"}
              </p>
            </div>
          </div>

          {Object.keys(run.phase2.candidate_categories).length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Candidate Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(run.phase2.candidate_categories).map(
                  ([name, count]) => (
                    <span
                      key={name}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {name} ({count})
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DualRunComparison({ runs }: { runs: PipelineRun[] }) {
  if (runs.length < 2) return null;

  return (
    <PipelineComparison runs={runs} />
  );
}
