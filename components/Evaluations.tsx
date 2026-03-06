"use client";

import { useState, useCallback } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { HistoryDashboard } from "./eval/HistoryDashboard";
import { UploadStep } from "./eval/UploadStep";
import { ConfigureStep } from "./eval/ConfigureStep";
import { RunningStep } from "./eval/RunningStep";
import { ResultsStep } from "./eval/ResultsStep";
import type { PromptConfigPayload } from "./eval/types";

const API = "/api/pipeline";

export interface ModelConfig {
  id: string;
  display_name: string;
  description: string;
  color: string;
  phases: {
    phase_1: { provider: string; model: string; role: string };
    phase_2: { provider: string; model: string; role: string };
    phase_3: { provider: string; model: string; role: string };
  };
  enabled: boolean;
}

export interface UploadResult {
  file_id: string;
  filename: string;
  row_count: number;
  columns: string[];
  sample_rows: Record<string, string>[];
}

export interface JobStatus {
  job_id: string;
  config_id: string;
  config_snapshot: ModelConfig;
  status: "queued" | "running" | "completed" | "failed";
  current_phase: number;
  progress_pct: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface PipelineResult {
  job_id: string;
  config_id: string;
  config_snapshot: ModelConfig;
  prompt_config?: {
    preset_used: string;
    mode: "structured" | "raw";
    task_instruction: string;
    category_seeds: string[];
    additional_constraints: string;
    full_composed_prompt: string;
    prompt_hash: string;
  } | null;
  pipeline_summary: {
    pipeline: {
      total_time_seconds: number;
      phases_run: number[];
      llm_provider_priority: string[];
      phase_1_models: Record<string, string>;
      phase_2_model: string;
      phase_3_models: Record<string, string>;
    };
    results: {
      final_categories: number;
      total_subcategories: number;
      candidates_found: number;
      changes_applied: number;
    };
  };
  final_taxonomy: {
    categories: {
      id: string;
      name: string;
      description: string;
      subcategories: {
        id: string;
        name: string;
        description: string;
        examples?: string[];
      }[];
    }[];
    reasoning?: string;
  };
  phase_3_final: {
    changes?: { action: string; candidate: string; target: string; reason: string }[];
    summary?: string;
    final_taxonomy?: Record<string, unknown>;
  };
  eda_report: Record<string, unknown>;
  token_usage?: {
    phase_1?: { input_tokens: number; output_tokens: number; total_tokens: number; calls: number; provider: string | null; model: string | null };
    phase_2?: { input_tokens: number; output_tokens: number; total_tokens: number; calls: number; provider: string | null; model: string | null };
    phase_3?: { input_tokens: number; output_tokens: number; total_tokens: number; calls: number; provider: string | null; model: string | null };
    totals?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      estimated_cost_usd: number;
      cost_by_phase: { phase_1: number; phase_2: number; phase_3: number };
    };
  };
}

export type CategoryAction = "keep" | "bin" | { merge: string };

export type Step = "history" | "upload" | "configure" | "running" | "results";

export interface EvalState {
  step: Step;
  upload: UploadResult | null;
  selectedConfigs: string[];
  promptConfig: PromptConfigPayload | null;
  jobs: Record<string, JobStatus>;
  results: Record<string, PipelineResult>;
  selectedTaxonomyId: string | null;
  categoryActions: Record<string, CategoryAction>;
  subcategoryActions: Record<string, "keep" | "bin">;
}

export async function apiGetConfigs(): Promise<ModelConfig[]> {
  const res = await fetch(`${API}/configs`);
  if (!res.ok) throw new Error(`Failed to fetch configs: ${res.statusText}`);
  const data = await res.json();
  return data.configs || [];
}

export async function apiUpload(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function apiStartRuns(
  fileId: string,
  configIds: string[],
  promptConfig?: PromptConfigPayload | null,
): Promise<{ job_id: string; config_id: string }[]> {
  const body: Record<string, unknown> = { file_id: fileId, config_ids: configIds };
  if (promptConfig) body.prompt_config = promptConfig;
  const res = await fetch(`${API}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to start runs");
  const data = await res.json();
  return data.jobs || [];
}

export async function apiPollStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API}/status/${jobId}`);
  if (!res.ok) throw new Error(`Failed to poll status: ${res.statusText}`);
  return res.json();
}

export async function apiGetResults(jobId: string): Promise<PipelineResult> {
  const res = await fetch(`${API}/results/${jobId}`);
  if (!res.ok) throw new Error(`Failed to get results: ${res.statusText}`);
  return res.json();
}

export async function apiApplyTaxonomy(payload: {
  job_id: string;
  file_id: string;
  category_actions: Record<string, CategoryAction>;
  subcategory_actions: Record<string, "keep" | "bin">;
  final_taxonomy: Record<string, unknown>;
}): Promise<{ curation_id: string }> {
  const res = await fetch(`${API}/apply-taxonomy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to apply taxonomy");
  return res.json();
}

const STEPS: { id: Step; label: string }[] = [
  { id: "upload",    label: "Upload" },
  { id: "configure", label: "Configure" },
  { id: "running",   label: "Running" },
  { id: "results",   label: "Results" },
];

function StepIndicator({ current }: { current: Step }) {
  const ci = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-1 mb-5">
      {STEPS.map((s, i) => {
        const done = i < ci;
        const active = i === ci;
        return (
          <div key={s.id} className="flex items-center gap-1">
            {i > 0 && (
              <div className={`w-8 h-0.5 rounded ${done ? "bg-[#00A98F]" : "bg-gray-200"}`} />
            )}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
              active ? "bg-[#F96400] text-white shadow-sm" :
              done   ? "bg-teal-50 text-[#00A98F]" :
                      "bg-gray-100 text-gray-400"
            }`}>
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Evaluations({ data }: { data: DashboardData }) {
  const [state, setState] = useState<EvalState>({
    step: "history",
    upload: null,
    selectedConfigs: [],
    promptConfig: null,
    jobs: {},
    results: {},
    selectedTaxonomyId: null,
    categoryActions: {},
    subcategoryActions: {},
  });

  const setStep = useCallback((step: Step) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const setUpload = useCallback((upload: UploadResult) => {
    setState(prev => ({ ...prev, upload, step: "configure" }));
  }, []);

  const setSelectedConfigs = useCallback((configs: string[]) => {
    setState(prev => ({ ...prev, selectedConfigs: configs }));
  }, []);

  const setPromptConfig = useCallback((config: PromptConfigPayload | null) => {
    setState(prev => ({ ...prev, promptConfig: config }));
  }, []);

  const setJobs = useCallback((jobs: Record<string, JobStatus>) => {
    setState(prev => ({ ...prev, jobs }));
  }, []);

  const updateJob = useCallback((jobId: string, job: JobStatus) => {
    setState(prev => ({ ...prev, jobs: { ...prev.jobs, [jobId]: job } }));
  }, []);

  const setResults = useCallback((results: Record<string, PipelineResult>) => {
    setState(prev => ({ ...prev, results, step: "results" }));
  }, []);

  const addResult = useCallback((configId: string, result: PipelineResult) => {
    setState(prev => ({ ...prev, results: { ...prev.results, [configId]: result } }));
  }, []);

  const setSelectedTaxonomy = useCallback((id: string | null) => {
    setState(prev => {
      if (id && prev.results[id]) {
        const tax = prev.results[id].final_taxonomy;
        const catActions: Record<string, CategoryAction> = {};
        const subActions: Record<string, "keep" | "bin"> = {};
        for (const cat of tax.categories) {
          catActions[cat.id] = "keep";
          for (const sub of cat.subcategories) {
            subActions[sub.id] = "keep";
          }
        }
        return { ...prev, selectedTaxonomyId: id, categoryActions: catActions, subcategoryActions: subActions };
      }
      return { ...prev, selectedTaxonomyId: id };
    });
  }, []);

  const setCategoryAction = useCallback((catId: string, action: CategoryAction) => {
    setState(prev => {
      const next = { ...prev, categoryActions: { ...prev.categoryActions, [catId]: action } };
      if (action === "bin") {
        const tax = prev.selectedTaxonomyId && prev.results[prev.selectedTaxonomyId]?.final_taxonomy;
        if (tax) {
          const cat = tax.categories.find(c => c.id === catId);
          if (cat) {
            const subActions = { ...next.subcategoryActions };
            for (const sub of cat.subcategories) subActions[sub.id] = "bin";
            next.subcategoryActions = subActions;
          }
        }
      }
      return next;
    });
  }, []);

  const setSubcategoryAction = useCallback((subId: string, action: "keep" | "bin") => {
    setState(prev => ({ ...prev, subcategoryActions: { ...prev.subcategoryActions, [subId]: action } }));
  }, []);

  const handleCurateFromHistory = useCallback((result: PipelineResult) => {
    const configId = result.config_id;
    const catActions: Record<string, CategoryAction> = {};
    const subActions: Record<string, "keep" | "bin"> = {};
    for (const cat of result.final_taxonomy.categories) {
      catActions[cat.id] = "keep";
      for (const sub of cat.subcategories) {
        subActions[sub.id] = "keep";
      }
    }
    setState(prev => ({
      ...prev,
      step: "results",
      results: { ...prev.results, [configId]: result },
      selectedTaxonomyId: configId,
      categoryActions: catActions,
      subcategoryActions: subActions,
    }));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex gap-2.5">
        <div>
          <p className="text-xs text-indigo-800 leading-relaxed">
            <strong>Pipeline Evaluation Studio</strong> — Upload a recognition dataset, run the
            taxonomy pipeline across multiple model configurations, compare results, and curate
            your final taxonomy.
          </p>
        </div>
      </div>

      {/* Step indicator (only during wizard flow) */}
      {state.step !== "history" && <StepIndicator current={state.step} />}

      {/* Step content */}
      {state.step === "history" && (
        <HistoryDashboard
          onNewRun={() => setStep("upload")}
          onCurateRun={handleCurateFromHistory}
        />
      )}

      {state.step === "upload" && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setStep("history")}
            className="self-start px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            ← Back to History
          </button>
          <UploadStep onUpload={setUpload} />
        </div>
      )}

      {state.step === "configure" && (
        <ConfigureStep
          upload={state.upload!}
          selectedConfigs={state.selectedConfigs}
          onSelectConfigs={setSelectedConfigs}
          promptConfig={state.promptConfig}
          onPromptConfig={setPromptConfig}
          onBack={() => setStep("upload")}
          onStart={(jobs) => {
            const jobMap: Record<string, JobStatus> = {};
            for (const j of jobs) {
              jobMap[j.job_id] = {
                job_id: j.job_id,
                config_id: j.config_id,
                config_snapshot: {} as ModelConfig,
                status: "queued",
                current_phase: 0,
                progress_pct: 0,
              };
            }
            setJobs(jobMap);
            setStep("running");
          }}
          fileId={state.upload?.file_id || ""}
        />
      )}

      {state.step === "running" && (
        <RunningStep
          jobs={state.jobs}
          onUpdateJob={updateJob}
          onAddResult={addResult}
          onAllComplete={() => setStep("results")}
        />
      )}

      {state.step === "results" && (
        <ResultsStep
          state={state}
          onSelectTaxonomy={setSelectedTaxonomy}
          onCategoryAction={setCategoryAction}
          onSubcategoryAction={setSubcategoryAction}
          onBack={() => setStep("history")}
        />
      )}
    </div>
  );
}