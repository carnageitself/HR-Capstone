"use client";

import { PipelineRun } from "@/lib/pipelineTypes";

interface ComparisonMetricsProps {
  run1: PipelineRun;
  run2: PipelineRun;
}

export default function ComparisonMetrics({
  run1,
  run2,
}: ComparisonMetricsProps) {
  const metrics1 = run1.summary;
  const metrics2 = run2.summary;

  if (!metrics1 || !metrics2) return null;

  const categoryDiff =
    metrics2.results.final_categories - metrics1.results.final_categories;
  const subcategoryDiff =
    metrics2.results.total_subcategories - metrics1.results.total_subcategories;
  const timeDiff =
    metrics2.pipeline.total_time_seconds - metrics1.pipeline.total_time_seconds;

  const success1 = run1.phase2
    ? (run1.phase2.metadata.total_classified /
        run1.phase2.metadata.total_messages) *
      100
    : 0;
  const success2 = run2.phase2
    ? (run2.phase2.metadata.total_classified /
        run2.phase2.metadata.total_messages) *
      100
    : 0;
  const successDiff = success2 - success1;

  const formatDiff = (diff: number): string => {
    if (diff === 0) return "=";
    if (diff > 0) return `+${diff}`;
    return `${diff}`;
  };

  const diffColor = (diff: number): string => {
    if (diff === 0) return "text-gray-600";
    if (diff > 0) return "text-green-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-900">
        Comparison: {run1.provider.toUpperCase()} vs {run2.provider.toUpperCase()}
      </h3>

      <div className="grid grid-cols-5 gap-4">
        {/* Categories */}
        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">
            Categories
          </p>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">
                {run1.provider.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {metrics1.results.final_categories}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {run2.provider.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {metrics2.results.final_categories}
              </p>
            </div>
          </div>
          <p className={`text-xs font-semibold mt-2 ${diffColor(categoryDiff)}`}>
            {formatDiff(categoryDiff)}
          </p>
        </div>

        {/* Subcategories */}
        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">
            Subcategories
          </p>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">
                {run1.provider.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics1.results.total_subcategories}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {run2.provider.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics2.results.total_subcategories}
              </p>
            </div>
          </div>
          <p className={`text-xs font-semibold mt-2 ${diffColor(subcategoryDiff)}`}>
            {formatDiff(subcategoryDiff)}
          </p>
        </div>

        {/* Speed (Execution Time) */}
        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Speed</p>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">
                {run1.provider.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {metrics1.pipeline.total_time_seconds}s
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {run2.provider.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {metrics2.pipeline.total_time_seconds}s
              </p>
            </div>
          </div>
          <p className={`text-xs font-semibold mt-2 ${diffColor(-timeDiff)}`}>
            {timeDiff > 0 ? `${run1.provider} faster` : `${run2.provider} faster`}
          </p>
        </div>

        {/* Success Rate */}
        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">
            Classification Rate
          </p>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">
                {run1.provider.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {success1.toFixed(0)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {run2.provider.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {success2.toFixed(0)}%
              </p>
            </div>
          </div>
          <p className={`text-xs font-semibold mt-2 ${diffColor(successDiff)}`}>
            {formatDiff(successDiff.toFixed(1))}
          </p>
        </div>

        {/* Quality Score */}
        <div className="border rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-orange-50">
          <p className="text-xs font-medium text-gray-500 uppercase">
            Quality Score
          </p>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">
                {run1.provider.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {(
                  ((metrics1.results.final_categories +
                    metrics1.results.total_subcategories) /
                    100) *
                  success1
                ).toFixed(1)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {run2.provider.toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {(
                  ((metrics2.results.final_categories +
                    metrics2.results.total_subcategories) /
                    100) *
                  success2
                ).toFixed(1)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">(Derived score)</p>
        </div>
      </div>

      {/* Winner Badge */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs font-medium text-gray-500 mb-3">RECOMMENDATION</p>
        <div className="flex gap-4">
          {metrics1.results.final_categories > metrics2.results.final_categories ? (
            <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-orange-900">
                Better Category Coverage: {run1.provider.toUpperCase()}
              </p>
              <p className="text-xs text-orange-700 mt-1">
                {metrics1.results.final_categories} vs{" "}
                {metrics2.results.final_categories} categories
              </p>
            </div>
          ) : (
            <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-purple-900">
                Better Category Coverage: {run2.provider.toUpperCase()}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                {metrics2.results.final_categories} vs{" "}
                {metrics1.results.final_categories} categories
              </p>
            </div>
          )}

          {success1 > success2 ? (
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-green-900">
                Better Accuracy: {run1.provider.toUpperCase()}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {success1.toFixed(1)}% vs {success2.toFixed(1)}% classified
              </p>
            </div>
          ) : (
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-green-900">
                Better Accuracy: {run2.provider.toUpperCase()}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {success2.toFixed(1)}% vs {success1.toFixed(1)}% classified
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
