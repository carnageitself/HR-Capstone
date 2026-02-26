"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { SH } from "@/constants/primitives";
import pipelineSummary from "@/outputs/pipeline_summary.json";
import finalTaxonomy from "@/outputs/final_taxonomy.json";
import phase3Final from "@/outputs/phase_3_final.json";
import edaReport from "@/outputs/reports/eda_report.json";
import geminiWithLlamaSummary from "@/outputs/runs/gemini_with_llama/pipeline_summary.json";
import geminiWithLlamaTaxonomy from "@/outputs/runs/gemini_with_llama/final_taxonomy.json";
import geminiOnlySummary from "@/outputs/runs/gemini_only/pipeline_summary.json";
import geminiOnlyTaxonomy from "@/outputs/runs/gemini_only/final_taxonomy.json";

const CAT_PALETTE = ["#F96400", "#00A98F", "#3B5BDB", "#8E44AD", "#27AE60", "#E74C3C", "#F39C12", "#45B7D1"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(s: number) {
  if (s < 60) return `${s.toFixed(1)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  return `${(s / 3600).toFixed(1)}h`;
}

function Section({
  emoji,
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-base">{emoji}</span>
          <div className="text-left">
            <div className="font-bold text-[14px] text-[#0B3954]">{title}</div>
            <div className="font-mono text-[10px] text-gray-400">{subtitle}</div>
          </div>
        </div>
        <span
          className="text-gray-400 text-sm transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          ▼
        </span>
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100">{children}</div>}
    </div>
  );
}

function KpiCard({
  eye,
  value,
  sub,
  bar,
}: {
  eye: string;
  value: string | number;
  sub?: string;
  bar: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${bar},${bar}55)` }} />
      <div className="font-mono text-[8px] tracking-widest uppercase text-gray-500 mb-1.5 leading-tight">{eye}</div>
      <div className="text-[22px] font-extrabold leading-none tracking-tight" style={{ color: bar }}>
        {value}
      </div>
      {sub && <div className="font-mono text-[9px] text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function PipelineOverview() {
  const p = pipelineSummary.pipeline;
  const r = pipelineSummary.results;
  const provider = p.llm_provider_priority[0] || "—";

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard eye="Run Time" value={fmtTime(p.total_time_seconds)} sub="end-to-end" bar="#F96400" />
        <KpiCard eye="Phases Run" value={p.phases_run.join(" → ")} sub={`Provider: ${provider}`} bar="#3B5BDB" />
        <KpiCard eye="Final Categories" value={r.final_categories} sub={`${r.total_subcategories} subcategories`} bar="#00A98F" />
        <KpiCard eye="Candidates Found" value={r.candidates_found} sub={`${r.changes_applied} changes applied`} bar="#8E44AD" />
      </div>

      {/* Model details */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
          <div className="font-mono text-[8px] tracking-widest uppercase text-gray-400 mb-1.5">Phase 1 Model</div>
          <div className="text-[12px] font-semibold text-[#0B3954]">
            {(p.phase_1_models as Record<string, string>)[provider] || "—"}
          </div>
          <div className="font-mono text-[9px] text-gray-400 mt-0.5">Taxonomy Discovery</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
          <div className="font-mono text-[8px] tracking-widest uppercase text-gray-400 mb-1.5">Phase 2 Model</div>
          <div className="text-[12px] font-semibold text-[#0B3954]">
            {p.phase_2_model}
          </div>
          <div className="font-mono text-[9px] text-gray-400 mt-0.5">Bulk Classification (Local)</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
          <div className="font-mono text-[8px] tracking-widest uppercase text-gray-400 mb-1.5">Phase 3 Model</div>
          <div className="text-[12px] font-semibold text-[#0B3954]">
            {(p.phase_3_models as Record<string, string>)[provider] || "—"}
          </div>
          <div className="font-mono text-[9px] text-gray-400 mt-0.5">Taxonomy Finalization</div>
        </div>
      </div>

      {/* Phase 3 change log */}
      {phase3Final.result?.summary && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex gap-2.5">
          <span className="text-lg">📝</span>
          <div>
            <div className="font-mono text-[8px] tracking-widest uppercase text-indigo-500 mb-1">Phase 3 Summary</div>
            <div className="text-xs text-indigo-800 leading-relaxed">{phase3Final.result.summary}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaxonomyViewer() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(finalTaxonomy.categories.map((c) => c.id)));
  };

  const collapseAll = () => setExpanded(new Set());

  const cats = finalTaxonomy.categories;

  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] text-gray-400">
          {cats.length} categories · {cats.reduce((s, c) => s + c.subcategories.length, 0)} subcategories
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={expandAll}
            className="px-2.5 py-1 rounded-md text-[10px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 rounded-md text-[10px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {cats.map((cat, ci) => {
        const color = CAT_PALETTE[ci % CAT_PALETTE.length];
        const isOpen = expanded.has(cat.id);

        return (
          <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(cat.id)}
              className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                style={{ background: color + "18", border: `2px solid ${color}` }}
              >
                <span className="font-mono text-[11px] font-bold" style={{ color }}>
                  {cat.id}
                </span>
              </div>
              <div className="flex-1 text-left">
                <div className="text-[13px] font-bold text-[#0B3954]">{cat.name}</div>
                <div className="text-[11px] text-gray-500 leading-snug">{cat.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-gray-400">
                  {cat.subcategories.length} sub
                </span>
                <span
                  className="text-gray-400 text-xs transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                >
                  ▼
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex flex-col gap-2.5">
                {cat.subcategories.map((sub) => (
                  <div key={sub.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-5 h-5 rounded grid place-items-center shrink-0"
                        style={{ background: color }}
                      >
                        <span className="font-mono text-[7px] text-white font-bold">{sub.id}</span>
                      </div>
                      <span className="text-[12px] font-semibold text-[#0B3954]">{sub.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mb-2 leading-snug pl-7">{sub.description}</div>
                    {sub.examples && sub.examples.length > 0 && (
                      <div className="pl-7 flex flex-wrap gap-1.5">
                        {sub.examples.map((ex, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-[9px] font-mono"
                            style={{ background: color + "12", color, border: `1px solid ${color}30` }}
                          >
                            &ldquo;{ex}&rdquo;
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Reasoning */}
      {finalTaxonomy.reasoning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-2.5">
          <span className="text-lg">💡</span>
          <div>
            <div className="font-mono text-[8px] tracking-widest uppercase text-amber-600 mb-1">LLM Reasoning</div>
            <div className="text-[11px] text-amber-800 leading-relaxed">{finalTaxonomy.reasoning}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiRunComparison() {
  const runs = [
    {
      name: "Default (Claude)",
      summary: pipelineSummary,
      taxonomy: finalTaxonomy,
      color: "#F96400",
    },
    {
      name: "Gemini + Llama",
      summary: geminiWithLlamaSummary,
      taxonomy: geminiWithLlamaTaxonomy,
      color: "#3B5BDB",
    },
    {
      name: "Gemini Only",
      summary: geminiOnlySummary,
      taxonomy: geminiOnlyTaxonomy,
      color: "#00A98F",
    },
  ];

  // Pre-computed metrics from phase_2_results analysis
  const scorecardMetrics: {
    metric: string;
    values: (string | number)[];
    higherIsBetter: boolean;
  }[] = [
      { metric: "Success Rate", values: ["96%", "97.5%", "0%"], higherIsBetter: true },
      { metric: "Malformed Output", values: ["7.7%", "8.9%", "0%"], higherIsBetter: false },
      { metric: "Category Bias", values: ["236.3%", "191.2%", "0%"], higherIsBetter: false },
      { metric: "Format Consistency", values: ["72.9%", "71.0%", "0%"], higherIsBetter: true },
      {
        metric: "Categories Discovered",
        values: runs.map((r) => r.summary.results.final_categories),
        higherIsBetter: true,
      },
      {
        metric: "Subcategories",
        values: runs.map((r) => r.summary.results.total_subcategories),
        higherIsBetter: true,
      },
      {
        metric: "Run Time",
        values: runs.map((r) => fmtTime(r.summary.pipeline.total_time_seconds)),
        higherIsBetter: false,
      },
      { metric: "New Categories Found", values: [17, 8, 0], higherIsBetter: true },
    ];

  function getBestWorst(values: (string | number)[], higherIsBetter: boolean) {
    const nums = values.map((v) => {
      const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
      return isNaN(n) ? 0 : n;
    });
    const nonZero = nums.filter((n) => n > 0);
    if (nonZero.length === 0) return { best: -1, worst: -1 };
    const bestVal = higherIsBetter ? Math.max(...nonZero) : Math.min(...nonZero);
    const worstVal = higherIsBetter ? Math.min(...nums) : Math.max(...nums);
    const best = nums.indexOf(bestVal);
    const worst = nums.indexOf(worstVal);
    return { best, worst: best !== worst ? worst : -1 };
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      {/* Pipeline Scorecard */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="font-bold text-[15px] text-[#0B3954]">Pipeline Scorecard</div>
          <div className="font-mono text-[10px] text-gray-400">
            Side-by-side comparison of key quality and efficiency metrics.{" "}
            <span className="text-green-600">Green</span> = best performer for that metric.{" "}
            <span className="text-red-500">Red</span> = worst.
          </div>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">
                Metric
              </th>
              {runs.map((r) => (
                <th
                  key={r.name}
                  className="px-4 py-3 text-center font-mono text-[9px] tracking-widest uppercase font-semibold"
                  style={{ color: r.color }}
                >
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scorecardMetrics.map((row) => {
              const { best, worst } = getBestWorst(row.values, row.higherIsBetter);
              return (
                <tr key={row.metric} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#0B3954] text-[12px]">{row.metric}</td>
                  {row.values.map((v, i) => {
                    const isBest = i === best;
                    const isWorst = i === worst;
                    return (
                      <td
                        key={i}
                        className="px-4 py-3 text-center font-mono text-[13px] font-bold"
                        style={{
                          color: isBest ? "#27AE60" : isWorst ? "#E74C3C" : "#0B3954",
                        }}
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Category name comparison */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="font-mono text-[9px] text-[#8E44AD] uppercase tracking-widest mb-0.5">
            Category Names
          </div>
          <div className="font-bold text-[14px] text-[#0B3954]">Taxonomy Alignment Across Runs</div>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal w-12">
                ID
              </th>
              {runs.map((r) => (
                <th
                  key={r.name}
                  className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase font-normal"
                  style={{ color: r.color }}
                >
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["C1", "C2", "C3", "C4", "C5", "C6"].map((id) => (
              <tr key={id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3.5 py-2.5">
                  <span className="font-mono text-[10px] font-bold text-gray-400">{id}</span>
                </td>
                {runs.map((r, i) => {
                  const cat = r.taxonomy.categories.find((c) => c.id === id);
                  return (
                    <td key={i} className="px-3.5 py-2.5 text-[11px] text-[#0B3954]">
                      {cat?.name || <span className="text-gray-300">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual run time bars */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <SH eye="Performance" title="Run Time Comparison" eyeColorCls="text-[#8E44AD]" />
        <div className="flex flex-col gap-3">
          {runs.map((r) => {
            const secs = r.summary.pipeline.total_time_seconds;
            const maxSecs = Math.max(...runs.map((x) => x.summary.pipeline.total_time_seconds));
            const pct = Math.max(2, Math.round((secs / maxSecs) * 100));
            return (
              <div key={r.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] font-medium text-[#0B3954]">{r.name}</span>
                  <span className="font-mono text-[10px]" style={{ color: r.color }}>
                    {fmtTime(secs)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-1000"
                    style={{ width: `${pct}%`, background: r.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DataQuality() {
  const b = edaReport.basic;
  const msg = edaReport.message;
  const award = edaReport.award_title;
  const recip = edaReport.recipient_title;
  const nom = edaReport.nominator_title;
  const inter = edaReport.interactions;

  return (
    <div className="flex flex-col gap-4 pt-4">
      {/* Dataset basics */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard eye="Total Rows" value={b.total_rows.toLocaleString()} bar="#F96400" />
        <KpiCard eye="Columns" value={b.total_columns} sub={b.columns.join(", ")} bar="#3B5BDB" />
        <KpiCard eye="Null Counts" value={Object.values(b.null_counts).reduce((s, v) => s + v, 0)} sub="across all columns" bar="#E74C3C" />
        <KpiCard eye="Unique Pairs" value={inter.unique_pairs} sub={`${inter.total_interactions} interactions`} bar="#00A98F" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Message length stats */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Text Analysis" title="Message Length Distribution" eyeColorCls="text-[#F96400]" />
          <div className="flex flex-col gap-2">
            {[
              { label: "Minimum", value: msg.char_length.min, pct: 0 },
              { label: "P5", value: msg.char_length.p5, pct: 5 },
              { label: "Median", value: msg.char_length.median, pct: 50 },
              { label: "Mean", value: msg.char_length.mean, pct: 52 },
              { label: "P95", value: msg.char_length.p95, pct: 95 },
              { label: "Maximum", value: msg.char_length.max, pct: 100 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[11px] text-[#0B3954] font-medium">{s.label}</span>
                  <span className="font-mono text-[10px] text-[#F96400] font-bold">
                    {typeof s.value === 'number' ? s.value.toLocaleString() : s.value} chars
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full rounded bg-gradient-to-r from-[#F96400] to-[#FFAB73]"
                    style={{ width: `${Math.max(2, (Number(s.value) / msg.char_length.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
              <div className="font-mono text-[8px] uppercase tracking-widest text-orange-500 mb-0.5">Word Count Range</div>
              <div className="font-bold text-[13px] text-[#0B3954]">
                {msg.word_count.min} – {msg.word_count.max}
              </div>
              <div className="font-mono text-[9px] text-gray-400">avg {msg.word_count.mean} words</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
              <div className="font-mono text-[8px] uppercase tracking-widest text-orange-500 mb-0.5">Std Deviation</div>
              <div className="font-bold text-[13px] text-[#0B3954]">{msg.char_length.std}</div>
              <div className="font-mono text-[9px] text-gray-400">character spread</div>
            </div>
          </div>
        </div>

        {/* Interaction stats */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Network" title="Interaction Statistics" eyeColorCls="text-[#00A98F]" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Unique Recipients", value: inter.unique_recipients, color: "#00A98F" },
              { label: "Unique Nominators", value: inter.unique_nominators, color: "#3B5BDB" },
              { label: "Self-Recognition", value: inter.self_recognition_count, color: "#F39C12" },
              { label: "Bidirectional Pairs", value: inter.bidirectional_pairs, color: "#8E44AD" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                <div className="font-mono text-[8px] uppercase tracking-widest text-gray-400 mb-0.5">{s.label}</div>
                <div className="font-bold text-[18px] leading-none" style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="font-mono text-[8px] tracking-widest uppercase text-gray-400 mb-2">Top Interaction Pairs</div>
          <div className="flex flex-col gap-1.5">
            {inter.top_10_pairs.slice(0, 5).map((pair, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="font-mono text-[9px] text-gray-400 w-4 text-right">{i + 1}.</span>
                <span className="text-[#0B3954] font-medium flex-1 truncate">{pair.nominator}</span>
                <span className="text-gray-300">→</span>
                <span className="text-[#0B3954] flex-1 truncate">{pair.recipient}</span>
                <span className="font-mono text-[10px] text-[#00A98F] font-bold w-6 text-right">{pair.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seniority distributions side by side */}
      <div className="grid grid-cols-2 gap-4">
        {([
          { label: "Recipient", data: recip.seniority_distribution, color: "#3B5BDB", uniqueCount: recip.unique_count },
          { label: "Nominator", data: nom.seniority_distribution, color: "#8E44AD", uniqueCount: nom.unique_count },
        ] as const).map((section) => {
          const entries = Object.entries(section.data).sort((a, b) => b[1] - a[1]);
          const maxVal = Math.max(...entries.map((e) => e[1]));
          return (
            <div key={section.label} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <SH
                eye={`${section.label} Titles`}
                title={`Seniority Distribution`}
                eyeColorCls={`text-[${section.color}]`}
                right={
                  <span className="font-mono text-[10px] text-gray-500">
                    {section.uniqueCount} unique titles
                  </span>
                }
              />
              <div className="flex flex-col gap-2">
                {entries.map(([level, count]) => (
                  <div key={level}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[11px] text-[#0B3954] font-medium">{level}</span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: section.color }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${Math.max(2, (count / maxVal) * 100)}%`,
                          background: section.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Evaluations({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex gap-2.5">
        <span className="text-lg">🔬</span>
        <p className="text-xs text-indigo-800 leading-relaxed">
          <strong>Pipeline Evaluation Metrics</strong> — This tab presents the findings from the taxonomy
          pipeline, including taxonomy structure, multi-run comparisons, and data quality analysis of the
          underlying {edaReport.basic.total_rows.toLocaleString()} award messages.
        </p>
      </div>

      <Section
        emoji="⚡"
        title="Pipeline Overview"
        subtitle="Run time, models, and pipeline results"
        defaultOpen={true}
      >
        <PipelineOverview />
      </Section>

      <Section
        emoji="🏷️"
        title="Final Taxonomy"
        subtitle={`${finalTaxonomy.categories.length} categories · ${finalTaxonomy.categories.reduce((s, c) => s + c.subcategories.length, 0)} subcategories`}
        defaultOpen={true}
      >
        <TaxonomyViewer />
      </Section>

      <Section
        emoji="📊"
        title="Multi-Run Comparison"
        subtitle="Compare taxonomy outputs across different pipeline configurations"
      >
        <MultiRunComparison />
      </Section>

      <Section
        emoji="🔍"
        title="Data Quality (EDA)"
        subtitle={`${edaReport.basic.total_rows.toLocaleString()} rows · ${edaReport.basic.total_columns} columns`}
      >
        <DataQuality />
      </Section>
    </div>
  );
}
