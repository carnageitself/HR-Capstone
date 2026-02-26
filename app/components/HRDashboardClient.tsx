"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";

// ── Category colours ──────────────────────────────────────────────────────────
const CAT_COLORS: Record<string,string> = {
  A:"#FF6B6B", B:"#4ECDC4", C:"#95E1D3", D:"#F9CA24", E:"#6C5CE7", F:"#A29BFE",
};
const CAT_LABELS: Record<string,string> = {
  A:"Leadership", B:"Innovation", C:"Customer", D:"Collaboration", E:"Growth", F:"Operations",
};

// ── Dept colours ──────────────────────────────────────────────────────────────
const DEPT_COLORS: Record<string,string> = {
  Marketing:"#FD79A8","Data Science":"#4ECDC4",Finance:"#FFEAA7",
  "Customer Service":"#FF6B6B",Product:"#00CEC9",Design:"#45B7D1",
  Sales:"#FDCB6E",Legal:"#A29BFE",HR:"#DDA15E",IT:"#6C5CE7",
  Engineering:"#96CEB4",Operations:"#74B9FF",
};

// ── Animated counter ──────────────────────────────────────────────────────────
function Num({to,pre="",suf="",dur=1200}:{to:number;pre?:string;suf?:string;dur?:number}){
  const [v,setV]=useState(0);
  useEffect(()=>{
    let s:number|null=null;
    const t=(ts:number)=>{if(!s)s=ts;const p=Math.min((ts-s)/dur,1),e=1-Math.pow(1-p,3);setV(Math.round(e*to));if(p<1)requestAnimationFrame(t);else setV(to);};
    requestAnimationFrame(t);
  },[to,dur]);
  const f=pre==="$"?v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}K`:`$${v}`:`${pre}${v.toLocaleString()}${suf}`;
  return <span>{f}</span>;
}

// ── Bar chart row ──────────────────────────────────────────────────────────────
function Bar({label,value,max,right,color="orange",h=6,delay=0}:{label:string;value:number;max:number;right:string;color?:string;h?:number;delay?:number}){
  const pct=Math.round((value/Math.max(max,1))*100);
  const gradients:Record<string,string>={
    orange:"from-[#F96400] to-[#FFAB73]",
    teal:"from-[#00A98F] to-[#4DD9C5]",
    purple:"from-[#8E44AD] to-[#BB8FCE]",
    green:"from-[#27AE60] to-[#58D68D]",
    navy:"from-[#0B3954] to-[#1A5276]",
    indigo:"from-[#3B5BDB] to-[#74C0FC]",
  };
  const grad=gradients[color]||gradients.orange;
  return(
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="font-mono text-[10px] text-gray-500">{right}</span>
      </div>
      <div className="bg-gray-200 rounded-full overflow-hidden" style={{height:h}}>
        <div className={`h-full bg-gradient-to-r ${grad} rounded-full transition-[width] duration-1000`}
          style={{width:`${pct}%`}}/>
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SH({eye,title,right,eyeColorCls="text-[#F96400]"}:{eye:string;title:string;right?:React.ReactNode;eyeColorCls?:string}){
  return(
    <div className="flex justify-between items-end mb-5">
      <div>
        <div className={`font-mono text-[9px] tracking-[.18em] uppercase ${eyeColorCls} mb-1.5 font-medium`}>{eye}</div>
        <div className="text-[17px] font-bold text-[#0B3954] tracking-tight">{title}</div>
      </div>
      {right&&<div>{right}</div>}
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Spark({data,color="#F96400",h=28,w=80}:{data:{period:string;awards:number}[];color?:string;h?:number;w?:number}){
  if(!data||data.length<2) return <span className="text-gray-300 text-[10px]">—</span>;
  const vals=data.map(d=>d.awards);
  const mx=Math.max(...vals,1),mn=Math.min(...vals);
  const rng=mx-mn||1;
  const pts=vals.map((v,i)=>{
    const x=(i/(vals.length-1))*(w-4)+2;
    const y=h-2-((v-mn)/rng)*(h-4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last=pts.split(" ").at(-1)!.split(",");
  return(
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={color}/>
    </svg>
  );
}

// ── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({score}:{score:number}){
  const level=score>=75?{label:"HIGH",cls:"bg-red-50 text-red-600"}
             :score>=40?{label:"MED", cls:"bg-yellow-50 text-yellow-600"}
             :           {label:"LOW", cls:"bg-green-50 text-green-600"};
  return(
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide font-mono ${level.cls}`}>
      {level.label}
    </span>
  );
}

// ── Intel avatar ──────────────────────────────────────────────────────────────
function IntelAvatar({name,dept,size=32}:{name:string;dept:string;size?:number}){
  const initials=name.split(" ").map((p:string)=>p[0]).slice(0,2).join("");
  const color=DEPT_COLORS[dept]||"#888";
  return(
    <div className="rounded-full grid place-items-center font-bold font-mono shrink-0"
      style={{width:size,height:size,background:color+"22",border:`2px solid ${color}`,fontSize:size*0.32,color}}>
      {initials}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// NETWORK GRAPH
// ══════════════════════════════════════════════════════════════════════════
type NetNodeBase = DashboardData["network"]["nodes"][0];
type SimNode = NetNodeBase & {
  x:number; y:number; vx:number; vy:number; radius:number;
  color?: string; title?: string; seniority?: string; totalValue?: number;
};
type SimEdge = DashboardData["network"]["edges"][0];

function NetworkGraph({data}:{data:DashboardData}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const animRef=useRef<number>(0);
  const nodesRef=useRef<SimNode[]>([]);
  const edgesRef=useRef<SimEdge[]>([]);
  const [hovered,setHovered]=useState<SimNode|null>(null);
  const [filter,setFilter]=useState<string>("all");
  const [dragging,setDragging]=useState<SimNode|null>(null);
  const activeDepts=[...new Set(data.network?.nodes.map(n=>n.dept)||[])].sort();

  useEffect(()=>{
    if(!data.network) return;
    const W=canvasRef.current?.offsetWidth||700,H=400;
    const nodes:SimNode[]=data.network.nodes.map((n,i:number)=>{
      const angle=(i/data.network.nodes.length)*Math.PI*2,r=150;
      return{...n,x:W/2+Math.cos(angle)*r+(Math.random()-0.5)*80,y:H/2+Math.sin(angle)*r+(Math.random()-0.5)*80,vx:0,vy:0,radius:Math.max(5,Math.min(14,4+(n.received||0)/2))};
    });
    nodesRef.current=nodes;
    edgesRef.current=data.network.edges;
  },[data.network]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d")!;
    const W=canvas.width,H=canvas.height;
    const tick=()=>{
      const nodes=nodesRef.current,edges=edgesRef.current;
      for(const n of nodes){n.vx*=0.85;n.vy*=0.85;}
      for(let i=0;i<nodes.length;i++){
        for(let j=i+1;j<nodes.length;j++){
          const a=nodes[i],b=nodes[j];
          const dx=b.x-a.x,dy=b.y-a.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
          if(dist<80){const f=(80-dist)/dist*0.4;a.vx-=dx*f;a.vy-=dy*f;b.vx+=dx*f;b.vy+=dy*f;}
        }
        nodes[i].vx+=(W/2-nodes[i].x)*0.003;
        nodes[i].vy+=(H/2-nodes[i].y)*0.003;
      }
      for(const e of edges){
        const a=nodes.find(n=>n.id===e.source),b=nodes.find(n=>n.id===e.target);
        if(!a||!b) continue;
        const dx=b.x-a.x,dy=b.y-a.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
        const target=90+e.weight*10,f=(dist-target)/dist*0.04;
        a.vx+=dx*f;a.vy+=dy*f;b.vx-=dx*f;b.vy-=dy*f;
      }
      for(const n of nodes){
        if(dragging&&n.id===dragging.id) continue;
        n.x+=n.vx;n.y+=n.vy;
        n.x=Math.max(n.radius+4,Math.min(W-n.radius-4,n.x));
        n.y=Math.max(n.radius+4,Math.min(H-n.radius-4,n.y));
      }
      ctx.clearRect(0,0,W,H);
      for(const e of edges){
        const a=nodes.find(n=>n.id===e.source),b=nodes.find(n=>n.id===e.target);
        if(!a||!b) continue;
        const active=filter==="all"||(a.dept===filter||b.dept===filter);
        ctx.globalAlpha=active?Math.min(0.12+e.weight*0.12,0.5):0.03;
        ctx.strokeStyle=DEPT_COLORS[a.dept]||"#aaa";
        ctx.lineWidth=Math.min(e.weight,3);
        ctx.beginPath();ctx.moveTo(a.x,a.y);
        const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
        ctx.quadraticCurveTo(mx-(b.y-a.y)*0.15,my+(b.x-a.x)*0.15,b.x,b.y);
        ctx.stroke();
      }
      ctx.globalAlpha=1;
      for(const n of nodes){
        const isHov=hovered&&n.id===hovered.id;
        const active=filter==="all"||n.dept===filter;
        const col=n.color||DEPT_COLORS[n.dept]||"#888";
        if(isHov){ctx.shadowBlur=16;ctx.shadowColor=col;}
        ctx.globalAlpha=active?1:0.15;
        ctx.beginPath();ctx.arc(n.x,n.y,n.radius+(isHov?2:0),0,Math.PI*2);
        const grad=ctx.createRadialGradient(n.x-n.radius/3,n.y-n.radius/3,0,n.x,n.y,n.radius);
        grad.addColorStop(0,col+"EE");grad.addColorStop(1,col+"88");
        ctx.fillStyle=grad;ctx.fill();
        ctx.shadowBlur=0;
        ctx.strokeStyle=isHov?"#fff":col;ctx.lineWidth=isHov?2:1;ctx.stroke();
        if(isHov||n.radius>10){
          ctx.globalAlpha=active?1:0.2;
          ctx.fillStyle="#0B3954";
          ctx.font=`${isHov?"600 ":""}9px 'Plus Jakarta Sans'`;
          ctx.textAlign="center";
          ctx.fillText(n.name.split(" ")[0],n.x,n.y+n.radius+11);
        }
        ctx.globalAlpha=1;
      }
      animRef.current=requestAnimationFrame(tick);
    };
    animRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(animRef.current);
  },[hovered,filter,dragging]);

  const handleMouseMove=useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{
    const rect=canvasRef.current!.getBoundingClientRect();
    const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    if(dragging){const n=nodesRef.current.find(n=>n.id===dragging.id);if(n){n.x=mx;n.y=my;}return;}
    const hit=nodesRef.current.find(n=>Math.hypot(n.x-mx,n.y-my)<n.radius+4);
    setHovered(hit||null);
  },[dragging]);

  const handleMouseDown=useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{
    const rect=canvasRef.current!.getBoundingClientRect();
    const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const hit=nodesRef.current.find(n=>Math.hypot(n.x-mx,n.y-my)<n.radius+4);
    if(hit)setDragging(hit);
  },[]);

  return(
    <div>
      <SH eye="Social Graph" title="Recognition Network" eyeColorCls="text-[#00A98F]"
        right={<div className="font-mono text-[10px] text-gray-500">{data.network?.nodes.length} people · {data.network?.edges.length} connections · drag nodes</div>}/>
      <div className="flex gap-1.5 flex-wrap mb-3.5">
        <button className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${filter==="all"?"bg-[#0B3954] text-white border-[#0B3954]":"text-gray-500 border-gray-200 hover:bg-gray-100"}`}
          onClick={()=>setFilter("all")}>All Depts</button>
        {activeDepts.map(d=>(
          <button key={d}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all`}
            onClick={()=>setFilter(filter===d?"all":d)}
            style={{borderColor:(DEPT_COLORS[d]||"#888")+"66",color:filter===d?"#fff":DEPT_COLORS[d]||"#888",background:filter===d?DEPT_COLORS[d]||"#888":"transparent"}}>
            {d}
          </button>
        ))}
      </div>
      <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-br from-[#FAFBFC] to-[#F0F4F8]">
        <canvas ref={canvasRef} width={780} height={400}
          className="w-full"
          style={{height:400,cursor:dragging?"grabbing":hovered?"grab":"default"}}
          onMouseMove={handleMouseMove} onMouseDown={handleMouseDown}
          onMouseUp={()=>setDragging(null)} onMouseLeave={()=>setDragging(null)}/>
        {hovered&&(
          <div className="absolute top-3 right-3 bg-white border border-gray-200 rounded-lg p-3.5 shadow-md min-w-[200px] pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:hovered.color||DEPT_COLORS[hovered.dept]||"#888"}}/>
              <span className="font-bold text-sm text-[#0B3954]">{hovered.name}</span>
            </div>
            <div className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">{hovered.dept}</div>
            <div className="font-mono text-[9px] text-gray-400 mb-2.5">{hovered.title} · {hovered.seniority}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {l:"Received",v:hovered.received,c:"text-[#F96400]"},
                {l:"Given",v:hovered.given,c:"text-[#00A98F]"},
                {l:"Value",v:`$${(hovered.totalValue||0).toLocaleString()}`,c:"text-[#0B3954]"},
              ].map(s=>(
                <div key={s.l} className="p-2 bg-gray-50 rounded-md">
                  <div className="font-mono text-[8px] text-gray-500 mb-0.5">{s.l.toUpperCase()}</div>
                  <div className={`font-bold text-[15px] ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className={`mt-2 px-2.5 py-1.5 rounded-md font-mono text-[9px] text-gray-500 ${
              hovered.given>hovered.received?"bg-teal-50":hovered.received>hovered.given?"bg-orange-50":"bg-gray-50"}`}>
              {hovered.given>hovered.received?"🌟 Culture carrier":hovered.received>hovered.given*2?"⭐ Star recipient":"⚖️ Balanced"}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5 mt-3">
        {activeDepts.map(d=>(
          <div key={d} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{background:DEPT_COLORS[d]||"#888"}}/>
            <span className="text-[11px] text-gray-500">{d}</span>
          </div>
        ))}
        <div className="ml-auto font-mono text-[9px] text-gray-400">Node size = awards received · Scroll to zoom</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CULTURE HEALTH SCORECARD
// ══════════════════════════════════════════════════════════════════════════
function HealthScorecard({data}:{data:DashboardData}){
  const [selected,setSelected]=useState<string|null>(data.cultureHealth[0]?.name||null);
  const depts=data.cultureHealth;

  const scoreColor=(s:number)=>s>=80?"#27AE60":s>=65?"#00A98F":s>=50?"#F39C12":"#E74C3C";
  const scoreBg=(s:number)=>s>=80?"#EAFAF1":s>=65?"#E8F8F5":s>=50?"#FEF9E7":"#FDEDEC";
  const scoreLabel=(s:number)=>s>=80?"Thriving":s>=65?"Healthy":s>=50?"Developing":"Needs Focus";
  const sel=depts.find(d=>d.name===selected)||depts[0];

  const SCORE_DIMS=[
    {key:"diversity" as const,label:"Category Diversity",color:"#3B5BDB"},
    {key:"participation" as const,label:"Peer Participation",color:"#00A98F"},
    {key:"volume" as const,label:"Recognition Volume",color:"#F96400"},
    {key:"generosity" as const,label:"Award Generosity",color:"#27AE60"},
  ];

  return(
    <div>
      <SH eye="Culture Intelligence" title="Department Health Scorecard" eyeColorCls="text-[#27AE60]"
        right={<div className="font-mono text-[10px] text-gray-500">4 signals · click dept for detail</div>}/>

      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {[...depts].sort((a,b)=>b.health-a.health).map(d=>{
          const col=scoreColor(d.health);
          const isSel=selected===d.name;
          return(
            <div key={d.name} onClick={()=>setSelected(isSel?null:d.name)}
              className="p-3.5 rounded-lg cursor-pointer transition-all duration-200 bg-white shadow-sm"
              style={{border:`2px solid ${isSel?col:"#E9ECEF"}`,background:isSel?scoreBg(d.health):"white",boxShadow:isSel?"0 4px 12px rgba(11,57,84,.08)":"0 1px 3px rgba(11,57,84,.06)"}}
              onMouseEnter={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.borderColor=col;}}
              onMouseLeave={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.borderColor="#E9ECEF";}}>
              <div className="font-mono text-[8px] tracking-widest uppercase text-gray-500 mb-1.5">{d.name}</div>
              <div className="font-extrabold text-3xl font-mono tracking-tight leading-none mb-0.5" style={{color:col}}>{d.health}</div>
              <div className="font-mono text-[9px] text-gray-400 mb-2.5">{scoreLabel(d.health)}</div>
              {/* mini category spread */}
              <div className="flex h-1 rounded overflow-hidden gap-px">
                {d.categorySpread.map(c=>(
                  <div key={c.id} style={{flex:c.count,background:CAT_COLORS[c.id]||"#888"}} title={`${c.name}: ${c.count}`}/>
                ))}
              </div>
              <div className="font-mono text-[9px] text-gray-500 mt-1.5">{d.totalAwards} awards · ${(d.totalValue/1000).toFixed(0)}K</div>
            </div>
          );
        })}
      </div>

      {sel&&(
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="text-[44px] font-extrabold font-mono tracking-tight leading-none" style={{color:scoreColor(sel.health)}}>{sel.health}</div>
              <div>
                <div className="font-bold text-base text-[#0B3954]">{sel.name}</div>
                <div className="font-mono text-[10px] text-gray-500 mt-0.5">{scoreLabel(sel.health)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                {l:"Awards",v:sel.totalAwards,c:"text-[#F96400]"},
                {l:"Recipients",v:sel.uniqueRecipients,c:"text-[#00A98F]"},
                {l:"Nominators",v:sel.uniqueNominators,c:"text-[#0B3954]"},
                {l:"Total Value",v:`$${(sel.totalValue/1000).toFixed(0)}K`,c:"text-[#27AE60]"},
                {l:"Avg Value",v:`$${sel.avgValue}`,c:"text-[#3B5BDB]"},
                {l:"Cross-Dept",v:`${sel.crossDeptPct}%`,c:"text-[#8E44AD]"},
              ].map(s=>(
                <div key={s.l} className="p-2.5 bg-gray-50 rounded-lg">
                  <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1">{s.l}</div>
                  <div className={`font-bold text-lg ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {SCORE_DIMS.map(dim=>(
                <div key={dim.key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-[#0B3954] font-medium">{dim.label}</span>
                    <span className="font-mono text-[10px] font-bold" style={{color:dim.color}}>{sel.scores[dim.key]}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full rounded transition-[width] duration-1000" style={{width:`${sel.scores[dim.key]}%`,background:dim.color}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="font-mono text-[9px] tracking-[.14em] uppercase text-[#27AE60] mb-1">AWARD CATEGORY SPREAD</div>
            <div className="text-[14px] font-bold text-[#0B3954] mb-4">Recognition Type Breakdown</div>
            {sel.categorySpread.map(c=>(
              <div key={c.id} className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:CAT_COLORS[c.id]||"#888"}}/>
                    <span className="text-[11px] text-[#0B3954] font-medium">{c.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">{c.count}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded" style={{width:`${(c.count/sel.totalAwards)*100}%`,background:CAT_COLORS[c.id]||"#888"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MESSAGE INSIGHTS
// ══════════════════════════════════════════════════════════════════════════
function MessageInsights({data}:{data:DashboardData}){
  const [catFilter,setCatFilter]=useState("All");
  const cats=["All",...[...new Set(data.messageThemes.map(t=>t.category))].slice(0,6)];
  const filteredWords=catFilter==="All"?data.wordCloud:data.messageThemes.find(t=>t.category===catFilter)?.words||[];
  const filteredMax=filteredWords[0]?.count||1;
  const wordColors=["#F96400","#00A98F","#8E44AD","#3B5BDB","#27AE60","#F39C12"];
  const themes=data.messageThemes.slice(0,5) as (typeof data.messageThemes[0] & {categoryId:string})[];

  return(
    <div>
      <SH eye="Language Analysis" title="Message Insights" eyeColorCls="text-[#8E44AD]"/>
      <div className="flex gap-2 flex-wrap mb-5">
        {cats.map(c=>(
          <button key={c}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${catFilter===c?"bg-[#0B3954] text-white border-[#0B3954]":"text-gray-500 border-gray-200 hover:bg-gray-100"}`}
            onClick={()=>setCatFilter(c)}>
            {c==="All"?"All Categories":c.split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="grid gap-5 mb-5" style={{gridTemplateColumns:"1.2fr 1fr"}}>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-[#8E44AD] mb-1">WORD CLOUD</div>
          <div className="text-[13px] font-bold text-[#0B3954] mb-4">Language in Award Messages</div>
          <div className="flex flex-wrap gap-2 items-center leading-loose">
            {filteredWords.slice(0,28).map((w,i)=>{
              const size=Math.round(10+(w.count/filteredMax)*20);
              const opacity=0.5+(w.count/filteredMax)*0.5;
              return(
                <span key={w.word} style={{fontSize:size,fontWeight:w.count>filteredMax*0.6?800:w.count>filteredMax*0.3?600:400,color:wordColors[i%wordColors.length],opacity,lineHeight:1.2,transition:"all .2s",cursor:"default"}}
                  onMouseEnter={e=>{(e.target as HTMLElement).style.opacity="1";(e.target as HTMLElement).style.transform="scale(1.1)";}}
                  onMouseLeave={e=>{(e.target as HTMLElement).style.opacity=String(opacity);(e.target as HTMLElement).style.transform="none";}}
                  title={`${w.count} occurrences`}>{w.word}</span>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-[#8E44AD] mb-1">CATEGORY THEMES</div>
          <div className="text-[13px] font-bold text-[#0B3954] mb-4">Top Words per Category</div>
          <div className="flex flex-col gap-3">
            {themes.map(t=>(
              <div key={t.category}
                className="p-2.5 rounded-lg border cursor-pointer transition-all duration-150"
                style={{background:catFilter===t.category?"#F5EEF8":"white",borderColor:catFilter===t.category?"#D7BDE2":"#E9ECEF"}}
                onClick={()=>setCatFilter(catFilter===t.category?"All":t.category)}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-full" style={{background:CAT_COLORS[t.categoryId]||"#888"}}/>
                  <div className="text-[11px] font-bold text-[#0B3954]">{t.category}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.words.slice(0,5).map((w,j)=>(
                    <span key={w.word} className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{background:j===0?"#F5EEF8":"#F8F9FA",color:j===0?"#8E44AD":"#6C757D",borderColor:j===0?"#D7BDE2":"#E9ECEF",fontWeight:j===0?700:400}}>
                      {w.word}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(()=>{
        const top1=data.wordCloud[0]?.word||"support";
        const top2=data.wordCloud[1]?.word||"team";
        const top1c=data.wordCloud[0]?.count||0;
        const top2c=data.wordCloud[1]?.count||0;
        return(
          <div className="p-4 bg-[#F5EEF8] rounded-lg border border-[#D7BDE2] flex gap-2.5">
            <span className="text-xl shrink-0">🔍</span>
            <div>
              <div className="font-mono text-[9px] tracking-[.12em] uppercase text-[#8E44AD] mb-1">LANGUAGE INSIGHT</div>
              <p className="text-xs text-[#0B3954] leading-relaxed">
                <strong>&quot;{top1}&quot;</strong> ({top1c} mentions) and <strong>&quot;{top2}&quot;</strong> ({top2c} mentions) dominate award messages.
                {" "}Collaboration &amp; Teamwork is the most common category ({data.categories.find(c=>c.id==="D")?.count||0} awards, {data.categories.find(c=>c.id==="D")?.pct||0}%), while Operational Excellence has the least recognition.
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SKILLS TAB
// ══════════════════════════════════════════════════════════════════════════
function SkillsTab({data}:{data:DashboardData}){
  const [selDept,setSelDept]=useState<string|null>(null);
  const si=data.skillInsights;
  const maxSkill=si.topSkills[0]?.count||1;
  const depts=Object.keys(si.byDepartment).sort();

  return(
    <div>
      <SH eye="Skill Intelligence" title="Skills & Recognition Correlation" eyeColorCls="text-[#3B5BDB]"/>
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="font-mono text-[9px] tracking-[.14em] uppercase text-[#3B5BDB] mb-1">MOST RECOGNIZED SKILLS</div>
          <div className="text-[14px] font-bold text-[#0B3954] mb-4">Top 15 Skills</div>
          <div className="flex flex-col gap-2.5">
            {si.topSkills.slice(0,15).map(s=>(
              <div key={s.skill}>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{background:CAT_COLORS[s.dominantCategory]||"#888"}}/>
                    <span className="text-xs text-[#0B3954] font-medium">{s.skill}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">{s.count}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded" style={{width:`${(s.count/maxSkill)*100}%`,background:CAT_COLORS[s.dominantCategory]||"#3B5BDB"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="font-mono text-[9px] tracking-[.14em] uppercase text-[#3B5BDB] mb-1">SKILLS BY DEPARTMENT</div>
          <div className="text-[14px] font-bold text-[#0B3954] mb-3.5">Click a department to explore</div>
          <div className="flex gap-1.5 flex-wrap mb-3.5">
            {depts.map(d=>(
              <button key={d}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all ${selDept===d?"bg-[#0B3954] text-white border-[#0B3954]":"text-gray-500 border-gray-200 hover:bg-gray-100"}`}
                onClick={()=>setSelDept(selDept===d?null:d)}>
                {d}
              </button>
            ))}
          </div>
          {selDept&&si.byDepartment[selDept]&&(
            <div className="flex flex-col gap-2">
              <div className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">{selDept} · Top Skills</div>
              {si.byDepartment[selDept].map((s,i)=>(
                <div key={s.skill} className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] text-gray-400 w-4 text-right">{i+1}</span>
                  <span className="text-xs text-[#0B3954] flex-1 font-medium">{s.skill}</span>
                  <span className="font-mono text-[10px] text-[#F96400] font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          )}
          {!selDept&&<div className="py-6 text-center text-gray-500 text-xs">Select a department above to see its top skills</div>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 overflow-x-auto">
        <div className="font-mono text-[9px] tracking-[.14em] uppercase text-[#3B5BDB] mb-1">SKILL × CATEGORY HEATMAP</div>
        <div className="text-[14px] font-bold text-[#0B3954] mb-4">Where each skill is most frequently recognized</div>
        <table className="w-full border-collapse" style={{minWidth:600}}>
          <thead>
            <tr>
              <th className="font-mono text-[9px] text-gray-500 uppercase tracking-widest px-3 py-1.5 text-left border-b border-gray-200 w-40">Skill</th>
              {data.categories.map(c=>(
                <th key={c.id} className="font-mono text-[9px] uppercase tracking-widest px-2 py-1.5 text-center border-b border-gray-200"
                  style={{color:CAT_COLORS[c.id]}}>
                  {c.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {si.skillCategoryMatrix.map(row=>{
              const maxVal=Math.max(...Object.values(row.categories),1);
              return(
                <tr key={row.skill}>
                  <td className="text-xs px-3 py-2 text-[#0B3954] font-medium border-b border-gray-100">{row.skill}</td>
                  {data.categories.map(c=>{
                    const val=row.categories[c.id]||0;
                    const intensity=val/maxVal;
                    const hex=(CAT_COLORS[c.id]||"#888").replace("#","");
                    const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
                    const bg=val>0?`rgba(${r},${g},${b},${0.1+intensity*0.7})`:"transparent";
                    return(
                      <td key={c.id} className="text-center px-2 py-2 border-b border-gray-100">
                        {val>0&&(
                          <div className="rounded px-1 py-0.5 font-mono text-[10px] font-bold inline-block min-w-[28px]"
                            style={{background:bg,color:intensity>0.4?"#fff":"#6C757D"}}>
                            {val}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-2.5 font-mono text-[9px] text-gray-400">
          Colour intensity = frequency relative to row max · A=Leadership · B=Innovation · C=Customer · D=Collaboration · E=Growth · F=Operations
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// HR INTELLIGENCE — sub-features
// ══════════════════════════════════════════════════════════════════════════
function InvisibleRadar({intel}:{intel:DashboardData["intelligence"]}){
  const [filter,setFilter]=useState("All");
  const [selected,setSelected]=useState<string|null>(null);
  const depts=["All",...new Set(intel.invisibleContributors.map(x=>x.dept))];
  const filtered=filter==="All"?intel.invisibleContributors:intel.invisibleContributors.filter(x=>x.dept===filter);
  const sel=selected?intel.invisibleContributors.find(x=>x.id===selected):null;

  return(
    <div>
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-orange-200 rounded-xl p-3.5 mb-4 flex gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <div className="font-bold text-[13px] text-red-700 mb-1">{intel.invisibleContributors.length} Invisible Contributors Detected</div>
          <p className="text-[11px] text-red-600 leading-relaxed">People who actively nominate colleagues but have <strong>never been recognized themselves</strong>. Unrecognized givers are 3× more likely to disengage within 6 months.</p>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-3.5">
        {depts.map(d=>(
          <button key={d} onClick={()=>setFilter(d)}
            className="px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all"
            style={{borderColor:filter===d?(DEPT_COLORS[d]||"#0B3954"):"#E9ECEF",background:filter===d?(DEPT_COLORS[d]||"#0B3954")+"18":"white",color:filter===d?(DEPT_COLORS[d]||"#0B3954"):"#6C757D"}}>
            {d}
          </button>
        ))}
      </div>
      <div className={`grid gap-4 ${selected?"grid-cols-[1fr_340px]":"grid-cols-1"}`}>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                {["Person","Dept","Title","Seniority","Given","Risk","Action"].map(h=>(
                  <th key={h} className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p,i)=>(
                <tr key={p.id} onClick={()=>setSelected(selected===p.id?null:p.id)}
                  className="border-b border-gray-100 cursor-pointer transition-colors"
                  style={{background:selected===p.id?"#FFF4EE":i%2===0?"white":"#FAFBFC"}}>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2"><IntelAvatar name={p.name} dept={p.dept} size={26}/><span className="font-semibold text-xs text-[#0B3954]">{p.name}</span></div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-xl font-semibold" style={{background:(DEPT_COLORS[p.dept]||"#888")+"18",color:DEPT_COLORS[p.dept]||"#888"}}>{p.dept}</span>
                  </td>
                  <td className="px-3.5 py-3 text-[11px] text-gray-500">{p.title}</td>
                  <td className="px-3.5 py-3 text-[11px] text-gray-500">{p.seniority}</td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-extrabold text-base text-[#F96400]">{p.given}</span>
                      <div className="w-10 h-1 bg-gray-200 rounded">
                        <div className="h-full bg-gradient-to-r from-[#F96400] to-[#FFAB73] rounded" style={{width:`${(p.given/7)*100}%`}}/>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-3"><RiskBadge score={p.riskScore}/></td>
                  <td className="px-3.5 py-3">
                    <button className="text-[10px] px-2.5 py-1 rounded-md bg-[#F96400] text-white font-semibold">Nominate →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sel&&(
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3.5">
              <IntelAvatar name={sel.name} dept={sel.dept} size={40}/>
              <div><div className="font-bold text-sm text-[#0B3954]">{sel.name}</div><div className="text-[11px] text-gray-500">{sel.title} · {sel.dept}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3.5">
              {[{l:"Given",v:sel.given,c:"text-[#F96400]"},{l:"Received",v:sel.received,c:"text-red-500"},{l:"Seniority",v:sel.seniority,c:"text-indigo-600"},{l:"Risk",v:sel.riskScore+"%",c:"text-red-500"}].map(s=>(
                <div key={s.l} className="p-2 bg-gray-50 rounded-lg">
                  <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-0.5">{s.l}</div>
                  <div className={`font-extrabold text-base ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="bg-teal-50 rounded-lg p-2.5 mb-2.5">
              <div className="font-mono text-[8px] text-teal-600 uppercase tracking-widest mb-1">💡 RECOMMENDED ACTION</div>
              <p className="text-[11px] text-[#0B3954] leading-relaxed">
                {sel.seniority==="VP"||sel.seniority==="Director"
                  ?`Senior leaders rarely get recognized upward. Prompt their skip-level to call out ${sel.name.split(" ")[0]}'s generosity in the next all-hands.`
                  :`Reach out to ${sel.name.split(" ")[0]}'s manager. They've given ${sel.given} nominations — ask the manager to submit recognition this week.`}
              </p>
            </div>
            <button onClick={()=>setSelected(null)} className="w-full py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-500 cursor-pointer">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MomentumTracker({intel}:{intel:DashboardData["intelligence"]}){
  const [view,setView]=useState<"rising"|"declining">("rising");
  const people=view==="rising"?intel.risingStars:intel.decliningRecognition;
  const maxSlope=Math.max(...intel.risingStars.map(x=>x.slope),0.01);
  const minSlope=Math.min(...intel.decliningRecognition.map(x=>x.slope),-0.01);

  return(
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-green-50 border border-green-200">
          <div className="font-bold text-xs text-green-700 mb-1">🚀 {intel.risingStars.length} Rising Stars</div>
          <p className="text-[11px] text-green-600 leading-relaxed">Recognition accelerating — high potential for promotion pipeline.</p>
        </div>
        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
          <div className="font-bold text-xs text-red-700 mb-1">⚠️ {intel.decliningRecognition.length} Declining</div>
          <p className="text-[11px] text-red-600 leading-relaxed">Recognition falling — possible early disengagement signal.</p>
        </div>
      </div>
      <div className="flex gap-2 mb-3.5">
        {([{id:"rising" as const,label:"🚀 Rising Stars",activeCls:"border-green-500 bg-green-50 text-green-700"},{id:"declining" as const,label:"⚠️ Declining",activeCls:"border-red-500 bg-red-50 text-red-700"}]).map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-semibold border-2 cursor-pointer transition-all ${view===v.id?v.activeCls:"border-gray-200 bg-white text-gray-500"}`}>
            {v.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {people.slice(0,12).map(p=>{
          const isRising=view==="rising";
          const borderCls=isRising?"border-green-200":"border-red-200";
          return(
            <div key={p.id} className={`p-3.5 rounded-xl border bg-white shadow-sm ${borderCls}`}>
              <div className="flex items-center gap-2 mb-2">
                <IntelAvatar name={p.name} dept={p.dept} size={28}/>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[11px] text-[#0B3954] truncate">{p.name}</div>
                  <div className="text-[9px] text-gray-500">{p.dept}</div>
                </div>
              </div>
              <div className="mb-2"><Spark data={p.monthlyData} color={isRising?"#27AE60":"#E74C3C"} h={28} w={110}/></div>
              <div className="grid grid-cols-3 gap-1">
                {[{l:"Total",v:p.total,cls:"text-[#0B3954]"},{l:"Slope",v:(isRising?"+":"")+p.slope.toFixed(2),cls:isRising?"text-green-600":"text-red-500"},{l:"Recent",v:p.recent,cls:"text-[#0B3954]"}].map(s=>(
                  <div key={s.l} className="text-center p-1 bg-gray-50 rounded-md">
                    <div className="font-mono text-[7px] text-gray-500 uppercase mb-0.5">{s.l}</div>
                    <div className={`font-bold text-[13px] ${s.cls}`}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="font-mono text-[8px] text-gray-400 mt-2">{p.seniority} · {p.months} months</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrossDeptMap({intel}:{intel:DashboardData["intelligence"]}){
  const [highlight,setHighlight]=useState<string|null>(null);
  const [view,setView]=useState<"matrix"|"givers"|"receivers">("matrix");
  const depts=intel.depts;
  const matrix:Record<string,Record<string,number>>={};
  intel.crossDeptFlow.forEach(f=>{if(!matrix[f.from])matrix[f.from]={};matrix[f.from][f.to]=f.value;});
  const getVal=(from:string,to:string)=>from===to?null:(matrix[from]?.[to]||0);
  const maxFlow=Math.max(...intel.crossDeptFlow.map(f=>f.value),1);
  const heatBg=(v:number)=>{const t=v/maxFlow;return `rgb(${Math.round(249*t+240*(1-t))},${Math.round(100*t+240*(1-t))},${Math.round(240*(1-t))})`; };
  const givers=depts.map(d=>({dept:d,total:depts.reduce((s,r)=>d!==r?s+(getVal(d,r)||0):s,0)})).sort((a,b)=>b.total-a.total);
  const receivers=depts.map(d=>({dept:d,total:depts.reduce((s,g)=>d!==g?s+(getVal(g,d)||0):s,0),sources:depts.filter(g=>d!==g&&(getVal(g,d)||0)>0).length})).sort((a,b)=>b.total-a.total);
  const maxG=givers[0]?.total||1,maxR=receivers[0]?.total||1;

  return(
    <div>
      <div className="bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-200 rounded-xl p-3 mb-4 flex gap-2">
        <span className="text-lg">🗺️</span>
        <p className="text-[11px] text-[#0B3954] leading-relaxed"><strong>Cross-dept recognition reveals your org&apos;s informal influence network.</strong> High-outflow depts are culture amplifiers. Low inflow depts may be siloed.</p>
      </div>
      <div className="flex gap-1.5 mb-3.5">
        {([{id:"matrix" as const,label:"Heat Map"},{id:"givers" as const,label:"🏆 Top Givers"},{id:"receivers" as const,label:"⭐ Top Receivers"}]).map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)}
            className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${view===v.id?"border-teal-500 bg-teal-50 text-teal-700":"border-gray-200 bg-white text-gray-500"}`}>
            {v.label}
          </button>
        ))}
      </div>
      {view==="matrix"&&(
        <div className="overflow-x-auto">
          <table className="border-collapse text-[10px]" style={{minWidth:600}}>
            <thead><tr>
              <th className="px-2 py-1.5 font-mono text-[8px] text-gray-500 uppercase border-b-2 border-gray-200 text-left min-w-[90px]">FROM↓ TO→</th>
              {depts.map(d=>(
                <th key={d} onClick={()=>setHighlight(highlight===d?null:d)}
                  className="px-1 py-1 font-mono text-[7px] text-center border-b-2 border-gray-200 cursor-pointer min-w-[48px] transition-colors"
                  style={{color:highlight===d?(DEPT_COLORS[d]||"#0B3954"):"#6C757D",fontWeight:highlight===d?700:400}}>
                  {d.slice(0,7)}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {depts.map(from=>(
                <tr key={from}>
                  <td onClick={()=>setHighlight(highlight===from?null:from)}
                    className="px-2 py-0.5 font-mono text-[8px] border-b border-gray-100 cursor-pointer whitespace-nowrap"
                    style={{color:highlight===from?(DEPT_COLORS[from]||"#0B3954"):"#6C757D",fontWeight:highlight===from?700:400}}>
                    {from}
                  </td>
                  {depts.map(to=>{
                    const v=getVal(from,to);const isSelf=from===to;
                    const isHL=highlight&&(highlight===from||highlight===to);
                    return(
                      <td key={to} className="px-1 py-0.5 text-center border-b border-gray-100 transition-opacity"
                        style={{background:isSelf?"#F8F9FA":v?heatBg(v):"transparent",opacity:highlight&&!isHL?0.2:1}}>
                        {isSelf?<span className="text-gray-200">—</span>:v?<span className="font-mono text-[9px] font-bold" style={{color:v>=maxFlow*0.6?"white":v>=maxFlow*0.35?"#B03A2E":"#6C757D"}}>{v}</span>:<span className="text-gray-200 text-[8px]">·</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view==="givers"&&(
        <div className="flex flex-col gap-2">
          {givers.map((g,i)=>(
            <div key={g.dept} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border ${i===0?"bg-teal-50 border-teal-200":"bg-gray-50 border-gray-200"}`}>
              <div className="w-6 h-6 rounded-md grid place-items-center text-white font-extrabold text-[10px] shrink-0" style={{background:DEPT_COLORS[g.dept]||"#888"}}>{i+1}</div>
              <div className="flex-1"><div className="font-semibold text-xs text-[#0B3954]">{g.dept}</div><div className="text-[10px] text-gray-500">Champions {g.total} employees in other depts</div></div>
              <div className="w-24 h-1.5 bg-gray-200 rounded overflow-hidden"><div className="h-full rounded" style={{width:`${(g.total/maxG)*100}%`,background:DEPT_COLORS[g.dept]||"#888"}}/></div>
              <div className="font-mono font-extrabold text-sm min-w-[20px] text-right" style={{color:i===0?"#00A98F":"#0B3954"}}>{g.total}</div>
            </div>
          ))}
        </div>
      )}
      {view==="receivers"&&(
        <div className="flex flex-col gap-2">
          {receivers.map((r,i)=>(
            <div key={r.dept} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border ${i===0?"bg-orange-50 border-orange-200":"bg-gray-50 border-gray-200"}`}>
              <div className="w-6 h-6 rounded-md grid place-items-center text-white font-extrabold text-[10px] shrink-0" style={{background:DEPT_COLORS[r.dept]||"#888"}}>{i+1}</div>
              <div className="flex-1"><div className="font-semibold text-xs text-[#0B3954]">{r.dept}</div><div className="text-[10px] text-gray-500">Recognized by {r.sources} depts · {r.total} cross-dept awards</div></div>
              <div className="w-24 h-1.5 bg-gray-200 rounded overflow-hidden"><div className="h-full rounded" style={{width:`${(r.total/maxR)*100}%`,background:DEPT_COLORS[r.dept]||"#888"}}/></div>
              <div className="font-mono font-extrabold text-sm min-w-[20px] text-right" style={{color:i===0?"#F96400":"#0B3954"}}>{r.total}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EquityLens({intel}:{intel:DashboardData["intelligence"]}){
  const [metric,setMetric]=useState<"count"|"avg_value"|"high_value_pct">("count");
  const ORDER=["IC","Senior IC","Manager","Senior Manager","Director","VP"];
  const sorted=[...intel.equityData].sort((a,b)=>ORDER.indexOf(a.recipient_seniority)-ORDER.indexOf(b.recipient_seniority));
  const vals=sorted.map(x=>metric==="count"?x.count:metric==="avg_value"?x.avg_value:x.high_value_pct);
  const maxVal=Math.max(...vals,1);
  const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
  const std=Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length);
  const cv=((std/mean)*100).toFixed(1);
  const SEN_COLORS:Record<string,string>={"IC":"#45B7D1","Senior IC":"#4ECDC4","Manager":"#F9CA24","Senior Manager":"#F96400","Director":"#FF6B6B","VP":"#6C5CE7"};
  const getVal=(row:typeof sorted[0])=>metric==="count"?{v:row.count,fmt:String(row.count)}:metric==="avg_value"?{v:row.avg_value,fmt:`$${row.avg_value}`}:{v:row.high_value_pct,fmt:`${row.high_value_pct}%`};
  const isGood=parseFloat(cv)<15;

  return(
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className={`p-3 rounded-xl border ${isGood?"bg-green-50 border-green-200":"bg-yellow-50 border-yellow-200"}`}>
          <div className={`font-mono text-[8px] uppercase tracking-widest mb-1 ${isGood?"text-green-700":"text-yellow-700"}`}>Equity Score</div>
          <div className={`font-extrabold text-2xl ${isGood?"text-green-600":"text-yellow-500"}`}>{isGood?"✓ Fair":"~ Moderate"}</div>
          <div className={`text-[10px] mt-0.5 ${isGood?"text-green-700":"text-yellow-700"}`}>CV = {cv}%</div>
        </div>
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
          <div className="font-mono text-[8px] text-indigo-600 uppercase tracking-widest mb-1">Most Recognized</div>
          <div className="font-bold text-[13px] text-[#0B3954]">{[...intel.equityData].sort((a,b)=>b.count-a.count)[0]?.recipient_seniority}</div>
          <div className="text-[10px] text-indigo-600">{[...intel.equityData].sort((a,b)=>b.count-a.count)[0]?.count} awards</div>
        </div>
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
          <div className="font-mono text-[8px] text-orange-500 uppercase tracking-widest mb-1">Highest Avg Value</div>
          <div className="font-bold text-[13px] text-[#0B3954]">{[...intel.equityData].sort((a,b)=>b.avg_value-a.avg_value)[0]?.recipient_seniority}</div>
          <div className="text-[10px] text-orange-500">${[...intel.equityData].sort((a,b)=>b.avg_value-a.avg_value)[0]?.avg_value} avg</div>
        </div>
      </div>
      <div className="flex gap-1.5 mb-3.5">
        {([{id:"count" as const,label:"Award Count"},{id:"avg_value" as const,label:"Avg Value"},{id:"high_value_pct" as const,label:"High-Value Rate"}]).map(m=>(
          <button key={m.id} onClick={()=>setMetric(m.id)}
            className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${metric===m.id?"bg-[#0B3954] border-[#0B3954] text-white":"bg-white border-gray-200 text-gray-500"}`}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3.5">
        <div className="flex flex-col gap-3">
          {sorted.map(row=>{
            const {v,fmt}=getVal(row);const pct=(v/maxVal)*100;const color=SEN_COLORS[row.recipient_seniority]||"#888";
            return(
              <div key={row.recipient_seniority}>
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{background:color}}/>
                    <span className="text-xs font-semibold text-[#0B3954]">{row.recipient_seniority}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold" style={{color}}>{fmt}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded transition-[width] duration-700" style={{width:`${pct}%`,background:color}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-indigo-50 rounded-xl p-3.5 flex gap-2">
        <span className="text-base">⚖️</span>
        <p className="text-[11px] text-[#0B3954] leading-relaxed">Distribution across seniority levels shows CV of <strong>{cv}%</strong>. {isGood?" Recognition is distributed equitably — not skewed toward senior employees.":" Consider reviewing whether ICs are being overlooked relative to VPs."} Benchmark target: all levels within <strong>±15%</strong>.</p>
      </div>
    </div>
  );
}

function SkillGapRadar({intel}:{intel:DashboardData["intelligence"]}){
  const [view,setView]=useState<"all"|"rare"|"moderate"|"common">("all");
  const [selDept,setSelDept]=useState("All");
  const depts=["All",...intel.depts];
  const filtered=intel.skillGaps.filter(s=>view==="all"||s.rarity===view).filter(s=>selDept==="All"||s.depts.includes(selDept));
  const maxCount=Math.max(...intel.skillGaps.map(s=>s.count),1);
  const RARITY:{[k:string]:{cls:string;c:string;label:string}}={
    rare:{cls:"bg-red-50 text-red-600",c:"#E74C3C",label:"Rare"},
    moderate:{cls:"bg-yellow-50 text-yellow-600",c:"#F39C12",label:"Moderate"},
    common:{cls:"bg-green-50 text-green-600",c:"#27AE60",label:"Common"},
  };
  const rareCt=intel.skillGaps.filter(s=>s.rarity==="rare").length;
  const modCt=intel.skillGaps.filter(s=>s.rarity==="moderate").length;
  const commonCt=intel.skillGaps.filter(s=>s.rarity==="common").length;

  return(
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[{key:"rare" as const,label:"Rare Skills",sub:"Under-represented org-wide",count:rareCt,activeCls:"border-red-500 bg-red-50",c:"text-red-600"},
          {key:"moderate" as const,label:"Moderate Skills",sub:"Present but not widespread",count:modCt,activeCls:"border-yellow-400 bg-yellow-50",c:"text-yellow-600"},
          {key:"common" as const,label:"Core Skills",sub:"Widely recognized across org",count:commonCt,activeCls:"border-green-500 bg-green-50",c:"text-green-700"}].map(s=>(
          <button key={s.key} onClick={()=>setView(view===s.key?"all":s.key)}
            className={`p-3.5 rounded-xl border-2 cursor-pointer text-left transition-all ${view===s.key?s.activeCls:"border-gray-200 bg-white"}`}>
            <div className={`font-bold text-[13px] mb-1 ${s.c}`}>{s.label}</div>
            <div className="font-mono text-2xl font-extrabold text-[#0B3954]">{s.count}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.sub}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-3.5 flex-wrap items-center">
        <select value={selDept} onChange={e=>setSelDept(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[11px] bg-white text-[#0B3954] cursor-pointer">
          {depts.map(d=><option key={d}>{d}</option>)}
        </select>
        <span className="font-mono text-[10px] text-gray-500">{filtered.length} skills shown</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              {["Skill","Frequency","Departments","Rarity","Dept Breakdown"].map(h=>(
                <th key={h} className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s=>{
              const rs=RARITY[s.rarity]||RARITY.common;
              return(
                <tr key={s.skill} className="border-b border-gray-100">
                  <td className="px-3.5 py-3 font-semibold text-[#0B3954] text-[13px]">{s.skill}</td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded overflow-hidden"><div className="h-full rounded" style={{width:`${(s.count/maxCount)*100}%`,background:rs.c}}/></div>
                      <span className="font-mono text-[11px] font-bold text-[#0B3954]">{s.count}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 font-mono text-[11px]">{s.deptCount}/12</td>
                  <td className="px-3.5 py-3"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${rs.cls}`}>{rs.label}</span></td>
                  <td className="px-3.5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {s.depts.slice(0,4).map(d=>(
                        <span key={d} className="text-[8px] px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap"
                          style={{background:(DEPT_COLORS[d]||"#888")+"18",color:DEPT_COLORS[d]||"#888"}}>{d}</span>
                      ))}
                      {s.depts.length>4&&<span className="text-[9px] text-gray-400">+{s.depts.length-4}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3.5 p-3.5 bg-yellow-50 rounded-xl border border-yellow-200 flex gap-2.5">
        <span className="text-base">🎯</span>
        <p className="text-[11px] text-yellow-800 leading-relaxed">
          <strong>{rareCt} rare skills</strong> are under-represented across the org. Consider targeted L&D programmes for skills like{" "}
          <strong>{intel.skillGaps.filter(s=>s.rarity==="rare").slice(0,3).map(s=>s.skill).join(", ")}</strong>.
        </p>
      </div>
    </div>
  );
}

function SeasonalityHeatmap({intel}:{intel:DashboardData["intelligence"]}){
  const [metric,setMetric]=useState<"total"|string>("total");
  const cats=["A","B","C","D","E","F"];
  const CAT_FULL:Record<string,string>={A:"Leadership",B:"Innovation",C:"Customer",D:"Collaboration",E:"Growth",F:"Operations"};
  const months=intel.seasonality;
  const getCellVal=(m:typeof months[0])=>metric==="total"?m.total:(m.byCategory[metric]||0);
  const maxCell=Math.max(...months.map(m=>getCellVal(m)),1);

  const heatColor=(v:number,max:number,catId?:string)=>{
    const t=v/max;
    const baseColor=catId?CAT_COLORS[catId]:"#0B3954";
    if(t===0) return "transparent";
    const hex=baseColor.replace("#","");
    const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
    return `rgba(${r},${g},${b},${0.1+t*0.85})`;
  };

  return(
    <div>
      <div className="bg-gradient-to-br from-indigo-50 to-teal-50 border border-indigo-200 rounded-xl p-3.5 mb-4 flex gap-2.5">
        <span className="text-lg">📅</span>
        <p className="text-[11px] text-[#0B3954] leading-relaxed">
          <strong>Recognition behaviour has seasonal patterns.</strong> Understanding when each category peaks helps HR time manager nudges and review cycles.
        </p>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={()=>setMetric("total")}
          className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${metric==="total"?"bg-[#0B3954] border-[#0B3954] text-white":"bg-white border-gray-200 text-gray-500"}`}>
          Total Volume
        </button>
        {cats.map(c=>(
          <button key={c} onClick={()=>setMetric(c)}
            className="px-3.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all"
            style={{borderColor:metric===c?CAT_COLORS[c]:"#E9ECEF",background:metric===c?CAT_COLORS[c]+"18":"white",color:metric===c?CAT_COLORS[c]:"#6C757D"}}>
            {c}: {CAT_FULL[c]}
          </button>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="grid gap-1" style={{gridTemplateColumns:"80px repeat(12,1fr)",alignItems:"center"}}>
          <div className="font-mono text-[8px] text-gray-500 uppercase">Month</div>
          {months.map(m=>(
            <div key={m.month} className="text-center font-mono text-[9px] text-gray-500 font-medium">{m.monthName}</div>
          ))}
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-wide">Volume</div>
          {months.map(m=>{
            const v=getCellVal(m);const t=v/maxCell;
            return(
              <div key={m.month} className="flex flex-col items-center gap-0.5">
                <div className="w-full h-10 bg-gray-50 rounded-md overflow-hidden flex items-end">
                  <div className="w-full rounded opacity-90 transition-[height] duration-300"
                    style={{height:`${t*100}%`,background:metric==="total"?"#3B5BDB":CAT_COLORS[metric]||"#3B5BDB"}}/>
                </div>
                <span className="font-mono text-[9px] font-bold text-[#0B3954]">{v}</span>
              </div>
            );
          })}
          {cats.map(cat=>(
            <>
              <div key={`l${cat}`} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:CAT_COLORS[cat]}}/>
                <span className="font-mono text-[8px] text-gray-500">{cat}</span>
              </div>
              {months.map(m=>{
                const v=m.byCategory[cat]||0;
                const maxCat=Math.max(...months.map(mo=>mo.byCategory[cat]||0),1);
                const t=v/maxCat;
                const isDom=m.dominantCategory===cat;
                return(
                  <div key={`${cat}${m.month}`} title={`${CAT_FULL[cat]} in ${m.monthName}: ${v} awards`}
                    className="h-6 rounded-md grid place-items-center"
                    style={{background:heatColor(v,maxCat,cat),border:isDom?`1px solid ${CAT_COLORS[cat]}`:"1px solid transparent"}}>
                    {v>0&&<span className="font-mono text-[8px] font-bold" style={{color:t>0.5?"white":"#0B3954"}}>{v}</span>}
                  </div>
                );
              })}
            </>
          ))}
        </div>
        <div className="mt-3.5 flex gap-4 flex-wrap">
          {cats.map(c=>{
            const peakMonth=months.reduce((best,m)=>(m.byCategory[c]||0)>(best.byCategory[c]||0)?m:best,months[0]);
            return(
              <div key={c} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{background:CAT_COLORS[c]}}/>
                <span className="text-[10px] text-gray-500">{CAT_FULL[c]}: peaks <strong className="text-[#0B3954]">{peakMonth?.monthName}</strong></span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OrgConnectors({intel}:{intel:DashboardData["intelligence"]}){
  const [selDept,setSelDept]=useState("All");
  const connectors=intel.orgConnectors;
  const depts=["All",...new Set(connectors.map(c=>c.dept))].sort();
  const filtered=selDept==="All"?connectors:connectors.filter(c=>c.dept===selDept);
  const maxScore=connectors[0]?.collaborationScore||1;

  return(
    <div>
      <div className="bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-200 rounded-xl p-3.5 mb-4 flex gap-2.5">
        <span className="text-lg">🕸️</span>
        <p className="text-[11px] text-[#0B3954] leading-relaxed">
          <strong>Org Connectors are your informal culture brokers</strong> — people who actively recognize colleagues across multiple teams. Losing even one can fragment collaboration patterns.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {label:"Total Connectors",v:connectors.length,sub:"recognized 3+ unique people",c:"text-[#00A98F]"},
          {label:"Cross-Dept Connectors",v:connectors.filter(c=>c.uniqueDeptsReached>=3).length,sub:"reached 3+ departments",c:"text-[#3B5BDB]"},
          {label:"Super Connectors",v:connectors.filter(c=>c.uniquePeopleRecognized>=5).length,sub:"recognized 5+ unique people",c:"text-[#F96400]"},
        ].map(s=>(
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
            <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">{s.label}</div>
            <div className={`font-extrabold text-2xl font-mono ${s.c}`}>{s.v}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-3.5 items-center">
        <select value={selDept} onChange={e=>setSelDept(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[11px] bg-white text-[#0B3954] cursor-pointer">
          {depts.map(d=><option key={d}>{d}</option>)}
        </select>
        <span className="font-mono text-[10px] text-gray-500">{filtered.length} connectors</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {filtered.map(c=>{
          const color=DEPT_COLORS[c.dept]||"#888";
          return(
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-0.5" style={{background:color}}/>
              <div className="pl-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full grid place-items-center font-extrabold text-[10px] font-mono shrink-0"
                    style={{width:32,height:32,background:color+"22",border:`2px solid ${color}`,color}}>
                    {c.name.split(" ").map((n:string)=>n[0]).slice(0,2).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[#0B3954] truncate">{c.name}</div>
                    <div className="text-[9px] text-gray-500">{c.dept}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 mb-2.5">
                  {[{l:"People",v:c.uniquePeopleRecognized},{l:"Depts",v:c.uniqueDeptsReached},{l:"Given",v:c.totalGiven}].map(s=>(
                    <div key={s.l} className="text-center p-1 bg-gray-50 rounded-md">
                      <div className="font-mono text-[7px] text-gray-500 uppercase mb-0.5">{s.l}</div>
                      <div className="font-extrabold text-sm text-[#0B3954]">{s.v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[9px] text-gray-500">Collaboration Score</span>
                    <span className="font-mono text-[9px] font-bold" style={{color}}>{c.collaborationScore}</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full rounded" style={{width:`${(c.collaborationScore/maxScore)*100}%`,background:color}}/>
                  </div>
                </div>
                <div className="font-mono text-[9px] text-gray-400 mt-1">{c.seniority} · {c.title}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ValueEquityAudit({intel}:{intel:DashboardData["intelligence"]}){
  const [view,setView]=useState<"dept"|"seniority">("dept");
  const ve=intel.valueEquity;
  const maxDeptVal=Math.max(...ve.byDept.map(d=>d.total),1);
  const gini=ve.concentration.giniCoeff;
  const equityLevel=gini<0.3?"Highly Equitable":gini<0.45?"Moderately Equitable":"Concentrated";
  const equityColor=gini<0.3?"#27AE60":gini<0.45?"#F39C12":"#E74C3C";
  const equityCls=gini<0.3?"text-green-600":gini<0.45?"text-yellow-500":"text-red-500";

  return(
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">Gini Coefficient</div>
          <div className={`font-extrabold text-2xl font-mono ${equityCls}`}>{gini}</div>
          <div className={`text-[10px] font-semibold mt-1 ${equityCls}`}>{equityLevel}</div>
          <div className="text-[9px] text-gray-400 mt-0.5">0 = perfect equality · 1 = maximum concentration</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">Top 10 Earners</div>
          <div className="font-extrabold text-2xl font-mono text-[#F96400]">{ve.concentration.top10Pct}%</div>
          <div className="text-[10px] text-gray-500 mt-1">${ve.concentration.top10Value.toLocaleString()} of total value</div>
          <div className={`text-[9px] font-semibold mt-0.5 ${ve.concentration.top10Pct<20?"text-green-600":"text-yellow-500"}`}>
            {ve.concentration.top10Pct<20?"Healthy distribution":"Worth reviewing"}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">Dept Value Range</div>
          <div className="font-extrabold text-2xl font-mono text-[#3B5BDB]">
            {Math.round((ve.byDept[0]?.total||0)/(ve.byDept[ve.byDept.length-1]?.total||1)*10)/10}×
          </div>
          <div className="text-[10px] text-gray-500 mt-1">${(ve.byDept[ve.byDept.length-1]?.total||0).toLocaleString()} → ${(ve.byDept[0]?.total||0).toLocaleString()}</div>
        </div>
      </div>
      <div className="flex gap-2 mb-3.5">
        {([{id:"dept" as const,label:"By Department"},{id:"seniority" as const,label:"By Seniority"}]).map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)}
            className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${view===v.id?"bg-[#0B3954] border-[#0B3954] text-white":"bg-white border-gray-200 text-gray-500"}`}>
            {v.label}
          </button>
        ))}
      </div>
      {view==="dept"&&(
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex flex-col gap-3">
            {ve.byDept.map(d=>{
              const color=DEPT_COLORS[d.dept]||"#888";
              return(
                <div key={d.dept}>
                  <div className="flex justify-between mb-1 items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{background:color}}/>
                      <span className="text-xs font-semibold text-[#0B3954]">{d.dept}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="font-mono text-[10px] text-gray-500">${d.perPerson.toLocaleString()}/person</span>
                      <span className="font-mono text-[11px] font-bold" style={{color}}>${d.total.toLocaleString()}</span>
                      <span className="font-mono text-[9px] text-gray-400 w-9 text-right">{d.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full rounded transition-[width] duration-700" style={{width:`${(d.total/maxDeptVal)*100}%`,background:color}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {view==="seniority"&&(
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex flex-col gap-3.5">
            {ve.bySeniority.map((s,i)=>{
              const colors=["#45B7D1","#4ECDC4","#F9CA24","#F96400","#FF6B6B","#6C5CE7"];
              const c=colors[i]||"#888";
              const maxAvg=Math.max(...ve.bySeniority.map(x=>x.avg),1);
              return(
                <div key={s.level}>
                  <div className="flex justify-between mb-1.5 items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{background:c}}/>
                      <span className="text-xs font-semibold text-[#0B3954]">{s.level}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="font-mono text-[10px] text-gray-500">High-value: <strong style={{color:c}}>{s.highValuePct}%</strong></span>
                      <span className="font-mono text-[11px] font-bold" style={{color:c}}>${s.avg} avg</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full rounded" style={{width:`${(s.avg/maxAvg)*100}%`,background:c}}/>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex gap-2">
            <span>⚖️</span>
            <p className="text-[11px] text-[#0B3954] leading-relaxed">
              Gini coefficient of <strong>{gini}</strong> indicates <strong>{equityLevel.toLowerCase()}</strong> value distribution.
              {gini<0.35?" Recognition value is fairly spread — no seniority tier is disproportionately advantaged.":" Consider reviewing whether award value thresholds are calibrated consistently across seniority levels."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function HRIntelligence({data}:{data:DashboardData}){
  const [active,setActive]=useState<"invisible"|"momentum"|"crossdept"|"equity"|"skillgap"|"seasonality"|"connectors"|"valueaudit">("invisible");
  const intel=data.intelligence;
  const TABS=[
    {id:"invisible"   as const,icon:"👁️",label:"Invisible Contributors",sub:`${intel.invisibleContributors.length} at risk`,activeCls:"border-red-500 bg-red-50",labelCls:"text-red-600",subCls:"text-red-400"},
    {id:"momentum"    as const,icon:"📈",label:"Momentum Tracker",       sub:`${intel.risingStars.length} rising`,activeCls:"border-green-500 bg-green-50",labelCls:"text-green-700",subCls:"text-green-400"},
    {id:"crossdept"   as const,icon:"🗺️",label:"Influence Map",          sub:`${intel.crossDeptFlow.length} flows`,activeCls:"border-teal-500 bg-teal-50",labelCls:"text-teal-700",subCls:"text-teal-400"},
    {id:"equity"      as const,icon:"⚖️",label:"Equity Lens",            sub:"6 seniority levels",activeCls:"border-indigo-500 bg-indigo-50",labelCls:"text-indigo-700",subCls:"text-indigo-400"},
    {id:"skillgap"    as const,icon:"🎯",label:"Skill Gap Radar",        sub:`${intel.skillGaps.filter(s=>s.rarity==="rare").length} rare skills`,activeCls:"border-red-400 bg-red-50",labelCls:"text-red-600",subCls:"text-red-300"},
    {id:"seasonality" as const,icon:"📅",label:"Seasonality Heatmap",   sub:"12 months · 6 categories",activeCls:"border-purple-500 bg-purple-50",labelCls:"text-purple-700",subCls:"text-purple-400"},
    {id:"connectors"  as const,icon:"🕸️",label:"Org Connectors",        sub:`${intel.orgConnectors.length} connectors`,activeCls:"border-orange-500 bg-orange-50",labelCls:"text-orange-700",subCls:"text-orange-400"},
    {id:"valueaudit"  as const,icon:"💰",label:"Value Equity Audit",     sub:`Gini ${intel.valueEquity.concentration.giniCoeff}`,activeCls:"border-green-500 bg-green-50",labelCls:"text-green-700",subCls:"text-green-400"},
  ];
  return(
    <div>
      <div className="flex gap-2 flex-wrap mb-5">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActive(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 cursor-pointer transition-all duration-200 ${active===t.id?t.activeCls:"border-gray-200 bg-white"}`}>
            <span className="text-sm">{t.icon}</span>
            <div className="text-left">
              <div className={`text-[11px] font-bold leading-tight ${active===t.id?t.labelCls:"text-[#0B3954]"}`}>{t.label}</div>
              <div className={`font-mono text-[8px] ${active===t.id?t.subCls:"text-gray-400"}`}>{t.sub}</div>
            </div>
          </button>
        ))}
      </div>
      {active==="invisible"  &&<InvisibleRadar intel={intel}/>}
      {active==="momentum"   &&<MomentumTracker intel={intel}/>}
      {active==="crossdept"  &&<CrossDeptMap intel={intel}/>}
      {active==="equity"     &&<EquityLens intel={intel}/>}
      {active==="skillgap"   &&<SkillGapRadar intel={intel}/>}
      {active==="seasonality"&&<SeasonalityHeatmap intel={intel}/>}
      {active==="connectors" &&<OrgConnectors intel={intel}/>}
      {active==="valueaudit" &&<ValueEquityAudit intel={intel}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// EMPLOYEE DIRECTORY
// ══════════════════════════════════════════════════════════════════════════
const STATUS_CONFIG = {
  thriving:         {label:"Thriving",         bg:"#EAFAF1",c:"#27AE60",dot:"#27AE60",cls:"bg-green-50 text-green-700"},
  active:           {label:"Active",           bg:"#E8F8F5",c:"#00A98F",dot:"#00A98F",cls:"bg-teal-50 text-teal-700"},
  passive:          {label:"Passive",          bg:"#FEF9E7",c:"#B7770D",dot:"#F39C12",cls:"bg-yellow-50 text-yellow-700"},
  at_risk:          {label:"At Risk",          bg:"#FFF4EE",c:"#F96400",dot:"#F96400",cls:"bg-orange-50 text-orange-700"},
  never_recognized: {label:"Never Recognized", bg:"#FDEDEC",c:"#E74C3C",dot:"#E74C3C",cls:"bg-red-50 text-red-700"},
};

type SortKey = "name"|"received"|"given"|"engagementScore"|"daysSinceLast";

function SortTh({col,label,sortBy,sortDir,onSort}:{col:SortKey;label:string;sortBy:SortKey;sortDir:1|-1;onSort:(col:SortKey)=>void}){
  return(
    <th className={`px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase font-normal cursor-pointer select-none ${sortBy===col?"text-[#0B3954] bg-blue-50":"text-gray-500 bg-gray-50"}`}
      onClick={()=>onSort(col)}>
      {label}{sortBy===col?(sortDir===-1?" ↓":" ↑"):""}
    </th>
  );
}

function DirCatBar({breakdown}:{breakdown:{id:string;count:number}[]}){
  return(
    <div className="flex h-1.5 rounded overflow-hidden gap-px min-w-[60px]">
      {breakdown.map(c=>(
        <div key={c.id} title={`${CAT_LABELS[c.id]}: ${c.count}`} style={{flex:c.count,background:CAT_COLORS[c.id]||"#ccc"}}/>
      ))}
    </div>
  );
}

function DirPaginationBar({safePage,totalPages,start,end,total,setPage}:{safePage:number;totalPages:number;start:number;end:number;total:number;setPage:(fn:(p:number)=>number|number)=>void}){
  return(
    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-3 flex-wrap">
      <span className="font-mono text-[10px] text-gray-500">{total===0?"No results":`${start}–${end} of ${total} employees`}</span>
      <div className="flex items-center gap-1">
        {[{label:"«",fn:()=>1,dis:safePage===1},{label:"‹",fn:()=>Math.max(1,safePage-1),dis:safePage===1}].map(b=>(
          <button key={b.label} onClick={()=>setPage(()=>b.fn())} disabled={b.dis}
            className={`px-2 py-1 rounded-md border border-gray-200 bg-white font-mono text-[11px] ${b.dis?"text-gray-300 cursor-not-allowed":"text-[#0B3954] cursor-pointer hover:bg-gray-50"}`}>{b.label}</button>
        ))}
        {Array.from({length:totalPages},(_,i)=>i+1)
          .filter(n=>n===1||n===totalPages||Math.abs(n-safePage)<=2)
          .reduce<(number|"…")[]>((acc,n,i,arr)=>{
            if(i>0&&(n as number)-(arr[i-1] as number)>1) acc.push("…");
            acc.push(n); return acc;
          },[])
          .map((n,i)=>
            n==="…"
              ? <span key={`e${i}`} className="px-1.5 font-mono text-[11px] text-gray-400">…</span>
              : <button key={n} onClick={()=>setPage(()=>n as number)}
                  className={`px-2 py-1 min-w-[28px] rounded-md border font-mono text-[11px] cursor-pointer ${safePage===n?"border-teal-500 bg-[#00A98F] text-white font-bold":"border-gray-200 bg-white text-[#0B3954] hover:bg-gray-50"}`}>
                  {n}
                </button>
          )}
        {[{label:"›",fn:()=>Math.min(totalPages,safePage+1),dis:safePage===totalPages},{label:"»",fn:()=>totalPages,dis:safePage===totalPages}].map(b=>(
          <button key={b.label} onClick={()=>setPage(()=>b.fn())} disabled={b.dis}
            className={`px-2 py-1 rounded-md border border-gray-200 bg-white font-mono text-[11px] ${b.dis?"text-gray-300 cursor-not-allowed":"text-[#0B3954] cursor-pointer hover:bg-gray-50"}`}>{b.label}</button>
        ))}
      </div>
      <span className="font-mono text-[10px] text-gray-500">Page {safePage} of {totalPages}</span>
    </div>
  );
}

function EmployeeProfilePanel({p,onClose}:{p:DashboardData["employeeDirectory"][0];onClose:()=>void}){
  const sc=STATUS_CONFIG[p.status];
  const color=DEPT_COLORS[p.dept]||"#888";
  return(
    <div className="flex flex-col gap-3 sticky top-20">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full grid place-items-center font-extrabold shrink-0 font-mono"
            style={{width:52,height:52,background:color+"22",border:`3px solid ${color}`,fontSize:16,color}}>
            {p.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-base text-[#0B3954] tracking-tight">{p.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{p.title}</div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{background:color+"18",color}}>{p.dept}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">{p.seniority}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${sc.cls}`}>{sc.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full border border-gray-200 grid place-items-center cursor-pointer text-gray-500 text-sm bg-gray-50 shrink-0">✕</button>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3.5">
          {[
            {l:"Received",v:p.received,c:p.received>=5?"text-green-600":p.received===0?"text-red-500":"text-[#0B3954]"},
            {l:"Given",v:p.given,c:p.given>=4?"text-teal-600":p.given===0?"text-yellow-600":"text-[#0B3954]"},
            {l:"Total Value",v:`$${p.valueReceived.toLocaleString()}`,c:"text-[#F96400]"},
            {l:"Engagement",v:p.engagementScore+"%",c:p.engagementScore>=70?"text-green-600":p.engagementScore>=40?"text-teal-600":"text-yellow-600"},
          ].map(s=>(
            <div key={s.l} className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="font-mono text-[7px] text-gray-500 uppercase tracking-widest mb-1">{s.l}</div>
              <div className={`font-extrabold text-[15px] ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 rounded-lg border"
          style={{background:p.daysSinceLast>120?"#FDEDEC":p.daysSinceLast>60?"#FEF9E7":"#EAFAF1",borderColor:p.daysSinceLast>120?"#F5B7B1":p.daysSinceLast>60?"#FAD7A0":"#A9DFBF"}}>
          <div className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Last Recognition</div>
          <div className="text-xs font-semibold text-[#0B3954]">
            {p.lastAwardDate?`${p.lastAwardDate} · ${p.daysSinceLast} days ago`:"Never received recognition"}
          </div>
        </div>
      </div>

      {p.skills.length>0&&(
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-2">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {p.skills.map(s=>(
              <span key={s} className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium border border-indigo-200">{s}</span>
            ))}
          </div>
        </div>
      )}

      {p.categoryBreakdown.length>0&&(
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-2.5">Recognition by Category</div>
          <div className="flex flex-col gap-2">
            {p.categoryBreakdown.map(c=>(
              <div key={c.id}>
                <div className="flex justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{background:CAT_COLORS[c.id]||"#888"}}/>
                    <span className="text-[11px] text-[#0B3954] font-medium">{CAT_LABELS[c.id]} ({c.id})</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold" style={{color:CAT_COLORS[c.id]||"#888"}}>{c.count}</span>
                </div>
                <div className="h-1 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full rounded" style={{width:`${(c.count/Math.max(p.received,1))*100}%`,background:CAT_COLORS[c.id]||"#888"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5">
        <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-2.5">
          Recent Recognitions {p.recentAwards.length>0?`· ${p.recentAwards.length} shown`:""}
        </div>
        {p.recentAwards.length===0
          ? <div className="py-3.5 text-center text-gray-500 text-xs bg-gray-50 rounded-lg">No recognitions received yet</div>
          : (
            <div className="flex flex-col gap-2.5">
              {p.recentAwards.map((a,i)=>(
                <div key={i} className="p-3 rounded-lg border"
                  style={{background:i===0?"#E8F8F5":"#F8F9FA",borderColor:i===0?"#B2EBE3":"#E9ECEF"}}>
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
                      style={{background:(CAT_COLORS[a.categoryId]||"#888")+"18",color:CAT_COLORS[a.categoryId]||"#888"}}>
                      {a.category}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500">{a.subcategory}</span>
                  </div>
                  {a.message&&(
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
            {p.status==="never_recognized"
              ?`${p.name.split(" ")[0]} has never received recognition. Reach out to their manager to initiate a recognition this week.`
              :p.status==="at_risk"
              ?`Last recognized ${p.daysSinceLast} days ago — above the 120-day threshold. Prompt their manager to recognise recent contributions.`
              :p.status==="passive"
              ?`${p.name.split(" ")[0]} receives recognition but never gives it. Invite them to a peer recognition training.`
              :p.status==="thriving"
              ?`${p.name.split(" ")[0]} is a strong performer with ${p.received} recognitions. Consider for mentoring roles or promotion pipeline.`
              :`${p.name.split(" ")[0]} is actively engaged — ${p.received} received and ${p.given} given.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmployeeDirectory({data}:{data:DashboardData}){
  const PAGE_SIZE=25;
  const dir=data.employeeDirectory;
  const [selected,setSelected]=useState<string|null>(null);
  const [search,setSearch]=useState("");
  const [deptF,setDeptF]=useState("All");
  const [senF,setSenF]=useState("All");
  const [statusF,setStatusF]=useState("All");
  const [sortBy,setSortBy]=useState<SortKey>("received");
  const [sortDir,setSortDir]=useState<1|-1>(-1);
  const [page,setPage]=useState(1);

  const depts=["All",...Array.from(new Set(dir.map(p=>p.dept))).sort()];
  const seniors=["All","IC","Senior IC","Manager","Senior Manager","Director","VP"];

  const filtered=dir
    .filter(p=>deptF==="All"||p.dept===deptF)
    .filter(p=>senF==="All"||p.seniority===senF)
    .filter(p=>statusF==="All"||p.status===statusF)
    .filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase())||p.title.toLowerCase().includes(search.toLowerCase())||p.skills.some(s=>s.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>{
      const av=a[sortBy] as number|string,bv=b[sortBy] as number|string;
      if(typeof av==="string") return (av as string).localeCompare(bv as string)*sortDir;
      return ((av as number)-(bv as number))*sortDir;
    });

  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const safePage=Math.min(page,totalPages);
  const pageRows=filtered.slice((safePage-1)*PAGE_SIZE,safePage*PAGE_SIZE);
  const start=filtered.length===0?0:(safePage-1)*PAGE_SIZE+1;
  const end=Math.min(safePage*PAGE_SIZE,filtered.length);
  const resetPage=()=>setPage(1);
  const selPerson=selected?dir.find(p=>p.id===selected):null;
  const toggleSort=(col:SortKey)=>{if(sortBy===col)setSortDir(d=>d===1?-1:1);else{setSortBy(col);setSortDir(-1);}resetPage();};

  return(
    <div className="flex flex-col gap-4">
      {/* Status summary */}
      <div className="grid grid-cols-5 gap-2.5">
        {(Object.entries(STATUS_CONFIG) as [string,typeof STATUS_CONFIG["thriving"]][]).map(([k,cfg])=>{
          const count=dir.filter(p=>p.status===k).length;
          return(
            <button key={k} onClick={()=>{setStatusF(statusF===k?"All":k);resetPage();}}
              className="p-2.5 rounded-xl border-2 cursor-pointer text-left transition-all"
              style={{borderColor:statusF===k?cfg.c:"#E9ECEF",background:statusF===k?cfg.bg:"white"}}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full" style={{background:cfg.dot}}/>
                <span className="text-[10px] font-semibold" style={{color:cfg.c}}>{cfg.label}</span>
              </div>
              <div className="font-mono text-xl font-extrabold text-[#0B3954]">{count}</div>
              <div className="font-mono text-[9px] text-gray-500">{Math.round(count/dir.length*100)}% of workforce</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <input value={search} onChange={e=>{setSearch(e.target.value);resetPage();}}
          placeholder="Search name, title, or skill…"
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-[#0B3954] outline-none focus:border-teal-400"/>
        <select value={deptF} onChange={e=>{setDeptF(e.target.value);resetPage();}}
          className="px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] bg-white cursor-pointer text-[#0B3954]">
          {depts.map(d=><option key={d}>{d}</option>)}
        </select>
        <select value={senF} onChange={e=>{setSenF(e.target.value);resetPage();}}
          className="px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] bg-white cursor-pointer text-[#0B3954]">
          {seniors.map(s=><option key={s}>{s}</option>)}
        </select>
        {(search||deptF!=="All"||senF!=="All"||statusF!=="All")&&(
          <button onClick={()=>{setSearch("");setDeptF("All");setSenF("All");setStatusF("All");resetPage();}}
            className="px-3.5 py-2 rounded-lg border border-gray-200 text-[11px] cursor-pointer text-gray-500 bg-white hover:bg-gray-50">
            Clear filters
          </button>
        )}
        <span className="font-mono text-[10px] text-gray-500 ml-auto">{filtered.length} of {dir.length} employees</span>
      </div>

      {/* Table + panel */}
      <div className={`grid gap-4 items-start ${selPerson?"grid-cols-[1fr_420px]":"grid-cols-1"}`}>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={`px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase font-normal cursor-pointer select-none ${sortBy==="name"?"text-[#0B3954] bg-blue-50":"text-gray-500 bg-gray-50"}`}
                  onClick={()=>toggleSort("name")}>Name{sortBy==="name"?(sortDir===-1?" ↓":" ↑"):""}</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Department</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Title & Seniority</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Skills</th>
                <SortTh col="received"        label="Received"   sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}/>
                <SortTh col="given"           label="Given"      sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}/>
                <SortTh col="engagementScore" label="Engagement" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}/>
                <SortTh col="daysSinceLast"   label="Last Rec."  sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}/>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Categories</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal bg-gray-50">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(p=>{
                const sc=STATUS_CONFIG[p.status];
                const isSel=selected===p.id;
                const depColor=DEPT_COLORS[p.dept]||"#888";
                return(
                  <tr key={p.id} onClick={()=>setSelected(isSel?null:p.id)}
                    className="border-b border-gray-100 cursor-pointer hover:bg-orange-50 transition-colors"
                    style={{background:isSel?"#E8F8F5":undefined,borderLeft:isSel?"3px solid #00A98F":"3px solid transparent"}}>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full grid place-items-center font-bold font-mono shrink-0 text-[10px]"
                          style={{width:30,height:30,background:depColor+"22",border:`2px solid ${depColor}`,color:depColor}}>
                          {p.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                        </div>
                        <span className="font-semibold text-[#0B3954] text-xs">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-xl font-semibold"
                        style={{background:depColor+"18",color:depColor}}>{p.dept}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="text-[11px] text-[#0B3954] font-medium">{p.title}</div>
                      <div className="text-[9px] text-gray-500 font-mono mt-0.5">{p.seniority}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex gap-1 flex-wrap max-w-[140px]">
                        {p.skills.slice(0,2).map(s=>(
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 whitespace-nowrap">{s}</span>
                        ))}
                        {p.skills.length>2&&<span className="text-[9px] text-gray-400">+{p.skills.length-2}</span>}
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-base font-extrabold"
                        style={{color:p.received>=5?"#27AE60":p.received===0?"#E74C3C":"#0B3954"}}>{p.received}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-base font-extrabold"
                        style={{color:p.given>=4?"#00A98F":p.given===0?"#F39C12":"#0B3954"}}>{p.given}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="relative w-9 h-9">
                        <svg width={36} height={36} viewBox="0 0 36 36">
                          <circle cx={18} cy={18} r={14} fill="none" stroke="#E9ECEF" strokeWidth={4}/>
                          <circle cx={18} cy={18} r={14} fill="none"
                            stroke={p.engagementScore>=70?"#27AE60":p.engagementScore>=40?"#00A98F":"#F39C12"}
                            strokeWidth={4}
                            strokeDasharray={`${p.engagementScore/100*88} 88`}
                            strokeLinecap="round"
                            transform="rotate(-90 18 18)"/>
                        </svg>
                        <div className="absolute inset-0 grid place-items-center font-mono text-[8px] font-bold text-[#0B3954]">{p.engagementScore}</div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-[11px]"
                        style={{color:p.daysSinceLast>120?"#E74C3C":p.daysSinceLast>60?"#F39C12":"#00A98F"}}>
                        {p.received===0?"—":p.daysSinceLast===999?"—":`${p.daysSinceLast}d ago`}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      {p.categoryBreakdown.length>0?<DirCatBar breakdown={p.categoryBreakdown}/>:<span className="text-gray-400 text-[10px]">—</span>}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${sc.cls}`}>{sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <DirPaginationBar safePage={safePage} totalPages={totalPages} start={start} end={end} total={filtered.length} setPage={setPage}/>
        </div>
        {selPerson&&<EmployeeProfilePanel p={selPerson} onClose={()=>setSelected(null)}/>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
export function HRDashboardClient({data}:{data:DashboardData}){
  type Tab="overview"|"departments"|"recognition"|"people"|"intelligence";
  const [tab,setTab]=useState<Tab>("overview");

  const NAV=[
    {id:"overview"     as Tab,label:"Overview",            icon:"⊞"},
    {id:"people"       as Tab,label:"People",              icon:"◎"},
    {id:"departments"  as Tab,label:"Departments",          icon:"◫"},
    {id:"recognition"  as Tab,label:"Recognition Activity", icon:"◈"},
    {id:"intelligence" as Tab,label:"HR Intelligence",      icon:"🧠",isNew:true},
  ];

  const wf=data.workforce;
  const maxMo=data.monthly.length>0?Math.max(...data.monthly.map(d=>d.awards)):1;
  const minMo=data.monthly.length>0?Math.min(...data.monthly.map(d=>d.awards)):0;

  /* SVG line chart */
  const LineChart=({d,color="#F96400"}:{d:DashboardData["monthly"];color?:string})=>{
    const [tip,setTip]=useState<{x:number;y:number;d:DashboardData["monthly"][0]}|null>(null);
    if(!d||d.length===0) return <div className="h-36 grid place-items-center text-gray-400 text-[11px]">No data</div>;
    const W=700,H=140,px=24,py=16;
    const vals=d.map(x=>x.awards);
    const mx=Math.max(...vals,1),mn=Math.min(...vals);
    const rng=mx-mn||1;
    const pts=d.map((x,i)=>({x:px+(i/Math.max(d.length-1,1))*(W-px*2),y:py+(1-(x.awards-mn)/rng)*(H-py*2),d:x}));
    if(!pts.length) return null;
    const line=pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const last=pts[pts.length-1],first=pts[0];
    const area=`${line} L${last.x},${H} L${first.x},${H} Z`;
    return(
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{height:140}}>
        <defs><linearGradient id="lc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        {[0,.5,1].map(t=>{const y=py+t*(H-py*2);return<line key={t} x1={px} y1={y} x2={W-px} y2={y} stroke="#E9ECEF" strokeWidth="1"/>;})}
        <path d={area} fill="url(#lc1)"/>
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2" style={{opacity:tip?.d.month===p.d.month?1:.35,transition:"opacity .15s"}}/>
            <rect x={p.x-16} y={0} width={32} height={H} fill="transparent" onMouseEnter={()=>setTip(p)} onMouseLeave={()=>setTip(null)}/>
            <text x={p.x} y={H+3} textAnchor="middle" fill="#ADB5BD" fontSize="9" fontFamily="monospace">{(p.d.label||"").slice(0,3)}</text>
          </g>
        ))}
        {tip&&<g>
          <rect x={Math.min(tip.x-44,W-92)} y={tip.y-48} width={88} height={36} rx="8" fill="#0B3954"/>
          <text x={Math.min(tip.x,W-48)} y={tip.y-28} textAnchor="middle" fill={color} fontSize="13" fontFamily="monospace" fontWeight="600">{tip.d.awards}</text>
          <text x={Math.min(tip.x,W-48)} y={tip.y-15} textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="8" fontFamily="monospace">{tip.d.label}</text>
        </g>}
      </svg>
    );
  };

  /* Coverage donut */
  const CoverageDonut=({pct,color,label}:{pct:number;color:string;label:string})=>{
    const r=42,cx=52,cy=52,circ=2*Math.PI*r;
    const dash=circ*(pct/100),gap=circ-dash;
    return(
      <div className="flex items-center gap-4">
        <svg width={104} height={104} className="shrink-0">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E9ECEF" strokeWidth="10"/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dasharray .8s cubic-bezier(.22,.68,0,1.2)"}}/>
          <text x={cx} y={cy-6} textAnchor="middle" fill="#0B3954" fontSize="18" fontWeight="800" fontFamily="monospace">{pct}%</text>
          <text x={cx} y={cy+10} textAnchor="middle" fill="#ADB5BD" fontSize="8" fontFamily="monospace">{label}</text>
        </svg>
      </div>
    );
  };

  return(
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <aside className="w-[230px] shrink-0 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-5 pb-3.5 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <img src="/Northeastern Logo.png" alt="Northeastern University" className="w-9 h-9 object-contain shrink-0"/>
            <div>
              <div className="font-extrabold text-[15px] text-[#0B3954]">Capstone</div>
              <div className="font-mono text-[9px] text-gray-500 tracking-widest uppercase">Master&apos;s Project</div>
            </div>
          </div>
        </div>
        <nav className="px-2 py-2.5 flex-1">
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-gray-400 px-1.5 py-2">Workforce</div>
          {NAV.filter(n=>!n.isNew).map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 border-none ${tab===n.id?"bg-orange-50 text-[#F96400] font-bold":"text-gray-500 hover:bg-orange-50 hover:text-[#F96400]"}`}>
              <span className="text-[13px] w-4 text-center">{n.icon}</span>{n.label}
            </button>
          ))}
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-gray-400 px-1.5 pt-4 pb-1 flex items-center gap-1.5">
            Intelligence
            <span className="bg-[#F96400] text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
          </div>
          {NAV.filter(n=>n.isNew).map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 border-none ${tab===n.id?"bg-orange-50 text-[#F96400] font-bold":"text-gray-500 hover:bg-orange-50 hover:text-[#F96400]"}`}>
              <span className="text-[13px] w-4 text-center">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="px-3.5 py-3 border-t border-gray-200 font-mono text-[9px] text-gray-400">
          <div>{wf.totalPeople} employees · {data.kpi.uniqueDepartments} depts</div>
          <div className="mt-0.5">FY 2025 · 1,000 recognitions</div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-7 shrink-0">
          <div>
            <div className="text-[15px] font-bold text-[#0B3954]">{NAV.find(n=>n.id===tab)?.label}</div>
            <div className="font-mono text-[10px] text-gray-500 mt-0.5">{wf.totalPeople} employees · {wf.coveragePct}% recognition coverage · FY 2025</div>
          </div>
          <div className="px-3 py-1.5 bg-teal-50 rounded-lg font-mono text-[10px] text-[#00A98F] font-semibold">HR ANALYTICS</div>
        </header>

        <main className="flex-1 px-7 py-6 overflow-y-auto">

          {/* ── KPI STRIP ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2.5 mb-6">
            <div className="flex gap-1.5 items-center mb-0.5">
              <div className="font-mono text-[8px] tracking-[.14em] uppercase text-gray-400">Workforce Health</div>
              <div className="flex-1 h-px bg-gray-200"/>
            </div>
            <div className="grid grid-cols-6 gap-2.5 mb-1.5">
              {[
                {eye:"Total Employees",  v:wf.totalPeople,              a:"text-[#0B3954]",  bar:"#0B3954"},
                {eye:"Departments",      v:data.kpi.uniqueDepartments,  a:"text-[#3B5BDB]",  bar:"#3B5BDB"},
                {eye:"High Performers",  v:data.kpi.highPerformers,     a:"text-green-600",  bar:"#27AE60"},
                {eye:"Culture Carriers", v:data.kpi.cultureCarriers,    a:"text-teal-600",   bar:"#00A98F"},
                {eye:"At Risk",          v:data.kpi.atRiskCount,        a:"text-[#F39C12]",  bar:"#F39C12"},
                {eye:"Never Recognized", v:data.kpi.neverRecognizedCount,a:"text-red-500",   bar:"#E74C3C"},
              ].map((k,i)=>(
                <div key={k.eye} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{background:`linear-gradient(90deg,${k.bar},${k.bar}55)`}}/>
                  <div className="font-mono text-[8px] tracking-widest uppercase text-gray-500 mb-1.5 leading-tight">{k.eye}</div>
                  <div className={`text-[22px] font-extrabold leading-none tracking-tight ${k.a}`}><Num to={k.v}/></div>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 items-center mb-0.5">
              <div className="font-mono text-[8px] tracking-[.14em] uppercase text-gray-400">Organisation Dynamics</div>
              <div className="flex-1 h-px bg-gray-200"/>
            </div>
            <div className="grid grid-cols-6 gap-2.5">
              {[
                {eye:"Recognition Cover",v:wf.coveragePct,             suf:"%",  bar:"#00A98F"},
                {eye:"Participation",    v:wf.participationPct,         suf:"%",  bar:"#27AE60"},
                {eye:"Cross-Dept Rate",  v:data.kpi.crossDeptPct,       suf:"%",  bar:"#3B5BDB"},
                {eye:"Peer Recognition", v:data.kpi.peerRecognitionPct, suf:"%",  bar:"#8E44AD"},
                {eye:"IC Ratio",         v:data.kpi.icRatio,            suf:"%",  bar:"#0B3954"},
                {eye:"MoM Trend",        v:Math.abs(data.kpi.momTrend), suf:`% ${data.kpi.momTrend>=0?"▲":"▼"}`, bar:data.kpi.momTrend>=0?"#27AE60":"#E74C3C"},
              ].map((k,i)=>(
                <div key={k.eye} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{background:`linear-gradient(90deg,${k.bar},${k.bar}55)`}}/>
                  <div className="font-mono text-[8px] tracking-widest uppercase text-gray-500 mb-1.5 leading-tight">{k.eye}</div>
                  <div className="text-[22px] font-extrabold text-[#0B3954] leading-none tracking-tight">
                    <Num to={k.v}/><span className="text-[13px] font-semibold" style={{color:k.bar}}>{k.suf}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── OVERVIEW ──────────────────────────────────────────────── */}
          {tab==="overview"&&<div className="flex flex-col gap-4">
            {wf.coveragePct<80&&(
              <div className="p-3.5 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-2.5">
                <span className="text-lg">⚠️</span>
                <p className="text-xs text-yellow-800 leading-relaxed">
                  <strong>{wf.neverRecognized} employees ({100-wf.coveragePct}% of workforce)</strong> have not received any recognition this year. Target: 90%+ coverage.
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <SH eye="Workforce Coverage" title="Recognition Reach" eyeColorCls="text-[#00A98F]"/>
                <div className="flex gap-5 items-center">
                  <CoverageDonut pct={wf.coveragePct} color="#00A98F" label="covered"/>
                  <div className="flex-1 flex flex-col gap-2.5">
                    {[{label:"Recognized",v:wf.totalPeople-wf.neverRecognized,c:"#00A98F"},{label:"Never recognized",v:wf.neverRecognized,c:"#E74C3C"}].map(s=>(
                      <div key={s.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px] text-[#0B3954] font-medium">{s.label}</span>
                          <span className="font-mono text-[11px] font-bold" style={{color:s.c}}>{s.v}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                          <div className="h-full rounded" style={{width:`${s.v/wf.totalPeople*100}%`,background:s.c}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <SH eye="Peer Participation" title="Who Gives Recognition" eyeColorCls="text-[#27AE60]"/>
                <div className="flex gap-5 items-center">
                  <CoverageDonut pct={wf.participationPct} color="#27AE60" label="participate"/>
                  <div className="flex-1 flex flex-col gap-2.5">
                    {[{label:"Active nominators",v:wf.totalPeople-wf.neverGiven,c:"#27AE60"},{label:"Never nominated anyone",v:wf.neverGiven,c:"#F39C12"}].map(s=>(
                      <div key={s.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px] text-[#0B3954] font-medium">{s.label}</span>
                          <span className="font-mono text-[11px] font-bold" style={{color:s.c}}>{s.v}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                          <div className="h-full rounded" style={{width:`${s.v/wf.totalPeople*100}%`,background:s.c}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <SH eye="Seniority Breakdown" title="Workforce Composition" eyeColorCls="text-[#3B5BDB]"/>
                <div className="flex flex-col gap-2">
                  {wf.bySeniority.map((s,i)=>{
                    const colors=["#45B7D1","#4ECDC4","#F9CA24","#F96400","#FF6B6B","#6C5CE7"];
                    const c=colors[i]||"#888";
                    return(
                      <div key={s.level} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{background:c}}/>
                        <span className="text-[11px] flex-1 text-[#0B3954] font-medium">{s.level}</span>
                        <span className="font-mono text-[10px] text-gray-500 w-6 text-right">{s.headcount}</span>
                        <span className="font-mono text-[9px] text-gray-400 w-8 text-right">{Math.round(s.headcount/wf.totalPeople*100)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="grid gap-4" style={{gridTemplateColumns:"2fr 1fr"}}>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <SH eye="Trend" title="Monthly Recognition Activity"
                  right={<span className="font-mono text-[10px] text-gray-500">Peak {maxMo} · Low {minMo}</span>}/>
                <LineChart d={data.monthly}/>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <SH eye="Recognition Reach by Level" title="Seniority Coverage" eyeColorCls="text-[#8E44AD]"/>
                <div className="flex flex-col gap-2.5">
                  {wf.bySeniority.map((s,i)=>{
                    const colors=["#45B7D1","#4ECDC4","#F9CA24","#F96400","#FF6B6B","#6C5CE7"];
                    const c=colors[i]||"#888";
                    return(
                      <div key={s.level}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[11px] text-[#0B3954] font-medium">{s.level}</span>
                          <span className="font-mono text-[10px] font-bold" style={{color:s.coveragePct>=85?c:"#E74C3C"}}>{s.coveragePct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                          <div className="h-full rounded" style={{width:`${s.coveragePct}%`,background:c}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>}

          {/* ── DEPARTMENTS ────────────────────────────────────────────── */}
          {tab==="departments"&&<div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {wf.byDept.map(d=>{
                const color=DEPT_COLORS[d.dept]||"#888";
                const covColor=d.coveragePct>=90?"#27AE60":d.coveragePct>=75?"#F39C12":"#E74C3C";
                return(
                  <div key={d.dept} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:color}}/>
                      <span className="font-bold text-[13px] text-[#0B3954]">{d.dept}</span>
                      <span className="font-mono text-[9px] text-gray-500 ml-auto">{d.headcount} people</span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-500">Recognition coverage</span>
                        <span className="font-mono text-[10px] font-bold" style={{color:covColor}}>{d.coveragePct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                        <div className="h-full rounded transition-[width] duration-700" style={{width:`${d.coveragePct}%`,background:covColor}}/>
                      </div>
                    </div>
                    <div className="mb-2.5">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-500">Peer participation</span>
                        <span className="font-mono text-[10px] font-bold text-[#00A98F]">{d.participationPct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                        <div className="h-full rounded bg-[#00A98F] transition-[width] duration-700" style={{width:`${d.participationPct}%`}}/>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[{l:"Avg awards",v:`${d.avgAwards}×`},{l:"Recognized",v:d.recognized},{l:"Unrecognized",v:d.headcount-d.recognized}].map(s=>(
                        <div key={s.l} className="text-center p-1.5 bg-gray-50 rounded-lg">
                          <div className="font-mono text-[7px] text-gray-500 uppercase mb-0.5">{s.l}</div>
                          <div className="font-bold text-[13px] text-[#0B3954]">{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-200"><SH eye="Summary" title="Department Recognition Health"/></div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    {["#","Department","Headcount","Coverage","Participation","Avg Awards","Recognized","Unrecognized"].map(h=>(
                      <th key={h} className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wf.byDept.map((d,i)=>{
                    const covColor=d.coveragePct>=90?"text-green-600":d.coveragePct>=75?"text-yellow-600":"text-red-500";
                    return(
                      <tr key={d.dept} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                        <td className="px-3.5 py-3 font-mono text-[11px] text-gray-400">{String(i+1).padStart(2,"0")}</td>
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{background:DEPT_COLORS[d.dept]||"#888"}}/>
                            <span className="font-semibold">{d.dept}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 font-mono">{d.headcount}</td>
                        <td className="px-3.5 py-3"><span className={`font-bold font-mono ${covColor}`}>{d.coveragePct}%</span></td>
                        <td className="px-3.5 py-3"><span className="font-bold font-mono text-teal-600">{d.participationPct}%</span></td>
                        <td className="px-3.5 py-3"><span className="font-mono">{d.avgAwards}×</span></td>
                        <td className="px-3.5 py-3"><span className="font-mono text-green-600">{d.recognized}</span></td>
                        <td className="px-3.5 py-3"><span className={`font-mono ${d.headcount-d.recognized>0?"text-red-500":"text-gray-400"}`}>{d.headcount-d.recognized}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>}

          {/* ── RECOGNITION ACTIVITY ───────────────────────────────────── */}
          {tab==="recognition"&&<div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <SH eye="Behaviours Valued" title="Recognition by Category"/>
                <div className="flex flex-col gap-2.5">
                  {data.categories.map(c=>(
                    <div key={c.id}>
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:CAT_COLORS[c.id]||"#888"}}/>
                          <span className="text-xs font-medium text-[#0B3954]">{c.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-gray-500">{c.count} · {c.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                        <div className="h-full rounded transition-[width] duration-700" style={{width:`${c.pct}%`,background:CAT_COLORS[c.id]||"#F96400"}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <SH eye="Detail" title="Top Behaviour Subcategories"/>
                <div className="flex flex-col gap-2">
                  {data.subcategories.slice(0,10).map(s=>(
                    <div key={s.id} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded grid place-items-center shrink-0" style={{background:CAT_COLORS[s.categoryId]||"#888"}}>
                        <span className="font-mono text-[8px] text-white font-bold">{s.id}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[11px] text-[#0B3954] font-medium">{s.name}</span>
                          <span className="font-mono text-[10px] text-gray-500">{s.count}</span>
                        </div>
                        <div className="h-1 bg-gray-200 rounded overflow-hidden">
                          <div className="h-full rounded" style={{width:`${(s.count/(data.subcategories[0]?.count||1))*100}%`,background:CAT_COLORS[s.categoryId]||"#888"}}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <SH eye="Activity Trend" title="Recognition Frequency Over Time"
                right={<span className="font-mono text-[10px] text-gray-500">Peak {maxMo} · Low {minMo} events/month</span>}/>
              <LineChart d={data.monthly} color="#00A98F"/>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <SH eye="Culture Builders" title="Most Active Recognition Contributors"
                right={<span className="font-mono text-[10px] text-gray-500">people who actively nominate peers</span>}/>
              <div className="grid grid-cols-5 gap-2.5">
                {data.topNominators.slice(0,5).map((n,i)=>(
                  <div key={n.id} className="p-3.5 rounded-xl border"
                    style={{background:i===0?"#E8F8F5":"#F8F9FA",borderColor:i===0?"#B2EBE3":"#E9ECEF"}}>
                    <div className="font-mono text-[8px] uppercase tracking-widest mb-1.5"
                      style={{color:i===0?"#00A98F":"#ADB5BD"}}>
                      {i===0?"🌟 Champion":`#${i+1}`}
                    </div>
                    <div className="text-[11px] font-bold text-[#0B3954] mb-0.5">{n.name}</div>
                    <div className="text-[10px] text-gray-500 mb-2">{n.dept}</div>
                    <div className="font-mono text-lg font-extrabold" style={{color:i===0?"#00A98F":"#0B3954"}}>{n.nominations}</div>
                    <div className="font-mono text-[9px] text-gray-500">recognitions given</div>
                  </div>
                ))}
              </div>
            </div>
          </div>}

          {tab==="people"       &&<div><EmployeeDirectory data={data}/></div>}
          {tab==="intelligence" &&<div><HRIntelligence data={data}/></div>}

        </main>
      </div>
    </div>
  );
}