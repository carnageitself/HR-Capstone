"use client";

import { useMemo, useEffect, useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { Num } from "@/constants/primitives";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  navy:  "#0B3954", orange:"#F96400", teal: "#00A98F", green: "#27AE60",
  red:   "#E74C3C", amber: "#F39C12", muted:"#6C757D", muted2:"#ADB5BD",
  border:"#E9ECEF", bg:   "#F8F9FA",  white:"#FFFFFF",
  mono:  "var(--mono,'JetBrains Mono',ui-monospace,monospace)",
  sans:  "var(--sans,'Plus Jakarta Sans',sans-serif)",
};

type Severity = "critical"|"warning"|"positive"|"insight";
const SEV: Record<Severity,{bg:string;border:string;chip:string;chipText:string;label:string;bar:string}> = {
  critical:{ bg:"#FFFBFB", border:"#FCA5A5", chip:"#FEF2F2", chipText:"#DC2626", label:"Action Required",   bar:"#EF4444" },
  warning: { bg:"#FFFDF5", border:"#FDE68A", chip:"#FFFBEB", chipText:"#D97706", label:"Monitor Closely",   bar:"#F59E0B" },
  positive:{ bg:"#FAFFFE", border:"#A7F3D0", chip:"#F0FDF4", chipText:"#059669", label:"Performing Well",   bar:"#10B981" },
  insight: { bg:"#FAFBFF", border:"#BFDBFE", chip:"#EFF6FF", chipText:"#2563EB", label:"Strategic Insight", bar:"#3B82F6" },
};
const SEV_ICONS: Record<Severity,string> = {
  critical:"🔴", warning:"🟡", positive:"🟢", insight:"🔵",
};

interface Insight { id:string; severity:Severity; category:string; title:string; metric:string; metricSub:string; finding:string; action:string; tab?:string }
interface KpiCard  { eye:string; v:number; a?:string; bar:string; suf?:string; _compound?:number }

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
function SH({ eye, title, eyeColor, right }: { eye:string; title:string; eyeColor?:string; right?:React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <div>
        <div className="font-mono text-[9px] tracking-[.14em] uppercase font-semibold mb-1"
          style={{ color: eyeColor || T.orange }}>{eye}</div>
        <div className="text-[16px] font-extrabold tracking-tight leading-tight"
          style={{ color: T.navy }}>{title}</div>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COVERAGE DONUT — static ring, animated percentage number via Num
// ─────────────────────────────────────────────────────────────────────────────
function CoverageDonut({ pct, color, label }: { pct:number; color:string; label:string }) {
  const r = 42, cx = 52, cy = 52, circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <div className="relative shrink-0" style={{ width: 104, height: 104 }}>
      <svg width={104} height={104} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.bg} strokeWidth="10" />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <span className="font-mono font-extrabold leading-none" style={{ fontSize: 18, color: T.navy }}>
          <Num to={pct} suf="%" />
        </span>
        <span className="font-mono" style={{ fontSize: 8, color: T.muted2, marginTop: 3 }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI STRIP
// ─────────────────────────────────────────────────────────────────────────────
function KpiStrip({ kpiRow1, kpiRow2, isActive, hasData }: {
  kpiRow1:KpiCard[]; kpiRow2:KpiCard[]; isActive:boolean; hasData:boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5 mb-2">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="font-mono text-[8px] tracking-[.14em] uppercase text-gray-400">
          {isActive ? "Period Summary" : "Workforce Health"}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
        {isActive && (
          <div className="flex items-center gap-1 font-mono text-[8px] text-[#3B5BDB]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B5BDB] inline-block" />
            date filter active
          </div>
        )}
      </div>
      {isActive && !hasData ? (
        <div className="py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono text-[11px] text-gray-400">
          No award data available for selected period
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-2.5 mb-1.5">
          {kpiRow1.map(k => (
            <div key={k.eye} className="relative overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm p-3">
              <div className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background:`linear-gradient(90deg,${k.bar},${k.bar}55)` }} />
              <div className="font-mono text-[8px] tracking-widest uppercase text-gray-500 mb-1.5 leading-tight">{k.eye}</div>
              <div className="text-[22px] font-extrabold leading-none tracking-tight" style={{ color:k.bar }}>
                <Num to={k.v} />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="font-mono text-[8px] tracking-[.14em] uppercase text-gray-400">
          Organisation Dynamics {isActive && <span className="text-gray-300">(full year)</span>}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="grid grid-cols-6 gap-2.5">
        {kpiRow2.map(k => (
          <div key={k.eye} className="relative overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm p-3">
            <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background:`linear-gradient(90deg,${k.bar},${k.bar}55)` }} />
            <div className="font-mono text-[8px] tracking-widest uppercase text-gray-500 mb-1.5 leading-tight">{k.eye}</div>
            <div className="text-[22px] font-extrabold leading-none tracking-tight" style={{ color:k.bar }}>
              <Num to={k.v} /><span className="text-[13px] font-semibold" style={{ color:k.bar }}>{k.suf}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHT ENGINE — plain-language findings for non-technical readers
// ─────────────────────────────────────────────────────────────────────────────
function deriveInsights(data: DashboardData): Insight[] {
  const out: Insight[] = [];
  const wf = data.workforce, kpi = data.kpi, intel = data.intelligence;
  const neverRecPct = Math.round((wf.neverRecognized / wf.totalPeople) * 100);
  const lowDepts = wf.byDept.filter(d => d.coveragePct < 80).map(d => d.dept);

  // 1. Recognition coverage
  out.push({
    id:"coverage",
    severity: wf.coveragePct < 75 ? "critical" : wf.coveragePct < 88 ? "warning" : "positive",
    category:"Recognition Coverage",
    title: wf.coveragePct < 88
      ? `${wf.neverRecognized} employees haven't received any recognition this year`
      : "Most employees have been recognized at least once this year",
    metric:`${wf.coveragePct}%`, metricSub:"of employees recognized",
    finding: wf.coveragePct < 88
      ? `${neverRecPct}% of the workforce — ${wf.neverRecognized} people — went the entire year without being thanked or acknowledged. Employees who feel unseen are much more likely to disengage or leave.${lowDepts.length > 0 ? ` Departments with the most gaps: ${lowDepts.slice(0,3).join(", ")}.` : ""}`
      : `${wf.coveragePct}% of employees received at least one recognition this year — above the 88% healthy benchmark.`,
    action: wf.coveragePct < 88
      ? `Ask managers to identify one unrecognized person on their team and nominate them this month. Target: 90% coverage within 30 days.`
      : "Keep up the current pace. Flag any department that drops below 80% and follow up with their manager.",
    tab: wf.coveragePct < 88 ? "actions" : "employees",
  });

  // 2. Invisible contributors
  const invisible = intel.invisibleContributors;
  if (invisible.length > 0) {
    const topDepts = [...new Set(invisible.slice(0,8).map((p: { dept: string }) => p.dept))].slice(0,2).join(" and ");
    out.push({
      id:"invisible",
      severity: invisible.length >= 15 ? "critical" : invisible.length >= 6 ? "warning" : "insight",
      category:"Retention Risk",
      title:`${invisible.length} employees are actively recognizing others but have never been recognized themselves`,
      metric:`${invisible.length}`, metricSub:"give awards, receive none",
      finding:`These ${invisible.length} employees each nominated 3 or more colleagues but received zero recognition in return. They are often the most engaged members of the team — and research shows they are also the most likely to quietly leave when they feel unappreciated. Most are in ${topDepts || "multiple departments"}.`,
      action:`Recognize the top ${Math.min(5,invisible.length)} people on this list this week. Alert their managers so they can follow up personally.`,
      tab:"actions",
    });
  }

  // 3. Weakest department
  const lowestDept = [...wf.byDept].sort((a,b) => a.coveragePct - b.coveragePct)[0];
  if (lowestDept && lowestDept.coveragePct < 85) {
    out.push({
      id:"dept-gap",
      severity: lowestDept.coveragePct < 72 ? "critical" : "warning",
      category:"Department Health",
      title:`${lowestDept.dept} has the lowest recognition rate in the organization`,
      metric:`${lowestDept.coveragePct}%`, metricSub:`coverage · ${lowestDept.headcount - lowestDept.recognized} of ${lowestDept.headcount} not yet reached`,
      finding:`Only ${lowestDept.coveragePct}% of ${lowestDept.dept} has been recognized this year, and only ${lowestDept.participationPct}% are actively giving recognition to others. When both numbers are low together, it usually points to a cultural gap that needs direct leadership attention — not just a reminder email.`,
      action:`Have a conversation with ${lowestDept.dept} leadership. A short team challenge or a visible example from the department head can shift the culture quickly.`,
      tab:"actions",
    });
  }

  // 4. Award value equity
  const senData = intel.equityData;
  if (senData.length > 1) {
    const sorted = [...senData].sort((a: { avg_value: number; recipient_seniority: string }, b: { avg_value: number; recipient_seniority: string }) => a.avg_value - b.avg_value);
    const lo = sorted[0], hi = sorted[sorted.length-1];
    const gap = Math.round(((hi.avg_value - lo.avg_value) / Math.max(lo.avg_value,1)) * 100);
    if (gap > 20) {
      out.push({
        id:"equity",
        severity: gap > 45 ? "warning" : "insight",
        category:"Pay & Recognition Equity",
        title:"Award values differ significantly depending on seniority level",
        metric:`$${hi.avg_value - lo.avg_value}`, metricSub:`gap between ${hi.recipient_seniority}s and ${lo.recipient_seniority}s`,
        finding:`${hi.recipient_seniority}s receive an average of $${hi.avg_value} per award vs $${lo.avg_value} for ${lo.recipient_seniority}s — a ${gap}% difference. If this isn't intentional, it may send the unintended message that some contributions matter less than others.`,
        action:`Review award value guidelines with your HR team. Consider aligning award bands to the impact of the contribution rather than the seniority of the person.`,
        tab:"intelligence",
      });
    }
  }

  // 5. Peer recognition
  out.push({
    id:"peer",
    severity: kpi.peerRecognitionPct >= 40 ? "positive" : "warning",
    category:"Culture Signal",
    title: kpi.peerRecognitionPct >= 40
      ? "Employees are recognizing each other — not just waiting for managers to do it"
      : "Most recognition is coming from managers, not from colleagues",
    metric:`${kpi.peerRecognitionPct}%`, metricSub:"of recognition is colleague-to-colleague",
    finding: kpi.peerRecognitionPct >= 40
      ? `${kpi.peerRecognitionPct}% of recognitions this year were given by a colleague rather than a manager. The healthy benchmark is 40–60%, meaning people feel comfortable appreciating each other without being prompted.`
      : `Only ${kpi.peerRecognitionPct}% of recognitions came from peers. When recognition is almost entirely manager-driven, it starts to feel like a formal process rather than genuine appreciation.`,
    action: kpi.peerRecognitionPct >= 40
      ? "Share examples of colleague-to-colleague recognition in your next all-hands to reinforce the behavior."
      : "Introduce simple prompts for teams — a weekly shout-out slot in team meetings or a nudge in your internal comms tool can make a real difference.",
    tab:"recognition",
  });

  // 6. Cross-department recognition
  out.push({
    id:"crossdept",
    severity: kpi.crossDeptPct >= 30 ? "positive" : kpi.crossDeptPct >= 15 ? "insight" : "warning",
    category:"Collaboration Health",
    title: kpi.crossDeptPct >= 30
      ? "People are recognizing colleagues across different teams — a sign of a connected organization"
      : "Most recognition stays within the same team — cross-department collaboration may need a boost",
    metric:`${kpi.crossDeptPct}%`, metricSub:"of recognitions crossed team boundaries",
    finding: kpi.crossDeptPct >= 30
      ? `${kpi.crossDeptPct}% of awards went to someone in a different department. This is a healthy sign — it means people notice and appreciate work happening outside their immediate team.`
      : `Only ${kpi.crossDeptPct}% of recognitions crossed department lines. Teams that only recognize internally can gradually drift into silos, reducing collaboration over time.`,
    action: kpi.crossDeptPct >= 30
      ? "Highlight cross-team recognition stories in leadership communications to reinforce the behavior."
      : "Ask senior leaders to each recognize one person from a different department this quarter — it sets a visible example.",
    tab:"recognition",
  });

  // 7. Recognition trend
  const trend = kpi.momTrend;
  if (Math.abs(trend) >= 8) {
    out.push({
      id:"momentum",
      severity: trend <= -15 ? "warning" : trend >= 15 ? "positive" : "insight",
      category:"Program Momentum",
      title: trend > 0
        ? "Recognition activity is increasing — the program is gaining traction"
        : "Recognition activity has declined over the last three months",
      metric:`${trend > 0 ? "+" : ""}${trend}%`, metricSub:"change over last 3 months",
      finding: trend > 0
        ? `Recognition volume is up ${trend}% compared to the previous three months. Sustained increases like this typically show up as improved engagement scores 2–3 months later.`
        : `Activity dropped ${Math.abs(trend)}% over the last quarter. This kind of decline often precedes a dip in engagement results — worth investigating before it becomes a bigger issue.`,
      action: trend > 0
        ? "Share this trend with leadership as concrete evidence that the recognition program is working."
        : "Brief department heads on the drop. A short push — a manager reminder or a team challenge — can reverse the trend within 30 days.",
      tab:"recognition",
    });
  }

  // 8. Category distribution
  const topCat = data.categories[0], botCat = data.categories[data.categories.length-1];
  if (topCat && botCat && topCat.id !== botCat.id) {
    out.push({
      id:"category-skew",
      severity:"insight",
      category:"Values Alignment",
      title:"One type of behavior dominates recognition — others are barely represented",
      metric:`${topCat.pct}%`, metricSub:`"${topCat.name}" leads all categories`,
      finding:`"${topCat.name}" makes up ${topCat.pct}% of all awards this year. At the other end, "${botCat.name}" received just ${botCat.count} recognitions (${botCat.pct}%) all year. If your strategic priorities include more than ${topCat.name.toLowerCase()}, that may not be reflected in how people are being thanked.`,
      action:`Ask your leadership team whether the current mix of awards reflects what the company values most this year. Brief managers to look for and nominate behaviors in underrepresented areas.`,
      tab:"recognition",
    });
  }

  // 9. Rising stars
  if (intel.risingStars.length > 0) {
    out.push({
      id:"rising",
      severity:"insight",
      category:"Talent Pipeline",
      title:`${intel.risingStars.length} employees are being recognized more frequently over time — potential future leaders`,
      metric:`${intel.risingStars.length}`, metricSub:"employees with rising recognition",
      finding:`These employees have been recognized at an increasing rate throughout the year — their contributions are being noticed more and more. Employees on this kind of upward trajectory often respond well to stretch opportunities and added responsibility.`,
      action:`Flag the top 5 to your talent team. Have a conversation with their managers about career development. These are the people worth investing in proactively.`,
      tab:"intelligence",
    });
  }

  // 10. Culture carriers
  if (kpi.cultureCarriers > 0) {
    const pct = Math.round((kpi.cultureCarriers / wf.totalPeople) * 100);
    out.push({
      id:"culture-carriers",
      severity: pct < 8 ? "warning" : "insight",
      category:"Culture Sustainability",
      title: pct < 8
        ? "The recognition culture depends on a very small group of people — a risk if any of them leave"
        : "A healthy number of employees are leading recognition by example",
      metric:`${kpi.cultureCarriers}`, metricSub:`${pct}% of workforce · gave 5+ recognitions`,
      finding: pct < 8
        ? `Only ${pct}% of your workforce consistently give recognition (5 or more awards). If even a few of these people leave, the program can lose momentum quickly.`
        : `${kpi.cultureCarriers} employees have each given 5 or more recognitions this year — they are the people making others feel valued and setting the cultural tone.`,
      action: pct < 8
        ? "Identify and support these champions. Look for ways to bring more people in — team challenges and manager coaching can widen the base."
        : "Make sure these people are also being recognized themselves. Consider celebrating their contribution publicly — it reinforces the behavior at all levels.",
      tab:"employees",
    });
  }

  const ORDER: Record<Severity,number> = { critical:0, warning:1, positive:2, insight:3 };
  return out.sort((a,b) => ORDER[a.severity] - ORDER[b.severity]);
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHT CARD
// ─────────────────────────────────────────────────────────────────────────────
function InsightCard({ insight, onNavigate }: { insight:Insight; onNavigate?:(tab:string)=>void }) {
  const s = SEV[insight.severity];
  const metricLen = (insight.metric ?? "").length;
  const metricSize = metricLen <= 5 ? 26 : metricLen <= 10 ? 20 : metricLen <= 15 ? 16 : 13;
  return (
    <div className="flex overflow-hidden rounded-[10px] shadow-sm"
      style={{ border:`1px solid ${s.border}`, borderLeft:`4px solid ${s.bar}`, background:T.white }}>

      {/* Metric block */}
      <div className="flex flex-col items-center justify-center shrink-0 gap-1.5 px-3 py-5"
        style={{ background:s.chip, borderRight:`1px solid ${s.border}`, width:112, minWidth:112 }}>
        <div className="font-mono font-extrabold leading-tight tracking-tight text-center w-full"
          style={{ color:s.chipText, fontSize:metricSize, wordBreak:"break-word", overflowWrap:"break-word" }}>
          {insight.metric}
        </div>
        <div className="font-mono font-semibold text-center leading-snug w-full"
          style={{ color:s.chipText, fontSize:9, opacity:0.75, wordBreak:"break-word", overflowWrap:"break-word" }}>
          {insight.metricSub}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-2.5 px-5 py-4 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] font-bold tracking-[.12em] uppercase truncate"
            style={{ color:T.muted2 }}>{insight.category}</span>
          <span className="font-mono text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap"
            style={{ background:s.chip, color:s.chipText }}>{s.label}</span>
        </div>
        <p className="text-[14px] font-extrabold leading-snug tracking-tight m-0"
          style={{ color:T.navy }}>{insight.title}</p>
        <p className="text-[12px] font-medium leading-relaxed m-0"
          style={{ color:T.muted }}>{insight.finding}</p>
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg"
          style={{ background:s.bg, border:`1px solid ${s.border}` }}>
          <span className="font-mono text-[9px] font-extrabold tracking-[.1em] uppercase shrink-0 pt-0.5"
            style={{ color:s.chipText }}>Action:</span>
          <p className="text-[12px] font-medium leading-relaxed m-0 flex-1"
            style={{ color:T.navy }}>{insight.action}</p>
          {insight.tab && onNavigate && (
            <button onClick={() => onNavigate(insight.tab!)}
              className="shrink-0 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md cursor-pointer bg-transparent self-end whitespace-nowrap"
              style={{ color:s.chipText, border:`1px solid ${s.border}` }}>
              View →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEVERITY GROUP
// ─────────────────────────────────────────────────────────────────────────────
function SeverityGroup({ severity, items, onNavigate }: {
  severity:Severity; items:Insight[]; onNavigate?:(tab:string)=>void;
}) {
  if (!items.length) return null;
  const s = SEV[severity];
  return (
    <div className="flex flex-col overflow-hidden rounded-xl shadow-sm"
      style={{ border:`1px solid ${T.border}`, background:T.white }}>
      <div className="flex items-center gap-3 px-5 py-3"
        style={{ background:s.bg, borderBottom:`1px solid ${s.border}` }}>
        <span className="text-sm">{SEV_ICONS[severity]}</span>
        <span className="flex-1 font-mono text-[11px] font-extrabold tracking-[.1em] uppercase"
          style={{ color:s.chipText }}>{s.label}</span>
        <span className="font-mono text-[12px] font-extrabold px-3 py-0.5 rounded-full"
          style={{ background:T.white, color:s.chipText, border:`1px solid ${s.border}` }}>
          {items.length}
        </span>
      </div>
      <div className="flex flex-col">
        {items.map((item, i) => (
          <div key={item.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <InsightCard insight={item} onNavigate={onNavigate} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI INSIGHTS PANEL — Claude-powered deep analysis
// ─────────────────────────────────────────────────────────────────────────────
interface AiInsight {
  severity: Severity;
  category: string;
  title: string;
  metric: string;
  metricSub: string;
  finding: string;
  action: string;
  tab?: string;
}

type AiState = "loading" | "fresh" | "stale";

function AiInsightsPanel({ data: _data, onNavigate }: { data: DashboardData; onNavigate?: (tab: string) => void }) {
  const [state, setState]             = useState<AiState>("loading");
  const [insights, setInsights]       = useState<AiInsight[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [bgRefreshing, setBgRefreshing] = useState(false);

  useEffect(() => { loadCache(); }, []);

  // Poll every 6s whenever a background refresh is in flight (no cache yet, or stale)
  useEffect(() => {
    if (!bgRefreshing) return;
    const interval = setInterval(async () => {
      const res = await fetch("/api/ai-insights").catch(() => null);
      if (!res?.ok) return;
      const json = await res.json();
      if (json.insights?.length > 0 && !json.refreshing) {
        setInsights(json.insights);
        setGeneratedAt(json.generatedAt ?? null);
        setState("fresh");
        setBgRefreshing(false);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [bgRefreshing]);

  async function loadCache() {
    try {
      const res = await fetch("/api/ai-insights");
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();

      if (json.insights?.length > 0) {
        // Detect bad cache from a previous broken run:
        // metrics like "Unknown", "0%", "?%" mean Claude received empty data
        const hasBadData = json.insights.some((ins: AiInsight) =>
          !ins.metric ||
          ins.metric === "Unknown" ||
          ins.metric === "0%" ||
          ins.metric === "?%" ||
          ins.metric === "?" ||
          ins.metric.includes("undefined")
        );

        if (hasBadData) {
          // Wipe the bad cache and regenerate from fresh data
          await fetch("/api/ai-insights", { method: "DELETE" });
          await runOnce();
          return;
        }

        setInsights(json.insights);
        setGeneratedAt(json.generatedAt ?? null);
        setState(json.stale ? "stale" : "fresh");
        if (json.refreshing) setBgRefreshing(true);
      } else {
        await runOnce();
      }
    } catch {
      await runOnce();
    }
  }

  async function runOnce() {
    // state stays "loading" — skeleton remains visible while this runs
    try {
      const res = await fetch("/api/ai-insights", { method: "POST" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.insights?.length > 0) {
        setInsights(json.insights);
        setGeneratedAt(json.generatedAt ?? null);
        setState("fresh");
      }
    } catch {
      // silently fail — skeleton will stay, no confusing error shown to HR
    }
  }

  const ORDER: Record<Severity, number> = { critical: 0, warning: 1, positive: 2, insight: 3 };
  const sorted = [...insights].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

  const formatAge = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000 / 60;
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return `${Math.round(diff / 1440)}d ago`;
  };

  return (
    <div className="rounded-xl overflow-hidden shadow-sm"
      style={{ border: `1px solid #C7D2FE`, background: T.white }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)", borderBottom: "1px solid #C7D2FE" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 2px 8px rgba(99,102,241,.35)" }}>
            ✦
          </div>
          <div>
            <div className="font-mono text-[9px] font-bold tracking-[.16em] uppercase mb-0.5"
              style={{ color: "#6366F1" }}>AI-Powered Analysis</div>
            <div className="text-[16px] font-extrabold tracking-tight" style={{ color: T.navy }}>
              Daily Intelligence Briefing
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status indicators — read only, no user actions */}
          {state === "fresh" && generatedAt && !bgRefreshing && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] px-3 py-1 rounded-full"
              style={{ background:"#F0FDF4", color:"#059669", border:"1px solid #A7F3D0" }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background:"#10B981" }} />
              Updated {formatAge(generatedAt)}
            </div>
          )}
          {bgRefreshing && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] px-3 py-1 rounded-full"
              style={{ background:"#EEF2FF", color:"#6366F1", border:"1px solid #C7D2FE" }}>
              <span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◌</span>
              Updating…
            </div>
          )}
          {state === "stale" && generatedAt && !bgRefreshing && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] px-3 py-1 rounded-full"
              style={{ background:"#FFFBEB", color:"#D97706", border:"1px solid #FDE68A" }}>
              <span>🕓</span> {formatAge(generatedAt)}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">

        {/* Skeleton — shown on initial load AND while waiting for first-ever generation */}
        {state === "loading" && (
          <div className="flex flex-col gap-3">
            {[0,1,2,3].map(i => (
              <div key={i} className="flex overflow-hidden rounded-[10px]"
                style={{ border:`1px solid #E9ECEF`, animationDelay:`${i*0.08}s` }}>
                <div className="shrink-0 w-[110px] h-[88px] animate-pulse rounded-l-[10px]"
                  style={{ background:"#EEF2FF" }} />
                <div className="flex flex-col flex-1 gap-2.5 px-5 py-4">
                  <div className="h-2.5 w-24 rounded animate-pulse" style={{ background:"#E9ECEF" }} />
                  <div className="h-4 w-3/4 rounded animate-pulse" style={{ background:"#EEF2FF" }} />
                  <div className="h-3 w-full rounded animate-pulse" style={{ background:"#F3F4F6" }} />
                  <div className="h-3 w-5/6 rounded animate-pulse" style={{ background:"#F3F4F6" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Insights */}
        {(state === "fresh" || state === "stale") && sorted.length > 0 && (
          <div className="flex flex-col gap-3">
            {state === "stale" && bgRefreshing && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg"
                style={{ background:"#EEF2FF", border:"1px solid #C7D2FE" }}>
                <span style={{ animation:"spin 1s linear infinite", display:"inline-block", color:"#6366F1" }}>◌</span>
                <p className="text-[12px] m-0" style={{ color:"#4338CA" }}>
                  <strong>Updating in the background</strong> — new insights will replace these automatically.
                </p>
              </div>
            )}
            {sorted.map((ins, i) => {
              const s = SEV[ins.severity];
              // Dynamically shrink metric font for long values
              const metricLen = (ins.metric ?? "").length;
              const metricSize = metricLen <= 5 ? 26 : metricLen <= 10 ? 20 : metricLen <= 15 ? 16 : 13;
              return (
                <div key={i} className="flex overflow-hidden rounded-[10px] shadow-sm"
                  style={{
                    border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.bar}`, background: T.white,
                    animation: `fadeUp .4s cubic-bezier(.22,.68,0,1.2) ${i * 0.07}s both`,
                  }}>

                  {/* Metric block — fixed width, overflow-safe */}
                  <div className="flex flex-col items-center justify-center shrink-0 gap-1.5 px-3 py-5"
                    style={{ background: s.chip, borderRight: `1px solid ${s.border}`, width: 112, minWidth: 112 }}>
                    <div className="font-mono font-extrabold leading-tight tracking-tight text-center break-words w-full"
                      style={{ color: s.chipText, fontSize: metricSize, wordBreak: "break-word", overflowWrap: "break-word" }}>
                      {ins.metric}
                    </div>
                    <div className="font-mono font-semibold text-center leading-snug w-full"
                      style={{ color: s.chipText, fontSize: 9, opacity: 0.75, wordBreak: "break-word", overflowWrap: "break-word" }}>
                      {ins.metricSub}
                    </div>
                  </div>

                  {/* Content block */}
                  <div className="flex flex-col flex-1 gap-2 px-5 py-4 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] font-bold tracking-[.12em] uppercase truncate"
                        style={{ color: T.muted2 }}>{ins.category}</span>
                      <span className="font-mono text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                        style={{ background: s.chip, color: s.chipText, border: `1px solid ${s.border}` }}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-[14px] font-extrabold leading-snug tracking-tight m-0"
                      style={{ color: T.navy }}>{ins.title}</p>
                    <p className="text-[12px] font-medium leading-relaxed m-0"
                      style={{ color: T.muted }}>{ins.finding}</p>
                    <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg"
                      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                      <span className="font-mono text-[9px] font-extrabold tracking-[.1em] uppercase shrink-0 pt-0.5"
                        style={{ color: s.chipText }}>Action:</span>
                      <p className="text-[12px] font-medium leading-relaxed m-0 flex-1"
                        style={{ color: T.navy }}>{ins.action}</p>
                      {onNavigate && (
                        <button
                          onClick={() => {
                            const target = ins.tab ?? (() => {
                              const cat = (ins.category ?? "").toLowerCase();
                              if (cat.includes("retention") || cat.includes("invisible") || cat.includes("at-risk") || cat.includes("unrecognized")) return "actions";
                              if (cat.includes("dept") || cat.includes("department") || cat.includes("coverage")) return "departments";
                              if (cat.includes("manager") || cat.includes("effectiveness")) return "manager";
                              if (cat.includes("equity") || cat.includes("rising") || cat.includes("momentum") || cat.includes("cross")) return "intelligence";
                              if (cat.includes("trend") || cat.includes("category") || cat.includes("sentiment") || cat.includes("peer") || cat.includes("culture")) return "recognition";
                              if (cat.includes("talent") || cat.includes("engagement") || cat.includes("employee")) return "employees";
                              if (ins.severity === "critical") return "actions";
                              if (ins.severity === "warning") return "departments";
                              return "recognition";
                            })();
                            onNavigate(target);
                          }}
                          className="shrink-0 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md cursor-pointer bg-transparent self-end whitespace-nowrap"
                          style={{ color: s.chipText, border: `1px solid ${s.border}` }}>
                          View →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-center mt-1 font-mono" style={{ color: T.muted2 }}>
              Last updated {generatedAt ? new Date(generatedAt).toLocaleString("en-US", { dateStyle:"medium", timeStyle:"short" }) : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function Overview({ data, kpiRow1, kpiRow2, isActive, hasData, onNavigate }: {
  data:DashboardData; kpiRow1:KpiCard[]; kpiRow2:KpiCard[];
  isActive:boolean; hasData:boolean; onNavigate?:(tab:string)=>void;
}) {
  const wf = data.workforce;

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily:T.sans }}>

      {/* KPI Strip */}
      <KpiStrip kpiRow1={kpiRow1} kpiRow2={kpiRow2} isActive={isActive} hasData={hasData} />

      {/* Coverage warning banner */}
      {wf.coveragePct < 80 && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
          style={{ background:"#FFFBEB", border:"1px solid #FDE68A" }}>
          <span className="text-lg shrink-0">⚠️</span>
          <p className="text-[12px] leading-relaxed m-0" style={{ color:"#92400E" }}>
            <strong>{wf.neverRecognized} employees ({100 - wf.coveragePct}% of workforce)</strong> have not received any recognition this year. Target: 90%+ coverage.
          </p>
        </div>
      )}

      {/* Coverage + Participation donuts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recognition Reach */}
        <div className="rounded-xl p-6 shadow-sm" style={{ background:T.white, border:`1px solid ${T.border}` }}>
          <SH eye="Workforce Coverage" title="Recognition Reach" eyeColor={T.teal} />
          <div className="flex items-center gap-5">
            <CoverageDonut pct={wf.coveragePct} color={T.teal} label="covered" />
            <div className="flex flex-col flex-1 gap-2.5">
              {[
                { label:"Recognized",       v:wf.totalPeople - wf.neverRecognized, c:T.teal },
                { label:"Never recognized", v:wf.neverRecognized,                  c:T.red  },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] font-medium" style={{ color:T.navy }}>{row.label}</span>
                    <span className="font-mono text-[12px] font-bold" style={{ color:row.c }}>
                      <Num to={row.v} />
                    </span>
                  </div>
                  <div className="h-1.5 rounded overflow-hidden" style={{ background:T.bg }}>
                    <div className="h-full rounded" style={{ width:`${row.v / wf.totalPeople * 100}%`, background:row.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Who Gives Recognition */}
        <div className="rounded-xl p-6 shadow-sm" style={{ background:T.white, border:`1px solid ${T.border}` }}>
          <SH eye="Peer Participation" title="Who Gives Recognition" eyeColor={T.green} />
          <div className="flex items-center gap-5">
            <CoverageDonut pct={wf.participationPct} color={T.green} label="participate" />
            <div className="flex flex-col flex-1 gap-2.5">
              {[
                { label:"Active nominators",      v:wf.totalPeople - wf.neverGiven, c:T.green },
                { label:"Never nominated anyone", v:wf.neverGiven,                  c:T.amber },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] font-medium" style={{ color:T.navy }}>{row.label}</span>
                    <span className="font-mono text-[12px] font-bold" style={{ color:row.c }}>
                      <Num to={row.v} />
                    </span>
                  </div>
                  <div className="h-1.5 rounded overflow-hidden" style={{ background:T.bg }}>
                    <div className="h-full rounded" style={{ width:`${row.v / wf.totalPeople * 100}%`, background:row.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <AiInsightsPanel data={data} onNavigate={onNavigate} />

    </div>
  );
}