export interface TaxonomySubcategory {
  id: string;
  name: string;
  description: string;
  examples?: string[];
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  description: string;
  color?: string;
  subcategories: TaxonomySubcategory[];
}

export interface Taxonomy {
  categories: TaxonomyCategory[];
  reasoning?: string;
}

export interface Classification {
  batch: number;
  category: string | null;
  subcategory: string | null;
  themes: string[];
  new_category: string | null;
}

export interface Phase2Metadata {
  phase: number;
  total_messages: number;
  total_classified: number;
  batch_size: number;
  model: string;
  average_confidence?: number;
}

export interface Phase2Data {
  metadata: Phase2Metadata;
  classifications: Classification[];
  candidate_categories: Record<string, number>;
}

export interface PipelineSummary {
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
}

export interface PipelineRun {
  name: string;
  provider?: string;
  taxonomy?: Taxonomy;
  phase2?: Phase2Data;
  summary?: PipelineSummary;
}

export interface ModelPrice {
  input: number;
  output: number;
  name: string;
}

export interface PipelineScore {
  pipeline: string;
  llmProvider?: string;
  phase1Model?: string;
  phase1Models?: string[];
  phase1Pricing?: Record<string, ModelPrice>;
  phase2Model?: string;
  phase3Model?: string;
  successRate: number;
  malformedPct: number;
  biasScore: number;
  formatConsistency: number;
  categoryCount: number;
  subcategoryCount: number;
  timeSeconds: number;
  candidatesFound: number;
}

export interface CategoryOverlap {
  category: string;
  pipelines: Record<string, number>;
}

export interface TaxonomyDiff {
  categoryName: string;
  presentIn: string[];
  missingFrom: string[];
}

export interface RadarMetric {
  metric: string;
  fullMark: number;
  [pipelineName: string]: number | string;
}

export interface ComparisonData {
  pipelines: string[];
  scores: PipelineScore[];
  categoryOverlap: CategoryOverlap[];
  taxonomyDiff: TaxonomyDiff[];
  radarMetrics: RadarMetric[];
}
