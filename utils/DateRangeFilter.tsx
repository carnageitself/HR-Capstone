"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DateRange {
  start:    string; // "YYYY-MM"
  end:      string; // "YYYY-MM"
  presetId: string; // "q1" | "q2" | "q3" | "q4" | "h1" | "h2" | "all" | ""
}

interface DateRangeCtx extends DateRange {
  setRange:  (r: DateRange) => void;
  isActive:  boolean;
  reset:     () => void;
  allMonths: string[];
}

const Ctx = createContext<DateRangeCtx>({
  start: "", end: "", presetId: "all",
  setRange: () => {}, isActive: false, reset: () => {}, allMonths: [],
});

// ── Provider ──────────────────────────────────────────────────────────────────
export function DateRangeProvider({ children, allMonths }: { children: ReactNode; allMonths: string[] }) {
  const min = allMonths[0] ?? "";
  const max = allMonths[allMonths.length - 1] ?? "";
  const DEFAULT: DateRange = { start: min, end: max, presetId: "all" };
  const [range, setRangeState] = useState<DateRange>(DEFAULT);

  const setRange = (r: DateRange) => setRangeState(r);
  const reset    = () => setRangeState(DEFAULT);
  const isActive = range.presetId !== "all";

  return (
    <Ctx.Provider value={{ ...range, setRange, isActive, reset, allMonths }}>
      {children}
    </Ctx.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useDateRange() {
  return useContext(Ctx);
}

export function useFilterByDate<T extends Record<string, unknown>>(
  items: T[],
  dateField: keyof T
): T[] {
  const { start, end } = useDateRange();
  if (!start || !end) return items;
  return items.filter(item => {
    const raw = item[dateField];
    if (!raw) return true;
    return String(raw).slice(0, 7) >= start && String(raw).slice(0, 7) <= end;
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function monthLabel(ym: string): string {
  const NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [yr, mo] = ym.split("-");
  return `${NAMES[parseInt(mo) - 1]} '${yr.slice(2)}`;
}

function buildPresets(allMonths: string[]) {
  if (!allMonths.length) return [];
  const min  = allMonths[0];
  const max  = allMonths[allMonths.length - 1];
  const year = min.slice(0, 4);

  const candidates = [
    { id: "q1", label: "Q1", start: `${year}-01`, end: `${year}-03` },
    { id: "q2", label: "Q2", start: `${year}-04`, end: `${year}-06` },
    { id: "q3", label: "Q3", start: `${year}-07`, end: `${year}-09` },
    { id: "q4", label: "Q4", start: `${year}-10`, end: `${year}-12` },
    { id: "h1", label: "H1", start: `${year}-01`, end: `${year}-06` },
    { id: "h2", label: "H2", start: `${year}-07`, end: `${year}-12` },
  ];

  // Keep original start/end for filtering — don't clip to data range
  // Only show presets that have at least one data month in range
  return [
    ...candidates.filter(q => allMonths.some(m => m >= q.start && m <= q.end)),
    { id: "all", label: "All", start: min, end: max },
  ];
}

// ── UI ────────────────────────────────────────────────────────────────────────
export function DateRangeFilter() {
  const { start, end, presetId, setRange, isActive, reset, allMonths } = useDateRange();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!allMonths.length) return null;

  const presets      = buildPresets(allMonths);
  const activePreset = presets.find(p => p.id === presetId);
  const label        = activePreset && presetId !== "all"
    ? activePreset.label
    : isActive
      ? `${monthLabel(start)} – ${monthLabel(end)}`
      : "All";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
          isActive
            ? "bg-[#0B3954] border-[#0B3954] text-white"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        {label}
        {isActive && (
          <span onClick={e => { e.stopPropagation(); reset(); }} className="ml-0.5 opacity-70 hover:opacity-100">✕</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72">
          <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-2">Quick Select</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {presets.map(p => (
              <button
                key={p.id}
                onClick={() => { setRange({ start: p.start, end: p.end, presetId: p.id }); setOpen(false); }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer transition-all ${
                  presetId === p.id
                    ? "bg-[#0B3954] text-white border-[#0B3954]"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-2">Custom Range</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <div className="text-[10px] text-gray-500 mb-1">From</div>
              <select
                value={start}
                onChange={e => setRange({ start: e.target.value, end: end >= e.target.value ? end : e.target.value, presetId: "" })}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] bg-white text-[#0B3954] cursor-pointer"
              >
                {allMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-1">To</div>
              <select
                value={end}
                onChange={e => setRange({ start, end: e.target.value, presetId: "" })}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] bg-white text-[#0B3954] cursor-pointer"
              >
                {allMonths.filter(m => m >= start).map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-1.5 rounded-lg bg-[#0B3954] text-white text-[11px] font-semibold cursor-pointer hover:bg-[#0a3248] transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => { reset(); setOpen(false); }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-[11px] cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}