"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { DEPT_COLORS } from "@/constants/colors";
import { SH } from "@/constants/primitives";

type NetNodeBase = DashboardData["network"]["nodes"][0];
type SimNode = NetNodeBase & {
  x: number; y: number; vx: number; vy: number; radius: number;
  color?: string; title?: string; seniority?: string; totalValue?: number;
};
type SimEdge = DashboardData["network"]["edges"][0];

export function NetworkGraph({ data }: { data: DashboardData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<SimEdge[]>([]);
  const [hovered, setHovered] = useState<SimNode | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [dragging, setDragging] = useState<SimNode | null>(null);
  const activeDepts = [...new Set(data.network?.nodes.map(n => n.dept) || [])].sort();

  useEffect(() => {
    if (!data.network) return;
    const W = canvasRef.current?.offsetWidth || 700, H = 400;
    const nodes: SimNode[] = data.network.nodes.map((n, i: number) => {
      const angle = (i / data.network.nodes.length) * Math.PI * 2, r = 150;
      return { ...n, x: W / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 80, y: H / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 80, vx: 0, vy: 0, radius: Math.max(5, Math.min(14, 4 + (n.received || 0) / 2)) };
    });
    nodesRef.current = nodes;
    edgesRef.current = data.network.edges;
  }, [data.network]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const tick = () => {
      const nodes = nodesRef.current, edges = edgesRef.current;
      for (const n of nodes) { n.vx *= 0.85; n.vy *= 0.85; }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 80) { const f = (80 - dist) / dist * 0.4; a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f; }
        }
        nodes[i].vx += (W / 2 - nodes[i].x) * 0.003;
        nodes[i].vy += (H / 2 - nodes[i].y) * 0.003;
      }
      for (const e of edges) {
        const a = nodes.find(n => n.id === e.source), b = nodes.find(n => n.id === e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = 90 + e.weight * 10, f = (dist - target) / dist * 0.04;
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
      }
      for (const n of nodes) {
        if (dragging && n.id === dragging.id) continue;
        n.x += n.vx; n.y += n.vy;
        n.x = Math.max(n.radius + 4, Math.min(W - n.radius - 4, n.x));
        n.y = Math.max(n.radius + 4, Math.min(H - n.radius - 4, n.y));
      }
      ctx.clearRect(0, 0, W, H);
      for (const e of edges) {
        const a = nodes.find(n => n.id === e.source), b = nodes.find(n => n.id === e.target);
        if (!a || !b) continue;
        const active = filter === "all" || (a.dept === filter || b.dept === filter);
        ctx.globalAlpha = active ? Math.min(0.12 + e.weight * 0.12, 0.5) : 0.03;
        ctx.strokeStyle = DEPT_COLORS[a.dept] || "#aaa";
        ctx.lineWidth = Math.min(e.weight, 3);
        ctx.beginPath(); ctx.moveTo(a.x, a.y);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        ctx.quadraticCurveTo(mx - (b.y - a.y) * 0.15, my + (b.x - a.x) * 0.15, b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (const n of nodes) {
        const isHov = hovered && n.id === hovered.id;
        const active = filter === "all" || n.dept === filter;
        const col = n.color || DEPT_COLORS[n.dept] || "#888";
        if (isHov) { ctx.shadowBlur = 16; ctx.shadowColor = col; }
        ctx.globalAlpha = active ? 1 : 0.15;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.radius + (isHov ? 2 : 0), 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(n.x - n.radius / 3, n.y - n.radius / 3, 0, n.x, n.y, n.radius);
        grad.addColorStop(0, col + "EE"); grad.addColorStop(1, col + "88");
        ctx.fillStyle = grad; ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isHov ? "#fff" : col; ctx.lineWidth = isHov ? 2 : 1; ctx.stroke();
        if (isHov || n.radius > 10) {
          ctx.globalAlpha = active ? 1 : 0.2;
          ctx.fillStyle = "#0B3954";
          ctx.font = `${isHov ? "600 " : ""}9px 'Plus Jakarta Sans'`;
          ctx.textAlign = "center";
          ctx.fillText(n.name.split(" ")[0], n.x, n.y + n.radius + 11);
        }
        ctx.globalAlpha = 1;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [hovered, filter, dragging]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (dragging) { const n = nodesRef.current.find(n => n.id === dragging.id); if (n) { n.x = mx; n.y = my; } return; }
    const hit = nodesRef.current.find(n => Math.hypot(n.x - mx, n.y - my) < n.radius + 4);
    setHovered(hit || null);
  }, [dragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const hit = nodesRef.current.find(n => Math.hypot(n.x - mx, n.y - my) < n.radius + 4);
    if (hit) setDragging(hit);
  }, []);

  return (
    <div>
      <SH eye="Social Graph" title="Recognition Network" eyeColorCls="text-[#00A98F]"
        right={<div className="font-mono text-[10px] text-gray-500">{data.network?.nodes.length} people · {data.network?.edges.length} connections · drag nodes</div>} />
      <div className="flex gap-1.5 flex-wrap mb-3.5">
        <button
          className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${filter === "all" ? "bg-[#0B3954] text-white border-[#0B3954]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}
          onClick={() => setFilter("all")}>All Depts</button>
        {activeDepts.map(d => (
          <button key={d}
            className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all"
            onClick={() => setFilter(filter === d ? "all" : d)}
            style={{ borderColor: (DEPT_COLORS[d] || "#888") + "66", color: filter === d ? "#fff" : DEPT_COLORS[d] || "#888", background: filter === d ? DEPT_COLORS[d] || "#888" : "transparent" }}>
            {d}
          </button>
        ))}
      </div>
      <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-br from-[#FAFBFC] to-[#F0F4F8]">
        <canvas ref={canvasRef} width={780} height={400} className="w-full"
          style={{ height: 400, cursor: dragging ? "grabbing" : hovered ? "grab" : "default" }}
          onMouseMove={handleMouseMove} onMouseDown={handleMouseDown}
          onMouseUp={() => setDragging(null)} onMouseLeave={() => setDragging(null)} />
        {hovered && (
          <div className="absolute top-3 right-3 bg-white border border-gray-200 rounded-lg p-3.5 shadow-md min-w-[200px] pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: hovered.color || DEPT_COLORS[hovered.dept] || "#888" }} />
              <span className="font-bold text-sm text-[#0B3954]">{hovered.name}</span>
            </div>
            <div className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">{hovered.dept}</div>
            <div className="font-mono text-[9px] text-gray-400 mb-2.5">{hovered.title} · {hovered.seniority}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { l: "Received", v: hovered.received, c: "text-[#F96400]" },
                { l: "Given", v: hovered.given, c: "text-[#00A98F]" },
                { l: "Value", v: `$${(hovered.totalValue || 0).toLocaleString()}`, c: "text-[#0B3954]" },
              ].map(s => (
                <div key={s.l} className="p-2 bg-gray-50 rounded-md">
                  <div className="font-mono text-[8px] text-gray-500 mb-0.5">{s.l.toUpperCase()}</div>
                  <div className={`font-bold text-[15px] ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className={`mt-2 px-2.5 py-1.5 rounded-md font-mono text-[9px] text-gray-500 ${hovered.given > hovered.received ? "bg-teal-50" : hovered.received > hovered.given ? "bg-orange-50" : "bg-gray-50"}`}>
              {hovered.given > hovered.received ? "🌟 Culture carrier" : hovered.received > hovered.given * 2 ? "⭐ Star recipient" : "⚖️ Balanced"}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5 mt-3">
        {activeDepts.map(d => (
          <div key={d} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: DEPT_COLORS[d] || "#888" }} />
            <span className="text-[11px] text-gray-500">{d}</span>
          </div>
        ))}
        <div className="ml-auto font-mono text-[9px] text-gray-400">Node size = awards received · Scroll to zoom</div>
      </div>
    </div>
  );
}