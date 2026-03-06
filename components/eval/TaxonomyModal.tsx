"use client";

import { useState } from "react";
import type { PipelineResult } from "../Evaluations";
import { Modal } from "./Modal";
import { CAT_PALETTE } from "./types";

export function TaxonomyModal({ result, onClose }: { result: PipelineResult; onClose: () => void }) {
  const tax = result.final_taxonomy;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Modal
      title={`${result.config_id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} — Taxonomy`}
      subtitle={`${tax.categories.length} categories · ${tax.categories.reduce((s, c) => s + c.subcategories.length, 0)} subcategories`}
      width={720}
      onClose={onClose}
    >
      <div className="flex flex-col gap-2.5">
        {tax.categories.map((cat, ci) => {
          const color = CAT_PALETTE[ci % CAT_PALETTE.length];
          const isOpen = expanded.has(cat.id);
          return (
            <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggle(cat.id)}
                className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
                  style={{ background: color + "18", border: `2px solid ${color}` }}
                >
                  <span className="font-mono text-[10px] font-bold" style={{ color }}>{cat.id}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[12px] font-bold text-[#0B3954]">{cat.name}</div>
                  <div className="text-[10px] text-gray-500">{cat.description}</div>
                </div>
                <span className="font-mono text-[9px] text-gray-400">{cat.subcategories.length} sub</span>
                <span
                  className="text-gray-400 text-xs transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                >
                  ▼
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex flex-col gap-2">
                  {cat.subcategories.map((sub) => (
                    <div key={sub.id} className="bg-white border border-gray-200 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 rounded grid place-items-center shrink-0" style={{ background: color }}>
                          <span className="font-mono text-[6px] text-white font-bold">{sub.id}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#0B3954]">{sub.name}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 pl-6">{sub.description}</div>
                      {sub.examples && sub.examples.length > 0 && (
                        <div className="pl-6 flex flex-wrap gap-1 mt-1.5">
                          {sub.examples.map((ex, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded-full text-[8px] font-mono"
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

        {tax.reasoning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <span className="text-base">💡</span>
            <div>
              <div className="font-mono text-[8px] tracking-widest uppercase text-amber-600 mb-1">LLM Reasoning</div>
              <div className="text-[10px] text-amber-800 leading-relaxed">{tax.reasoning}</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}