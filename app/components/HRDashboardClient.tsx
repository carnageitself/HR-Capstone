"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#F8F9FA;color:#0B3954;font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
button{font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;background:none;border:none;}
:root{
  --orange:#F96400;--orange-lt:#FFF4EE;--orange-md:#FDDCC9;
  --teal:#00A98F;--teal-lt:#E8F8F5;--teal-md:#B2EBE3;
  --navy:#0B3954;--white:#FFFFFF;--bg:#F8F9FA;
  --border:#E9ECEF;--border2:#DEE2E6;
  --muted:#6C757D;--muted2:#ADB5BD;
  --red:#E74C3C;--red-lt:#FDEDEC;
  --amber:#F39C12;--amber-lt:#FEF9E7;
  --purple:#8E44AD;--purple-lt:#F5EEF8;
  --green:#27AE60;--green-lt:#EAFAF1;
  --indigo:#3B5BDB;--indigo-lt:#EDF2FF;
  --mono:'JetBrains Mono',monospace;
  --sans:'Plus Jakarta Sans',sans-serif;
  --r:12px;--rs:8px;
  --sh:0 1px 3px rgba(11,57,84,.06),0 1px 2px rgba(11,57,84,.04);
  --sh2:0 4px 12px rgba(11,57,84,.08),0 2px 4px rgba(11,57,84,.04);
  --sh3:0 12px 30px rgba(11,57,84,.12),0 4px 8px rgba(11,57,84,.06);
}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes pop{0%{transform:scale(.92)}60%{transform:scale(1.04)}100%{transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
.au{animation:fadeUp .45s cubic-bezier(.22,.68,0,1.2) forwards;opacity:0;}
.au2{animation:fadeUp .45s cubic-bezier(.22,.68,0,1.2) .08s forwards;opacity:0;}
.au3{animation:fadeUp .45s cubic-bezier(.22,.68,0,1.2) .16s forwards;opacity:0;}
.au4{animation:fadeUp .45s cubic-bezier(.22,.68,0,1.2) .24s forwards;opacity:0;}
.au5{animation:fadeUp .45s cubic-bezier(.22,.68,0,1.2) .32s forwards;opacity:0;}
.card{background:var(--white);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh);transition:box-shadow .2s,border-color .2s;}
.card:hover{box-shadow:var(--sh2);}
.nav-link{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:var(--rs);font-size:13px;font-weight:500;color:var(--muted);cursor:pointer;transition:all .15s;border:none;width:100%;text-align:left;}
.nav-link:hover{background:var(--orange-lt);color:var(--orange);}
.nav-link.active{background:var(--orange-lt);color:var(--orange);font-weight:700;}
.tbl{width:100%;border-collapse:collapse;font-size:12px;}
.tbl thead tr{border-bottom:2px solid var(--border);}
.tbl th{padding:10px 14px;text-align:left;font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:400;background:#FAFBFC;}
.tbl tbody tr{border-bottom:1px solid var(--border);transition:background .1s;}
.tbl tbody tr:hover{background:var(--orange-lt);}
.tbl td{padding:12px 14px;vertical-align:middle;}
.wh-gem{width:32px;height:32px;flex-shrink:0;background:linear-gradient(135deg,var(--orange),#FF8C42);clip-path:polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%);}
.tab-pill{padding:7px 14px;border-radius:20px;font-size:11px;font-weight:600;color:var(--muted);transition:all .2s;border:1px solid var(--border);}
.tab-pill.on{background:var(--navy);color:#fff;border-color:var(--navy);}
.tab-pill:hover:not(.on){background:var(--border);color:var(--navy);}
.chip{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;white-space:nowrap;}
`;

/* ── CAT colours matching taxonomy ───────────────────────────────────────── */
const CAT_COLORS: Record<string,string> = {
  A:"#FF6B6B", B:"#4ECDC4", C:"#95E1D3", D:"#F9CA24", E:"#6C5CE7", F:"#A29BFE",
};

const CAT_LABELS: Record<string,string> = {
  A:"Leadership", B:"Innovation", C:"Customer", D:"Collaboration", E:"Growth", F:"Operations",
};

/* ── Dept colours ─────────────────────────────────────────────────────────── */
const DEPT_COLORS: Record<string,string> = {
  Marketing:"#FD79A8","Data Science":"#4ECDC4",Finance:"#FFEAA7",
  "Customer Service":"#FF6B6B",Product:"#00CEC9",Design:"#45B7D1",
  Sales:"#FDCB6E",Legal:"#A29BFE",HR:"#DDA15E",IT:"#6C5CE7",
  Engineering:"#96CEB4",Operations:"#74B9FF",
};

/* ── shared helpers ───────────────────────────────────────────────────────── */
function Num({to,pre="",suf="",dur=1200}:{to:number;pre?:string;suf?:string;dur?:number}){
  const [v,setV]=useState(0);
  useEffect(()=>{
    let s:number|null=null;
    const t=(ts:number)=>{if(!s)s=ts;const p=Math.min((ts-s)/dur,1),e=1-Math.pow(1-p,3);setV(Math.round(e*to));if(p<1)requestAnimationFrame(t);else setV(to);};
    requestAnimationFrame(t);
  },[to]);
  const f=pre==="$"?v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}K`:`$${v}`:`${pre}${v.toLocaleString()}${suf}`;
  return <span>{f}</span>;
}

function Bar({label,value,max,right,color="orange",h=6,delay=0}:{label:string;value:number;max:number;right:string;color?:string;h?:number;delay?:number}){
  const pct=Math.round((value/Math.max(max,1))*100);
  const bgs:Record<string,string>={
    orange:"linear-gradient(90deg,#F96400,#FFAB73)",
    teal:"linear-gradient(90deg,#00A98F,#4DD9C5)",
    purple:"linear-gradient(90deg,#8E44AD,#BB8FCE)",
    green:"linear-gradient(90deg,#27AE60,#58D68D)",
    navy:"linear-gradient(90deg,#0B3954,#1A5276)",
    indigo:"linear-gradient(90deg,#3B5BDB,#74C0FC)",
  };
  return(
    <div style={{animationDelay:`${delay}s`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:12,color:"#343A40",fontWeight:500}}>{label}</span>
        <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>{right}</span>
      </div>
      <div style={{height:h,background:"var(--border)",borderRadius:h,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:bgs[color]||color,borderRadius:h,transition:"width 1s cubic-bezier(.22,.68,0,1.2)"}}/>
      </div>
    </div>
  );
}

function SH({eye,title,right,eyeColor="var(--orange)"}:{eye:string;title:string;right?:React.ReactNode;eyeColor?:string}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:22}}>
      <div>
        <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".18em",textTransform:"uppercase",color:eyeColor,marginBottom:6,fontWeight:500}}>{eye}</div>
        <div style={{fontSize:17,fontWeight:700,color:"var(--navy)",letterSpacing:"-.02em"}}>{title}</div>
      </div>
      {right&&<div>{right}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NETWORK GRAPH
══════════════════════════════════════════════════════════════════════════ */
/* ── NetworkGraph simulation node (base node + physics fields) ───────────── */
type NetNodeBase = DashboardData["network"]["nodes"][0];
type SimNode = NetNodeBase & { x:number; y:number; vx:number; vy:number; radius:number };
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
      const angle=(i/data.network.nodes.length)*Math.PI*2;
      const r=150;
      return{...n,x:W/2+Math.cos(angle)*r+(Math.random()-0.5)*80,y:H/2+Math.sin(angle)*r+(Math.random()-0.5)*80,vx:0,vy:0,radius:Math.max(5,Math.min(14,4+(n.received||0)/2))};
    });
    nodesRef.current=nodes;
    edgesRef.current=data.network.edges;
  },[data.network]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d")!;
    const W=canvas.width, H=canvas.height;
    const tick=()=>{
      const nodes=nodesRef.current;
      const edges=edgesRef.current;
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
      <SH eye="Social Graph" title="Recognition Network" eyeColor="var(--teal)"
        right={<div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>
          {data.network?.nodes.length} people · {data.network?.edges.length} connections · drag nodes
        </div>}/>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        <button className={`tab-pill${filter==="all"?" on":""}`} onClick={()=>setFilter("all")}>All Depts</button>
        {activeDepts.map(d=>(
          <button key={d} className={`tab-pill${filter===d?" on":""}`}
            onClick={()=>setFilter(filter===d?"all":d)}
            style={{borderColor:(DEPT_COLORS[d]||"#888")+"66",color:filter===d?"#fff":DEPT_COLORS[d]||"#888",background:filter===d?DEPT_COLORS[d]||"#888":"transparent"}}>
            {d}
          </button>
        ))}
      </div>
      <div style={{position:"relative",borderRadius:"var(--rs)",overflow:"hidden",border:"1px solid var(--border)",background:"linear-gradient(135deg,#FAFBFC,#F0F4F8)"}}>
        <canvas ref={canvasRef} width={780} height={400} style={{width:"100%",height:400,cursor:dragging?"grabbing":hovered?"grab":"default"}}
          onMouseMove={handleMouseMove} onMouseDown={handleMouseDown}
          onMouseUp={()=>setDragging(null)} onMouseLeave={()=>setDragging(null)}/>
        {hovered&&(
          <div style={{position:"absolute",top:12,right:12,background:"var(--white)",border:"1px solid var(--border)",borderRadius:"var(--rs)",padding:"14px 16px",boxShadow:"var(--sh2)",minWidth:200,pointerEvents:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:hovered.color||DEPT_COLORS[hovered.dept]||"#888",flexShrink:0}}/>
              <span style={{fontWeight:700,fontSize:14,color:"var(--navy)"}}>{hovered.name}</span>
            </div>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>{hovered.dept}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)",marginBottom:10}}>{hovered.title} · {hovered.seniority}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[
                {l:"Received",v:hovered.received,c:"var(--orange)"},
                {l:"Given",v:hovered.given,c:"var(--teal)"},
                {l:"Value",v:`$${(hovered.totalValue||0).toLocaleString()}`,c:"var(--navy)"},
              ].map(s=>(
                <div key={s.l} style={{padding:"7px 9px",background:"var(--bg)",borderRadius:6}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",marginBottom:3}}>{s.l.toUpperCase()}</div>
                  <div style={{fontWeight:700,fontSize:15,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:8,padding:"5px 9px",background:hovered.given>hovered.received?"var(--teal-lt)":hovered.received>hovered.given?"var(--orange-lt)":"var(--bg)",borderRadius:6,fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)"}}>
              {hovered.given>hovered.received?"🌟 Culture carrier":hovered.received>hovered.given*2?"⭐ Star recipient":"⚖️ Balanced"}
            </div>
          </div>
        )}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:12}}>
        {activeDepts.map(d=>(
          <div key={d} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:DEPT_COLORS[d]||"#888"}}/>
            <span style={{fontSize:11,color:"var(--muted)"}}>{d}</span>
          </div>
        ))}
        <div style={{marginLeft:"auto",fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)"}}>Node size = awards received · Scroll to zoom</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CULTURE HEALTH SCORECARD
══════════════════════════════════════════════════════════════════════════ */
function HealthScorecard({data}:{data:DashboardData}){
  const [selected,setSelected]=useState<string|null>(data.cultureHealth[0]?.name||null);
  const depts=data.cultureHealth;

  const scoreColor=(s:number)=>s>=80?"var(--green)":s>=65?"var(--teal)":s>=50?"var(--amber)":"var(--red)";
  const scoreBg=(s:number)=>s>=80?"var(--green-lt)":s>=65?"var(--teal-lt)":s>=50?"var(--amber-lt)":"var(--red-lt)";
  const scoreLabel=(s:number)=>s>=80?"Thriving":s>=65?"Healthy":s>=50?"Developing":"Needs Focus";

  const sel=depts.find(d=>d.name===selected)||depts[0];

  const SCORE_DIMS=[
    {key:"diversity" as const,label:"Category Diversity",color:"var(--indigo)",tip:"Breadth of award types used"},
    {key:"participation" as const,label:"Peer Participation",color:"var(--teal)",tip:"Nominators ÷ recipients ratio"},
    {key:"volume" as const,label:"Recognition Volume",color:"var(--orange)",tip:"Awards relative to top department"},
    {key:"generosity" as const,label:"Award Generosity",color:"var(--green)",tip:"Average award value (max $1,000)"},
  ];

  return(
    <div>
      <SH eye="Culture Intelligence" title="Department Health Scorecard" eyeColor="var(--green)"
        right={<div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>4 signals · click dept for detail</div>}/>

      {/* Dept grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
        {[...depts].sort((a,b)=>b.health-a.health).map(d=>{
          const col=scoreColor(d.health);
          const isSel=selected===d.name;
          return(
            <div key={d.name} onClick={()=>setSelected(isSel?null:d.name)}
              style={{padding:"14px",borderRadius:"var(--rs)",cursor:"pointer",border:`2px solid ${isSel?col:"var(--border)"}`,background:isSel?scoreBg(d.health):"var(--white)",boxShadow:isSel?"var(--sh2)":"var(--sh)",transition:"all .2s"}}
              onMouseEnter={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.borderColor=col;}}
              onMouseLeave={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.borderColor="var(--border)";}}>
              <div style={{fontFamily:"var(--mono)",fontSize:8,letterSpacing:".1em",textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>{d.name}</div>
              <div style={{fontSize:28,fontWeight:800,color:col,fontFamily:"var(--mono)",letterSpacing:"-.03em",lineHeight:1.1}}>{d.health}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)",marginBottom:10}}>{scoreLabel(d.health)}</div>
              {/* mini category spread */}
              <div style={{display:"flex",height:4,borderRadius:2,overflow:"hidden",gap:"1px"}}>
                {d.categorySpread.map(c=>(
                  <div key={c.id} style={{flex:c.count,background:CAT_COLORS[c.id]||"#888"}} title={`${c.name}: ${c.count}`}/>
                ))}
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",marginTop:6}}>{d.totalAwards} awards · ${(d.totalValue/1000).toFixed(0)}K</div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {sel&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div className="card" style={{padding:"22px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <div style={{fontSize:44,fontWeight:800,color:scoreColor(sel.health),fontFamily:"var(--mono)",letterSpacing:"-.04em"}}>{sel.health}</div>
              <div>
                <div style={{fontWeight:700,fontSize:16,color:"var(--navy)"}}>{sel.name}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)",marginTop:2}}>{scoreLabel(sel.health)}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>
              {[
                {l:"Awards",v:sel.totalAwards,c:"var(--orange)"},
                {l:"Recipients",v:sel.uniqueRecipients,c:"var(--teal)"},
                {l:"Nominators",v:sel.uniqueNominators,c:"var(--navy)"},
                {l:"Total Value",v:`$${(sel.totalValue/1000).toFixed(0)}K`,c:"var(--green)"},
                {l:"Avg Value",v:`$${sel.avgValue}`,c:"var(--indigo)"},
                {l:"Cross-Dept",v:`${sel.crossDeptPct}%`,c:"var(--purple)"},
              ].map(s=>(
                <div key={s.l} style={{padding:"10px 12px",background:"var(--bg)",borderRadius:"var(--rs)"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>{s.l}</div>
                  <div style={{fontWeight:700,fontSize:18,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            {/* Score dims */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {SCORE_DIMS.map(dim=>(
                <div key={dim.key}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:"var(--navy)",fontWeight:500}}>{dim.label}</span>
                    <span style={{fontFamily:"var(--mono)",fontSize:10,color:dim.color,fontWeight:700}}>{sel.scores[dim.key]}</span>
                  </div>
                  <div style={{height:6,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${sel.scores[dim.key]}%`,background:dim.color,borderRadius:3,transition:"width 1s cubic-bezier(.22,.68,0,1.2)"}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category spread */}
          <div className="card" style={{padding:"22px"}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".14em",textTransform:"uppercase",color:"var(--green)",marginBottom:4}}>AWARD CATEGORY SPREAD</div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--navy)",marginBottom:18}}>Recognition Type Breakdown</div>
            {sel.categorySpread.map(c=>(
              <div key={c.id} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:CAT_COLORS[c.id]||"#888",flexShrink:0}}/>
                    <span style={{fontSize:11,color:"var(--navy)",fontWeight:500}}>{c.name}</span>
                  </div>
                  <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>{c.count}</span>
                </div>
                <div style={{height:6,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(c.count/sel.totalAwards)*100}%`,background:CAT_COLORS[c.id]||"#888",borderRadius:3}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MESSAGE INSIGHTS
══════════════════════════════════════════════════════════════════════════ */
function MessageInsights({data}:{data:DashboardData}){
  const [catFilter,setCatFilter]=useState("All");
  const cats=["All",...[...new Set(data.messageThemes.map(t=>t.category))].slice(0,6)];

  const filteredWords=catFilter==="All"
    ? data.wordCloud
    : data.messageThemes.find(t=>t.category===catFilter)?.words||[];
  const filteredMax=filteredWords[0]?.count||1;

  const wordColor=(i:number)=>{
    const palette=["var(--orange)","var(--teal)","var(--purple)","var(--indigo)","var(--green)","var(--amber)"];
    return palette[i%palette.length];
  };

  const themes=data.messageThemes.slice(0,5);

  return(
    <div>
      <SH eye="Language Analysis" title="Message Insights" eyeColor="var(--purple)"/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        {cats.map(c=>(
          <button key={c} className={`tab-pill${catFilter===c?" on":""}`} onClick={()=>setCatFilter(c)} style={{fontSize:11}}>
            {c==="All"?"All Categories":c.split(" ")[0]}
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:20,marginBottom:20}}>
        {/* Word cloud */}
        <div className="card" style={{padding:"24px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".16em",textTransform:"uppercase",color:"var(--purple)",marginBottom:4}}>WORD CLOUD</div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:16}}>Language in Award Messages</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",lineHeight:1.8}}>
            {filteredWords.slice(0,28).map((w,i)=>{
              const size=Math.round(10+(w.count/filteredMax)*20);
              const opacity=0.5+(w.count/filteredMax)*0.5;
              return(
                <span key={w.word} style={{fontSize:size,fontWeight:w.count>filteredMax*0.6?800:w.count>filteredMax*0.3?600:400,color:wordColor(i),opacity,transition:"all .2s",cursor:"default",lineHeight:1.2}}
                  onMouseEnter={e=>{(e.target as HTMLElement).style.opacity="1";(e.target as HTMLElement).style.transform="scale(1.1)";}}
                  onMouseLeave={e=>{(e.target as HTMLElement).style.opacity=String(opacity);(e.target as HTMLElement).style.transform="none";}}
                  title={`${w.count} occurrences`}>{w.word}</span>
              );
            })}
          </div>
        </div>

        {/* Theme breakdown */}
        <div className="card" style={{padding:"24px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".16em",textTransform:"uppercase",color:"var(--purple)",marginBottom:4}}>CATEGORY THEMES</div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:16}}>Top Words per Category</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {themes.map((t)=>(
              <div key={t.category} style={{padding:"10px 12px",borderRadius:"var(--rs)",border:"1px solid var(--border)",cursor:"pointer",transition:"all .15s",background:catFilter===t.category?"var(--purple-lt)":"var(--white)",borderColor:catFilter===t.category?"#D7BDE2":"var(--border)"}}
                onClick={()=>setCatFilter(catFilter===t.category?"All":t.category)}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLORS[t.categoryId]||"#888"}}/>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--navy)"}}>{t.category}</div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {t.words.slice(0,5).map((w,j)=>(
                    <span key={w.word} style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:j===0?"var(--purple-lt)":"var(--bg)",color:j===0?"var(--purple)":"var(--muted)",border:`1px solid ${j===0?"#D7BDE2":"var(--border)"}`,fontWeight:j===0?700:400}}>
                      {w.word}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight callout — dynamic */}
      {(()=>{
        const top1=data.wordCloud[0]?.word||"support";
        const top2=data.wordCloud[1]?.word||"team";
        const top1c=data.wordCloud[0]?.count||0;
        const top2c=data.wordCloud[1]?.count||0;
        return(
          <div style={{padding:"16px 20px",background:"var(--purple-lt)",borderRadius:"var(--rs)",border:"1px solid #D7BDE2",display:"flex",gap:10}}>
            <span style={{fontSize:20,flexShrink:0}}>🔍</span>
            <div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".12em",textTransform:"uppercase",color:"var(--purple)",marginBottom:4}}>LANGUAGE INSIGHT</div>
              <p style={{fontSize:12,color:"var(--navy)",lineHeight:1.7}}>
                <strong>&quot;{top1}&quot;</strong> ({top1c} mentions) and <strong>&quot;{top2}&quot;</strong> ({top2c} mentions) dominate award messages.
                {" "}Collaboration & Teamwork is the most common category ({data.categories.find(c=>c.id==="D")?.count||0} awards, {data.categories.find(c=>c.id==="D")?.pct||0}%), while Operational Excellence has the least recognition — consider targeted prompts for this dimension.
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SKILLS TAB
══════════════════════════════════════════════════════════════════════════ */
function SkillsTab({data}:{data:DashboardData}){
  const [selDept,setSelDept]=useState<string|null>(null);
  const si=data.skillInsights;
  const maxSkill=si.topSkills[0]?.count||1;
  const depts=Object.keys(si.byDepartment).sort();

  return(
    <div>
      <SH eye="Skill Intelligence" title="Skills & Recognition Correlation" eyeColor="var(--indigo)"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {/* Top skills */}
        <div className="card au1" style={{padding:"24px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".14em",textTransform:"uppercase",color:"var(--indigo)",marginBottom:4}}>MOST RECOGNIZED SKILLS</div>
          <div style={{fontSize:14,fontWeight:700,color:"var(--navy)",marginBottom:16}}>Top 15 Skills</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {si.topSkills.slice(0,15).map((s,i)=>(
              <div key={s.skill}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLORS[s.dominantCategory]||"#888"}}/>
                    <span style={{fontSize:12,color:"var(--navy)",fontWeight:500}}>{s.skill}</span>
                  </div>
                  <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>{s.count}</span>
                </div>
                <div style={{height:5,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(s.count/maxSkill)*100}%`,background:`linear-gradient(90deg,${CAT_COLORS[s.dominantCategory]||"var(--indigo)"},${CAT_COLORS[s.dominantCategory]||"var(--indigo)"}88)`,borderRadius:3}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By department */}
        <div className="card au2" style={{padding:"24px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".14em",textTransform:"uppercase",color:"var(--indigo)",marginBottom:4}}>SKILLS BY DEPARTMENT</div>
          <div style={{fontSize:14,fontWeight:700,color:"var(--navy)",marginBottom:14}}>Click a department to explore</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {depts.map(d=>(
              <button key={d} className={`tab-pill${selDept===d?" on":""}`} onClick={()=>setSelDept(selDept===d?null:d)} style={{fontSize:10}}>
                {d}
              </button>
            ))}
          </div>
          {selDept&&si.byDepartment[selDept]&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>{selDept} · Top Skills</div>
              {si.byDepartment[selDept].map((s,i)=>(
                <div key={s.skill} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted2)",width:18,textAlign:"right"}}>{i+1}</span>
                  <span style={{fontSize:12,color:"var(--navy)",flex:1,fontWeight:500}}>{s.skill}</span>
                  <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--orange)",fontWeight:700}}>{s.count}</span>
                </div>
              ))}
            </div>
          )}
          {!selDept&&(
            <div style={{padding:"24px",textAlign:"center",color:"var(--muted)",fontSize:12}}>
              Select a department above to see its top skills
            </div>
          )}
        </div>
      </div>

      {/* Skill × Category heatmap */}
      <div className="card au3" style={{padding:"24px",overflowX:"auto"}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".14em",textTransform:"uppercase",color:"var(--indigo)",marginBottom:4}}>SKILL × CATEGORY HEATMAP</div>
        <div style={{fontSize:14,fontWeight:700,color:"var(--navy)",marginBottom:16}}>Where each skill is most frequently recognized</div>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
          <thead>
            <tr>
              <th style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",padding:"6px 12px",textAlign:"left",borderBottom:"1px solid var(--border)",width:160}}>Skill</th>
              {data.categories.map(c=>(
                <th key={c.id} style={{fontFamily:"var(--mono)",fontSize:9,color:CAT_COLORS[c.id],textTransform:"uppercase",letterSpacing:".04em",padding:"6px 8px",textAlign:"center",borderBottom:"1px solid var(--border)"}}>
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
                  <td style={{fontSize:12,padding:"8px 12px",color:"var(--navy)",fontWeight:500,borderBottom:"1px solid var(--border)"}}>{row.skill}</td>
                  {data.categories.map(c=>{
                    const val=row.categories[c.id]||0;
                    const intensity=val/maxVal;
                    const hex=CAT_COLORS[c.id]||"#888";
                    const bg=val>0?`${hex}${Math.round(intensity*180).toString(16).padStart(2,"0")}`:"transparent";
                    return(
                      <td key={c.id} style={{textAlign:"center",padding:"8px",borderBottom:"1px solid var(--border)"}}>
                        {val>0&&(
                          <div style={{background:bg,borderRadius:4,padding:"3px 0",fontFamily:"var(--mono)",fontSize:10,color:intensity>0.4?"#fff":"var(--muted)",minWidth:28,display:"inline-block"}}>
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
        <div style={{marginTop:10,fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)"}}>
          Colour intensity = frequency relative to row max · A=Leadership · B=Innovation · C=Customer · D=Collaboration · E=Growth · F=Operations
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HR INTELLIGENCE SUITE — 4 diagnostic features
══════════════════════════════════════════════════════════════════════════ */

function Spark({data,color="#F96400",h=28,w=80}:{data:{period:string;awards:number}[];color?:string;h?:number;w?:number}){
  if(!data||data.length<2) return <span style={{color:"#ccc",fontSize:10}}>—</span>;
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
    <svg width={w} height={h} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={color}/>
    </svg>
  );
}

function RiskBadge({score}:{score:number}){
  const level=score>=75?{label:"HIGH",bg:"#FDEDEC",c:"#E74C3C"}
             :score>=40?{label:"MED", bg:"#FEF9E7",c:"#F39C12"}
             :           {label:"LOW", bg:"#EAFAF1",c:"#27AE60"};
  return(
    <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,
      background:level.bg,color:level.c,letterSpacing:".08em",fontFamily:"var(--mono)"}}>
      {level.label}
    </span>
  );
}

function IntelAvatar({name,dept,size=32}:{name:string;dept:string;size?:number}){
  const initials=name.split(" ").map((p:string)=>p[0]).slice(0,2).join("");
  const color=DEPT_COLORS[dept]||"#888";
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",
      border:`2px solid ${color}`,display:"grid",placeItems:"center",
      fontWeight:700,fontSize:size*0.32,color,flexShrink:0,fontFamily:"var(--mono)"}}>
      {initials}
    </div>
  );
}

function InvisibleRadar({intel}:{intel:DashboardData["intelligence"]}){
  const [filter,setFilter]=useState("All");
  const [selected,setSelected]=useState<string|null>(null);
  const depts=["All",...new Set(intel.invisibleContributors.map(x=>x.dept))];
  const filtered=filter==="All"?intel.invisibleContributors:intel.invisibleContributors.filter(x=>x.dept===filter);
  const sel=selected?intel.invisibleContributors.find(x=>x.id===selected):null;
  return(
    <div>
      <div style={{background:"linear-gradient(135deg,#FDEDEC,#FFF4EE)",border:"1px solid #FDDCC9",borderRadius:12,padding:"14px 18px",marginBottom:18,display:"flex",gap:12}}>
        <span style={{fontSize:20}}>⚠️</span>
        <div>
          <div style={{fontWeight:700,fontSize:13,color:"#B03A2E",marginBottom:3}}>{intel.invisibleContributors.length} Invisible Contributors Detected</div>
          <p style={{fontSize:11,color:"#922B21",lineHeight:1.6}}>People who actively nominate colleagues but have <strong>never been recognized themselves</strong>. Unrecognized givers are 3× more likely to disengage within 6 months.</p>
        </div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {depts.map(d=>(
          <button key={d} onClick={()=>setFilter(d)} style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,border:"1px solid",
            borderColor:filter===d?(DEPT_COLORS[d]||"var(--navy)"):"var(--border)",
            background:filter===d?(DEPT_COLORS[d]||"var(--navy)")+"18":"white",
            color:filter===d?(DEPT_COLORS[d]||"var(--navy)"):"var(--muted)",cursor:"pointer"}}>
            {d}
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:selected?"1fr 340px":"1fr",gap:16}}>
        <div className="card" style={{overflow:"hidden"}}>
          <table className="tbl">
            <thead><tr>{["Person","Dept","Title","Seniority","Given","Risk","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((p,i)=>(
                <tr key={p.id} onClick={()=>setSelected(selected===p.id?null:p.id)}
                  style={{cursor:"pointer",background:selected===p.id?"var(--orange-lt)":i%2===0?"white":"#FAFBFC"}}>
                  <td><div style={{display:"flex",alignItems:"center",gap:8}}><IntelAvatar name={p.name} dept={p.dept} size={26}/><span style={{fontWeight:600,fontSize:12,color:"var(--navy)"}}>{p.name}</span></div></td>
                  <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:12,background:(DEPT_COLORS[p.dept]||"#888")+"18",color:DEPT_COLORS[p.dept]||"#888",fontWeight:600}}>{p.dept}</span></td>
                  <td style={{fontSize:11,color:"var(--muted)"}}>{p.title}</td>
                  <td style={{fontSize:11,color:"var(--muted)"}}>{p.seniority}</td>
                  <td><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:16,color:"var(--orange)"}}>{p.given}</span><div style={{width:40,height:4,background:"var(--border)",borderRadius:2}}><div style={{height:"100%",width:`${(p.given/7)*100}%`,background:"linear-gradient(90deg,#F96400,#FFAB73)",borderRadius:2}}/></div></div></td>
                  <td><RiskBadge score={p.riskScore}/></td>
                  <td><button style={{fontSize:10,padding:"4px 10px",borderRadius:6,background:"var(--orange)",color:"white",border:"none",cursor:"pointer",fontWeight:600}}>Nominate →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sel&&(
          <div className="card" style={{padding:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <IntelAvatar name={sel.name} dept={sel.dept} size={40}/>
              <div><div style={{fontWeight:700,fontSize:14,color:"var(--navy)"}}>{sel.name}</div><div style={{fontSize:11,color:"var(--muted)"}}>{sel.title} · {sel.dept}</div></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[{l:"Given",v:sel.given,c:"var(--orange)"},{l:"Received",v:sel.received,c:"var(--red)"},{l:"Seniority",v:sel.seniority,c:"var(--indigo)"},{l:"Risk",v:sel.riskScore+"%",c:"var(--red)"}].map(s=>(
                <div key={s.l} style={{padding:"8px 10px",background:"var(--bg)",borderRadius:8}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:3}}>{s.l}</div>
                  <div style={{fontWeight:800,fontSize:16,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{background:"var(--teal-lt)",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
              <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--teal)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:5}}>💡 RECOMMENDED ACTION</div>
              <p style={{fontSize:11,color:"var(--navy)",lineHeight:1.6}}>
                {sel.seniority==="VP"||sel.seniority==="Director"
                  ?`Senior leaders rarely get recognized upward. Prompt their skip-level to call out ${sel.name.split(" ")[0]}'s generosity in the next all-hands.`
                  :`Reach out to ${sel.name.split(" ")[0]}'s manager. They've given ${sel.given} nominations — ask the manager to submit recognition this week.`}
              </p>
            </div>
            <button onClick={()=>setSelected(null)} style={{width:"100%",padding:"7px",borderRadius:8,background:"var(--bg)",border:"1px solid var(--border)",cursor:"pointer",fontSize:11,color:"var(--muted)"}}>Close</button>
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
        <div style={{padding:"12px 16px",borderRadius:10,background:"var(--green-lt)",border:"1px solid #A9DFBF"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#1E8449",marginBottom:3}}>🚀 {intel.risingStars.length} Rising Stars</div>
          <p style={{fontSize:11,color:"#239B56",lineHeight:1.5}}>Recognition accelerating — high potential for promotion pipeline.</p>
        </div>
        <div style={{padding:"12px 16px",borderRadius:10,background:"var(--red-lt)",border:"1px solid #F5B7B1"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#B03A2E",marginBottom:3}}>⚠️ {intel.decliningRecognition.length} Declining</div>
          <p style={{fontSize:11,color:"#922B21",lineHeight:1.5}}>Recognition falling — possible early disengagement signal.</p>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {([{id:"rising" as const,label:"🚀 Rising Stars",color:"var(--green)"},{id:"declining" as const,label:"⚠️ Declining",color:"var(--red)"}]).map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"6px 16px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",
            border:`2px solid ${view===v.id?v.color:"var(--border)"}`,background:view===v.id?v.color+"18":"white",color:view===v.id?v.color:"var(--muted)"}}>
            {v.label}
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {people.slice(0,12).map(p=>{
          const isRising=view==="rising";
          const color=isRising?"var(--green)":"var(--red)";
          const bg=isRising?"var(--green-lt)":"var(--red-lt)";
          return(
            <div key={p.id} style={{padding:"14px",borderRadius:10,border:`1px solid ${isRising?"#A9DFBF":"#F5B7B1"}`,background:"white",transition:"all .2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <IntelAvatar name={p.name} dept={p.dept} size={28}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:11,color:"var(--navy)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:9,color:"var(--muted)"}}>{p.dept}</div>
                </div>
              </div>
              <div style={{marginBottom:8}}><Spark data={p.monthlyData} color={isRising?"#27AE60":"#E74C3C"} h={28} w={110}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
                {[{l:"Total",v:p.total,c:"var(--navy)"},{l:"Slope",v:(isRising?"+":"")+p.slope.toFixed(2),c:color},{l:"Recent",v:p.recent,c:"var(--navy)"}].map(s=>(
                  <div key={s.l} style={{textAlign:"center",padding:"5px 4px",background:"var(--bg)",borderRadius:6}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:7,color:"var(--muted)",textTransform:"uppercase",marginBottom:2}}>{s.l}</div>
                    <div style={{fontWeight:700,fontSize:13,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:8,fontFamily:"var(--mono)",fontSize:8,color:"var(--muted2)"}}>{p.seniority} · {p.months} months</div>
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
  const heatBg=(v:number)=>{const t=v/maxFlow;const r=Math.round(249*t+240*(1-t));const g=Math.round(100*t+240*(1-t));return `rgb(${r},${g},${Math.round(240*(1-t))})`; };
  const givers=depts.map(d=>({dept:d,total:depts.reduce((s,r)=>d!==r?s+(getVal(d,r)||0):s,0)})).sort((a,b)=>b.total-a.total);
  const receivers=depts.map(d=>({dept:d,total:depts.reduce((s,g)=>d!==g?s+(getVal(g,d)||0):s,0),sources:depts.filter(g=>d!==g&&(getVal(g,d)||0)>0).length})).sort((a,b)=>b.total-a.total);
  const maxG=givers[0]?.total||1,maxR=receivers[0]?.total||1;
  return(
    <div>
      <div style={{background:"linear-gradient(135deg,#E8F8F5,#EDF2FF)",border:"1px solid #B2EBE3",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",gap:8}}>
        <span style={{fontSize:18}}>🗺️</span>
        <p style={{fontSize:11,color:"var(--navy)",lineHeight:1.6}}><strong>Cross-dept recognition reveals your org&apos;s informal influence network.</strong> High-outflow depts are culture amplifiers. Low inflow depts may be siloed.</p>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {([{id:"matrix" as const,label:"Heat Map"},{id:"givers" as const,label:"🏆 Top Givers"},{id:"receivers" as const,label:"⭐ Top Receivers"}]).map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"5px 14px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",
            border:`1px solid ${view===v.id?"var(--teal)":"var(--border)"}`,background:view===v.id?"var(--teal-lt)":"white",color:view===v.id?"var(--teal)":"var(--muted)"}}>
            {v.label}
          </button>
        ))}
      </div>
      {view==="matrix"&&(
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse",fontSize:10,minWidth:600}}>
            <thead><tr>
              <th style={{padding:"6px 8px",fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",borderBottom:"2px solid var(--border)",textAlign:"left",minWidth:90}}>FROM↓ TO→</th>
              {depts.map(d=>(
                <th key={d} onClick={()=>setHighlight(highlight===d?null:d)}
                  style={{padding:"4px 5px",fontFamily:"var(--mono)",fontSize:7,color:highlight===d?(DEPT_COLORS[d]||"var(--navy)"):"var(--muted)",textAlign:"center",borderBottom:"2px solid var(--border)",cursor:"pointer",minWidth:50,fontWeight:highlight===d?700:400}}>
                  {d.slice(0,7)}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {depts.map(from=>(
                <tr key={from}>
                  <td onClick={()=>setHighlight(highlight===from?null:from)}
                    style={{padding:"3px 8px",fontFamily:"var(--mono)",fontSize:8,color:highlight===from?(DEPT_COLORS[from]||"var(--navy)"):"var(--muted)",fontWeight:highlight===from?700:400,borderBottom:"1px solid #F0F0F0",cursor:"pointer",whiteSpace:"nowrap"}}>
                    {from}
                  </td>
                  {depts.map(to=>{
                    const v=getVal(from,to);const isSelf=from===to;
                    const isHL=highlight&&(highlight===from||highlight===to);
                    return(
                      <td key={to} style={{padding:"3px 4px",textAlign:"center",borderBottom:"1px solid #F0F0F0",background:isSelf?"#F8F9FA":v?heatBg(v):"transparent",opacity:highlight&&!isHL?0.2:1,transition:"opacity .2s"}}>
                        {isSelf?<span style={{color:"#E9ECEF"}}>—</span>:v?<span style={{fontFamily:"var(--mono)",fontSize:9,fontWeight:700,color:v>=maxFlow*0.6?"white":v>=maxFlow*0.35?"#B03A2E":"#6C757D"}}>{v}</span>:<span style={{color:"#E9ECEF",fontSize:8}}>·</span>}
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
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {givers.map((g,i)=>(
            <div key={g.dept} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,background:i===0?"var(--teal-lt)":"#FAFBFC",border:`1px solid ${i===0?"var(--teal-md)":"var(--border)"}`}}>
              <div style={{width:24,height:24,borderRadius:6,background:DEPT_COLORS[g.dept]||"#888",display:"grid",placeItems:"center",color:"white",fontWeight:800,fontSize:10,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12,color:"var(--navy)"}}>{g.dept}</div><div style={{fontSize:10,color:"var(--muted)"}}>Champions {g.total} employees in other depts</div></div>
              <div style={{width:100,height:5,background:"var(--border)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(g.total/maxG)*100}%`,background:DEPT_COLORS[g.dept]||"#888",borderRadius:3}}/></div>
              <div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:14,color:i===0?"var(--teal)":"var(--navy)",minWidth:22,textAlign:"right"}}>{g.total}</div>
            </div>
          ))}
        </div>
      )}
      {view==="receivers"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {receivers.map((r,i)=>(
            <div key={r.dept} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,background:i===0?"var(--orange-lt)":"#FAFBFC",border:`1px solid ${i===0?"var(--orange-md)":"var(--border)"}`}}>
              <div style={{width:24,height:24,borderRadius:6,background:DEPT_COLORS[r.dept]||"#888",display:"grid",placeItems:"center",color:"white",fontWeight:800,fontSize:10,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12,color:"var(--navy)"}}>{r.dept}</div><div style={{fontSize:10,color:"var(--muted)"}}>Recognized by {r.sources} depts · {r.total} cross-dept awards</div></div>
              <div style={{width:100,height:5,background:"var(--border)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(r.total/maxR)*100}%`,background:DEPT_COLORS[r.dept]||"#888",borderRadius:3}}/></div>
              <div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:14,color:i===0?"var(--orange)":"var(--navy)",minWidth:22,textAlign:"right"}}>{r.total}</div>
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
  const SEN_COLORS:Record<string,string>={"IC":"#45B7D1","Senior IC":"#4ECDC4","Manager":"#F9CA24","Senior Manager":"#F96400","Director":"#FF6B6B","VP":"var(--indigo)"};
  const getVal=(row:typeof sorted[0])=>metric==="count"?{v:row.count,fmt:String(row.count)}:metric==="avg_value"?{v:row.avg_value,fmt:`$${row.avg_value}`}:{v:row.high_value_pct,fmt:`${row.high_value_pct}%`};
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
        <div style={{padding:"12px 14px",borderRadius:10,background:parseFloat(cv)<15?"var(--green-lt)":"var(--amber-lt)",border:"1px solid",borderColor:parseFloat(cv)<15?"#A9DFBF":"#FAD7A0"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:parseFloat(cv)<15?"#1E8449":"#9A7D0A",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Equity Score</div>
          <div style={{fontWeight:800,fontSize:22,color:parseFloat(cv)<15?"var(--green)":"var(--amber)"}}>{parseFloat(cv)<15?"✓ Fair":"~ Moderate"}</div>
          <div style={{fontSize:10,color:parseFloat(cv)<15?"#1E8449":"#9A7D0A",marginTop:3}}>CV = {cv}%</div>
        </div>
        <div style={{padding:"12px 14px",borderRadius:10,background:"var(--indigo-lt)",border:"1px solid #BFD0FF"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--indigo)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Most Recognized</div>
          <div style={{fontWeight:700,fontSize:13,color:"var(--navy)"}}>{[...intel.equityData].sort((a,b)=>b.count-a.count)[0]?.recipient_seniority}</div>
          <div style={{fontSize:10,color:"var(--indigo)"}}>{[...intel.equityData].sort((a,b)=>b.count-a.count)[0]?.count} awards</div>
        </div>
        <div style={{padding:"12px 14px",borderRadius:10,background:"var(--orange-lt)",border:"1px solid var(--orange-md)"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--orange)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Highest Avg Value</div>
          <div style={{fontWeight:700,fontSize:13,color:"var(--navy)"}}>{[...intel.equityData].sort((a,b)=>b.avg_value-a.avg_value)[0]?.recipient_seniority}</div>
          <div style={{fontSize:10,color:"var(--orange)"}}>${[...intel.equityData].sort((a,b)=>b.avg_value-a.avg_value)[0]?.avg_value} avg</div>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {([{id:"count" as const,label:"Award Count"},{id:"avg_value" as const,label:"Avg Value"},{id:"high_value_pct" as const,label:"High-Value Rate"}]).map(m=>(
          <button key={m.id} onClick={()=>setMetric(m.id)} style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:metric===m.id?"var(--navy)":"var(--border)",background:metric===m.id?"var(--navy)":"white",color:metric===m.id?"white":"var(--muted)"}}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="card" style={{padding:"18px 22px",marginBottom:14}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {sorted.map(row=>{
            const {v,fmt}=getVal(row);const pct=(v/maxVal)*100;const color=SEN_COLORS[row.recipient_seniority]||"#888";
            return(
              <div key={row.recipient_seniority}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:color}}/>
                    <span style={{fontSize:12,fontWeight:600,color:"var(--navy)"}}>{row.recipient_seniority}</span>
                  </div>
                  <span style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color}}>{fmt}</span>
                </div>
                <div style={{height:7,background:"var(--border)",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4,transition:"width .8s cubic-bezier(.22,.68,0,1.2)"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{background:"var(--indigo-lt)",borderRadius:10,padding:"12px 16px",display:"flex",gap:8}}>
        <span style={{fontSize:16}}>⚖️</span>
        <p style={{fontSize:11,color:"var(--navy)",lineHeight:1.6}}>Distribution across seniority levels shows CV of <strong>{cv}%</strong>. {parseFloat(cv)<15?" Recognition is distributed equitably — not skewed toward senior employees.":" Consider reviewing whether ICs are being overlooked relative to VPs."} Benchmark target: all levels within <strong>±15%</strong>.</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FEATURE 5 — SKILL GAP RADAR
══════════════════════════════════════════════════════════════════════════ */
function SkillGapRadar({intel}:{intel:DashboardData["intelligence"]}){
  const [view,setView]=useState<"all"|"rare"|"moderate"|"common">("all");
  const [selDept,setSelDept]=useState("All");
  const depts=["All",...intel.depts];

  const filtered=intel.skillGaps
    .filter(s=>view==="all"||s.rarity===view)
    .filter(s=>selDept==="All"||s.depts.includes(selDept));

  const maxCount=Math.max(...intel.skillGaps.map(s=>s.count),1);
  const RARITY_STYLE={
    rare:     {bg:"#FDEDEC",c:"#E74C3C",label:"Rare"},
    moderate: {bg:"var(--amber-lt)",c:"var(--amber)",label:"Moderate"},
    common:   {bg:"var(--green-lt)",c:"var(--green)",label:"Common"},
  };

  const rareCt=intel.skillGaps.filter(s=>s.rarity==="rare").length;
  const modCt=intel.skillGaps.filter(s=>s.rarity==="moderate").length;
  const commonCt=intel.skillGaps.filter(s=>s.rarity==="common").length;

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:18}}>
        {[
          {key:"rare" as const,label:"Rare Skills",sub:"Under-represented org-wide",count:rareCt,c:"var(--red)",bg:"var(--red-lt)"},
          {key:"moderate" as const,label:"Moderate Skills",sub:"Present but not widespread",count:modCt,c:"var(--amber)",bg:"var(--amber-lt)"},
          {key:"common" as const,label:"Core Skills",sub:"Widely recognized across org",count:commonCt,c:"var(--green)",bg:"var(--green-lt)"},
        ].map(s=>(
          <button key={s.key} onClick={()=>setView(view===s.key?"all":s.key)}
            style={{padding:"14px 16px",borderRadius:10,border:`2px solid ${view===s.key?s.c:"var(--border)"}`,
              background:view===s.key?s.bg:"white",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
            <div style={{fontWeight:700,fontSize:13,color:s.c,marginBottom:4}}>{s.label}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:22,fontWeight:800,color:"var(--navy)"}}>{s.count}</div>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{s.sub}</div>
          </button>
        ))}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <select value={selDept} onChange={e=>setSelDept(e.target.value)}
          style={{padding:"6px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:11,fontFamily:"var(--sans)",background:"white",color:"var(--navy)",cursor:"pointer"}}>
          {depts.map(d=><option key={d}>{d}</option>)}
        </select>
        <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>{filtered.length} skills shown</span>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <table className="tbl">
          <thead><tr>
            {["Skill","Frequency","Departments","Rarity","Dept Breakdown"].map(h=><th key={h}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(s=>{
              const rs=RARITY_STYLE[s.rarity];
              return(
                <tr key={s.skill}>
                  <td style={{fontWeight:600,color:"var(--navy)",fontSize:13}}>{s.skill}</td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:80,height:5,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(s.count/maxCount)*100}%`,background:rs.c,borderRadius:3}}/>
                      </div>
                      <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--navy)",fontWeight:700}}>{s.count}</span>
                    </div>
                  </td>
                  <td><span style={{fontFamily:"var(--mono)",fontSize:11}}>{s.deptCount}/12</span></td>
                  <td><span style={{fontSize:9,fontWeight:700,padding:"3px 9px",borderRadius:10,background:rs.bg,color:rs.c}}>{rs.label}</span></td>
                  <td>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {s.depts.slice(0,4).map(d=>(
                        <span key={d} style={{fontSize:8,padding:"1px 6px",borderRadius:8,background:(DEPT_COLORS[d]||"#888")+"18",color:DEPT_COLORS[d]||"#888",fontWeight:600,whiteSpace:"nowrap"}}>{d}</span>
                      ))}
                      {s.depts.length>4&&<span style={{fontSize:9,color:"var(--muted2)"}}>+{s.depts.length-4}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{marginTop:14,padding:"12px 16px",background:"var(--amber-lt)",borderRadius:10,border:"1px solid #FAD7A0",display:"flex",gap:10}}>
        <span style={{fontSize:16}}>🎯</span>
        <p style={{fontSize:11,color:"#7E5109",lineHeight:1.6}}>
          <strong>{rareCt} rare skills</strong> are under-represented across the org. Consider targeted L&D programmes for skills like{" "}
          <strong>{intel.skillGaps.filter(s=>s.rarity==="rare").slice(0,3).map(s=>s.skill).join(", ")}</strong> — these appear in fewer teams, creating knowledge concentration risk.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FEATURE 6 — SEASONALITY HEATMAP
══════════════════════════════════════════════════════════════════════════ */
function SeasonalityHeatmap({intel}:{intel:DashboardData["intelligence"]}){
  const [metric,setMetric]=useState<"total"|string>("total");
  const cats=["A","B","C","D","E","F"];
  const CAT_FULL:Record<string,string>={A:"Leadership",B:"Innovation",C:"Customer",D:"Collaboration",E:"Growth",F:"Operations"};
  const months=intel.seasonality;
  const maxTotal=Math.max(...months.map(m=>m.total),1);

  const getCellVal=(m:typeof months[0])=>{
    if(metric==="total") return m.total;
    return m.byCategory[metric]||0;
  };
  const maxCell=Math.max(...months.map(m=>getCellVal(m)),1);

  const heatColor=(v:number,max:number,catId?:string)=>{
    const t=v/max;
    const baseColor=catId?CAT_COLORS[catId]:"#0B3954";
    if(t===0) return "transparent";
    const hex=baseColor.replace("#","");
    const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
    const alpha=0.1+t*0.85;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return(
    <div>
      <div style={{background:"linear-gradient(135deg,var(--indigo-lt),var(--teal-lt)",borderRadius:12,padding:"14px 18px",marginBottom:18,display:"flex",gap:10}}>
        <span style={{fontSize:18}}>📅</span>
        <p style={{fontSize:11,color:"var(--navy)",lineHeight:1.6}}>
          <strong>Recognition behaviour has seasonal patterns.</strong> Understanding when each category peaks helps HR time manager nudges, campaigns, and review cycles to reinforce the right behaviours at the right moment.
        </p>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={()=>setMetric("total")} style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${metric==="total"?"var(--navy)":"var(--border)"}`,background:metric==="total"?"var(--navy)":"white",color:metric==="total"?"white":"var(--muted)"}}>
          Total Volume
        </button>
        {cats.map(c=>(
          <button key={c} onClick={()=>setMetric(c)}
            style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",
              border:`1px solid ${metric===c?CAT_COLORS[c]:"var(--border)"}`,
              background:metric===c?CAT_COLORS[c]+"18":"white",
              color:metric===c?CAT_COLORS[c]:"var(--muted)"}}>
            {c}: {CAT_FULL[c]}
          </button>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="card" style={{padding:"20px 24px"}}>
        <div style={{display:"grid",gridTemplateColumns:"80px repeat(12,1fr)",gap:4,alignItems:"center"}}>
          {/* Header */}
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase"}}>{metric==="total"?"Month":"Month"}</div>
          {months.map(m=>(
            <div key={m.month} style={{textAlign:"center",fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",fontWeight:500}}>{m.monthName}</div>
          ))}

          {/* Bar row */}
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em"}}>Volume</div>
          {months.map(m=>{
            const v=getCellVal(m);
            const t=v/maxCell;
            const c=metric==="total"?"var(--navy)":CAT_COLORS[metric]||"var(--navy)";
            return(
              <div key={m.month} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{width:"100%",height:40,background:"var(--bg)",borderRadius:6,overflow:"hidden",display:"flex",alignItems:"flex-end"}}>
                  <div style={{width:"100%",height:`${t*100}%`,background:metric==="total"?"var(--indigo)":CAT_COLORS[metric]||"var(--indigo)",borderRadius:4,transition:"height .4s ease",opacity:0.8+t*0.2}}/>
                </div>
                <span style={{fontFamily:"var(--mono)",fontSize:9,fontWeight:700,color:"var(--navy)"}}>{v}</span>
              </div>
            );
          })}

          {/* Category rows */}
          {cats.map(cat=>(
            <>
              <div key={`l${cat}`} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:CAT_COLORS[cat],flexShrink:0}}/>
                <span style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)"}}>{cat}</span>
              </div>
              {months.map(m=>{
                const v=m.byCategory[cat]||0;
                const maxCat=Math.max(...months.map(mo=>mo.byCategory[cat]||0),1);
                const t=v/maxCat;
                const isDom=m.dominantCategory===cat;
                return(
                  <div key={`${cat}${m.month}`}
                    title={`${CAT_FULL[cat]} in ${m.monthName}: ${v} awards`}
                    style={{height:24,borderRadius:5,background:heatColor(v,maxCat,cat),
                      display:"grid",placeItems:"center",position:"relative",
                      border:isDom?`1px solid ${CAT_COLORS[cat]}`:"1px solid transparent"}}>
                    {v>0&&<span style={{fontFamily:"var(--mono)",fontSize:8,fontWeight:700,color:t>0.5?"white":"var(--navy)"}}>{v}</span>}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        <div style={{marginTop:14,display:"flex",gap:16,flexWrap:"wrap"}}>
          {cats.map(c=>{
            const peakMonth=months.reduce((best,m)=>(m.byCategory[c]||0)>(best.byCategory[c]||0)?m:best,months[0]);
            return(
              <div key={c} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLORS[c]}}/>
                <span style={{fontSize:10,color:"var(--muted)"}}>{CAT_FULL[c]}: peaks <strong style={{color:"var(--navy)"}}>{peakMonth?.monthName}</strong></span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FEATURE 7 — ORG CONNECTORS
══════════════════════════════════════════════════════════════════════════ */
function OrgConnectors({intel}:{intel:DashboardData["intelligence"]}){
  const [selDept,setSelDept]=useState("All");
  const connectors=intel.orgConnectors;
  const depts=["All",...new Set(connectors.map(c=>c.dept))].sort();
  const filtered=selDept==="All"?connectors:connectors.filter(c=>c.dept===selDept);
  const maxScore=connectors[0]?.collaborationScore||1;

  return(
    <div>
      <div style={{background:"linear-gradient(135deg,#E8F8F5,#EDF2FF)",borderRadius:12,padding:"14px 18px",marginBottom:18,display:"flex",gap:10}}>
        <span style={{fontSize:18}}>🕸️</span>
        <p style={{fontSize:11,color:"var(--navy)",lineHeight:1.6}}>
          <strong>Org Connectors are your informal culture brokers</strong> — people who actively recognize colleagues across multiple teams. Losing even one can fragment collaboration patterns that took months to build. Identify and retain them proactively.
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Total Connectors",v:connectors.length,sub:"recognized 3+ unique people",c:"var(--teal)"},
          {label:"Cross-Dept Connectors",v:connectors.filter(c=>c.uniqueDeptsReached>=3).length,sub:"reached 3+ departments",c:"var(--indigo)"},
          {label:"Super Connectors",v:connectors.filter(c=>c.uniquePeopleRecognized>=5).length,sub:"recognized 5+ unique people",c:"var(--orange)"},
        ].map(s=>(
          <div key={s.label} className="card" style={{padding:"14px 16px"}}>
            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>{s.label}</div>
            <div style={{fontWeight:800,fontSize:24,color:s.c,fontFamily:"var(--mono)"}}>{s.v}</div>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
        <select value={selDept} onChange={e=>setSelDept(e.target.value)}
          style={{padding:"6px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:11,fontFamily:"var(--sans)",background:"white",color:"var(--navy)",cursor:"pointer"}}>
          {depts.map(d=><option key={d}>{d}</option>)}
        </select>
        <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>{filtered.length} connectors</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {filtered.map((c,i)=>{
          const color=DEPT_COLORS[c.dept]||"#888";
          const scorePct=c.collaborationScore/maxScore*100;
          return(
            <div key={c.id} className="card" style={{padding:"14px 16px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:color}}/>
              <div style={{paddingLeft:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:color+"22",border:`2px solid ${color}`,display:"grid",placeItems:"center",fontWeight:800,fontSize:10,color,flexShrink:0,fontFamily:"var(--mono)"}}>
                    {c.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:12,color:"var(--navy)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                    <div style={{fontSize:9,color:"var(--muted)"}}>{c.dept}</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:10}}>
                  {[{l:"People",v:c.uniquePeopleRecognized},{l:"Depts",v:c.uniqueDeptsReached},{l:"Given",v:c.totalGiven}].map(s=>(
                    <div key={s.l} style={{textAlign:"center",padding:"5px 4px",background:"var(--bg)",borderRadius:6}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:7,color:"var(--muted)",textTransform:"uppercase",marginBottom:2}}>{s.l}</div>
                      <div style={{fontWeight:800,fontSize:14,color:"var(--navy)"}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:4}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:9,color:"var(--muted)"}}>Collaboration Score</span>
                    <span style={{fontFamily:"var(--mono)",fontSize:9,fontWeight:700,color:color}}>{c.collaborationScore}</span>
                  </div>
                  <div style={{height:4,background:"var(--border)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${scorePct}%`,background:color,borderRadius:2}}/>
                  </div>
                </div>
                <div style={{fontSize:9,color:"var(--muted)",fontFamily:"var(--mono)"}}>{c.seniority} · {c.title}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FEATURE 8 — VALUE EQUITY AUDIT
══════════════════════════════════════════════════════════════════════════ */
function ValueEquityAudit({intel}:{intel:DashboardData["intelligence"]}){
  const [view,setView]=useState<"dept"|"seniority">("dept");
  const ve=intel.valueEquity;
  const maxDeptVal=Math.max(...ve.byDept.map(d=>d.total),1);
  const maxPerPerson=Math.max(...ve.byDept.map(d=>d.perPerson),1);
  const gini=ve.concentration.giniCoeff;
  const equityLevel=gini<0.3?"Highly Equitable":gini<0.45?"Moderately Equitable":"Concentrated";
  const equityColor=gini<0.3?"var(--green)":gini<0.45?"var(--amber)":"var(--red)";

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:18}}>
        <div className="card" style={{padding:"14px 16px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Gini Coefficient</div>
          <div style={{fontWeight:800,fontSize:26,color:equityColor,fontFamily:"var(--mono)"}}>{gini}</div>
          <div style={{fontSize:10,color:equityColor,marginTop:4,fontWeight:600}}>{equityLevel}</div>
          <div style={{fontSize:9,color:"var(--muted)",marginTop:2}}>0 = perfect equality · 1 = maximum concentration</div>
        </div>
        <div className="card" style={{padding:"14px 16px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Top 10 Earners</div>
          <div style={{fontWeight:800,fontSize:26,color:"var(--orange)",fontFamily:"var(--mono)"}}>{ve.concentration.top10Pct}%</div>
          <div style={{fontSize:10,color:"var(--muted)",marginTop:4}}>${ve.concentration.top10Value.toLocaleString()} of total value</div>
          <div style={{fontSize:9,color:ve.concentration.top10Pct<20?"var(--green)":"var(--amber)",marginTop:2,fontWeight:600}}>
            {ve.concentration.top10Pct<20?"Healthy distribution":"Worth reviewing"}
          </div>
        </div>
        <div className="card" style={{padding:"14px 16px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Dept Value Range</div>
          <div style={{fontWeight:800,fontSize:26,color:"var(--indigo)",fontFamily:"var(--mono)"}}>
            {Math.round((ve.byDept[0]?.total||0)/(ve.byDept[ve.byDept.length-1]?.total||1)*10)/10}×
          </div>
          <div style={{fontSize:10,color:"var(--muted)",marginTop:4}}>
            ${(ve.byDept[ve.byDept.length-1]?.total||0).toLocaleString()} → ${(ve.byDept[0]?.total||0).toLocaleString()}
          </div>
          <div style={{fontSize:9,color:"var(--muted)",marginTop:2}}>lowest to highest dept</div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {([{id:"dept" as const,label:"By Department"},{id:"seniority" as const,label:"By Seniority"}]).map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)}
            style={{padding:"5px 14px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:view===v.id?"var(--navy)":"var(--border)",background:view===v.id?"var(--navy)":"white",color:view===v.id?"white":"var(--muted)"}}>
            {v.label}
          </button>
        ))}
      </div>

      {view==="dept"&&(
        <div className="card" style={{padding:"20px 24px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {ve.byDept.map(d=>{
              const color=DEPT_COLORS[d.dept]||"#888";
              return(
                <div key={d.dept}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:color}}/>
                      <span style={{fontSize:12,fontWeight:600,color:"var(--navy)"}}>{d.dept}</span>
                    </div>
                    <div style={{display:"flex",gap:16,alignItems:"center"}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>
                        ${d.perPerson.toLocaleString()}/person
                      </span>
                      <span style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color}}>${d.total.toLocaleString()}</span>
                      <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)",width:36,textAlign:"right"}}>{d.pct}%</span>
                    </div>
                  </div>
                  <div style={{height:8,background:"var(--border)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(d.total/maxDeptVal)*100}%`,background:color,borderRadius:4,transition:"width .8s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view==="seniority"&&(
        <div className="card" style={{padding:"20px 24px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {ve.bySeniority.map((s,i)=>{
              const colors=["#45B7D1","#4ECDC4","#F9CA24","#F96400","#FF6B6B","var(--indigo)"];
              const c=colors[i]||"#888";
              const maxAvg=Math.max(...ve.bySeniority.map(x=>x.avg),1);
              return(
                <div key={s.level}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
                      <span style={{fontSize:12,fontWeight:600,color:"var(--navy)"}}>{s.level}</span>
                    </div>
                    <div style={{display:"flex",gap:16}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>
                        High-value: <strong style={{color:c}}>{s.highValuePct}%</strong>
                      </span>
                      <span style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color:c}}>
                        ${s.avg} avg
                      </span>
                    </div>
                  </div>
                  <div style={{height:8,background:"var(--border)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(s.avg/maxAvg)*100}%`,background:c,borderRadius:4}}/>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop:16,padding:"12px 14px",background:"var(--indigo-lt)",borderRadius:8,display:"flex",gap:8}}>
            <span>⚖️</span>
            <p style={{fontSize:11,color:"var(--navy)",lineHeight:1.6}}>
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
    {id:"invisible"   as const,icon:"👁️",label:"Invisible Contributors", sub:`${intel.invisibleContributors.length} at risk`,         color:"#E74C3C",bg:"#FDEDEC"},
    {id:"momentum"    as const,icon:"📈",label:"Momentum Tracker",        sub:`${intel.risingStars.length} rising`,                    color:"#27AE60",bg:"#EAFAF1"},
    {id:"crossdept"   as const,icon:"🗺️",label:"Influence Map",           sub:`${intel.crossDeptFlow.length} flows`,                   color:"var(--teal)",bg:"var(--teal-lt)"},
    {id:"equity"      as const,icon:"⚖️",label:"Equity Lens",             sub:"6 seniority levels",                                    color:"var(--indigo)",bg:"var(--indigo-lt)"},
    {id:"skillgap"    as const,icon:"🎯",label:"Skill Gap Radar",         sub:`${intel.skillGaps.filter(s=>s.rarity==="rare").length} rare skills`,  color:"var(--red)",bg:"var(--red-lt)"},
    {id:"seasonality" as const,icon:"📅",label:"Seasonality Heatmap",    sub:"12 months · 6 categories",                              color:"var(--purple)",bg:"var(--purple-lt)"},
    {id:"connectors"  as const,icon:"🕸️",label:"Org Connectors",         sub:`${intel.orgConnectors.length} connectors`,              color:"var(--orange)",bg:"var(--orange-lt)"},
    {id:"valueaudit"  as const,icon:"💰",label:"Value Equity Audit",      sub:`Gini ${intel.valueEquity.concentration.giniCoeff}`,     color:"var(--green)",bg:"var(--green-lt)"},
  ];
  return(
    <div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActive(t.id)}
            style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:10,border:`2px solid ${active===t.id?t.color:"var(--border)"}`,cursor:"pointer",background:active===t.id?t.bg:"white",transition:"all .2s"}}>
            <span style={{fontSize:14}}>{t.icon}</span>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:11,fontWeight:700,color:active===t.id?t.color:"var(--navy)",lineHeight:1.2}}>{t.label}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:8,color:active===t.id?t.color+"99":"var(--muted2)"}}>{t.sub}</div>
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

/* ══════════════════════════════════════════════════════════════════════════
   WORKFORCE TAB — extracted to avoid hook-in-IIFE violation
══════════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════════
   EMPLOYEE PROFILE PANEL — extracted to avoid hook-in-IIFE violation
══════════════════════════════════════════════════════════════════════════ */
function EmployeeProfilePanel({p,onClose}:{p:DashboardData["employeeDirectory"][0];onClose:()=>void}){
  const sc = STATUS_CONFIG[p.status];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12,position:"sticky",top:80}}>
      {/* Header card */}
      <div className="card" style={{padding:"20px 22px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{width:52,height:52,borderRadius:"50%",
            background:(DEPT_COLORS[p.dept]||"#888")+"22",
            border:`3px solid ${DEPT_COLORS[p.dept]||"#888"}`,
            display:"grid",placeItems:"center",fontWeight:800,
            fontSize:16,color:DEPT_COLORS[p.dept]||"#888",flexShrink:0,fontFamily:"var(--mono)"}}>
            {p.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:800,fontSize:16,color:"var(--navy)",letterSpacing:"-.01em"}}>{p.name}</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{p.title}</div>
            <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
              <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,fontWeight:600,
                background:(DEPT_COLORS[p.dept]||"#888")+"18",color:DEPT_COLORS[p.dept]||"#888"}}>
                {p.dept}
              </span>
              <span className="chip" style={{background:"var(--indigo-lt)",color:"var(--indigo)",fontSize:9}}>{p.seniority}</span>
              <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10,background:sc.bg,color:sc.c}}>{sc.label}</span>
            </div>
          </div>
          <button onClick={onClose}
            style={{width:28,height:28,borderRadius:"50%",border:"1px solid var(--border)",
              display:"grid",placeItems:"center",cursor:"pointer",color:"var(--muted)",
              fontSize:14,flexShrink:0,background:"var(--bg)"}}>✕</button>
        </div>
        {/* KPI row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:14}}>
          {[
            {l:"Received",v:p.received,c:p.received>=5?"var(--green)":p.received===0?"var(--red)":"var(--navy)"},
            {l:"Given",v:p.given,c:p.given>=4?"var(--teal)":p.given===0?"var(--amber)":"var(--navy)"},
            {l:"Total Value",v:`$${p.valueReceived.toLocaleString()}`,c:"var(--orange)"},
            {l:"Engagement",v:p.engagementScore+"%",c:p.engagementScore>=70?"var(--green)":p.engagementScore>=40?"var(--teal)":"var(--amber)"},
          ].map(s=>(
            <div key={s.l} style={{textAlign:"center",padding:"8px 6px",background:"var(--bg)",borderRadius:8}}>
              <div style={{fontFamily:"var(--mono)",fontSize:7,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>{s.l}</div>
              <div style={{fontWeight:800,fontSize:15,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
        {/* Last recognition banner */}
        <div style={{padding:"8px 12px",borderRadius:8,
          background:p.daysSinceLast>120?"var(--red-lt)":p.daysSinceLast>60?"var(--amber-lt)":"var(--green-lt)",
          border:`1px solid ${p.daysSinceLast>120?"#F5B7B1":p.daysSinceLast>60?"#FAD7A0":"#A9DFBF"}`}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>Last Recognition</div>
          <div style={{fontSize:12,fontWeight:600,color:"var(--navy)"}}>
            {p.lastAwardDate?`${p.lastAwardDate} · ${p.daysSinceLast} days ago`:"Never received recognition"}
          </div>
        </div>
      </div>
      {/* Skills */}
      {p.skills.length>0&&(
        <div className="card" style={{padding:"14px 16px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Skills</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {p.skills.map(s=>(
              <span key={s} style={{fontSize:10,padding:"3px 10px",borderRadius:20,
                background:"var(--indigo-lt)",color:"var(--indigo)",fontWeight:500,border:"1px solid #BFD0FF"}}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Category breakdown */}
      {p.categoryBreakdown.length>0&&(
        <div className="card" style={{padding:"14px 16px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Recognition by Category</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {p.categoryBreakdown.map(c=>(
              <div key={c.id}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLORS[c.id]||"#888"}}/>
                    <span style={{fontSize:11,color:"var(--navy)",fontWeight:500}}>{CAT_LABELS[c.id]} ({c.id})</span>
                  </div>
                  <span style={{fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:CAT_COLORS[c.id]||"#888"}}>{c.count}</span>
                </div>
                <div style={{height:4,background:"var(--border)",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(c.count/Math.max(p.received,1))*100}%`,background:CAT_COLORS[c.id]||"#888",borderRadius:2}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Recognition history */}
      <div className="card" style={{padding:"14px 16px"}}>
        <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>
          Recent Recognitions {p.recentAwards.length>0?`· ${p.recentAwards.length} shown`:""}
        </div>
        {p.recentAwards.length===0?(
          <div style={{padding:"14px",textAlign:"center",color:"var(--muted)",fontSize:12,background:"var(--bg)",borderRadius:8}}>
            No recognitions received yet
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {p.recentAwards.map((a,i)=>(
              <div key={i} style={{padding:"12px 14px",borderRadius:8,
                background:i===0?"var(--teal-lt)":"var(--bg)",
                border:`1px solid ${i===0?"var(--teal-md)":"var(--border)"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--navy)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</div>
                    <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>From <strong>{a.fromName}</strong> · {a.fromDept}</div>
                  </div>
                  <div style={{flexShrink:0,marginLeft:10,textAlign:"right"}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:800,color:"var(--orange)"}}>${a.value}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)"}}>{a.date}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,marginBottom:6}}>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,
                    background:(CAT_COLORS[a.categoryId]||"#888")+"18",color:CAT_COLORS[a.categoryId]||"#888",fontWeight:600}}>
                    {a.category}
                  </span>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:"var(--bg)",border:"1px solid var(--border)",color:"var(--muted)"}}>
                    {a.subcategory}
                  </span>
                </div>
                {a.message&&(
                  <p style={{fontSize:11,color:"var(--navy)",lineHeight:1.6,fontStyle:"italic",opacity:0.85,
                    overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>
                    `&quot;{a.message}`&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* HR insight */}
      <div style={{padding:"12px 14px",background:"var(--indigo-lt)",borderRadius:10,border:"1px solid #BFD0FF",display:"flex",gap:10}}>
        <span style={{fontSize:16}}>💡</span>
        <div>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--indigo)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>HR INSIGHT</div>
          <p style={{fontSize:11,color:"var(--navy)",lineHeight:1.6}}>
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
type SortKey = "name"|"received"|"given"|"engagementScore"|"daysSinceLast";

function SortTh({col,label,sortBy,sortDir,onSort}:{
  col:SortKey; label:string; sortBy:SortKey; sortDir:1|-1; onSort:(col:SortKey)=>void;
}){
  return(
    <th onClick={()=>onSort(col)} style={{cursor:"pointer",
      color:sortBy===col?"var(--navy)":"var(--muted)",
      background:sortBy===col?"#F0F4F8":"#FAFBFC",userSelect:"none"}}>
      {label}{sortBy===col?(sortDir===-1?" ↓":" ↑"):""}
    </th>
  );
}

function DirCatBar({breakdown}:{breakdown:{id:string;count:number}[]}){
  return(
    <div style={{display:"flex",height:6,borderRadius:3,overflow:"hidden",gap:"1px",minWidth:60}}>
      {breakdown.map(c=>(
        <div key={c.id} title={`${CAT_LABELS[c.id]}: ${c.count}`}
          style={{flex:c.count,background:CAT_COLORS[c.id]||"#ccc"}}/>
      ))}
    </div>
  );
}

function DirPaginationBar({safePage,totalPages,start,end,total,setPage}:{
  safePage:number; totalPages:number; start:number; end:number; total:number;
  setPage:(fn:(p:number)=>number|number)=>void;
}){
  return(
    <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
      <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>
        {total===0?"No results":`${start}–${end} of ${total} employees`}
      </span>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <button onClick={()=>setPage(()=>1)} disabled={safePage===1}
          style={{padding:"4px 9px",borderRadius:6,border:"1px solid var(--border)",background:"white",cursor:safePage===1?"not-allowed":"pointer",color:safePage===1?"var(--muted2)":"var(--navy)",fontSize:11,fontFamily:"var(--mono)"}}>
          «
        </button>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage===1}
          style={{padding:"4px 9px",borderRadius:6,border:"1px solid var(--border)",background:"white",cursor:safePage===1?"not-allowed":"pointer",color:safePage===1?"var(--muted2)":"var(--navy)",fontSize:11}}>
          ‹
        </button>
        {Array.from({length:totalPages},(_,i)=>i+1)
          .filter(n=>n===1||n===totalPages||Math.abs(n-safePage)<=2)
          .reduce<(number|"…")[]>((acc,n,i,arr)=>{
            if(i>0&&(n as number)-(arr[i-1] as number)>1) acc.push("…");
            acc.push(n); return acc;
          },[])
          .map((n,i)=>
            n==="…"
              ? <span key={`e${i}`} style={{padding:"4px 6px",fontSize:11,color:"var(--muted2)",fontFamily:"var(--mono)"}}>…</span>
              : <button key={n} onClick={()=>setPage(()=>n as number)}
                  style={{padding:"4px 9px",minWidth:30,borderRadius:6,border:"1px solid",
                    borderColor:safePage===n?"var(--teal)":"var(--border)",
                    background:safePage===n?"var(--teal)":"white",
                    color:safePage===n?"white":"var(--navy)",
                    fontWeight:safePage===n?700:400,fontSize:11,fontFamily:"var(--mono)",cursor:"pointer"}}>
                  {n}
                </button>
          )}
        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages}
          style={{padding:"4px 9px",borderRadius:6,border:"1px solid var(--border)",background:"white",cursor:safePage===totalPages?"not-allowed":"pointer",color:safePage===totalPages?"var(--muted2)":"var(--navy)",fontSize:11}}>
          ›
        </button>
        <button onClick={()=>setPage(()=>totalPages)} disabled={safePage===totalPages}
          style={{padding:"4px 9px",borderRadius:6,border:"1px solid var(--border)",background:"white",cursor:safePage===totalPages?"not-allowed":"pointer",color:safePage===totalPages?"var(--muted2)":"var(--navy)",fontSize:11,fontFamily:"var(--mono)"}}>
          »
        </button>
      </div>
      <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>
        Page {safePage} of {totalPages}
      </span>
    </div>
  );
}

const STATUS_CONFIG = {
  thriving:         {label:"Thriving",         bg:"#EAFAF1",c:"#27AE60",dot:"#27AE60"},
  active:           {label:"Active",           bg:"var(--teal-lt)",c:"var(--teal)",dot:"var(--teal)"},
  passive:          {label:"Passive",          bg:"var(--amber-lt)",c:"#B7770D",dot:"var(--amber)"},
  at_risk:          {label:"At Risk",          bg:"var(--orange-lt)",c:"var(--orange)",dot:"var(--orange)"},
  never_recognized: {label:"Never Recognized", bg:"var(--red-lt)",c:"var(--red)",dot:"var(--red)"},
};

function EmployeeDirectory({data}:{data:DashboardData}){
  const PAGE_SIZE = 25;
  const dir = data.employeeDirectory;
  const [selected, setSelected] = useState<string|null>(null);
  const [search, setSearch]     = useState("");
  const [deptF, setDeptF]       = useState("All");
  const [senF, setSenF]         = useState("All");
  const [statusF, setStatusF]   = useState("All");
  const [sortBy, setSortBy]     = useState<SortKey>("received");
  const [sortDir, setSortDir]   = useState<1|-1>(-1);
  const [page, setPage]         = useState(1);

  const depts   = ["All", ...Array.from(new Set(dir.map(p=>p.dept))).sort()];
  const seniors = ["All","IC","Senior IC","Manager","Senior Manager","Director","VP"];

  const filtered = dir
    .filter(p => deptF==="All" || p.dept===deptF)
    .filter(p => senF==="All"  || p.seniority===senF)
    .filter(p => statusF==="All" || p.status===statusF)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
                 p.title.toLowerCase().includes(search.toLowerCase()) ||
                 p.skills.some(s=>s.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b) => {
      const av = a[sortBy] as number|string, bv = b[sortBy] as number|string;
      if (typeof av === "string") return (av as string).localeCompare(bv as string) * sortDir;
      return ((av as number) - (bv as number)) * sortDir;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage-1)*PAGE_SIZE, safePage*PAGE_SIZE);
  const start      = filtered.length===0 ? 0 : (safePage-1)*PAGE_SIZE+1;
  const end        = Math.min(safePage*PAGE_SIZE, filtered.length);

  const resetPage  = () => setPage(1);

  const selPerson = selected ? dir.find(p=>p.id===selected) : null;

  const toggleSort = (col: SortKey) => {
    if (sortBy===col) setSortDir(d => d===1?-1:1);
    else { setSortBy(col); setSortDir(-1); }
    resetPage();
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* ── SUMMARY BAR ─────────────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG["thriving"]][]).map(([k,cfg])=>{
          const count = dir.filter(p=>p.status===k).length;
          return(
            <button key={k} onClick={()=>{setStatusF(statusF===k?"All":k);resetPage();}}
              style={{padding:"10px 12px",borderRadius:10,border:`2px solid ${statusF===k?cfg.c:"var(--border)"}`,
                background:statusF===k?cfg.bg:"white",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:cfg.dot}}/>
                <span style={{fontSize:10,fontWeight:600,color:cfg.c}}>{cfg.label}</span>
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:20,fontWeight:800,color:"var(--navy)"}}>{count}</div>
              <div style={{fontSize:9,color:"var(--muted)",fontFamily:"var(--mono)"}}>{Math.round(count/dir.length*100)}% of workforce</div>
            </button>
          );
        })}
      </div>

      {/* ── FILTERS ─────────────────────────────────────────────────────── */}
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);resetPage();}}
          placeholder="Search name, title, or skill…"
          style={{flex:"1 1 200px",minWidth:180,padding:"8px 12px",border:"1px solid var(--border)",
            borderRadius:8,fontSize:12,fontFamily:"var(--sans)",outline:"none",
            background:"white",color:"var(--navy)"}}/>
        {/* Dept */}
        <select value={deptF} onChange={e=>{setDeptF(e.target.value);resetPage();}}
          style={{padding:"7px 10px",border:"1px solid var(--border)",borderRadius:8,
            fontSize:11,fontFamily:"var(--sans)",background:"white",cursor:"pointer",color:"var(--navy)"}}>
          {depts.map(d=><option key={d}>{d}</option>)}
        </select>
        {/* Seniority */}
        <select value={senF} onChange={e=>{setSenF(e.target.value);resetPage();}}
          style={{padding:"7px 10px",border:"1px solid var(--border)",borderRadius:8,
            fontSize:11,fontFamily:"var(--sans)",background:"white",cursor:"pointer",color:"var(--navy)"}}>
          {seniors.map(s=><option key={s}>{s}</option>)}
        </select>
        {/* Clear */}
        {(search||deptF!=="All"||senF!=="All"||statusF!=="All")&&(
          <button onClick={()=>{setSearch("");setDeptF("All");setSenF("All");setStatusF("All");resetPage();}}
            style={{padding:"7px 14px",borderRadius:8,border:"1px solid var(--border)",
              fontSize:11,cursor:"pointer",color:"var(--muted)",background:"white"}}>
            Clear filters
          </button>
        )}
        <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)",marginLeft:"auto"}}>
          {filtered.length} of {dir.length} employees
        </span>
      </div>

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:selPerson?"1fr 420px":"1fr",gap:16,alignItems:"start"}}>

        {/* ── TABLE ───────────────────────────────────────────────────── */}
        <div className="card" style={{overflow:"hidden"}}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{background:"#FAFBFC",cursor:"pointer",color:sortBy==="name"?"var(--navy)":"var(--muted)"}} onClick={()=>toggleSort("name")}>
                  Name{sortBy==="name"?(sortDir===-1?" ↓":" ↑"):""}
                </th>
                <th style={{background:"#FAFBFC"}}>Department</th>
                <th style={{background:"#FAFBFC"}}>Title & Seniority</th>
                <th style={{background:"#FAFBFC"}}>Skills</th>
                <SortTh col="received"       label="Received"    sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}/>
                <SortTh col="given"          label="Given"       sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}/>
                <SortTh col="engagementScore"label="Engagement"  sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}/>
                <SortTh col="daysSinceLast"  label="Last Rec."   sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}/>
                <th style={{background:"#FAFBFC"}}>Categories</th>
                <th style={{background:"#FAFBFC"}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(p=>{
                const sc = STATUS_CONFIG[p.status];
                const isSel = selected===p.id;
                return(
                  <tr key={p.id} onClick={()=>setSelected(isSel?null:p.id)}
                    style={{cursor:"pointer",background:isSel?"var(--teal-lt)":undefined,
                      borderLeft:isSel?`3px solid var(--teal)`:"3px solid transparent"}}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:30,height:30,borderRadius:"50%",
                          background:(DEPT_COLORS[p.dept]||"#888")+"22",
                          border:`2px solid ${DEPT_COLORS[p.dept]||"#888"}`,
                          display:"grid",placeItems:"center",fontWeight:700,
                          fontSize:10,color:DEPT_COLORS[p.dept]||"#888",flexShrink:0,
                          fontFamily:"var(--mono)"}}>
                          {p.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                        </div>
                        <span style={{fontWeight:600,color:"var(--navy)",fontSize:12}}>{p.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:12,fontWeight:600,
                        background:(DEPT_COLORS[p.dept]||"#888")+"18",color:DEPT_COLORS[p.dept]||"#888"}}>
                        {p.dept}
                      </span>
                    </td>
                    <td>
                      <div style={{fontSize:11,color:"var(--navy)",fontWeight:500}}>{p.title}</div>
                      <div style={{fontSize:9,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{p.seniority}</div>
                    </td>
                    <td>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap",maxWidth:140}}>
                        {p.skills.slice(0,2).map(s=>(
                          <span key={s} style={{fontSize:9,padding:"1px 6px",borderRadius:10,
                            background:"var(--bg)",border:"1px solid var(--border)",color:"var(--muted)",whiteSpace:"nowrap"}}>
                            {s}
                          </span>
                        ))}
                        {p.skills.length>2&&<span style={{fontSize:9,color:"var(--muted2)"}}>+{p.skills.length-2}</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{fontFamily:"var(--mono)",fontSize:16,fontWeight:800,
                        color:p.received>=5?"var(--green)":p.received===0?"var(--red)":"var(--navy)"}}>
                        {p.received}
                      </span>
                    </td>
                    <td>
                      <span style={{fontFamily:"var(--mono)",fontSize:16,fontWeight:800,
                        color:p.given>=4?"var(--teal)":p.given===0?"var(--amber)":"var(--navy)"}}>
                        {p.given}
                      </span>
                    </td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:36,height:36,borderRadius:"50%",position:"relative",flexShrink:0}}>
                          <svg width={36} height={36} viewBox="0 0 36 36">
                            <circle cx={18} cy={18} r={14} fill="none" stroke="#E9ECEF" strokeWidth={4}/>
                            <circle cx={18} cy={18} r={14} fill="none"
                              stroke={p.engagementScore>=70?"var(--green)":p.engagementScore>=40?"var(--teal)":"var(--amber)"}
                              strokeWidth={4}
                              strokeDasharray={`${p.engagementScore/100*88} 88`}
                              strokeLinecap="round"
                              transform="rotate(-90 18 18)"/>
                          </svg>
                          <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",
                            fontFamily:"var(--mono)",fontSize:8,fontWeight:700,color:"var(--navy)"}}>
                            {p.engagementScore}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{fontFamily:"var(--mono)",fontSize:11,
                        color:p.daysSinceLast>120?"var(--red)":p.daysSinceLast>60?"var(--amber)":"var(--teal)"}}>
                        {p.received===0?"—":p.daysSinceLast===999?"—":`${p.daysSinceLast}d ago`}
                      </span>
                    </td>
                    <td>
                      {p.categoryBreakdown.length>0
                        ? <DirCatBar breakdown={p.categoryBreakdown}/>
                        : <span style={{color:"var(--muted2)",fontSize:10}}>—</span>}
                    </td>
                    <td>
                      <span style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:10,
                        background:sc.bg,color:sc.c,whiteSpace:"nowrap"}}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <DirPaginationBar safePage={safePage} totalPages={totalPages} start={start} end={end} total={filtered.length} setPage={setPage}/>
        </div>

        {/* ── PROFILE PANEL ────────────────────────────────────────────── */}
        {selPerson&&<EmployeeProfilePanel p={selPerson} onClose={()=>setSelected(null)}/>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════ */
export function HRDashboardClient({data}:{data:DashboardData}){
  type Tab="overview"|"departments"|"recognition"|"people"|"intelligence";
  const [tab,setTab]=useState<Tab>("overview");

  const NAV=[
    {id:"overview"     as Tab,label:"Overview",           icon:"⊞"},
    {id:"people"       as Tab,label:"People",             icon:"◎"},
    {id:"departments"  as Tab,label:"Departments",         icon:"◫"},
    {id:"recognition"  as Tab,label:"Recognition Activity",icon:"◈"},
    {id:"intelligence" as Tab,label:"HR Intelligence",     icon:"🧠",isNew:true},
  ];

  const wf = data.workforce;
  const maxDeptCov  = 100;
  const maxMo       = data.monthly.length>0?Math.max(...data.monthly.map(d=>d.awards)):1;
  const minMo       = data.monthly.length>0?Math.min(...data.monthly.map(d=>d.awards)):0;

  /* Inline line chart */
  const LineChart=({d,color="#F96400"}:{d:DashboardData["monthly"];color?:string})=>{
    const [tip,setTip]=useState<{x:number;y:number;d:DashboardData["monthly"][0]}|null>(null);
    if(!d||d.length===0) return <div style={{height:140,display:"grid",placeItems:"center",color:"var(--muted)",fontSize:11}}>No data</div>;
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
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:140,overflow:"visible"}}>
        <defs><linearGradient id="lc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        {[0,.5,1].map(t=>{const y=py+t*(H-py*2);return<line key={t} x1={px} y1={y} x2={W-px} y2={y} stroke="#E9ECEF" strokeWidth="1"/>;})}
        <path d={area} fill="url(#lc1)"/>
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2" style={{opacity:tip?.d.month===p.d.month?1:.35,transition:"opacity .15s"}}/>
            <rect x={p.x-16} y={0} width={32} height={H} fill="transparent" onMouseEnter={()=>setTip(p)} onMouseLeave={()=>setTip(null)}/>
            <text x={p.x} y={H+3} textAnchor="middle" fill="#ADB5BD" fontSize="9" fontFamily="var(--mono)">{(p.d.label||"").slice(0,3)}</text>
          </g>
        ))}
        {tip&&<g>
          <rect x={Math.min(tip.x-44,W-92)} y={tip.y-48} width={88} height={36} rx="8" fill="#0B3954"/>
          <text x={Math.min(tip.x,W-48)} y={tip.y-28} textAnchor="middle" fill={color} fontSize="13" fontFamily="var(--mono)" fontWeight="600">{tip.d.awards}</text>
          <text x={Math.min(tip.x,W-48)} y={tip.y-15} textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="8" fontFamily="var(--mono)">{tip.d.label}</text>
        </g>}
      </svg>
    );
  };

  /* Coverage donut */
  const CoverageDonut=({pct,color,label}:{pct:number;color:string;label:string})=>{
    const r=42,cx=52,cy=52,circ=2*Math.PI*r;
    const dash=circ*(pct/100),gap=circ-dash;
    return(
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <svg width={104} height={104} style={{flexShrink:0}}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E9ECEF" strokeWidth="10"/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dasharray .8s cubic-bezier(.22,.68,0,1.2)"}}/>
          <text x={cx} y={cy-6} textAnchor="middle" fill="var(--navy)" fontSize="18" fontWeight="800" fontFamily="monospace">{pct}%</text>
          <text x={cx} y={cy+10} textAnchor="middle" fill="#ADB5BD" fontSize="8" fontFamily="monospace">{label}</text>
        </svg>
      </div>
    );
  };

  return(
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",minHeight:"100vh",background:"var(--bg)"}}>

        {/* SIDEBAR */}
        <aside style={{width:230,flexShrink:0,background:"var(--white)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <div style={{padding:"20px 18px 14px",borderBottom:"1px solid var(--border)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <img src="/Northeastern Logo.png" alt="Northeastern University" style={{width:36,height:36,objectFit:"contain",flexShrink:0}}/>
              <div>
                <div style={{fontWeight:800,fontSize:15,color:"var(--navy)"}}>Capstone</div>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",letterSpacing:".1em",textTransform:"uppercase"}}>Master&apos;s Project</div>
              </div>
            </div>
          </div>
          <nav style={{padding:"10px 8px",flex:1}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".16em",textTransform:"uppercase",color:"var(--muted2)",padding:"8px 6px 4px"}}>Workforce</div>
            {NAV.filter(n=>!n.isNew).map(n=>(
              <button key={n.id} onClick={()=>setTab(n.id)} className={`nav-link${tab===n.id?" active":""}`}>
                <span style={{fontSize:13,width:16,textAlign:"center"}}>{n.icon}</span>{n.label}
              </button>
            ))}
            <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".16em",textTransform:"uppercase",color:"var(--muted2)",padding:"14px 6px 4px",display:"flex",alignItems:"center",gap:6}}>
              Intelligence
              <span style={{background:"var(--orange)",color:"#fff",fontSize:8,padding:"1px 7px",borderRadius:20,fontWeight:700,letterSpacing:0}}>NEW</span>
            </div>
            {NAV.filter(n=>n.isNew).map(n=>(
              <button key={n.id} onClick={()=>setTab(n.id)} className={`nav-link${tab===n.id?" active":""}`}>
                <span style={{fontSize:13,width:16,textAlign:"center"}}>{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>
          <div style={{padding:"12px 14px",borderTop:"1px solid var(--border)",fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)"}}>
            <div>{wf.totalPeople} employees · {data.kpi.uniqueDepartments} depts</div>
            <div style={{marginTop:2}}>FY 2025 · 1,000 recognitions</div>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
          <header style={{height:56,background:"var(--white)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",flexShrink:0}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"var(--navy)"}}>{NAV.find(n=>n.id===tab)?.label}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)",marginTop:1}}>
                {wf.totalPeople} employees · {wf.coveragePct}% recognition coverage · FY 2025
              </div>
            </div>
            <div style={{padding:"6px 12px",background:"var(--teal-lt)",borderRadius:"var(--rs)",fontFamily:"var(--mono)",fontSize:10,color:"var(--teal)",fontWeight:600}}>HR ANALYTICS</div>
          </header>

          <main style={{flex:1,padding:"24px 28px",overflowY:"auto"}}>

            {/* ── KPI DASHBOARD ─────────────────────────────────────────── */}
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>

              {/* Row 1 — Workforce Health */}
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}>
                <div style={{fontFamily:"var(--mono)",fontSize:8,letterSpacing:".14em",textTransform:"uppercase",color:"var(--muted2)"}}>Workforce Health</div>
                <div style={{flex:1,height:1,background:"var(--border)"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:6}}>
                {[
                  {eye:"Total Employees",   v:wf.totalPeople,                      suf:"",  a:"var(--navy)",   tip:"All unique employees in system"},
                  {eye:"Departments",       v:data.kpi.uniqueDepartments,           suf:"",  a:"var(--indigo)", tip:"Active departments"},
                  {eye:"High Performers",   v:data.kpi.highPerformers,              suf:"",  a:"var(--green)",  tip:"Received 5+ recognitions this year"},
                  {eye:"Culture Carriers",  v:data.kpi.cultureCarriers,             suf:"",  a:"var(--teal)",   tip:"Gave 5+ recognitions — active culture builders"},
                  {eye:"At Risk",           v:data.kpi.atRiskCount,                 suf:"",  a:"var(--amber)",  tip:"Recognized before, but not in 120+ days"},
                  {eye:"Never Recognized",  v:data.kpi.neverRecognizedCount,        suf:"",  a:"var(--red)",    tip:"Zero recognitions received all year"},
                ].map((k,i)=>(
                  <div key={k.eye} className={`card au${Math.min(i+1,5)}`} style={{padding:"12px 14px",position:"relative",overflow:"hidden"}} title={k.tip}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${k.a},${k.a}55)`}}/>
                    <div style={{fontFamily:"var(--mono)",fontSize:8,letterSpacing:".12em",textTransform:"uppercase",color:"var(--muted)",marginBottom:6,lineHeight:1.3}}>{k.eye}</div>
                    <div style={{fontSize:22,fontWeight:800,color:k.a==="var(--red)"||k.a==="var(--amber)"?k.a:"var(--navy)",letterSpacing:"-.03em",lineHeight:1}}>
                      <Num to={k.v} suf={k.suf}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2 — Organisation Dynamics */}
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}>
                <div style={{fontFamily:"var(--mono)",fontSize:8,letterSpacing:".14em",textTransform:"uppercase",color:"var(--muted2)"}}>Organisation Dynamics</div>
                <div style={{flex:1,height:1,background:"var(--border)"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
                {[
                  {eye:"Recognition Cover", v:wf.coveragePct,                 suf:"%", a:"var(--teal)",   tip:"% of employees who received at least 1 recognition"},
                  {eye:"Participation",     v:wf.participationPct,             suf:"%", a:"var(--green)",  tip:"% who gave at least 1 recognition"},
                  {eye:"Cross-Dept Rate",   v:data.kpi.crossDeptPct,           suf:"%", a:"var(--indigo)", tip:"% of recognitions given across department lines"},
                  {eye:"Peer Recognition",  v:data.kpi.peerRecognitionPct,     suf:"%", a:"var(--purple)", tip:"% given within ±1 seniority level (true peer-to-peer)"},
                  {eye:"IC Ratio",          v:data.kpi.icRatio,                suf:"%", a:"var(--navy)",   tip:"% of workforce at IC or Senior IC level"},
                  {eye:"MoM Trend",         v:Math.abs(data.kpi.momTrend),     suf:`% ${data.kpi.momTrend>=0?"▲":"▼"}`, a:data.kpi.momTrend>=0?"var(--green)":"var(--red)", tip:"Recognition volume change: last 3 months vs previous 3 months"},
                ].map((k,i)=>(
                  <div key={k.eye} className={`card au${Math.min(i+1,5)}`} style={{padding:"12px 14px",position:"relative",overflow:"hidden"}} title={k.tip}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${k.a},${k.a}55)`}}/>
                    <div style={{fontFamily:"var(--mono)",fontSize:8,letterSpacing:".12em",textTransform:"uppercase",color:"var(--muted)",marginBottom:6,lineHeight:1.3}}>{k.eye}</div>
                    <div style={{fontSize:22,fontWeight:800,color:"var(--navy)",letterSpacing:"-.03em",lineHeight:1}}>
                      <Num to={k.v} suf=""/>
                      <span style={{fontSize:13,fontWeight:600,color:k.a}}>{k.suf}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ OVERVIEW ══════════════════════════════════════════════════ */}
            {tab==="overview"&&<div style={{display:"flex",flexDirection:"column",gap:18}}>

              {/* Recognition coverage alert if low */}
              {wf.coveragePct < 80 && (
                <div style={{padding:"12px 16px",background:"var(--amber-lt)",border:"1px solid #FAD7A0",borderRadius:10,display:"flex",gap:10}}>
                  <span style={{fontSize:18}}>⚠️</span>
                  <p style={{fontSize:12,color:"#7E5109",lineHeight:1.6}}>
                    <strong>{wf.neverRecognized} employees ({100-wf.coveragePct}% of workforce)</strong> have not received any recognition this year.
                    Target: 90%+ coverage. Check the People tab to identify which departments and seniority levels are underserved.
                  </p>
                </div>
              )}

              {/* Coverage + Participation donuts */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                <div className="card au1" style={{padding:"22px 24px"}}>
                  <SH eye="Workforce Coverage" title="Recognition Reach" eyeColor="var(--teal)"/>
                  <div style={{display:"flex",gap:20,alignItems:"center"}}>
                    <CoverageDonut pct={wf.coveragePct} color="var(--teal)" label="covered"/>
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
                      {[
                        {label:"Recognized",v:wf.totalPeople-wf.neverRecognized,c:"var(--teal)"},
                        {label:"Never recognized",v:wf.neverRecognized,c:"var(--red)"},
                      ].map(s=>(
                        <div key={s.label}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                            <span style={{fontSize:11,color:"var(--navy)",fontWeight:500}}>{s.label}</span>
                            <span style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color:s.c}}>{s.v}</span>
                          </div>
                          <div style={{height:5,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${s.v/wf.totalPeople*100}%`,background:s.c,borderRadius:3}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card au2" style={{padding:"22px 24px"}}>
                  <SH eye="Peer Participation" title="Who Gives Recognition" eyeColor="var(--green)"/>
                  <div style={{display:"flex",gap:20,alignItems:"center"}}>
                    <CoverageDonut pct={wf.participationPct} color="var(--green)" label="participate"/>
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
                      {[
                        {label:"Active nominators",v:wf.totalPeople-wf.neverGiven,c:"var(--green)"},
                        {label:"Never nominated anyone",v:wf.neverGiven,c:"var(--amber)"},
                      ].map(s=>(
                        <div key={s.label}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                            <span style={{fontSize:11,color:"var(--navy)",fontWeight:500}}>{s.label}</span>
                            <span style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color:s.c}}>{s.v}</span>
                          </div>
                          <div style={{height:5,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${s.v/wf.totalPeople*100}%`,background:s.c,borderRadius:3}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card au3" style={{padding:"22px 24px"}}>
                  <SH eye="Seniority Breakdown" title="Workforce Composition" eyeColor="var(--indigo)"/>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {wf.bySeniority.map((s,i)=>{
                      const colors=["#45B7D1","#4ECDC4","#F9CA24","#F96400","#FF6B6B","var(--indigo)"];
                      const c=colors[i]||"#888";
                      return(
                        <div key={s.level} style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0}}/>
                          <span style={{fontSize:11,flex:1,color:"var(--navy)",fontWeight:500}}>{s.level}</span>
                          <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)",width:24,textAlign:"right"}}>{s.headcount}</span>
                          <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted2)",width:32,textAlign:"right"}}>{Math.round(s.headcount/wf.totalPeople*100)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Monthly trend + seniority recognition rates */}
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
                <div className="card au4" style={{padding:"22px 24px"}}>
                  <SH eye="Trend" title="Monthly Recognition Activity"
                    right={<span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>Peak {maxMo} · Low {minMo}</span>}/>
                  <LineChart d={data.monthly}/>
                </div>
                <div className="card au5" style={{padding:"22px 24px"}}>
                  <SH eye="Recognition Reach by Level" title="Seniority Coverage" eyeColor="var(--purple)"/>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {wf.bySeniority.map((s,i)=>{
                      const colors=["#45B7D1","#4ECDC4","#F9CA24","#F96400","#FF6B6B","var(--indigo)"];
                      const c=colors[i]||"#888";
                      return(
                        <div key={s.level}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span style={{fontSize:11,color:"var(--navy)",fontWeight:500}}>{s.level}</span>
                            <span style={{fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:s.coveragePct>=85?c:"var(--red)"}}>{s.coveragePct}%</span>
                          </div>
                          <div style={{height:5,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${s.coveragePct}%`,background:c,borderRadius:3}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>}

            {/* ══ DEPARTMENTS TAB ════════════════════════════════════════════ */}
            {tab==="departments"&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Coverage grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {wf.byDept.map((d,i)=>{
                  const color=DEPT_COLORS[d.dept]||"#888";
                  const covColor=d.coveragePct>=90?"var(--green)":d.coveragePct>=75?"var(--amber)":"var(--red)";
                  return(
                    <div key={d.dept} className="card" style={{padding:"16px 18px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0}}/>
                        <span style={{fontWeight:700,fontSize:13,color:"var(--navy)"}}>{d.dept}</span>
                        <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",marginLeft:"auto"}}>{d.headcount} people</span>
                      </div>
                      {/* Coverage bar */}
                      <div style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:10,color:"var(--muted)"}}>Recognition coverage</span>
                          <span style={{fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:covColor}}>{d.coveragePct}%</span>
                        </div>
                        <div style={{height:6,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${d.coveragePct}%`,background:covColor,borderRadius:3,transition:"width .8s ease"}}/>
                        </div>
                      </div>
                      {/* Participation bar */}
                      <div style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:10,color:"var(--muted)"}}>Peer participation</span>
                          <span style={{fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:"var(--teal)"}}>{d.participationPct}%</span>
                        </div>
                        <div style={{height:6,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${d.participationPct}%`,background:"var(--teal)",borderRadius:3,transition:"width .8s ease"}}/>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                        {[{l:"Avg awards",v:`${d.avgAwards}×`},{l:"Recognized",v:d.recognized},{l:"Unrecognized",v:d.headcount-d.recognized}].map(s=>(
                          <div key={s.l} style={{textAlign:"center",padding:"6px 4px",background:"var(--bg)",borderRadius:6}}>
                            <div style={{fontFamily:"var(--mono)",fontSize:7,color:"var(--muted)",textTransform:"uppercase",marginBottom:2}}>{s.l}</div>
                            <div style={{fontWeight:700,fontSize:13,color:"var(--navy)"}}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Summary table */}
              <div className="card" style={{overflow:"hidden"}}>
                <div style={{padding:"16px 18px",borderBottom:"1px solid var(--border)"}}><SH eye="Summary" title="Department Recognition Health"/></div>
                <table className="tbl">
                  <thead><tr>{["#","Department","Headcount","Coverage","Participation","Avg Awards","Recognized","Unrecognized"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>{wf.byDept.map((d,i)=>{
                    const covColor=d.coveragePct>=90?"var(--green)":d.coveragePct>=75?"var(--amber)":"var(--red)";
                    return(
                      <tr key={d.dept}>
                        <td><span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted2)"}}>{String(i+1).padStart(2,"0")}</span></td>
                        <td><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:8,height:8,borderRadius:"50%",background:DEPT_COLORS[d.dept]||"#888"}}/><span style={{fontWeight:600}}>{d.dept}</span></div></td>
                        <td style={{fontFamily:"var(--mono)"}}>{d.headcount}</td>
                        <td><span style={{fontWeight:700,color:covColor,fontFamily:"var(--mono)"}}>{d.coveragePct}%</span></td>
                        <td><span style={{fontWeight:700,color:"var(--teal)",fontFamily:"var(--mono)"}}>{d.participationPct}%</span></td>
                        <td><span style={{fontFamily:"var(--mono)"}}>{d.avgAwards}×</span></td>
                        <td><span style={{fontFamily:"var(--mono)",color:"var(--green)"}}>{d.recognized}</span></td>
                        <td><span style={{fontFamily:"var(--mono)",color:d.headcount-d.recognized>0?"var(--red)":"var(--muted)"}}>{d.headcount-d.recognized}</span></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </div>}

            {/* ══ RECOGNITION ACTIVITY TAB ══════════════════════════════════ */}
            {tab==="recognition"&&<div style={{display:"flex",flexDirection:"column",gap:18}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {/* Category breakdown — framed as "what behaviours are being valued" */}
                <div className="card au1" style={{padding:"22px 24px"}}>
                  <SH eye="Behaviours Valued" title="Recognition by Category"/>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {data.categories.map(c=>(
                      <div key={c.id}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <div style={{display:"flex",alignItems:"center",gap:7}}>
                            <div style={{width:9,height:9,borderRadius:"50%",background:CAT_COLORS[c.id]||"#888",flexShrink:0}}/>
                            <span style={{fontSize:12,fontWeight:500,color:"var(--navy)"}}>{c.name}</span>
                          </div>
                          <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>{c.count} · {c.pct}%</span>
                        </div>
                        <div style={{height:6,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${c.pct}%`,background:CAT_COLORS[c.id]||"var(--orange)",borderRadius:3,transition:"width .8s ease"}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Subcategory breakdown */}
                <div className="card au2" style={{padding:"22px 24px"}}>
                  <SH eye="Detail" title="Top Behaviour Subcategories"/>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {data.subcategories.slice(0,10).map(s=>(
                      <div key={s.id} style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:22,height:22,borderRadius:4,background:CAT_COLORS[s.categoryId]||"#888",display:"grid",placeItems:"center",flexShrink:0}}>
                          <span style={{fontFamily:"var(--mono)",fontSize:8,color:"#fff",fontWeight:700}}>{s.id}</span>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span style={{fontSize:11,color:"var(--navy)",fontWeight:500}}>{s.name}</span>
                            <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>{s.count}</span>
                          </div>
                          <div style={{height:4,background:"var(--border)",borderRadius:2,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${(s.count/(data.subcategories[0]?.count||1))*100}%`,background:CAT_COLORS[s.categoryId]||"#888",borderRadius:2}}/>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Monthly trend */}
              <div className="card au3" style={{padding:"22px 24px"}}>
                <SH eye="Activity Trend" title="Recognition Frequency Over Time"
                  right={<span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>Peak {maxMo} · Low {minMo} events/month</span>}/>
                <LineChart d={data.monthly} color="var(--teal)"/>
              </div>
              {/* Top recognizers — framed as culture builders, not leaderboard */}
              <div className="card au4" style={{padding:"22px 24px"}}>
                <SH eye="Culture Builders" title="Most Active Recognition Contributors"
                  right={<span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>people who actively nominate peers</span>}/>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
                  {data.topNominators.slice(0,5).map((n,i)=>(
                    <div key={n.id} style={{padding:"14px",background:i===0?"var(--teal-lt)":"var(--bg)",border:`1px solid ${i===0?"var(--teal-md)":"var(--border)"}`,borderRadius:10}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:i===0?"var(--teal)":"var(--muted2)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>
                        {i===0?"🌟 Champion":`#${i+1}`}
                      </div>
                      <div style={{fontSize:11,fontWeight:700,color:"var(--navy)",marginBottom:3}}>{n.name}</div>
                      <div style={{fontSize:10,color:"var(--muted)",marginBottom:8}}>{n.dept}</div>
                      <div style={{fontFamily:"var(--mono)",fontSize:18,fontWeight:800,color:i===0?"var(--teal)":"var(--navy)"}}>{n.nominations}</div>
                      <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)"}}>recognitions given</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>}

            {/* ── INTELLIGENCE TABS ────────────────────────────────────────── */}
            {tab==="people"        &&<div className="au1"><EmployeeDirectory data={data}/></div>}
            {tab==="intelligence" &&<div className="au1"><HRIntelligence data={data}/></div>}

          </main>
        </div>
      </div>
    </>
  );
}