"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis,
  CartesianGrid,
} from "recharts";
import processComparison from "@/lib/processComparison";
import type { PipelineRun } from "@/lib/pipelineTypes";

interface Props {
  runs: PipelineRun[];
}

const PIPELINE_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ec4899",
  "#06b6d4", "#8b5cf6", "#ef4444", "#14b8a6",
];

function getPipelineColor(idx: number): string {
  return PIPELINE_COLORS[idx % PIPELINE_COLORS.length];
}

export default function PipelineComparison({ runs }: Props) {
  const comparison = useMemo(() => processComparison(runs), [runs]);
  const { pipelines, scores, categoryOverlap, taxonomyDiff, radarMetrics } = comparison;

  const colorMap: Record<string, string> = {};
  pipelines.forEach((p, i) => { colorMap[p] = getPipelineColor(i); });

  const isBest = (pipeline: string, metric: keyof typeof scores[0], lower = false) => {
    const vals = scores.map((s) => ({ p: s.pipeline, v: s[metric] as number }));
    const target = lower
      ? Math.min(...vals.map((v) => v.v))
      : Math.max(...vals.map((v) => v.v));
    return vals.find((v) => v.p === pipeline)?.v === target;
  };

  const scatterData = scores.map((s) => ({
    pipeline: s.pipeline,
    x: s.timeSeconds,
    y: s.successRate - s.malformedPct + s.formatConsistency,
    z: s.categoryCount * 10,
  }));

  const groupedBarData = categoryOverlap.map((co) => ({
    category: co.category.length > 25 ? co.category.slice(0, 23) + "…" : co.category,
    fullName: co.category,
    ...co.pipelines,
  }));

  const consistencyData = scores.map((s) => ({
    pipeline: s.pipeline,
    correct: s.formatConsistency,
    incorrect: +(100 - s.formatConsistency).toFixed(1),
  }));

  return (
    <div className="space-y-6">

      {/* Pipeline legend */}
      <div className="flex flex-wrap gap-5">
        {pipelines.map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: colorMap[p] }} />
            <span className="text-sm font-medium text-gray-700">{p}</span>
          </div>
        ))}
      </div>

      {/* ── Scorecard Table ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Pipeline Scorecard</h3>
        <p className="text-xs text-gray-500 mb-5">
          Side-by-side comparison of key quality and efficiency metrics.
          Green = best performer for that metric. Red = worst.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-gray-500 font-medium border-b border-gray-200">Metric</th>
                {pipelines.map((p) => (
                  <th key={p} className="px-3 py-2 font-semibold border-b border-gray-200 text-center" style={{ color: colorMap[p] }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "LLM Provider",          key: "llmProvider"      as const, unit: "",  lower: false, isString: true },
                { label: "Phase 1 Model",         key: "phase1Model"      as const, unit: "",  lower: false, isString: true },
                { label: "Phase 1 Cost (in/out)", key: "phase1Price"       as const, unit: "",  lower: true,  isPrice: true },
                { label: "Phase 2 Model",         key: "phase2Model"      as const, unit: "",  lower: false, isString: true },
                { label: "Phase 3 Model",         key: "phase3Model"      as const, unit: "",  lower: false, isString: true },
                { label: "Success Rate",         key: "successRate"      as const, unit: "%", lower: false },
                { label: "Malformed Output",      key: "malformedPct"     as const, unit: "%", lower: true  },
                { label: "Category Bias",         key: "biasScore"        as const, unit: "%", lower: true  },
                { label: "Format Consistency",    key: "formatConsistency"as const, unit: "%", lower: false },
                { label: "Categories Discovered", key: "categoryCount"    as const, unit: "",  lower: false },
                { label: "Subcategories",         key: "subcategoryCount" as const, unit: "",  lower: false },
                { label: "Run Time",              key: "timeSeconds"      as const, unit: "s", lower: true  },
                { label: "New Categories Found",  key: "candidatesFound"  as const, unit: "",  lower: false },
              ].map((row) => (
                <tr key={row.key} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b border-gray-100 font-medium text-gray-700">{row.label}</td>
                  {scores.map((s) => {
                    const isString = (row as any).isString;
                    const isPrice = (row as any).isPrice;
                    let cellValue = "";

                    if (isPrice) {
                      const pricing = s.phase1Pricing?.[s.llmProvider || ""];
                      cellValue = pricing ? `$${pricing.input.toFixed(2)} / $${pricing.output.toFixed(2)}` : "N/A";
                    } else {
                      cellValue = String(s[row.key as keyof typeof s] || "");
                    }

                    const best = !isString && !isPrice && isBest(s.pipeline, row.key, row.lower);
                    const worst = !isString && !isPrice && isBest(s.pipeline, row.key, !row.lower);

                    return (
                      <td
                        key={s.pipeline}
                        className={`px-3 py-2 border-b border-gray-100 text-center font-semibold ${
                          isString || isPrice ? "text-gray-700" : best ? "text-green-600" : worst ? "text-red-500" : "text-gray-700"
                        }`}
                      >
                        {cellValue}{!isPrice && !isString && row.unit}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Radar + Scatter ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Radar Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Quality Radar</h3>
          <p className="text-xs text-gray-500 mb-4">
            Multi-axis comparison. Higher is better on all axes.
            Malformed % and bias are inverted (lower raw = higher score here).
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarMetrics}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#6b7280", fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: "#9ca3af", fontSize: 9 }} axisLine={false} />
              {pipelines.map((p) => (
                <Radar
                  key={p}
                  name={p}
                  dataKey={p}
                  stroke={colorMap[p]}
                  fill={colorMap[p]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost vs Quality Scatter */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Cost vs Quality</h3>
          <p className="text-xs text-gray-500 mb-4">
            X = run time (seconds). Y = composite quality score. Top-left = best.
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ left: 10, right: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                type="number" dataKey="x" name="Time (s)"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={{ stroke: "#e5e7eb" }}
                label={{ value: "Run Time (s)", position: "insideBottom", offset: -10, fill: "#9ca3af", fontSize: 11 }}
              />
              <YAxis
                type="number" dataKey="y" name="Quality"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={{ stroke: "#e5e7eb" }}
                label={{ value: "Quality", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 11 }}
              />
              <ZAxis type="number" dataKey="z" range={[100, 400]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm shadow-sm">
                      <p className="font-semibold mb-1" style={{ color: colorMap[d.pipeline] }}>{d.pipeline}</p>
                      <p className="text-gray-600">Time: {d.x}s</p>
                      <p className="text-gray-600">Quality: {d.y?.toFixed(1)}</p>
                    </div>
                  );
                }}
              />
              {scatterData.map((d) => (
                <Scatter key={d.pipeline} name={d.pipeline} data={[d]} fill={colorMap[d.pipeline]}>
                  <Cell fill={colorMap[d.pipeline]} />
                </Scatter>
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Category Distribution Bar Chart ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Category Distribution by Pipeline</h3>
        <p className="text-xs text-gray-500 mb-4">
          How each pipeline distributed messages across categories. Categories matched by name across taxonomies.
        </p>
        <ResponsiveContainer width="100%" height={Math.max(280, categoryOverlap.length * 45)}>
          <BarChart data={groupedBarData} layout="vertical" margin={{ left: 180, right: 20 }}>
            <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={{ stroke: "#e5e7eb" }} />
            <YAxis type="category" dataKey="category" tick={{ fill: "#6b7280", fontSize: 10 }} width={180} axisLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const fullName = payload[0]?.payload?.fullName || label;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm shadow-sm">
                    <p className="font-semibold mb-1 text-gray-800">{fullName}</p>
                    {payload.map((p) => (
                      <p key={p.name} style={{ color: p.color as string }}>{p.name}: {p.value}</p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {pipelines.map((p) => (
              <Bar key={p} dataKey={p} name={p} fill={colorMap[p]} fillOpacity={0.85} radius={[0, 4, 4, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Subcategory Consistency ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Subcategory Format Consistency</h3>
        <p className="text-xs text-gray-500 mb-4">
          What percentage of subcategory IDs matched the taxonomy exactly? Higher = more reliable output.
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={consistencyData} margin={{ left: 10, right: 10 }}>
            <XAxis dataKey="pipeline" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={{ stroke: "#e5e7eb" }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm shadow-sm">
                    <p className="font-semibold mb-1 text-gray-800">{d.pipeline}</p>
                    <p className="text-green-600">Correct: {d.correct}%</p>
                    <p className="text-red-500">Incorrect: {d.incorrect}%</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="correct" name="Correct %" stackId="a" fill="#10b981" />
            <Bar dataKey="incorrect" name="Incorrect %" stackId="a" fill="#ef4444" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Taxonomy Structure Diff ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Taxonomy Structure Comparison</h3>
        <p className="text-xs text-gray-500 mb-4">
          Which categories did each pipeline discover? Shared = genuine patterns. Unique = model-specific.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-gray-500 font-medium border-b border-gray-200">Category</th>
                {pipelines.map((p) => (
                  <th key={p} className="px-3 py-2 font-semibold border-b border-gray-200 text-center" style={{ color: colorMap[p] }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taxonomyDiff.map((row) => (
                <tr key={row.categoryName} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b border-gray-100 font-medium text-gray-700">{row.categoryName}</td>
                  {pipelines.map((p) => (
                    <td key={p} className="px-3 py-2 border-b border-gray-100 text-center">
                      {row.presentIn.includes(p) ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Yes</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-500">No</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          {taxonomyDiff.filter((d) => d.presentIn.length === pipelines.length).length} categories shared by all pipelines.
          {taxonomyDiff.filter((d) => d.presentIn.length === 1).length > 0 &&
            ` ${taxonomyDiff.filter((d) => d.presentIn.length === 1).length} unique to a single pipeline.`}
        </p>
      </div>

    </div>
  );
}
