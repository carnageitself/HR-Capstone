export interface TokenPhaseUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  calls: number;
  provider: string | null;
  model: string | null;
}

export interface TokenUsage {
  phase_1?: TokenPhaseUsage;
  phase_2?: TokenPhaseUsage;
  phase_3?: TokenPhaseUsage;
  totals?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    estimated_cost_usd: number;
    cost_by_phase: {
      phase_1: number;
      phase_2: number;
      phase_3: number;
    };
  };
}

export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  task_instruction: string;
  category_seeds: string[];
  additional_constraints: string;
}

export interface PromptConfigPayload {
  preset_id?: string;
  task_instruction?: string;
  category_seeds?: string[];
  additional_constraints?: string;
  mode: "structured" | "raw";
  raw_prompt?: string;
}

export interface PromptMetadata {
  preset_used: string;
  mode: "structured" | "raw";
  task_instruction: string;
  category_seeds: string[];
  additional_constraints: string;
  full_composed_prompt: string;
  prompt_hash: string;
}

export interface HistoryJob {
  job_id: string;
  file_id: string;
  config_id: string;
  config_snapshot: {
    display_name?: string;
    color?: string;
    phases?: Record<string, { model?: string; role?: string }>;
  };
  status: string;
  current_phase: number;
  progress_pct: number;
  error_message?: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  eda_report?: {
    basic?: {
      total_rows?: number;
      total_columns?: number;
      columns?: string[];
      null_counts?: Record<string, number>;
    };
  };
  upload?: {
    file_id: string;
    filename: string;
    row_count: number;
    columns: string[];
  };
  token_usage?: TokenUsage;
  prompt_config?: PromptMetadata | null;
}

export interface RunRequest {
  file_id: string;
  config_ids: string[];
  prompt_config?: PromptConfigPayload | null;
}

export const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  completed: { cls: "bg-green-50 text-green-600 border-green-200", label: "Completed" },
  running:   { cls: "bg-blue-50 text-blue-600 border-blue-200",   label: "Running" },
  queued:    { cls: "bg-gray-50 text-gray-500 border-gray-200",   label: "Queued" },
  failed:    { cls: "bg-red-50 text-red-600 border-red-200",      label: "Failed" },
};

export const CAT_PALETTE = [
  "#F96400", "#00A98F", "#3B5BDB", "#8E44AD",
  "#27AE60", "#E74C3C", "#F39C12", "#45B7D1",
];

export function fmtTime(s: number) {
  if (s < 60) return `${s.toFixed(1)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  return `${(s / 3600).toFixed(1)}h`;
}

export function fmtDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}