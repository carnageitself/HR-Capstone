"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { CAT_COLORS, CAT_LABELS, DEPT_COLORS } from "@/constants/colors";

export const STATUS_CONFIG = {
  thriving:         { label: "Thriving",         bg: "#EAFAF1", c: "#27AE60", dot: "#27AE60", cls: "bg-green-50 text-green-700" },
  active:           { label: "Active",           bg: "#E8F8F5", c: "#00A98F", dot: "#00A98F", cls: "bg-teal-50 text-teal-700" },
  passive:          { label: "Passive",          bg: "#FEF9E7", c: "#B7770D", dot: "#F39C12", cls: "bg-yellow-50 text-yellow-700" },
  at_risk:          { label: "At Risk",          bg: "#FFF4EE", c: "#F96400", dot: "#F96400", cls: "bg-orange-50 text-orange-700" },
  never_recognized: { label: "Never Recognized", bg: "#FDEDEC", c: "#E74C3C", dot: "#E74C3C", cls: "bg-red-50 text-red-700" },
};

export type SortKey = "name" | "received" | "given" | "engagementScore" | "daysSinceLast";

export function SortTh({ col, label, sortBy, sortDir, onSort }: { col: SortKey; label: string; sortBy: SortKey; sortDir: 1 | -1; onSort: (col: SortKey) => void }) {
  return (
    <th
      className={`px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase font-normal cursor-pointer select-none ${sortBy === col ? "text-[#0B3954] bg-blue-50" : "text-gray-500 bg-gray-50"}`}
      onClick={() => onSort(col)}>
      {label}{sortBy === col ? (sortDir === -1 ? " ↓" : " ↑") : ""}
    </th>
  );
}

export function DirCatBar({ breakdown }: { breakdown: { id: string; count: number }[] }) {
  return (
    <div className="flex h-1.5 rounded overflow-hidden gap-px min-w-[60px]">
      {breakdown.map(c => (
        <div key={c.id} title={`${CAT_LABELS[c.id]}: ${c.count}`} style={{ flex: c.count, background: CAT_COLORS[c.id] || "#ccc" }} />
      ))}
    </div>
  );
}

export function DirPaginationBar({ safePage, totalPages, start, end, total, setPage }: {
  safePage: number; totalPages: number; start: number; end: number; total: number;
  setPage: (fn: (p: number) => number | number) => void;
}) {
  return (
    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-3 flex-wrap">
      <span className="font-mono text-[10px] text-gray-500">{total === 0 ? "No results" : `${start}–${end} of ${total} employees`}</span>
      <div className="flex items-center gap-1">
        {[{ label: "«", fn: () => 1, dis: safePage === 1 }, { label: "‹", fn: () => Math.max(1, safePage - 1), dis: safePage === 1 }].map(b => (
          <button key={b.label} onClick={() => setPage(() => b.fn())} disabled={b.dis}
            className={`px-2 py-1 rounded-md border border-gray-200 bg-white font-mono text-[11px] ${b.dis ? "text-gray-300 cursor-not-allowed" : "text-[#0B3954] cursor-pointer hover:bg-gray-50"}`}>{b.label}</button>
        ))}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 2)
          .reduce<(number | "…")[]>((acc, n, i, arr) => {
            if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(n); return acc;
          }, [])
          .map((n, i) =>
            n === "…"
              ? <span key={`e${i}`} className="px-1.5 font-mono text-[11px] text-gray-400">…</span>
              : <button key={n} onClick={() => setPage(() => n as number)}
                className={`px-2 py-1 min-w-[28px] rounded-md border font-mono text-[11px] cursor-pointer ${safePage === n ? "border-teal-500 bg-[#00A98F] text-white font-bold" : "border-gray-200 bg-white text-[#0B3954] hover:bg-gray-50"}`}>
                {n}
              </button>
          )}
        {[{ label: "›", fn: () => Math.min(totalPages, safePage + 1), dis: safePage === totalPages }, { label: "»", fn: () => totalPages, dis: safePage === totalPages }].map(b => (
          <button key={b.label} onClick={() => setPage(() => b.fn())} disabled={b.dis}
            className={`px-2 py-1 rounded-md border border-gray-200 bg-white font-mono text-[11px] ${b.dis ? "text-gray-300 cursor-not-allowed" : "text-[#0B3954] cursor-pointer hover:bg-gray-50"}`}>{b.label}</button>
        ))}
      </div>
      <span className="font-mono text-[10px] text-gray-500">Page {safePage} of {totalPages}</span>
    </div>
  );
}

export function EmployeeProfilePanel({ p, onClose }: { p: DashboardData["employeeDirectory"][0]; onClose: () => void }) {
  const sc = STATUS_CONFIG[p.status];
  const color = DEPT_COLORS[p.dept] || "#888";
  return (
    <div className="flex flex-col gap-3 sticky top-20">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full grid place-items-center font-extrabold shrink-0 font-mono"
            style={{ width: 52, height: 52, background: color + "22", border: `3px solid ${color}`, fontSize: 16, color }}>
            {p.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-base text-[#0B3954] tracking-tight">{p.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{p.title}</div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: color + "18", color }}>{p.dept}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">{p.seniority}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${sc.cls}`}>{sc.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full border border-gray-200 grid place-items-center cursor-pointer text-gray-500 text-sm bg-gray-50 shrink-0">✕</button>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3.5">
          {[
            { l: "Received", v: p.received, c: p.received >= 5 ? "text-green-600" : p.received === 0 ? "text-red-500" : "text-[#0B3954]" },
            { l: "Given", v: p.given, c: p.given >= 4 ? "text-teal-600" : p.given === 0 ? "text-yellow-600" : "text-[#0B3954]" },
            { l: "Total Value", v: `$${p.valueReceived.toLocaleString()}`, c: "text-[#F96400]" },
            { l: "Engagement", v: p.engagementScore + "%", c: p.engagementScore >= 70 ? "text-green-600" : p.engagementScore >= 40 ? "text-teal-600" : "text-yellow-600" },
          ].map(s => (
            <div key={s.l} className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="font-mono text-[7px] text-gray-500 uppercase tracking-widest mb-1">{s.l}</div>
              <div className={`font-extrabold text-[15px] ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 rounded-lg border"
          style={{ background: p.daysSinceLast > 120 ? "#FDEDEC" : p.daysSinceLast > 60 ? "#FEF9E7" : "#EAFAF1", borderColor: p.daysSinceLast > 120 ? "#F5B7B1" : p.daysSinceLast > 60 ? "#FAD7A0" : "#A9DFBF" }}>
          <div className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Last Recognition</div>
          <div className="text-xs font-semibold text-[#0B3954]">
            {p.lastAwardDate ? `${p.lastAwardDate} · ${p.daysSinceLast} days ago` : "Never received recognition"}
          </div>
        </div>
      </div>

      {p.skills.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-2">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {p.skills.map(s => (
              <span key={s} className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium border border-indigo-200">{s}</span>
            ))}
          </div>
        </div>
      )}

      {p.categoryBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-2.5">Recognition by Category</div>
          <div className="flex flex-col gap-2">
            {p.categoryBreakdown.map(c => (
              <div key={c.id}>
                <div className="flex justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[c.id] || "#888" }} />
                    <span className="text-[11px] text-[#0B3954] font-medium">{CAT_LABELS[c.id]} ({c.id})</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold" style={{ color: CAT_COLORS[c.id] || "#888" }}>{c.count}</span>
                </div>
                <div className="h-1 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${(c.count / Math.max(p.received, 1)) * 100}%`, background: CAT_COLORS[c.id] || "#888" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
        <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-2.5">
          Recent Recognitions {p.recentAwards.length > 0 ? `· ${p.recentAwards.length} shown` : ""}
        </div>
        {p.recentAwards.length === 0
          ? <div className="py-3.5 text-center text-gray-500 text-xs bg-gray-50 rounded-lg">No recognitions received yet</div>
          : (
            <div className="flex flex-col gap-2.5">
              {p.recentAwards.map((a, i) => (
                <div key={i} className="p-3 rounded-lg border"
                  style={{ background: i === 0 ? "#E8F8F5" : "#F8F9FA", borderColor: i === 0 ? "#B2EBE3" : "#E9ECEF" }}>
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-[#0B3954] truncate">{a.title}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">From <strong>{a.fromName}</strong> · {a.fromDept}</div>
                    </div>
                    <div className="shrink-0 ml-2.5 text-right">
                      <div className="font-mono text-[13px] font-extrabold text-[#F96400]">${a.value}</div>
                      <div className="font-mono text-[9px] text-gray-500">{a.date}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mb-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: (CAT_COLORS[a.categoryId] || "#888") + "18", color: CAT_COLORS[a.categoryId] || "#888" }}>
                      {a.category}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500">{a.subcategory}</span>
                  </div>
                  {a.message && (
                    <p className="text-[11px] text-[#0B3954] leading-relaxed italic opacity-85 line-clamp-3">&quot;{a.message}&quot;</p>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>

      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex gap-2.5">
        <span className="text-base">💡</span>
        <div>
          <div className="font-mono text-[8px] text-indigo-600 uppercase tracking-widest mb-1">HR INSIGHT</div>
          <p className="text-[11px] text-[#0B3954] leading-relaxed">
            {p.status === "never_recognized"
              ? `${p.name.split(" ")[0]} has never received recognition. Reach out to their manager to initiate a recognition this week.`
              : p.status === "at_risk"
                ? `Last recognized ${p.daysSinceLast} days ago — above the 120-day threshold. Prompt their manager to recognise recent contributions.`
                : p.status === "passive"
                  ? `${p.name.split(" ")[0]} receives recognition but never gives it. Invite them to a peer recognition training.`
                  : p.status === "thriving"
                    ? `${p.name.split(" ")[0]} is a strong performer with ${p.received} recognitions. Consider for mentoring roles or promotion pipeline.`
                    : `${p.name.split(" ")[0]} is actively engaged — ${p.received} received and ${p.given} given.`}
          </p>
        </div>
      </div>
    </div>
  );
}

export function EmployeeDirectory({ data }: { data: DashboardData }) {
  const PAGE_SIZE = 25;
  const dir = data.employeeDirectory;
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deptF, setDeptF] = useState("All");
  const [senF, setSenF] = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("received");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(1);

  const depts = ["All", ...Array.from(new Set(dir.map(p => p.dept))).sort()];
  const seniors = ["All", "IC", "Senior IC", "Manager", "Senior Manager", "Director", "VP"];

  const filtered = dir
    .filter(p => deptF === "All" || p.dept === deptF)
    .filter(p => senF === "All" || p.seniority === senF)
    .filter(p => statusF === "All" || p.status === statusF)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.title.toLowerCase().includes(search.toLowerCase()) || p.skills.some(s => s.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      const av = a[sortBy] as number | string, bv = b[sortBy] as number | string;
      if (typeof av === "string") return (av as string).localeCompare(bv as string) * sortDir;
      return ((av as number) - (bv as number)) * sortDir;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filtered.length);
  const resetPage = () => setPage(1);
  const selPerson = selected ? dir.find(p => p.id === selected) : null;
  const toggleSort = (col: SortKey) => { if (sortBy === col) setSortDir(d => d === 1 ? -1 : 1); else { setSortBy(col); setSortDir(-1); } resetPage(); };

  return (
    <div className="flex flex-col gap-4">
      {/* Status summary */}
      <div className="grid grid-cols-5 gap-2.5">
        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG["thriving"]][]).map(([k, cfg]) => {
          const count = dir.filter(p => p.status === k).length;
          return (
            <button key={k} onClick={() => { setStatusF(statusF === k ? "All" : k); resetPage(); }}
              className="p-2.5 rounded-xl border-2 cursor-pointer text-left transition-all"
              style={{ borderColor: statusF === k ? cfg.c : "#E9ECEF", background: statusF === k ? cfg.bg : "white" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                <span className="text-[10px] font-semibold" style={{ color: cfg.c }}>{cfg.label}</span>
              </div>
              <div className="font-mono text-xl font-extrabold text-[#0B3954]">{count}</div>
              <div className="font-mono text-[9px] text-gray-500">{Math.round(count / dir.length * 100)}% of workforce</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); resetPage(); }}
          placeholder="Search name, title, or skill…"
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-[#0B3954] outline-none focus:border-teal-400" />
        <select value={deptF} onChange={e => { setDeptF(e.target.value); resetPage(); }}
          className="px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] bg-white cursor-pointer text-[#0B3954]">
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={senF} onChange={e => { setSenF(e.target.value); resetPage(); }}
          className="px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] bg-white cursor-pointer text-[#0B3954]">
          {seniors.map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || deptF !== "All" || senF !== "All" || statusF !== "All") && (
          <button onClick={() => { setSearch(""); setDeptF("All"); setSenF("All"); setStatusF("All"); resetPage(); }}
            className="px-3.5 py-2 rounded-lg border border-gray-200 text-[11px] cursor-pointer text-gray-500 bg-white hover:bg-gray-50">
            Clear filters
          </button>
        )}
        <span className="font-mono text-[10px] text-gray-500 ml-auto">{filtered.length} of {dir.length} employees</span>
      </div>

      {/* Table + panel */}
      <div className={`grid gap-4 items-start ${selPerson ? "grid-cols-[1fr_420px]" : "grid-cols-1"}`}>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={`px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase font-normal cursor-pointer select-none ${sortBy === "name" ? "text-[#0B3954] bg-blue-50" : "text-gray-500 bg-gray-50"}`}
                  onClick={() => toggleSort("name")}>Name{sortBy === "name" ? (sortDir === -1 ? " ↓" : " ↑") : ""}</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Department</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Title & Seniority</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Skills</th>
                <SortTh col="received" label="Received" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortTh col="given" label="Given" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortTh col="engagementScore" label="Engagement" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortTh col="daysSinceLast" label="Last Rec." sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Categories</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(p => {
                const sc = STATUS_CONFIG[p.status];
                const isSel = selected === p.id;
                const depColor = DEPT_COLORS[p.dept] || "#888";
                return (
                  <tr key={p.id} onClick={() => setSelected(isSel ? null : p.id)}
                    className="border-b border-gray-100 cursor-pointer hover:bg-orange-50 transition-colors"
                    style={{ background: isSel ? "#E8F8F5" : undefined, borderLeft: isSel ? "3px solid #00A98F" : "3px solid transparent" }}>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full grid place-items-center font-bold font-mono shrink-0 text-[10px]"
                          style={{ width: 30, height: 30, background: depColor + "22", border: `2px solid ${depColor}`, color: depColor }}>
                          {p.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <span className="font-semibold text-[#0B3954] text-xs">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-xl font-semibold"
                        style={{ background: depColor + "18", color: depColor }}>{p.dept}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="text-[11px] text-[#0B3954] font-medium">{p.title}</div>
                      <div className="text-[9px] text-gray-500 font-mono mt-0.5">{p.seniority}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex gap-1 flex-wrap max-w-[140px]">
                        {p.skills.slice(0, 2).map(s => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 whitespace-nowrap">{s}</span>
                        ))}
                        {p.skills.length > 2 && <span className="text-[9px] text-gray-400">+{p.skills.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-base font-extrabold"
                        style={{ color: p.received >= 5 ? "#27AE60" : p.received === 0 ? "#E74C3C" : "#0B3954" }}>{p.received}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-base font-extrabold"
                        style={{ color: p.given >= 4 ? "#00A98F" : p.given === 0 ? "#F39C12" : "#0B3954" }}>{p.given}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="relative w-9 h-9">
                        <svg width={36} height={36} viewBox="0 0 36 36">
                          <circle cx={18} cy={18} r={14} fill="none" stroke="#E9ECEF" strokeWidth={4} />
                          <circle cx={18} cy={18} r={14} fill="none"
                            stroke={p.engagementScore >= 70 ? "#27AE60" : p.engagementScore >= 40 ? "#00A98F" : "#F39C12"}
                            strokeWidth={4}
                            strokeDasharray={`${p.engagementScore / 100 * 88} 88`}
                            strokeLinecap="round"
                            transform="rotate(-90 18 18)" />
                        </svg>
                        <div className="absolute inset-0 grid place-items-center font-mono text-[8px] font-bold text-[#0B3954]">{p.engagementScore}</div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-[11px]"
                        style={{ color: p.daysSinceLast > 120 ? "#E74C3C" : p.daysSinceLast > 60 ? "#F39C12" : "#00A98F" }}>
                        {p.received === 0 ? "—" : p.daysSinceLast === 999 ? "—" : `${p.daysSinceLast}d ago`}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      {p.categoryBreakdown.length > 0 ? <DirCatBar breakdown={p.categoryBreakdown} /> : <span className="text-gray-400 text-[10px]">—</span>}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${sc.cls}`}>{sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <DirPaginationBar safePage={safePage} totalPages={totalPages} start={start} end={end} total={filtered.length} setPage={setPage} />
        </div>
        {selPerson && <EmployeeProfilePanel p={selPerson} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}