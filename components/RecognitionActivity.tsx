"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { CAT_COLORS } from "@/constants/colors";
import { SH } from "@/constants/primitives";

function LineChart({ d, color = "#00A98F" }: { d: DashboardData["monthly"]; color?: string }) {
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
      <defs><linearGradient id="lc2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0, .5, 1].map(t => { const y = py + t * (H - py * 2); return <line key={t} x1={px} y1={y} x2={W - px} y2={y} stroke="#E9ECEF" strokeWidth="1" />; })}
      <path d={area} fill="url(#lc2)" />
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

export function RecognitionActivity({ data }: { data: DashboardData }) {
  const maxMo = data.monthly.length > 0 ? Math.max(...data.monthly.map(d => d.awards)) : 1;
  const minMo = data.monthly.length > 0 ? Math.min(...data.monthly.map(d => d.awards)) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Behaviours Valued" title="Recognition by Category" />
          <div className="flex flex-col gap-2.5">
            {data.categories.map(c => (
              <div key={c.id}>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[c.id] || "#888" }} />
                    <span className="text-xs font-medium text-[#0B3954]">{c.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">{c.count} · {c.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded transition-[width] duration-700" style={{ width: `${c.pct}%`, background: CAT_COLORS[c.id] || "#F96400" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <SH eye="Detail" title="Top Behaviour Subcategories" />
          <div className="flex flex-col gap-2">
            {data.subcategories.slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded grid place-items-center shrink-0" style={{ background: CAT_COLORS[s.categoryId] || "#888" }}>
                  <span className="font-mono text-[8px] text-white font-bold">{s.id}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[11px] text-[#0B3954] font-medium">{s.name}</span>
                    <span className="font-mono text-[10px] text-gray-500">{s.count}</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(s.count / (data.subcategories[0]?.count || 1)) * 100}%`, background: CAT_COLORS[s.categoryId] || "#888" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <SH eye="Activity Trend" title="Recognition Frequency Over Time"
          right={<span className="font-mono text-[10px] text-gray-500">Peak {maxMo} · Low {minMo} events/month</span>} />
        <LineChart d={data.monthly} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <SH eye="Culture Builders" title="Most Active Recognition Contributors"
          right={<span className="font-mono text-[10px] text-gray-500">people who actively nominate peers</span>} />
        <div className="grid grid-cols-5 gap-2.5">
          {data.topNominators.slice(0, 5).map((n, i) => (
            <div key={n.id} className="p-3.5 rounded-xl border"
              style={{ background: i === 0 ? "#E8F8F5" : "#F8F9FA", borderColor: i === 0 ? "#B2EBE3" : "#E9ECEF" }}>
              <div className="font-mono text-[8px] uppercase tracking-widest mb-1.5" style={{ color: i === 0 ? "#00A98F" : "#ADB5BD" }}>
                {i === 0 ? "🌟 Champion" : `#${i + 1}`}
              </div>
              <div className="text-[11px] font-bold text-[#0B3954] mb-0.5">{n.name}</div>
              <div className="text-[10px] text-gray-500 mb-2">{n.dept}</div>
              <div className="font-mono text-lg font-extrabold" style={{ color: i === 0 ? "#00A98F" : "#0B3954" }}>{n.nominations}</div>
              <div className="font-mono text-[9px] text-gray-500">recognitions given</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}