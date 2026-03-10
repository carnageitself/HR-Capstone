"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { DashboardData, ActionItem } from "@/lib/loadDashboardData";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Urgency    = "critical" | "warning" | "info";
type ActionType = "invisible_contributor" | "long_tenured_unrecognized" | "inactive_manager" | "low_coverage_dept" | "stale_high_performer";
type ItemStatus = "open" | "completed" | "deferred";

interface StatusEntry {
  status: ItemStatus;
  updatedAt: string;
  deferredUntil?: string;
}

type StatusMap = Record<string, StatusEntry>;

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const URGENCY_CONFIG: Record<Urgency, {
  label: string; bar: string;
  rowHover: string; chipBg: string; chipText: string;
}> = {
  critical: { label:"Urgent",  bar:"#DC2626", rowHover:"#FFF8F8", chipBg:"#FEF2F2", chipText:"#B91C1C" },
  warning:  { label:"Monitor", bar:"#D97706", rowHover:"#FFFBF0", chipBg:"#FFFBEB", chipText:"#B45309" },
  info:     { label:"Watch",   bar:"#6B7280", rowHover:"#F9FAFB", chipBg:"#F3F4F6", chipText:"#374151" },
};

const TYPE_CONFIG: Record<ActionType, { label: string; color: string; bg: string }> = {
  invisible_contributor:     { label:"Never Recognized", color:"#F96400", bg:"#FFF4EE" },
  long_tenured_unrecognized: { label:"Long Tenure Gap",  color:"#6C5CE7", bg:"#F0EEFF" },
  inactive_manager:          { label:"Inactive Manager", color:"#00A98F", bg:"#E8F8F5" },
  low_coverage_dept:         { label:"Coverage Gap",     color:"#FDCB6E", bg:"#FFFDF0" },
  stale_high_performer:      { label:"Engagement Gap",   color:"#74B9FF", bg:"#EFF6FF" },
};

const DEPT_COLORS: Record<string, string> = {
  "Customer Service":"#FF6B6B", "Data Science":"#4ECDC4", "Design":"#45B7D1",
  "Engineering":"#96CEB4", "Finance":"#F9CA24", "HR":"#DDA15E",
  "IT":"#6C5CE7", "Legal":"#A29BFE", "Marketing":"#FD79A8",
  "Operations":"#74B9FF", "Product":"#00CEC9", "Sales":"#FDCB6E",
};

const SEN_COLORS: Record<string, string> = {
  "IC":"#ADB5BD", "Senior IC":"#74B9FF", "Manager":"#00A98F",
  "Senior Manager":"#FDCB6E", "Director":"#F96400", "VP":"#6C5CE7",
};

function parseDetail(detail: string) {
  const match = detail.match(/^(.+?)\s+in\s+([^·]+)·?(.*)$/);
  if (!match) return { seniority: null, dept: null, rest: detail };
  return { seniority: match[1].trim(), dept: match[2].trim(), rest: match[3].trim() };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function ActionQueue({ data, dismissed: _dismissed, setDismissed: _setDismissed }: {
  data?: DashboardData;
  // Legacy props — accepted but ignored, kept for backwards compat during migration
  dismissed?: Set<string>;
  setDismissed?: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const actions = (data?.actionQueue) ?? [];

  const [statuses,   setStatuses]   = useState<StatusMap>({});
  const [loading,    setLoading]    = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | "all">("all");
  const [typeFilter,    setTypeFilter]    = useState<ActionType | "all">("all");
  const [deptFilter,    setDeptFilter]    = useState<string>("all");
  const [search,        setSearch]        = useState("");
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);

  // Load persisted statuses on mount
  useEffect(() => {
    fetch("/api/action-queue")
      .then(r => r.json())
      .then((map: StatusMap) => setStatuses(map))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Persist a status change optimistically
  const updateStatus = useCallback(async (
    id: string,
    status: ItemStatus,
    opts?: { deferUntilTomorrow?: boolean }
  ) => {
    // Optimistic update
    setStatuses(prev => ({
      ...prev,
      [id]: { status, updatedAt: new Date().toISOString() },
    }));

    await fetch("/api/action-queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, deferUntilTomorrow: opts?.deferUntilTomorrow ?? (status === "deferred") }),
    }).catch(() => {});
  }, []);

  const getStatus = (id: string): ItemStatus =>
    statuses[id]?.status ?? "open";

  const allDepts = useMemo(() => Array.from(new Set(actions.map(a => a.dept))).sort(), [actions]);

  // Deduplicate by id — the Supabase loader guarantees unique ids but be safe
  const uniqueActions = useMemo(() => {
    const seen = new Set<string>();
    return actions.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
  }, [actions]);

  const openActions = uniqueActions.filter(a => getStatus(a.id) === "open");
  const deferredActions = uniqueActions.filter(a => getStatus(a.id) === "deferred");
  const completedActions = uniqueActions.filter(a => getStatus(a.id) === "completed");

  const counts = {
    critical: openActions.filter(a => a.urgency === "critical").length,
    warning:  openActions.filter(a => a.urgency === "warning").length,
    info:     openActions.filter(a => a.urgency === "info").length,
  };

  const filtered = useMemo(() => {
    const pool = showCompleted ? completedActions : [...openActions, ...deferredActions];
    return pool.filter(a => {
      if (urgencyFilter !== "all" && a.urgency !== urgencyFilter) return false;
      if (typeFilter    !== "all" && a.type    !== typeFilter)    return false;
      if (deptFilter    !== "all" && a.dept    !== deptFilter)    return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.title.toLowerCase().includes(q) &&
            !a.dept.toLowerCase().includes(q)  &&
            !(a.name?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [openActions, deferredActions, completedActions, showCompleted,
      urgencyFilter, typeFilter, deptFilter, search, statuses]);

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-14 rounded-xl animate-pulse"
            style={{ background:"#F3F4F6", animationDelay:`${i*0.07}s` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily:"var(--sans,'Plus Jakarta Sans',sans-serif)" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono text-[9px] tracking-[.18em] uppercase mb-1" style={{ color:"#9CA3AF" }}>
              HR Operations · FY 2025
            </div>
            <h2 className="text-[20px] font-bold tracking-tight m-0" style={{ color:"#0B3954" }}>
              Action Priority Queue
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {completedActions.length > 0 && (
              <button
                onClick={() => setShowCompleted(v => !v)}
                className="font-mono text-[10px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: showCompleted ? "#0B3954" : "#fff",
                  color: showCompleted ? "#fff" : "#374151",
                  border: "1px solid #E5E7EB",
                }}>
                {showCompleted ? "← Back to queue" : `✓ ${completedActions.length} completed`}
              </button>
            )}
            {deferredActions.length > 0 && !showCompleted && (
              <span className="font-mono text-[10px] px-2.5 py-1 rounded-full"
                style={{ background:"#EFF6FF", color:"#3B82F6", border:"1px solid #BFDBFE" }}>
                🕓 {deferredActions.length} deferred to tomorrow
              </span>
            )}
          </div>
        </div>

        {/* Summary cards — only show for open queue */}
        {!showCompleted && (
          <div className="grid grid-cols-3 gap-3">
            {(["critical","warning","info"] as Urgency[]).map(u => {
              const cfg = URGENCY_CONFIG[u];
              const count = counts[u];
              const isActive = urgencyFilter === u;
              const cardStyles: Record<Urgency, { accent: string; bg: string; border: string }> = {
                critical: { accent:"#F96400", bg:"#FFF4EE", border:"#FDDCC9" },
                warning:  { accent:"#6C5CE7", bg:"#F0EEFF", border:"#D4CAFF" },
                info:     { accent:"#00A98F", bg:"#E8F8F5", border:"#B2EBE3" },
              };
              const cs = cardStyles[u];
              return (
                <button key={u} onClick={() => setUrgencyFilter(isActive ? "all" : u)}
                  className="flex flex-col px-5 py-4 rounded-xl cursor-pointer text-left transition-all"
                  style={{
                    background: cs.bg,
                    border: `1px solid ${isActive ? cs.accent : cs.border}`,
                    boxShadow: isActive ? `0 0 0 2px ${cs.accent}33` : "none",
                    outline: "none",
                  }}>
                  <div className="font-mono text-[9px] uppercase tracking-[.14em] mb-2" style={{ color: cs.accent }}>
                    {cfg.label}
                  </div>
                  <div className="text-[30px] font-extrabold leading-none tracking-tight mb-1" style={{ color:"#0B3954" }}>
                    {count}
                  </div>
                  <div className="text-[11px]" style={{ color: cs.accent, opacity: 0.85 }}>
                    {u === "critical" ? "require immediate action" : u === "warning" ? "need monitoring" : "low priority items"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FILTERS ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none"
            style={{ color:"#9CA3AF" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or department…"
            className="w-full py-2 pl-8 pr-3 rounded-lg text-[12px] outline-none"
            style={{ border:"1px solid #E5E7EB", background:"#fff", color:"#111827" }} />
        </div>
        {!showCompleted && (
          <>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as ActionType | "all")}
              className="py-2 px-3 rounded-lg text-[12px] outline-none cursor-pointer"
              style={{ border:"1px solid #E5E7EB", background:"#fff", color:"#374151" }}>
              <option value="all">All types</option>
              {Object.entries(TYPE_CONFIG).map(([k,v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="py-2 px-3 rounded-lg text-[12px] outline-none cursor-pointer"
              style={{ border:"1px solid #E5E7EB", background:"#fff", color:"#374151" }}>
              <option value="all">All departments</option>
              {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </>
        )}
        <span className="font-mono text-[11px] ml-auto" style={{ color:"#9CA3AF" }}>
          {filtered.length} {showCompleted ? "completed" : "open"} items
        </span>
      </div>

      {/* ── ACTION LIST ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        {filtered.length === 0 ? (
          <div className="py-14 text-center rounded-xl" style={{ background:"#fff", border:"1px solid #E5E7EB" }}>
            <div className="text-[28px] mb-3">
              {showCompleted ? "📋" : "✅"}
            </div>
            <div className="text-[14px] font-semibold" style={{ color:"#374151" }}>
              {showCompleted ? "No completed items" : "All caught up!"}
            </div>
            <div className="text-[12px] mt-1" style={{ color:"#9CA3AF" }}>
              {showCompleted ? "Mark items as done to see them here." : "No open actions match your filters."}
            </div>
          </div>
        ) : filtered.map((a, i) => {
          const cfg      = URGENCY_CONFIG[a.urgency as Urgency];
          const type     = TYPE_CONFIG[a.type as ActionType];
          const isOpen   = expanded.has(a.id);
          const status   = getStatus(a.id);
          const isDeferred = status === "deferred";
          const isDone     = status === "completed";

          return (
            <div key={a.id}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: isDone ? "#F9FAFB" : "#fff",
                border: "1px solid #E5E7EB",
                borderLeft: `3px solid ${isDone ? "#D1D5DB" : isDeferred ? "#93C5FD" : type.color}`,
                opacity: isDone ? 0.75 : 1,
              }}>

              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
                style={{ background: isOpen ? "#F9FAFB" : "#fff" }}
                onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = cfg.rowHover; }}
                onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = isOpen ? "#F9FAFB" : "#fff"; }}
                onClick={() => toggleExpand(a.id)}>

                <span className="font-mono text-[10px] w-5 shrink-0 text-right" style={{ color:"#D1D5DB" }}>
                  {i + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold" style={{ color: isDone ? "#9CA3AF" : "#111827" }}>
                    {isDone && <span className="mr-1.5">✓</span>}
                    {a.title}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {(() => {
                      const { seniority, dept, rest } = parseDetail(a.detail);
                      const senColor  = seniority ? (SEN_COLORS[seniority]  || "#9CA3AF") : "#9CA3AF";
                      const deptColor = dept      ? (DEPT_COLORS[dept]      || "#9CA3AF") : "#9CA3AF";
                      return (
                        <>
                          {seniority && (
                            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background:`${senColor}18`, color: senColor }}>{seniority}</span>
                          )}
                          {dept && (
                            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background:`${deptColor}18`, color: deptColor }}>{dept}</span>
                          )}
                          {rest && (
                            <span className="font-mono text-[10px]" style={{ color:"#9CA3AF" }}>· {rest}</span>
                          )}
                          {isDeferred && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background:"#EFF6FF", color:"#3B82F6" }}>🕓 deferred to tomorrow</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Type badge */}
                {!isDone && (
                  <span className="font-mono text-[9px] font-bold px-2 py-1 rounded shrink-0"
                    style={{ background: type.bg, color: type.color, border:`1px solid ${type.color}33`, letterSpacing:".06em" }}>
                    {type.label}
                  </span>
                )}

                {/* Priority chip */}
                {!isDone && (
                  <span className="font-mono text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: cfg.chipBg, color: cfg.chipText }}>
                    {cfg.label}
                  </span>
                )}

                {/* Chevron */}
                <span className="text-[10px] shrink-0" style={{ color:"#9CA3AF" }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded panel */}
              {isOpen && (
                <div className="px-5 py-4" style={{ borderTop:"1px solid #F3F4F6", background:"#FAFAFA" }}>
                  <div className="flex gap-3 mb-4">
                    <span className="font-mono text-[9px] uppercase tracking-[.12em] shrink-0 pt-0.5"
                      style={{ color:"#9CA3AF" }}>Recommended</span>
                    <p className="text-[13px] font-medium leading-relaxed m-0" style={{ color:"#111827" }}>
                      {a.action}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap pt-3" style={{ borderTop:"1px solid #E5E7EB" }}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono text-[9px] uppercase tracking-[.1em]" style={{ color:"#9CA3AF" }}>
                        Assign to
                      </span>
                      <span className="text-[12px] font-semibold" style={{ color:"#0B3954" }}>{a.owner}</span>
                      <span style={{ color:"#E5E7EB" }}>·</span>
                      <span className="text-[12px]" style={{ color:"#374151" }}>{a.dept}</span>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded"
                        style={{ background:"#F3F4F6", color:"#6B7280" }}>{a.category}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!isDone && (
                        <>
                          {/* Defer to tomorrow */}
                          {!isDeferred && (
                            <button
                              onClick={() => updateStatus(a.id, "deferred", { deferUntilTomorrow: true })}
                              className="text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                              style={{ background:"#EFF6FF", color:"#3B82F6", border:"1px solid #BFDBFE" }}>
                              🕓 Defer to tomorrow
                            </button>
                          )}
                          {isDeferred && (
                            <button
                              onClick={() => updateStatus(a.id, "open")}
                              className="text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                              style={{ background:"#F3F4F6", color:"#374151", border:"1px solid #E5E7EB" }}>
                              ↩ Reopen
                            </button>
                          )}
                          {/* Mark complete */}
                          <button
                            onClick={() => updateStatus(a.id, "completed")}
                            className="text-[12px] font-semibold px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
                            style={{ background:"#0B3954", color:"#fff", border:"none" }}>
                            ✓ Mark as done
                          </button>
                        </>
                      )}
                      {isDone && (
                        <button
                          onClick={() => updateStatus(a.id, "open")}
                          className="text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                          style={{ background:"#F3F4F6", color:"#374151", border:"1px solid #E5E7EB" }}>
                          ↩ Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      {(completedActions.length > 0 || deferredActions.length > 0) && !showCompleted && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg"
          style={{ background:"#F9FAFB", border:"1px solid #E5E7EB" }}>
          <div className="flex items-center gap-4">
            {completedActions.length > 0 && (
              <span className="font-mono text-[11px]" style={{ color:"#9CA3AF" }}>
                ✓ {completedActions.length} completed today
              </span>
            )}
            {deferredActions.length > 0 && (
              <span className="font-mono text-[11px]" style={{ color:"#9CA3AF" }}>
                🕓 {deferredActions.length} deferred to tomorrow
              </span>
            )}
          </div>
          <span className="font-mono text-[10px]" style={{ color:"#9CA3AF" }}>
            Deferred items re-enter the queue overnight
          </span>
        </div>
      )}
    </div>
  );
}