"use client";

import { useState, useEffect } from "react";
import { DEPT_COLORS } from "./colors";

export function Num({ to, pre = "", suf = "", dur = 1200 }: { to: number; pre?: string; suf?: string; dur?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let s: number | null = null;
    const t = (ts: number) => { if (!s) s = ts; const p = Math.min((ts - s) / dur, 1), e = 1 - Math.pow(1 - p, 3); setV(Math.round(e * to)); if (p < 1) requestAnimationFrame(t); else setV(to); };
    requestAnimationFrame(t);
  }, [to, dur]);
  const f = pre === "$" ? v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}` : `${pre}${v.toLocaleString()}${suf}`;
  return <span>{f}</span>;
}

export function Bar({ label, value, max, right, color = "orange", h = 6 }: { label: string; value: number; max: number; right: string; color?: string; h?: number }) {
  const pct = Math.round((value / Math.max(max, 1)) * 100);
  const gradients: Record<string, string> = {
    orange: "from-[#F96400] to-[#FFAB73]",
    teal: "from-[#00A98F] to-[#4DD9C5]",
    purple: "from-[#8E44AD] to-[#BB8FCE]",
    green: "from-[#27AE60] to-[#58D68D]",
    navy: "from-[#0B3954] to-[#1A5276]",
    indigo: "from-[#3B5BDB] to-[#74C0FC]",
  };
  const grad = gradients[color] || gradients.orange;
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="font-mono text-[10px] text-gray-500">{right}</span>
      </div>
      <div className="bg-gray-200 rounded-full overflow-hidden" style={{ height: h }}>
        <div className={`h-full bg-gradient-to-r ${grad} rounded-full transition-[width] duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SH({ eye, title, right, eyeColorCls = "text-[#F96400]" }: { eye: string; title: string; right?: React.ReactNode; eyeColorCls?: string }) {
  return (
    <div className="flex justify-between items-end mb-5">
      <div>
        <div className={`font-mono text-[9px] tracking-[.18em] uppercase ${eyeColorCls} mb-1.5 font-medium`}>{eye}</div>
        <div className="text-[17px] font-bold text-[#0B3954] tracking-tight">{title}</div>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

export function Spark({ data, color = "#F96400", h = 28, w = 80 }: { data: { period: string; awards: number }[]; color?: string; h?: number; w?: number }) {
  if (!data || data.length < 2) return <span className="text-gray-300 text-[10px]">—</span>;
  const vals = data.map(d => d.awards);
  const mx = Math.max(...vals, 1), mn = Math.min(...vals);
  const rng = mx - mn || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((v - mn) / rng) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = pts.split(" ").at(-1)!.split(",");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

export function RiskBadge({ score }: { score: number }) {
  const level = score >= 75 ? { label: "HIGH", cls: "bg-red-50 text-red-600" }
    : score >= 40 ? { label: "MED", cls: "bg-yellow-50 text-yellow-600" }
      : { label: "LOW", cls: "bg-green-50 text-green-600" };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide font-mono ${level.cls}`}>
      {level.label}
    </span>
  );
}

export function IntelAvatar({ name, dept, size = 32 }: { name: string; dept: string; size?: number }) {
  const initials = name.split(" ").map((p: string) => p[0]).slice(0, 2).join("");
  const color = DEPT_COLORS[dept] || "#888";
  return (
    <div
      className="rounded-full grid place-items-center font-bold font-mono shrink-0"
      style={{ width: size, height: size, background: color + "22", border: `2px solid ${color}`, fontSize: size * 0.32, color }}
    >
      {initials}
    </div>
  );
}