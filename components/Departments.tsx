"use client";

import { useState, useCallback } from "react";
import type { DashboardData, OrgNode, OrgTreeNode } from "@/lib/loadDashboardData";
import { DEPT_COLORS } from "@/constants/colors";
import { SH } from "@/constants/primitives";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const SEN_STYLE: Record<string, { bg:string; color:string; border:string; label:string }> = {
  VP:               { bg:"#2C1654", color:"#E9D8FD", border:"#553C9A", label:"VP"         },
  Director:         { bg:"#FFF4EE", color:"#E05A00", border:"#FDDCC9", label:"Director"   },
  "Senior Manager": { bg:"#FEF9E7", color:"#B45309", border:"#FDE68A", label:"Sr Manager" },
  Manager:          { bg:"#E8F8F5", color:"#007F6C", border:"#B2EBE3", label:"Manager"    },
  "Senior IC":      { bg:"#EDF2FF", color:"#3451C7", border:"#C5D0FA", label:"Senior IC"  },
  IC:               { bg:"#F8F9FA", color:"#5C6370", border:"#DEE2E6", label:"IC"         },
  Lead:             { bg:"#FFF4EE", color:"#E05A00", border:"#FDDCC9", label:"Lead"       },
  Senior:           { bg:"#E8F8F5", color:"#007F6C", border:"#B2EBE3", label:"Senior"     },
  "Mid-Level":      { bg:"#EDF2FF", color:"#3451C7", border:"#C5D0FA", label:"Mid"        },
  Entry:            { bg:"#F8F9FA", color:"#5C6370", border:"#DEE2E6", label:"Entry"      },
};

const COV_COLOR = (p: number) => p >= 90 ? "#16A34A" : p >= 75 ? "#D97706" : "#DC2626";

// ─────────────────────────────────────────────────────────────────────────────
// DEPT SUMMARY TABLE  (replaces DeptCards KPI cards)
// ─────────────────────────────────────────────────────────────────────────────
function DeptTable({ wf }: { wf: DashboardData["workforce"] }) {
  const sorted = [...wf.byDept].sort((a, b) => b.coveragePct - a.coveragePct);

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm"
      style={{ border: "1px solid #E9ECEF" }}
    >
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ borderBottom: "1px solid #E9ECEF" }}
      >
        <SH eye="Summary" title="Department Recognition Health" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          {/* Column headers */}
          <thead>
            <tr style={{ background: "#FAFBFC", borderBottom: "2px solid #E9ECEF" }}>
              {["#", "Department", "Headcount", "Coverage", "Participation", "Avg Awards", "Recognized", "Unrecognized"].map(h => (
                <th
                  key={h}
                  style={{
                    padding: "10px 16px",
                    textAlign: h === "#" || h === "Department" ? "left" : "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: ".12em",
                    textTransform: "uppercase" as const,
                    color: "#ADB5BD",
                    fontWeight: 400,
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sorted.map((d, i) => {
              const accent      = DEPT_COLORS[d.dept] || "#888";
              const covColor    = COV_COLOR(d.coveragePct);
              const partColor   = d.participationPct >= 85 ? "#00A98F" : d.participationPct >= 70 ? "#D97706" : "#DC2626";
              const unrecog     = d.headcount - d.recognized;

              return (
                <tr
                  key={d.dept}
                  style={{
                    borderBottom: "1px solid #F0F2F4",
                    background: i % 2 === 0 ? "#fff" : "#FAFBFC",
                    transition: "background .12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FFF4EE")}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFBFC")}
                >
                  {/* Row number */}
                  <td style={{ padding: "12px 16px", width: 40 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#ADB5BD" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </td>

                  {/* Dept name */}
                  <td style={{ padding: "12px 16px" }}>
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: accent,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: 700, color: "#0B3954" }}>{d.dept}</span>
                    </div>
                  </td>

                  {/* Headcount */}
                  <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", color: "#6C757D" }}>
                    {d.headcount}
                  </td>

                  {/* Coverage */}
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: covColor }}>
                      {d.coveragePct}%
                    </span>
                  </td>

                  {/* Participation */}
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: partColor }}>
                      {d.participationPct}%
                    </span>
                  </td>

                  {/* Avg Awards */}
                  <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", color: "#6C757D" }}>
                    {d.avgAwards}×
                  </td>

                  {/* Recognized */}
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#16A34A" }}>
                      {d.recognized}
                    </span>
                  </td>

                  {/* Unrecognized */}
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: unrecog > 0 ? 700 : 400,
                        color: unrecog > 0 ? "#DC2626" : "#ADB5BD",
                      }}
                    >
                      {unrecog > 0 ? unrecog : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <div
        className="flex items-center gap-6 px-6 py-3"
        style={{ borderTop: "1px solid #E9ECEF", background: "#FAFBFC" }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 9, color: "#ADB5BD" }}>
          {sorted.length} departments · sorted by coverage
        </span>
        <div className="flex items-center gap-4 ml-auto" style={{ fontFamily: "monospace", fontSize: 9 }}>
          <span style={{ color: "#16A34A" }}>≥90% Excellent</span>
          <span style={{ color: "#D97706" }}>75–89% Fair</span>
          <span style={{ color: "#DC2626" }}>&lt;75% At Risk</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORG CHART COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ node, size = 36 }: { node:OrgNode; size?:number }) {
  const color    = DEPT_COLORS[node.dept] || "#888";
  const initials = node.name.split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-extrabold"
      style={{
        width:size, height:size, fontSize:size*0.3, color,
        background:`linear-gradient(140deg,${color}30,${color}70)`,
        border:`2px solid ${color}80`,
      }}>
      {initials}
    </div>
  );
}

function SenBadge({ seniority }: { seniority:string }) {
  const s = SEN_STYLE[seniority] || SEN_STYLE["Entry"];
  return (
    <span className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded tracking-[.04em] whitespace-nowrap"
      style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function OrgCard({ node, isSelected, onClick, showLine, dimmed }: {
  node:OrgNode; isSelected:boolean; onClick:()=>void; showLine:boolean; dimmed?:boolean;
}) {
  const deptColor  = DEPT_COLORS[node.dept] || "#888";
  const hasReports = node.directReportCount > 0;
  return (
    <div className="flex flex-col items-center relative">
      {showLine && <div className="w-0.5 h-5 shrink-0" style={{ background:"#E2E8F0" }} />}

      <div onClick={onClick}
        className="flex flex-col items-center gap-1.5 w-[150px] text-center rounded-[10px] p-2.5 cursor-pointer relative"
        style={{
          background:  isSelected ? "#FFF4EE" : "#fff",
          border:      isSelected ? "2px solid #F96400" : "1.5px solid #E2E8F0",
          boxShadow:   isSelected ? "0 0 0 3px #F9640020, 0 4px 12px rgba(11,57,84,.1)" : "0 1px 4px rgba(11,57,84,.07)",
          opacity:     dimmed ? 0.35 : 1,
          transition:  "all .2s ease",
        }}>

        <Avatar node={node} size={38} />

        <div>
          <div className="text-[11px] font-bold leading-snug" style={{ color:"#0B3954" }}>{node.name}</div>
          <div className="text-[9px] leading-snug mt-0.5" style={{ color:"#6C757D" }}>{node.title}</div>
        </div>

        <SenBadge seniority={node.seniority} />

        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background:deptColor }} />
          <span className="text-[9px]" style={{ color:"#ADB5BD" }}>{node.dept}</span>
        </div>

        {(node.received > 0 || node.given > 0) && (
          <div className="flex gap-2 w-full justify-center pt-1.5" style={{ borderTop:"1px solid #F0F2F4" }}>
            <span className="font-mono text-[9px]" style={{ color:"#F96400" }}>↓{node.received}</span>
            <span className="font-mono text-[9px]" style={{ color:"#00A98F" }}>↑{node.given}</span>
          </div>
        )}

        {hasReports && (
          <div className="absolute -top-2 -right-2 w-[18px] h-[18px] rounded-full flex items-center justify-center font-mono text-[8px] font-bold"
            style={{ background:"#0B3954", color:"#fff", border:"2px solid #fff" }}>
            {node.directReportCount}
          </div>
        )}
      </div>

      {hasReports && <div className="w-0.5 h-5 shrink-0" style={{ background:"#E2E8F0" }} />}
    </div>
  );
}

function ChildRow({ items, expanded, selected, onSelect, onToggle, maxRec, deptFilter }: {
  items:OrgTreeNode[]; expanded:Set<string>; selected:string|null;
  onSelect:(id:string)=>void; onToggle:(id:string)=>void; maxRec:number; deptFilter?:string;
}) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col items-center">
      {items.length > 1 && (
        <div className="h-0.5" style={{ background:"#E2E8F0", width:`${(items.length-1)*178}px` }} />
      )}
      <div className="flex gap-4 items-start">
        {items.map(child => (
          <OrgSubTree key={child.node.id} treeNode={child} expanded={expanded} selected={selected}
            onSelect={onSelect} onToggle={onToggle} maxRec={maxRec}
            showTopLine={items.length > 1} deptFilter={deptFilter} />
        ))}
      </div>
    </div>
  );
}

function OrgSubTree({ treeNode, expanded, selected, onSelect, onToggle, maxRec, showTopLine, deptFilter }: {
  treeNode:OrgTreeNode; expanded:Set<string>; selected:string|null; onSelect:(id:string)=>void;
  onToggle:(id:string)=>void; maxRec:number; showTopLine?:boolean; deptFilter?:string;
}) {
  const n           = treeNode.node;
  const isExpanded  = expanded.has(n.id);
  const isSelected  = selected === n.id;
  const hasChildren = treeNode.children.length > 0;
  const isDimmed    = (() => {
    if (!deptFilter || deptFilter === "All") return false;
    const hasDept = (tn:OrgTreeNode): boolean => tn.node.dept === deptFilter || tn.children.some(hasDept);
    return !hasDept(treeNode);
  })();

  return (
    <div className="flex flex-col items-center">
      <OrgCard node={n} isSelected={isSelected}
        onClick={() => { onSelect(n.id); if (hasChildren) onToggle(n.id); }}
        showLine={showTopLine ?? false} dimmed={isDimmed} />

      {hasChildren && (
        <button onClick={e => { e.stopPropagation(); onToggle(n.id); }}
          className="flex items-center justify-center w-5 h-5 rounded-full cursor-pointer font-bold text-[10px] shrink-0 -mt-0.5 z-10"
          style={{
            border:"1.5px solid #E2E8F0",
            background:  isExpanded ? "#F96400" : "#fff",
            color:       isExpanded ? "#fff"    : "#ADB5BD",
            transition:  "all .15s",
          }}>
          {isExpanded ? "−" : "+"}
        </button>
      )}

      {isExpanded && hasChildren && (
        <ChildRow items={treeNode.children}
          expanded={expanded} selected={selected} onSelect={onSelect} onToggle={onToggle}
          maxRec={maxRec} deptFilter={deptFilter} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────
function DetailPanel({ node, allNodes, onClose }: {
  node:OrgNode; allNodes:OrgNode[]; onClose:()=>void;
}) {
  const deptColor = DEPT_COLORS[node.dept] || "#888";
  const manager   = node.managerId && node.managerId !== "__root__"
    ? allNodes.find(n => n.id === node.managerId) ?? null : null;
  const total  = node.received + node.given;
  const recPct = total > 0 ? Math.round((node.received / total) * 100) : 50;

  const stats = [
    { label:"Awards Received", value:node.received,           color:"#F96400" },
    { label:"Awards Given",    value:node.given,              color:"#00A98F" },
    { label:"Direct Reports",  value:node.directReportCount,  color:"#3451C7" },
    { label:"Total Reports",   value:node.totalReportCount,   color:"#8E44AD" },
  ];

  return (
    <div className="bg-white rounded-xl overflow-hidden shrink-0 w-[260px]"
      style={{ border:"1px solid #E9ECEF", boxShadow:"0 4px 24px rgba(11,57,84,.10)" }}>

      <div className="relative px-[18px] py-5"
        style={{ background:`linear-gradient(135deg,${deptColor}20,${deptColor}08)`, borderBottom:`1px solid ${deptColor}30` }}>
        <button onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[13px] cursor-pointer bg-white"
          style={{ border:"1px solid #E9ECEF", color:"#6C757D" }}>×</button>
        <div className="flex flex-col items-center text-center gap-2">
          <Avatar node={node} size={52} />
          <div>
            <div className="text-[14px] font-extrabold" style={{ color:"#0B3954" }}>{node.name}</div>
            <div className="text-[11px] mt-0.5" style={{ color:"#6C757D" }}>{node.title}</div>
          </div>
          <SenBadge seniority={node.seniority} />
        </div>
      </div>

      <div className="flex flex-col gap-3.5 px-[18px] py-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background:"#F8F9FA" }}>
          <div className="w-2 h-2 rounded-full" style={{ background:deptColor }} />
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[.08em]" style={{ color:"#ADB5BD" }}>Department</div>
            <div className="text-[12px] font-semibold" style={{ color:"#0B3954" }}>{node.dept}</div>
          </div>
          <div className="ml-auto font-mono text-[9px]" style={{ color:"#ADB5BD" }}>L{node.depth}</div>
        </div>

        {manager && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background:"#F8F9FA" }}>
            <Avatar node={manager} size={26} />
            <div className="min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-[.08em]" style={{ color:"#ADB5BD" }}>Reports to</div>
              <div className="text-[11px] font-semibold truncate" style={{ color:"#0B3954" }}>{manager.name}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {stats.map(s => (
            <div key={s.label} className="rounded-lg px-2 py-2.5 text-center" style={{ background:"#F8F9FA" }}>
              <div className="font-mono text-[20px] font-extrabold" style={{ color:s.color }}>{s.value}</div>
              <div className="text-[8px] uppercase tracking-[.06em] mt-0.5 leading-snug" style={{ color:"#ADB5BD" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {total > 0 && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-mono text-[9px]" style={{ color:"#F96400" }}>↓ Received {recPct}%</span>
              <span className="font-mono text-[9px]" style={{ color:"#00A98F" }}>↑ Given {100-recPct}%</span>
            </div>
            <div className="h-1.5 rounded overflow-hidden" style={{ background:"#00A98F" }}>
              <div className="h-full" style={{ width:`${recPct}%`, background:"#F96400", transition:"width .5s ease" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORG HIERARCHY
// ─────────────────────────────────────────────────────────────────────────────
const isDimmedVp = (vp:OrgTreeNode, deptFilter:string) => {
  if (!deptFilter || deptFilter === "All") return false;
  const hasDept = (tn:OrgTreeNode): boolean => tn.node.dept === deptFilter || tn.children.some(hasDept);
  return !hasDept(vp);
};

function OrgHierarchy({ orgHierarchy }: { orgHierarchy:DashboardData["orgHierarchy"] }) {
  const { tree, nodes, stats } = orgHierarchy;
  const vpIds          = (tree.children ?? []).map(c => c.node.id);
  const initialExpanded = new Set(vpIds);

  const [expanded,   setExpanded]   = useState<Set<string>>(initialExpanded);
  const [selected,   setSelected]   = useState<string|null>(null);
  const [search,     setSearch]     = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [view,       setView]       = useState<"org"|"list">("org");

  const toggle = useCallback((id:string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }), []);

  const selectedNode = selected ? nodes.find(n => n.id === selected) ?? null : null;
  const allDepts     = Array.from(new Set(nodes.filter(n => n.id !== "__root__").map(n => n.dept))).sort();
  const maxRec       = Math.max(...nodes.map(n => Math.max(n.received, n.given)), 1);

  const listNodes = nodes.filter(n => {
    if (n.id === "__root__") return false;
    const ms = search.toLowerCase();
    return (ms === "" || n.name.toLowerCase().includes(ms) || n.title.toLowerCase().includes(ms))
      && (deptFilter === "All" || n.dept === deptFilter);
  });

  const statItems = [
    { label:"Total Employees",    value:stats.totalNodes },
    { label:"Managers",           value:stats.managerCount },
    { label:"Individual Contr.",  value:stats.icCount },
    { label:"Avg Span",           value:`${stats.avgSpan}×` },
    { label:"Org Depth",          value:`${stats.maxDepth} lvls` },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <SH eye="Organisation" title="Employee Hierarchy" eyeColorCls="var(--teal)" />
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {(["org","list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-3.5 py-1 rounded-md border-none cursor-pointer text-[11px] font-semibold transition-all"
              style={{
                background: view===v ? "#fff" : "transparent",
                color:      view===v ? "#0B3954" : "#ADB5BD",
                boxShadow:  view===v ? "0 1px 4px rgba(11,57,84,.08)" : "none",
              }}>
              {v === "org" ? "Org Chart" : "Directory"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats band */}
      <div className="flex overflow-hidden rounded-[10px] mb-4" style={{ background:"#F8F9FA", border:"1px solid #E9ECEF" }}>
        {statItems.map((s, i) => (
          <div key={s.label} className="flex-1 py-3 px-4 text-center"
            style={{ borderRight:i < statItems.length-1 ? "1px solid #E9ECEF" : "none" }}>
            <div className="font-mono text-[18px] font-extrabold" style={{ color:"#0B3954" }}>{s.value}</div>
            <div className="text-[9px] uppercase tracking-[.07em] mt-0.5" style={{ color:"#ADB5BD" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 mb-3.5 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color:"#ADB5BD" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or title…"
            className="w-full py-2 pl-8 pr-3 rounded-lg text-[12px] outline-none"
            style={{ border:"1px solid #E2E8F0", color:"#0B3954", background:"#fff" }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...allDepts].map(d => {
            const active = deptFilter === d;
            const col    = DEPT_COLORS[d] || "#0B3954";
            return (
              <button key={d} onClick={() => setDeptFilter(d)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] cursor-pointer transition-all"
                style={{
                  border:      `1.5px solid ${active ? col : "#E2E8F0"}`,
                  background:  active ? `${col}18` : "#fff",
                  color:       active ? col : "#6C757D",
                  fontWeight:  active ? 700 : 400,
                }}>
                {d !== "All" && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background:col }} />}
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-4 items-start">

        {/* ── ORG CHART ── */}
        {view === "org" && (
          <div className="flex-1 overflow-auto rounded-xl p-6"
            style={{
              maxHeight:640, border:"1px solid #E9ECEF",
              background:"repeating-linear-gradient(0deg,transparent,transparent 27px,#F8F9FA 28px),repeating-linear-gradient(90deg,transparent,transparent 27px,#F8F9FA 28px)",
              backgroundColor:"#FDFEFF",
            }}>
            <div className="overflow-x-auto pb-6">
              <div className="flex gap-8 justify-start min-w-max px-4">
                {(tree.children ?? [])
                  .filter(vp => deptFilter === "All" || vp.node.dept === deptFilter || !isDimmedVp(vp, deptFilter))
                  .map(vpTree => (
                    <OrgSubTree key={vpTree.node.id} treeNode={vpTree} expanded={expanded}
                      selected={selected} onSelect={setSelected} onToggle={toggle}
                      maxRec={maxRec} showTopLine={false} deptFilter={deptFilter} />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DIRECTORY ── */}
        {view === "list" && (
          <div className="flex-1 overflow-hidden rounded-xl bg-white" style={{ border:"1px solid #E9ECEF" }}>
            <div className="grid px-4 py-2.5 font-mono text-[9px] uppercase tracking-[.12em]"
              style={{ gridTemplateColumns:"2fr 1.4fr 1fr 90px 90px 90px", background:"#F8F9FA", borderBottom:"2px solid #E9ECEF", color:"#ADB5BD" }}>
              <div>Employee</div><div>Department</div><div>Level</div>
              <div className="text-right">Reports</div>
              <div className="text-right">Received</div>
              <div className="text-right">Given</div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight:580 }}>
              {listNodes.length === 0 ? (
                <div className="py-10 text-center text-[13px]" style={{ color:"#ADB5BD" }}>No results</div>
              ) : listNodes.map((n, idx) => {
                const isSel = selected === n.id;
                const col   = DEPT_COLORS[n.dept] || "#888";
                return (
                  <div key={n.id} onClick={() => setSelected(isSel ? null : n.id)}
                    className="grid items-center px-4 py-2.5 cursor-pointer transition-colors"
                    style={{
                      gridTemplateColumns:"2fr 1.4fr 1fr 90px 90px 90px",
                      background:  isSel ? "#FFF4EE" : idx % 2 === 0 ? "#fff" : "#FAFBFC",
                      borderLeft:  isSel ? "3px solid #F96400" : "3px solid transparent",
                      borderBottom:"1px solid #F0F2F4",
                    }}>
                    <div className="flex items-center gap-2.5">
                      <Avatar node={n} size={32} />
                      <div>
                        <div className="text-[12px] font-semibold" style={{ color:"#0B3954" }}>{n.name}</div>
                        <div className="text-[10px]" style={{ color:"#6C757D" }}>{n.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background:col }} />
                      <span className="text-[11px]" style={{ color:"#6C757D" }}>{n.dept}</span>
                    </div>
                    <div><SenBadge seniority={n.seniority} /></div>
                    <div className="text-right font-mono text-[12px]"
                      style={{ color:n.directReportCount > 0 ? "#3451C7" : "#ADB5BD" }}>
                      {n.directReportCount > 0 ? n.directReportCount : "—"}
                    </div>
                    <div className="text-right font-mono text-[12px]"
                      style={{ color:n.received > 0 ? "#F96400" : "#ADB5BD", fontWeight:n.received > 0 ? 700 : 400 }}>
                      {n.received > 0 ? n.received : "—"}
                    </div>
                    <div className="text-right font-mono text-[12px]"
                      style={{ color:n.given > 0 ? "#00A98F" : "#ADB5BD", fontWeight:n.given > 0 ? 700 : 400 }}>
                      {n.given > 0 ? n.given : "—"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center px-4 py-2.5"
              style={{ background:"#F8F9FA", borderTop:"1px solid #E9ECEF" }}>
              <span className="font-mono text-[10px]" style={{ color:"#ADB5BD" }}>{listNodes.length} employees shown</span>
              <div className="flex gap-4 font-mono text-[9px]">
                <span style={{ color:"#F96400" }}>↓ received</span>
                <span style={{ color:"#00A98F" }}>↑ given</span>
              </div>
            </div>
          </div>
        )}

        {selectedNode && selectedNode.id !== "__root__" && (
          <DetailPanel node={selectedNode} allNodes={nodes} onClose={() => setSelected(null)} />
        )}
      </div>

      {/* Seniority legend */}
      <div className="flex gap-4 mt-3 items-center flex-wrap">
        <span className="font-mono text-[9px] uppercase tracking-[.1em]" style={{ color:"#ADB5BD" }}>Seniority</span>
        {(["VP","Director","Senior Manager","Manager","Senior IC","IC"] as const).map(k => {
          const v = SEN_STYLE[k];
          return (
            <span key={k} className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded tracking-[.04em]"
              style={{ background:v.bg, color:v.color, border:`1px solid ${v.border}` }}>
              {v.label}
            </span>
          );
        })}
        <div className="ml-auto font-mono text-[9px]" style={{ color:"#ADB5BD" }}>+/− expand · click to inspect</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function Departments({ data }: { data:DashboardData }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Summary table — replaces KPI cards, sits above the hierarchy */}
      <DeptTable wf={data.workforce} />

      {/* Org Hierarchy */}
      <div className="bg-white rounded-xl p-[22px] shadow-sm" style={{ border:"1px solid #E9ECEF" }}>
        <OrgHierarchy orgHierarchy={data.orgHierarchy} />
      </div>
    </div>
  );
}