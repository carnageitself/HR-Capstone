"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { SH } from "@/constants/primitives";

const SENIORITY_COLORS = ["#45B7D1", "#4ECDC4", "#F9CA24", "#F96400", "#FF6B6B", "#6C5CE7"];

function LineChart({ d, color = "#F96400" }: { d: DashboardData["monthly"]; color?: string }) {
  const [tip, setTip] = useState<{ x: number; y: number; d: DashboardData["monthly"][0] } | null>(null);
  if (!d || d.length === 0) return <div className="h-36 grid place-items-center text-gray-400 text-[11px]">No data</div>;
  const W = 700, H = 140, px = 24, py = 16;
  const vals = d.map(x => x.awards);
  const mx = Math.max(...vals, 1), mn = Math.min(...vals);
  const rng = mx - mn || 1;
  const pts = d.map((x, i) => ({ x: px + (i / Math.max(d.length - 1, 1)) * (W - px * 2), y: py + (1 - (x.awards - mn) / rng) * (H - py * 2), d: x }));
  if (!pts.length) return null;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1], first = pts[0];
  const area = `${line} L${last.x},${H} L${first.x},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: 140 }}>
      <defs><linearGradient id="lc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0, .5, 1].map(t => { const y = py + t * (H - py * 2); return <line key={t} x1={px} y1={y} x2={W - px} y2={y} stroke="#E9ECEF" strokeWidth="1" />; })}
      <path d={area} fill="url(#lc1)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2" style={{ opacity: tip?.d.month === p.d.month ? 1 : .35, transition: "opacity .15s" }} />
          <rect x={p.x - 16} y={0} width={32} height={H} fill="transparent" onMouseEnter={() => setTip(p)} onMouseLeave={() => setTip(null)} />
          <text x={p.x} y={H + 3} textAnchor="middle" fill="#ADB5BD" fontSize="9" fontFamily="monospace">{(p.d.label || "").slice(0, 3)}</text>
        </g>
      ))}
      {tip && <g>
        <rect x={Math.min(tip.x - 44, W - 92)} y={tip.y - 48} width={88} height={36} rx="8" fill="#0B3954" />
        <text x={Math.min(tip.x, W - 48)} y={tip.y - 28} textAnchor="middle" fill={color} fontSize="13" fontFamily="monospace" fontWeight="600">{tip.d.awards}</text>
        <text x={Math.min(tip.x, W - 48)} y={tip.y - 15} textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="8" fontFamily="monospace">{tip.d.label}</text>
      </g>}
    </svg>
  );
}

function CoverageDonut({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 42, cx = 52, cy = 52, circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100), gap = circ - dash;
  return (
    <div className="flex items-center gap-4">
      <svg width={104} height={104} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E9ECEF" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray .8s cubic-bezier(.22,.68,0,1.2)" }} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#0B3954" fontSize="18" fontWeight="800" fontFamily="monospace">{pct}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#ADB5BD" fontSize="8" fontFamily="monospace">{label}</text>
      </svg>
    </div>
  );
}

export function Overview({ data }: { data: DashboardData }) {
  const wf = data.workforce;
  const maxMo = data.monthly.length > 0 ? Math.max(...data.monthly.map(d => d.awards)) : 1;
  const minMo = data.monthly.length > 0 ? Math.min(...data.monthly.map(d => d.awards)) : 0;

  return (
    <div className="flex flex-col gap-4">
      {wf.coveragePct < 80 && (
        <div className="p-3.5 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-2.5">
          <span className="text-lg">⚠️</span>
          <p className="text-xs text-yellow-800 leading-relaxed">
            <strong>{wf.neverRecognized} employees ({100 - wf.coveragePct}% of workforce)</strong> have not received any recognition this year. Target: 90%+ coverage.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Workforce Coverage" title="Recognition Reach" eyeColorCls="text-[#00A98F]" />
          <div className="flex gap-5 items-center">
            <CoverageDonut pct={wf.coveragePct} color="#00A98F" label="covered" />
            <div className="flex-1 flex flex-col gap-2.5">
              {[{ label: "Recognized", v: wf.totalPeople - wf.neverRecognized, c: "#00A98F" }, { label: "Never recognized", v: wf.neverRecognized, c: "#E74C3C" }].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-[#0B3954] font-medium">{s.label}</span>
                    <span className="font-mono text-[11px] font-bold" style={{ color: s.c }}>{s.v}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${s.v / wf.totalPeople * 100}%`, background: s.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Peer Participation" title="Who Gives Recognition" eyeColorCls="text-[#27AE60]" />
          <div className="flex gap-5 items-center">
            <CoverageDonut pct={wf.participationPct} color="#27AE60" label="participate" />
            <div className="flex-1 flex flex-col gap-2.5">
              {[{ label: "Active nominators", v: wf.totalPeople - wf.neverGiven, c: "#27AE60" }, { label: "Never nominated anyone", v: wf.neverGiven, c: "#F39C12" }].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-[#0B3954] font-medium">{s.label}</span>
                    <span className="font-mono text-[11px] font-bold" style={{ color: s.c }}>{s.v}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${s.v / wf.totalPeople * 100}%`, background: s.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Seniority Breakdown" title="Workforce Composition" eyeColorCls="text-[#3B5BDB]" />
          <div className="flex flex-col gap-2">
            {wf.bySeniority.map((s, i) => {
              const c = SENIORITY_COLORS[i] || "#888";
              return (
                <div key={s.level} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
                  <span className="text-[11px] flex-1 text-[#0B3954] font-medium">{s.level}</span>
                  <span className="font-mono text-[10px] text-gray-500 w-6 text-right">{s.headcount}</span>
                  <span className="font-mono text-[9px] text-gray-400 w-8 text-right">{Math.round(s.headcount / wf.totalPeople * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Trend" title="Monthly Recognition Activity"
            right={<span className="font-mono text-[10px] text-gray-500">Peak {maxMo} · Low {minMo}</span>} />
          <LineChart d={data.monthly} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Recognition Reach by Level" title="Seniority Coverage" eyeColorCls="text-[#8E44AD]" />
          <div className="flex flex-col gap-2.5">
            {wf.bySeniority.map((s, i) => {
              const c = SENIORITY_COLORS[i] || "#888";
              return (
                <div key={s.level}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[11px] text-[#0B3954] font-medium">{s.level}</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: s.coveragePct >= 85 ? c : "#E74C3C" }}>{s.coveragePct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${s.coveragePct}%`, background: c }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}