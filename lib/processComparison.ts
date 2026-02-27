/**
 * processComparison.ts
 *
 * Computes cross-pipeline metrics for the comparison dashboard.
 * Takes multiple PipelineRun objects and produces unified comparison data.
 * Ported from https://github.com/deepsGenAi/Taxonomy
 */

import type {
  PipelineRun, ComparisonData, PipelineScore,
  CategoryOverlap, TaxonomyDiff, Taxonomy, RadarMetric,
} from "@/lib/pipelineTypes";

function getValidCategoryIds(taxonomy?: Taxonomy): Set<string> {
  if (!taxonomy?.categories) return new Set();
  return new Set(taxonomy.categories.map((c) => c.id));
}

function getValidSubcategoryIds(taxonomy?: Taxonomy): Set<string> {
  if (!taxonomy?.categories) return new Set();
  const ids = new Set<string>();
  for (const cat of taxonomy.categories) {
    for (const sub of cat.subcategories || []) {
      ids.add(sub.id);
    }
  }
  return ids;
}

function computeScore(run: PipelineRun): PipelineScore {
  const taxonomy = run.taxonomy;
  const phase2 = run.phase2;
  const summary = run.summary;

  const catIds = getValidCategoryIds(taxonomy);
  const subIds = getValidSubcategoryIds(taxonomy);

  let successRate = 0;
  let malformedPct = 0;
  let biasScore = 0;
  let formatConsistency = 0;

  // Extract LLM provider from run name or summary
  let llmProvider = run.provider || "";
  if (!llmProvider && summary?.pipeline?.llm_provider_priority?.length) {
    llmProvider = summary.pipeline.llm_provider_priority[0];
  }
  if (!llmProvider) {
    if (run.name.includes("groq")) llmProvider = "groq";
    else if (run.name.includes("gemini")) llmProvider = "gemini";
    else if (run.name.includes("claude")) llmProvider = "claude";
  }

  if (phase2?.classifications?.length) {
    const clf = phase2.classifications;
    const total = clf.length;

    successRate = +((phase2.metadata.total_classified / phase2.metadata.total_messages) * 100).toFixed(1);

    const malformed = clf.filter((c) => !c.category || !catIds.has((c.category as string).trim())).length;
    malformedPct = +((malformed / total) * 100).toFixed(1);

    const catCounts: Record<string, number> = {};
    for (const c of clf) {
      const cat = (c.category as string)?.trim() || "";
      if (catIds.has(cat)) catCounts[cat] = (catCounts[cat] || 0) + 1;
    }
    const maxCount = Math.max(0, ...Object.values(catCounts));
    const expected = total / Math.max(1, catIds.size);
    biasScore = expected > 0 ? +((maxCount / expected - 1) * 100).toFixed(1) : 0;

    const correctSub = clf.filter((c) => c.subcategory && subIds.has((c.subcategory as string).trim())).length;
    formatConsistency = +((correctSub / total) * 100).toFixed(1);
  }

  const catCount = taxonomy?.categories?.length || 0;
  const subCount = taxonomy?.categories?.reduce(
    (sum, c) => sum + (c.subcategories?.length || 0), 0
  ) || 0;

  // Extract model names from summary
  let phase1Model = "";
  let phase1Models: string[] = [];
  let phase2Model = "";
  let phase3Model = "";
  let phase1Pricing: Record<string, any> = {};

  if (summary?.pipeline) {
    const models = summary.pipeline.phase_1_models || {};
    phase1Model = models[llmProvider] || `Unknown (${llmProvider})`;
    phase2Model = summary.pipeline.phase_2_model || "llama3:8b";
    const models3 = summary.pipeline.phase_3_models || {};
    phase3Model = models3[llmProvider] || `Unknown (${llmProvider})`;

    // Collect all Phase 1 models tested
    phase1Models = Object.values(models).filter(m => m) as string[];

    // Add pricing info for each model
    phase1Pricing = {
      "groq": { input: 0.10, output: 0.32, name: "Llama 3.3 70B" },
      "gemini": { input: 0.075, output: 0.30, name: "Gemini Flash 2.0" },
      "qwen": { input: 0.04, output: 0.15, name: "Gemma 3 27B (OpenRouter)" },
    };
  }

  return {
    pipeline: run.name,
    llmProvider,
    phase1Model,
    phase1Models: phase1Models.length > 0 ? phase1Models : undefined,
    phase1Pricing: Object.keys(phase1Pricing).length > 0 ? phase1Pricing : undefined,
    phase2Model,
    phase3Model,
    successRate,
    malformedPct,
    biasScore,
    formatConsistency,
    categoryCount: catCount,
    subcategoryCount: subCount,
    timeSeconds: summary?.pipeline?.total_time_seconds || 0,
    candidatesFound: Object.keys(phase2?.candidate_categories || {}).length,
  };
}

function computeCategoryOverlap(runs: PipelineRun[]): CategoryOverlap[] {
  const allCatNames = new Set<string>();
  const pipelineCatCounts: Record<string, Record<string, number>> = {};

  for (const run of runs) {
    if (!run.phase2?.classifications) continue;

    const catIds = getValidCategoryIds(run.taxonomy);
    const idToName: Record<string, string> = {};
    if (run.taxonomy?.categories) {
      for (const cat of run.taxonomy.categories) {
        idToName[cat.id] = cat.name;
      }
    }

    const counts: Record<string, number> = {};
    for (const clf of run.phase2.classifications) {
      const catId = (clf.category as string)?.trim() || "";
      if (catIds.has(catId)) {
        const name = idToName[catId] || catId;
        allCatNames.add(name);
        counts[name] = (counts[name] || 0) + 1;
      }
    }
    pipelineCatCounts[run.name] = counts;
  }

  return [...allCatNames]
    .map((category) => {
      const pipelines: Record<string, number> = {};
      for (const run of runs) {
        pipelines[run.name] = pipelineCatCounts[run.name]?.[category] || 0;
      }
      return { category, pipelines };
    })
    .sort((a, b) => {
      const totalA = Object.values(a.pipelines).reduce((s, v) => s + v, 0);
      const totalB = Object.values(b.pipelines).reduce((s, v) => s + v, 0);
      return totalB - totalA;
    });
}

function computeTaxonomyDiff(runs: PipelineRun[]): TaxonomyDiff[] {
  const catMap: Record<string, { name: string; presentIn: Set<string> }> = {};

  for (const run of runs) {
    if (!run.taxonomy?.categories) continue;
    for (const cat of run.taxonomy.categories) {
      const key = cat.name.toLowerCase().trim();
      if (!catMap[key]) {
        catMap[key] = { name: cat.name, presentIn: new Set() };
      }
      catMap[key].presentIn.add(run.name);
    }
  }

  const allPipelines = runs.map((r) => r.name);

  return Object.values(catMap)
    .map((entry) => ({
      categoryName: entry.name,
      presentIn: [...entry.presentIn],
      missingFrom: allPipelines.filter((p) => !entry.presentIn.has(p)),
    }))
    .sort((a, b) => b.presentIn.length - a.presentIn.length);
}

function computeRadar(scores: PipelineScore[]): ComparisonData["radarMetrics"] {
  const metrics = [
    { key: "successRate", label: "Success Rate", max: 100 },
    { key: "formatConsistency", label: "Format Consistency", max: 100 },
    { key: "categoryCount", label: "Category Richness", max: 10 },
    { key: "candidatesFound", label: "Discovery", max: 20 },
  ];

  const invertedMetrics = [
    { key: "malformedPct", label: "Output Quality", max: 100, invert: true },
    { key: "biasScore", label: "Balance", max: 200, invert: true },
  ];

  const result: ComparisonData["radarMetrics"] = [];

  for (const m of metrics) {
    const row: RadarMetric = { metric: m.label, fullMark: m.max };
    for (const s of scores) {
      row[s.pipeline] = (s as unknown as Record<string, number>)[m.key] || 0;
    }
    result.push(row);
  }

  for (const m of invertedMetrics) {
    const row: RadarMetric = { metric: m.label, fullMark: m.max };
    for (const s of scores) {
      const raw = (s as unknown as Record<string, number>)[m.key] || 0;
      row[s.pipeline] = Math.max(0, m.max - raw);
    }
    result.push(row);
  }

  return result;
}

export default function processComparison(runs: PipelineRun[]): ComparisonData {
  const scores = runs.map(computeScore);
  const categoryOverlap = computeCategoryOverlap(runs);
  const taxonomyDiff = computeTaxonomyDiff(runs);
  const radarMetrics = computeRadar(scores);

  return {
    pipelines: runs.map((r) => r.name),
    scores,
    categoryOverlap,
    taxonomyDiff,
    radarMetrics,
  };
}
