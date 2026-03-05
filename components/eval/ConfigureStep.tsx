"use client";

import { useState, useEffect } from "react";
import { apiGetConfigs, apiStartRuns, type ModelConfig, type UploadResult } from "../Evaluations";
import type { PromptConfigPayload } from "./types";
import PromptEditor from "./PromptEditor";

export function ConfigureStep({
  upload,
  selectedConfigs,
  onSelectConfigs,
  promptConfig,
  onPromptConfig,
  onBack,
  onStart,
  fileId,
}: {
  upload: UploadResult;
  selectedConfigs: string[];
  onSelectConfigs: (ids: string[]) => void;
  promptConfig: PromptConfigPayload | null;
  onPromptConfig: (config: PromptConfigPayload | null) => void;
  onBack: () => void;
  onStart: (jobs: { job_id: string; config_id: string }[]) => void;
  fileId: string;
}) {
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGetConfigs()
      .then(c => {
        setConfigs(c);
        if (selectedConfigs.length === 0) {
          onSelectConfigs(c.map(x => x.id));
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => {
    if (selectedConfigs.includes(id)) {
      onSelectConfigs(selectedConfigs.filter(x => x !== id));
    } else {
      onSelectConfigs([...selectedConfigs, id]);
    }
  };

  const handleStart = async () => {
    if (selectedConfigs.length === 0) return;
    setStarting(true);
    setError(null);
    try {
      const jobs = await apiStartRuns(fileId, selectedConfigs, promptConfig);
      onStart(jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start pipeline");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#F96400] border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-500">Loading model configurations...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Upload summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">📁</span>
          <div>
            <div className="text-[13px] font-bold text-[#0B3954]">{upload.filename}</div>
            <div className="font-mono text-[10px] text-gray-400">
              {upload.row_count.toLocaleString()} rows · {upload.columns.length} columns
            </div>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-500 hover:bg-white cursor-pointer"
        >
          ← Change
        </button>
      </div>

      {/* Config selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-[14px] text-[#0B3954]">Select Model Configurations</div>
            <div className="font-mono text-[10px] text-gray-400">
              Choose which pipeline configurations to run against your data
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => onSelectConfigs(configs.map(c => c.id))}
              className="px-2.5 py-1 rounded-md text-[10px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Select All
            </button>
            <button
              onClick={() => onSelectConfigs([])}
              className="px-2.5 py-1 rounded-md text-[10px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {configs.map(config => {
            const selected = selectedConfigs.includes(config.id);
            return (
              <button
                key={config.id}
                onClick={() => toggle(config.id)}
                className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                  selected
                    ? "shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
                style={selected ? {
                  borderColor: config.color,
                  background: config.color + "08",
                } : undefined}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border-2"
                      style={{
                        borderColor: config.color,
                        background: selected ? config.color : "transparent",
                      }}
                    />
                    <span className="font-bold text-[13px] text-[#0B3954]">{config.display_name}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="text-[11px] text-gray-500 mb-3 leading-snug">{config.description}</div>

                {/* Phase breakdown */}
                <div className="flex flex-col gap-1.5">
                  {(["phase_1", "phase_2", "phase_3"] as const).map((phase, i) => {
                    const p = config.phases[phase];
                    return (
                      <div key={phase} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded grid place-items-center text-[8px] font-bold text-white"
                          style={{ background: config.color + (selected ? "" : "88") }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[9px] text-gray-500 truncate">{p.model}</div>
                          <div className="font-mono text-[8px] text-gray-400">{p.role}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phase 1 Prompt Editor */}
      <PromptEditor
        onChange={onPromptConfig}
        initialConfig={promptConfig}
      />

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="text-base">❌</span>
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-[12px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
        >
          ← Back
        </button>
        <button
          onClick={handleStart}
          disabled={selectedConfigs.length === 0 || starting}
          className={`px-6 py-2 rounded-lg text-[12px] font-bold shadow-sm cursor-pointer transition-all ${
            selectedConfigs.length === 0 || starting
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#F96400] text-white hover:bg-[#E05A00]"
          }`}
        >
          {starting ? "Starting..." : `Run ${selectedConfigs.length} Configuration${selectedConfigs.length !== 1 ? "s" : ""} →`}
        </button>
      </div>
    </div>
  );
}