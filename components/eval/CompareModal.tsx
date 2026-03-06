"use client";

import type { PipelineResult } from "../Evaluations";
import type { PromptMetadata } from "./types";
import { Modal } from "./Modal";
import { fmtTime } from "./types";

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtCost(usd: number): string {
  if (usd === 0) return "Free";
  if (usd < 0.01) return `${usd.toFixed(4)}`;
  if (usd < 1) return `${usd.toFixed(3)}`;
  return `${usd.toFixed(2)}`;
}

function PromptDiff({
  a,
  b,
  colorA,
  colorB,
}: {
  a: PromptMetadata | null | undefined;
  b: PromptMetadata | null | undefined;
  colorA: string;
  colorB: string;
}) {
  const pa = a || null;
  const pb = b || null;

  // Check if prompts are identical
  const sameHash = pa?.prompt_hash && pb?.prompt_hash && pa.prompt_hash === pb.prompt_hash;

  if (sameHash) {
    return (
      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-[10px]">✓</span>
          <span className="text-[11px] text-gray-500">
            Both runs used the <strong>same prompt</strong>
            {pa?.preset_used && <> ({pa.preset_used})</>}
          </span>
        </div>
      </div>
    );
  }

  // Field-level comparison
  const fields: { label: string; va: string; vb: string }[] = [
    {
      label: "Preset",
      va: pa?.preset_used || "Default",
      vb: pb?.preset_used || "Default",
    },
    {
      label: "Mode",
      va: pa?.mode || "structured",
      vb: pb?.mode || "structured",
    },
    {
      label: "Task Instruction",
      va: pa?.task_instruction || "Default",
      vb: pb?.task_instruction || "Default",
    },
    {
      label: "Category Seeds",
      va: pa?.category_seeds?.length ? pa.category_seeds.join(", ") : "None",
      vb: pb?.category_seeds?.length ? pb.category_seeds.join(", ") : "None",
    },
    {
      label: "Constraints",
      va: pa?.additional_constraints || "None",
      vb: pb?.additional_constraints || "None",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {fields.map((f) => {
        const same = f.va === f.vb;
        return (
          <div key={f.label} className="flex gap-2">
            <div className="w-24 shrink-0">
              <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wider">
                {f.label}
              </span>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div
                className={[
                  "rounded-lg px-2.5 py-1.5 text-[10px] leading-relaxed border",
                  same ? "bg-white border-gray-100 text-gray-500" : "border-l-2 bg-gray-50 border-gray-100 text-[#0B3954]",
                ].join(" ")}
                style={!same ? { borderLeftColor: colorA } : undefined}
              >
                <div className={f.label === "Task Instruction" ? "line-clamp-3" : ""}>
                  {f.va}
                </div>
              </div>
              <div
                className={[
                  "rounded-lg px-2.5 py-1.5 text-[10px] leading-relaxed border",
                  same ? "bg-white border-gray-100 text-gray-500" : "border-l-2 bg-gray-50 border-gray-100 text-[#0B3954]",
                ].join(" ")}
                style={!same ? { borderLeftColor: colorB } : undefined}
              >
                <div className={f.label === "Task Instruction" ? "line-clamp-3" : ""}>
                  {f.vb}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CompareModal({
  results,
  onClose,
}: {
  results: [PipelineResult, PipelineResult];
  onClose: () => void;
}) {
  const [a, b] = results;
  const colorA = a.config_snapshot?.color || "#F96400";
  const colorB = b.config_snapshot?.color || "#3B5BDB";
  const maxCats = Math.max(a.final_taxonomy.categories.length, b.final_taxonomy.categories.length);

  const promptA = a.prompt_config || null;
  const promptB = b.prompt_config || null;
  const hasPromptData = promptA || promptB;

  const metrics: { label: string; va: string | number; vb: string | number }[] = [
    { label: "Categories", va: a.final_taxonomy.categories.length, vb: b.final_taxonomy.categories.length },
    {
      label: "Subcategories",
      va: a.final_taxonomy.categories.reduce((s, c) => s + c.subcategories.length, 0),
      vb: b.final_taxonomy.categories.reduce((s, c) => s + c.subcategories.length, 0),
    },
    { label: "Candidates Found", va: a.pipeline_summary.results.candidates_found, vb: b.pipeline_summary.results.candidates_found },
    { label: "Changes Applied", va: a.pipeline_summary.results.changes_applied, vb: b.pipeline_summary.results.changes_applied },
    { label: "Run Time", va: fmtTime(a.pipeline_summary.pipeline.total_time_seconds), vb: fmtTime(b.pipeline_summary.pipeline.total_time_seconds) },
    { label: "Total Tokens", va: fmtTokens(a.token_usage?.totals?.total_tokens || 0), vb: fmtTokens(b.token_usage?.totals?.total_tokens || 0) },
    { label: "Estimated Cost", va: fmtCost(a.token_usage?.totals?.estimated_cost_usd || 0), vb: fmtCost(b.token_usage?.totals?.estimated_cost_usd || 0) },
  ];

  return (
    <Modal title="Side-by-Side Comparison" width={900} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Prompt diff section */}
        {hasPromptData && (
          <div>
            <div className="font-mono text-[9px] tracking-widest uppercase text-gray-400 mb-2">
              Prompt Configuration
            </div>
            <PromptDiff a={promptA} b={promptB} colorA={colorA} colorB={colorB} />
          </div>
        )}

        {/* Metrics table */}
        <div>
          <div className="font-mono text-[9px] tracking-widest uppercase text-gray-400 mb-2">
            Pipeline Metrics
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-3 py-2 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">Metric</th>
                <th
                  className="px-3 py-2 text-center font-mono text-[9px] tracking-widest uppercase font-semibold"
                  style={{ color: colorA }}
                >
                  {a.config_id.replace(/_/g, " ")}
                </th>
                <th
                  className="px-3 py-2 text-center font-mono text-[9px] tracking-widest uppercase font-semibold"
                  style={{ color: colorB }}
                >
                  {b.config_id.replace(/_/g, " ")}
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-semibold text-[#0B3954] text-[11px]">{m.label}</td>
                  <td className="px-3 py-2 text-center font-mono text-[12px] font-bold text-[#0B3954]">{m.va}</td>
                  <td className="px-3 py-2 text-center font-mono text-[12px] font-bold text-[#0B3954]">{m.vb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Category alignment */}
        <div>
          <div className="font-mono text-[9px] tracking-widest uppercase text-gray-400 mb-2">Category Alignment</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-3 py-2 text-left font-mono text-[9px] text-gray-500 font-normal w-10">ID</th>
                <th
                  className="px-3 py-2 text-left font-mono text-[9px] font-normal"
                  style={{ color: colorA }}
                >
                  {a.config_id.replace(/_/g, " ")}
                </th>
                <th
                  className="px-3 py-2 text-left font-mono text-[9px] font-normal"
                  style={{ color: colorB }}
                >
                  {b.config_id.replace(/_/g, " ")}
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxCats }, (_, i) => {
                const catA = a.final_taxonomy.categories[i];
                const catB = b.final_taxonomy.categories[i];
                const id = catA?.id || catB?.id || `C${i + 1}`;
                return (
                  <tr key={id} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-mono text-[10px] font-bold text-gray-400">{id}</td>
                    <td className="px-3 py-2 text-[11px] text-[#0B3954]">
                      {catA ? (
                        <div>
                          <div className="font-semibold">{catA.name}</div>
                          <div className="text-[9px] text-gray-400">{catA.subcategories.length} sub</div>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-[#0B3954]">
                      {catB ? (
                        <div>
                          <div className="font-semibold">{catB.name}</div>
                          <div className="text-[9px] text-gray-400">{catB.subcategories.length} sub</div>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}