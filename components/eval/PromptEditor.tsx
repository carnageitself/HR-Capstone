"use client";

import { useState, useEffect, useCallback } from "react";
import type { PromptPreset, PromptConfigPayload } from "./types";

const API = "/api/pipeline";

const LOCKED_PREAMBLE =
  "You are a researcher designing a taxonomy for employee recognition awards.";

const LOCKED_SCHEMA = `Output ONLY valid JSON with this structure:
{
  "categories": [
    {
      "id": "A",
      "name": "...",
      "description": "...",
      "subcategories": [
        { "id": "A1", "name": "...", "description": "...",
          "examples": ["short phrase", "another phrase"] }
      ]
    }
  ],
  "reasoning": "2-3 sentences explaining why this structure fits the data"
}`;

interface PromptEditorProps {
  onChange: (config: PromptConfigPayload | null) => void;
  initialConfig?: PromptConfigPayload | null;
  collapsed?: boolean;
}

export default function PromptEditor({
  onChange,
  initialConfig,
  collapsed: initialCollapsed = true,
}: PromptEditorProps) {
  const [presets, setPresets] = useState<PromptPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(initialConfig?.preset_id || null);
  const [mode, setMode] = useState<"structured" | "raw">(initialConfig?.mode || "structured");
  const [taskInstruction, setTaskInstruction] = useState(initialConfig?.task_instruction || "");
  const [seeds, setSeeds] = useState<string[]>(initialConfig?.category_seeds || []);
  const [newSeed, setNewSeed] = useState("");
  const [constraints, setConstraints] = useState(initialConfig?.additional_constraints || "");
  const [rawPrompt, setRawPrompt] = useState(initialConfig?.raw_prompt || "");
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [showModeWarning, setShowModeWarning] = useState(false);
  const [dirty, setDirty] = useState(false);

    function composeRaw(task: string, seedList: string[], cons: string): string {
    let raw = task;
    if (seedList.length > 0) {
      raw +=
        "\n\nConsider these starting categories as hints, but freely " +
        "add new ones or discard these if the data doesn't support them:\n" +
        seedList.map((s) => `- ${s}`).join("\n");
    }
    if (cons) raw += `\n\nAdditional guidance:\n${cons}`;
    return raw;
  }

    function applyPreset(preset: PromptPreset) {
    setSelectedPresetId(preset.id);
    setTaskInstruction(preset.task_instruction);
    setSeeds([...preset.category_seeds]);
    setConstraints(preset.additional_constraints);
    setDirty(false);
    setRawPrompt(composeRaw(preset.task_instruction, preset.category_seeds, preset.additional_constraints));
  }

  useEffect(() => {
    fetch(`${API}/presets`)
      .then((r) => r.json())
      .then((data) => {
        const list: PromptPreset[] = data.presets || [];
        setPresets(list);
        if (!initialConfig && list.length > 0) {
          applyPreset(list[0]);
        }
      })
      .catch((err) => console.error("Failed to load presets:", err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const emitChange = useCallback(() => {
    const payload: PromptConfigPayload = {
      preset_id: selectedPresetId || undefined,
      task_instruction: taskInstruction || undefined,
      category_seeds: seeds.length > 0 ? seeds : undefined,
      additional_constraints: constraints || undefined,
      mode,
    };
    if (mode === "raw") payload.raw_prompt = rawPrompt;
    onChange(payload);
  }, [selectedPresetId, taskInstruction, seeds, constraints, mode, rawPrompt, onChange]);

  useEffect(() => { emitChange(); }, [emitChange]);

  function handlePresetChange(presetId: string) {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) applyPreset(preset);
  }

  function handleModeSwitch(newMode: "structured" | "raw") {
    if (newMode === mode) return;
    if (newMode === "raw") {
      setRawPrompt(composeRaw(taskInstruction, seeds, constraints));
      setMode("raw");
    } else {
      if (dirty) { setShowModeWarning(true); }
      else { setMode("structured"); }
    }
  }

  function addSeed() {
    const trimmed = newSeed.trim();
    if (trimmed && !seeds.includes(trimmed)) {
      setSeeds([...seeds, trimmed]);
      setNewSeed("");
      markDirty();
    }
  }
  function removeSeed(idx: number) { setSeeds(seeds.filter((_, i) => i !== idx)); markDirty(); }
  function handleSeedKeyDown(e: React.KeyboardEvent) { if (e.key === "Enter") { e.preventDefault(); addSeed(); } }
  function markDirty() { setDirty(true); setSelectedPresetId(null); }

  const currentPreset = presets.find((p) => p.id === selectedPresetId);
  const presetLabel = currentPreset ? currentPreset.name : dirty ? "Custom" : "Default";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${collapsed ? "" : "rotate-90"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-bold text-[13px] text-[#0B3954]">Phase 1 Prompt</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-semibold">
            {presetLabel}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">
          {mode === "raw" ? "raw" : "structured"}
        </span>
      </button>

      {!collapsed && (
        <div className="p-4 space-y-4 border-t border-gray-100">
          {/* Preset + mode toggle row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-[10px] text-gray-400 font-semibold whitespace-nowrap uppercase tracking-wider">
                Preset
              </label>
              <select
                value={selectedPresetId || ""}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] text-[#0B3954] focus:outline-none focus:border-[#F96400] cursor-pointer"
              >
                {!selectedPresetId && <option value="">Custom</option>}
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {(["structured", "raw"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeSwitch(m)}
                  className={`px-3 py-1.5 text-[10px] font-semibold transition-colors cursor-pointer capitalize ${
                    mode === m
                      ? "bg-[#0B3954] text-white"
                      : "bg-white text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Preset description */}
          {currentPreset && (
            <p className="text-[11px] text-gray-400 italic leading-snug">
              {currentPreset.description}
            </p>
          )}

          {mode === "structured" && (
            <div className="space-y-4">
              {/* Task instruction */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Task Instruction
                </label>
                <textarea
                  value={taskInstruction}
                  onChange={(e) => { setTaskInstruction(e.target.value); markDirty(); }}
                  rows={4}
                  placeholder="Describe what the LLM should do with the messages..."
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[12px] text-[#0B3954] placeholder-gray-300 focus:outline-none focus:border-[#F96400] resize-y leading-relaxed"
                />
              </div>

              {/* Category seeds */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Category Seeds
                  <span className="font-normal normal-case tracking-normal text-gray-400 ml-1">
                    — optional, leave empty for pure discovery
                  </span>
                </label>
                {seeds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {seeds.map((seed, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-[#0B3954] font-medium"
                      >
                        {seed}
                        <button
                          onClick={() => removeSeed(i)}
                          className="text-gray-300 hover:text-red-400 transition-colors ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSeed}
                    onChange={(e) => setNewSeed(e.target.value)}
                    onKeyDown={handleSeedKeyDown}
                    placeholder="Type a category name and press Enter..."
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] text-[#0B3954] placeholder-gray-300 focus:outline-none focus:border-[#F96400]"
                  />
                  <button
                    onClick={addSeed}
                    disabled={!newSeed.trim()}
                    className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Additional constraints */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Additional Constraints
                </label>
                <textarea
                  value={constraints}
                  onChange={(e) => { setConstraints(e.target.value); markDirty(); }}
                  rows={2}
                  placeholder='e.g. "Limit to 5-8 categories", "Focus on cross-functional patterns"...'
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[12px] text-[#0B3954] placeholder-gray-300 focus:outline-none focus:border-[#F96400] resize-y leading-relaxed"
                />
              </div>

              {/* Locked sections note */}
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <p className="text-[10px] text-gray-400">
                  <span className="font-semibold text-gray-500">Locked:</span>{" "}
                  System role, JSON output schema, and message injection are handled automatically.
                </p>
              </div>
            </div>
          )}

          {mode === "raw" && (
            <div className="space-y-3">
              {/* Locked preamble */}
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Locked — System Preamble
                </div>
                <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                  {LOCKED_PREAMBLE}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Editable Prompt
                </label>
                <textarea
                  value={rawPrompt}
                  onChange={(e) => { setRawPrompt(e.target.value); setDirty(true); setSelectedPresetId(null); }}
                  rows={14}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[12px] text-[#0B3954] font-mono leading-relaxed focus:outline-none focus:border-[#F96400] resize-y"
                />
              </div>

              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Locked — Output Schema
                </div>
                <pre className="text-[10px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {LOCKED_SCHEMA}
                </pre>
              </div>

              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Locked — Messages
                </div>
                <p className="text-[11px] text-gray-400">
                  Sampled messages (with award title, recipient, and nominator) will be appended automatically at runtime.
                </p>
              </div>
            </div>
          )}

          {showModeWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-sm mx-4 shadow-xl">
                <h3 className="text-[13px] font-bold text-[#0B3954] mb-2">
                  Switch to Structured Mode?
                </h3>
                <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                  Your raw edits will be lost. The structured fields will revert to
                  their last known values before you switched to raw mode.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowModeWarning(false)}
                    className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setShowModeWarning(false); setMode("structured"); setDirty(false); }}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[#F96400] text-white hover:bg-[#E05A00] cursor-pointer"
                  >
                    Switch Anyway
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}