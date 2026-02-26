import fs from "fs";
import path from "path";
import { parseCSV } from "./parseCSV";

// ── Enriched award row (awards_enriched.csv) ─────────────────────────────────
interface EnrichedAward {
  award_id: string;
  award_date: string;
  award_title: string;
  message: string;
  value: string;
  recipient_id: string;
  recipient_name: string;
  recipient_title: string;
  recipient_department: string;
  recipient_seniority: string;
  recipient_skills: string;        // comma-separated e.g. "Leadership,Communication"
  nominator_id: string;
  nominator_name: string;
  nominator_title: string;
  nominator_department: string;
  nominator_seniority: string;
  category_id: string;             // A–F
  category_name: string;
  subcategory_id: string;          // A1, A2, B1 …
  subcategory_name: string;
  reasoning: string;
}

// ── DashboardData contract (kept backward-compatible + extended) ──────────────
export interface DashboardData {
  kpi: {
    // workforce
    totalAwards: number;
    totalMonetary: number;
    avgAwardValue: number;
    uniqueRecipients: number;
    uniqueNominators: number;
    uniqueDepartments: number;
    recognitionRate: number;
    // people health
    highPerformers: number;         // received >= 5 recognitions
    cultureCarriers: number;        // given >= 5 recognitions
    atRiskCount: number;            // received > 0 but > 120 days since last
    neverRecognizedCount: number;   // received = 0
    // org dynamics
    crossDeptPct: number;           // % of awards given across departments
    peerRecognitionPct: number;     // % within ±1 seniority level
    icRatio: number;                // % of workforce who are IC/Senior IC
    execRatio: number;              // % of workforce who are Director/VP
    // momentum
    momTrend: number;               // month-over-month % change (last 3 vs prev 3 months)
    avgMonthlyAwards: number;       // average awards per active month
  };
  // category + subcategory breakdowns
  categories: { id: string; name: string; count: number; pct: number; totalValue: number }[];
  subcategories: { id: string; name: string; categoryId: string; categoryName: string; count: number; pct: number }[];
  // time series
  monthly: { month: string; label: string; awards: number; value: number }[];
  // department-level
  departments: {
    name: string;
    awards: number;
    totalValue: number;
    avgValue: number;
    uniqueRecipients: number;
    uniqueNominators: number;
  }[];
  // seniority distribution
  seniority: { level: string; count: number; pct: number }[];
  // top lists
  topRecipients: { id: string; name: string; dept: string; title: string; seniority: string; awards: number }[];
  topNominators: { id: string; name: string; dept: string; title: string; nominations: number }[];
  // skills from recipient_skills column
  skills: { name: string; count: number; dominantCategory: string }[];
  // award value distribution
  valueDistribution: { value: number; count: number }[];
  // ── advanced features ─────────────────────────────────────────────────────
  network: {
    nodes: {
      id: string; name: string; dept: string; title: string; seniority: string;
      received: number; given: number; totalValue: number; color: string;
    }[];
    edges: { source: string; target: string; weight: number }[];
  };
  cultureHealth: {
    name: string; health: number; totalAwards: number; totalValue: number;
    avgValue: number; uniqueRecipients: number; uniqueNominators: number;
    categoryDiversity: number; crossDeptPct: number; participation: number;
    scores: { diversity: number; participation: number; volume: number; generosity: number };
    categorySpread: { id: string; name: string; count: number }[];
  }[];
  wordCloud: { word: string; count: number }[];
  messageThemes: { categoryId: string; category: string; words: { word: string; count: number }[] }[];
  skillInsights: {
    topSkills: { skill: string; count: number; dominantCategory: string }[];
    byDepartment: Record<string, { skill: string; count: number }[]>;
    skillCategoryMatrix: { skill: string; categories: Record<string, number> }[];
  };
  // ── Workforce (HR-centric people view, not award-centric) ────────────────
  workforce: {
    totalPeople: number;
    neverRecognized: number;       // received = 0
    neverGiven: number;            // given = 0
    coveragePct: number;           // % of people who received at least 1
    participationPct: number;      // % of people who gave at least 1
    byDept: {
      dept: string; headcount: number; recognized: number; givers: number;
      coveragePct: number; participationPct: number; avgAwards: number; totalValue: number;
    }[];
    bySeniority: {
      level: string; headcount: number; recognized: number;
      avgReceived: number; avgGiven: number; coveragePct: number;
    }[];
    people: {
      id: string; name: string; dept: string; title: string; seniority: string;
      received: number; given: number; valueReceived: number;
    }[];
  };
  intelligence: {
    invisibleContributors: {
      id: string; name: string; dept: string; title: string;
      seniority: string; given: number; received: number; riskScore: number;
    }[];
    risingStars: {
      id: string; name: string; dept: string; seniority: string;
      slope: number; total: number; recent: number; months: number;
      monthlyData: { period: string; awards: number }[];
    }[];
    decliningRecognition: {
      id: string; name: string; dept: string; seniority: string;
      slope: number; total: number; recent: number; months: number;
      monthlyData: { period: string; awards: number }[];
    }[];
    crossDeptFlow: { from: string; to: string; value: number }[];
    depts: string[];
    equityData: {
      recipient_seniority: string; count: number; avg_value: number;
      total_value: number; high_value: number; high_value_pct: number;
    }[];
    managerReach: {
      id: string; name: string; dept: string; seniority: string;
      total: number; unique_depts: number; avg_value: number;
    }[];
    // ── New features ──────────────────────────────────────────────────────
    skillGaps: {
      skill: string; count: number; deptCount: number;
      depts: string[]; rarity: "common" | "moderate" | "rare";
      byDept: Record<string, number>;
    }[];
    seasonality: {
      month: number; monthName: string;
      total: number;
      byCategory: Record<string, number>;
      dominantCategory: string;
    }[];
    orgConnectors: {
      id: string; name: string; dept: string; seniority: string; title: string;
      uniquePeopleRecognized: number; uniqueDeptsReached: number; totalGiven: number;
      collaborationScore: number;
    }[];
    valueEquity: {
      byDept: { dept: string; total: number; avg: number; perPerson: number; pct: number }[];
      bySeniority: { level: string; total: number; avg: number; highValuePct: number }[];
      concentration: { top10Pct: number; top10Value: number; giniCoeff: number };
    };
  };
  // ── Employee Directory ────────────────────────────────────────────────────
  employeeDirectory: {
    id: string;
    name: string;
    dept: string;
    title: string;
    seniority: string;
    skills: string[];
    received: number;
    given: number;
    valueReceived: number;
    engagementScore: number;
    status: "thriving" | "active" | "passive" | "at_risk" | "never_recognized";
    daysSinceLast: number;
    lastAwardDate: string | null;
    categoryBreakdown: { id: string; count: number }[];
    recentAwards: {
      date: string; title: string; value: number;
      category: string; categoryId: string; subcategory: string;
      fromName: string; fromDept: string; message: string;
    }[];
  }[];
}

// ── helpers ───────────────────────────────────────────────────────────────────
function readCSV<T>(filename: string): T[] {
  const p = path.join(process.cwd(), "data", filename);
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, "utf-8");
  return parseCSV<Record<string, string>>(raw) as unknown as T[];
}

const DEPT_COLORS: Record<string, string> = {
  Marketing: "#FD79A8",  "Data Science": "#4ECDC4", Finance: "#FFEAA7",
  "Customer Service": "#FF6B6B", Product: "#00CEC9",  Design: "#45B7D1",
  Sales: "#FDCB6E", Legal: "#A29BFE", HR: "#DDA15E", IT: "#6C5CE7",
  Engineering: "#96CEB4", Operations: "#74B9FF",
};

const STOP = new Set([
  "that","this","your","with","have","been","from","they","will","were",
  "team","thank","thanks","work","great","just","take","want","wanted",
  "much","like","also","make","know","time","more","when","very","such",
  "some","into","about","their","would","which","there","really","always",
  "every","what","doing","done","made","well","even","only","here","then",
  "over","back","each","most","could","should","during","getting","being",
  "going","because","year","both","last","past","while","first","given",
  "long","close","award","today","since","where","next","week","weeks",
  "month","quick","people","across","these","those","many","another",
]);

// ── main loader ───────────────────────────────────────────────────────────────
export function loadDashboardData(): DashboardData {
  const rows = readCSV<EnrichedAward>("awards_enriched.csv");

  // Safety: if file is missing or empty return a zero-state so the UI doesn't crash
  if (!rows || rows.length === 0) {
    return {
      kpi:{ totalAwards:0,totalMonetary:0,avgAwardValue:0,uniqueRecipients:0,uniqueNominators:0,uniqueDepartments:0,recognitionRate:0,highPerformers:0,cultureCarriers:0,atRiskCount:0,neverRecognizedCount:0,crossDeptPct:0,peerRecognitionPct:0,icRatio:0,execRatio:0,momTrend:0,avgMonthlyAwards:0 },
      categories:[],subcategories:[],monthly:[],departments:[],seniority:[],
      topRecipients:[],topNominators:[],skills:[],valueDistribution:[],
      network:{nodes:[],edges:[]},cultureHealth:[],wordCloud:[],messageThemes:[],
      skillInsights:{topSkills:[],byDepartment:{},skillCategoryMatrix:[]},
      workforce:{totalPeople:0,neverRecognized:0,neverGiven:0,coveragePct:0,participationPct:0,byDept:[],bySeniority:[],people:[]},
      intelligence:{invisibleContributors:[],risingStars:[],decliningRecognition:[],crossDeptFlow:[],depts:[],equityData:[],managerReach:[],skillGaps:[],seasonality:[],orgConnectors:[],valueEquity:{byDept:[],bySeniority:[],concentration:{top10Pct:0,top10Value:0,giniCoeff:0}}},
      employeeDirectory:[],
    };
  }

  const MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalMonetary = rows.reduce((s, r) => s + (parseInt(r.value) || 0), 0);
  const uniqueRecips  = new Set(rows.map(r => r.recipient_id));
  const uniqueNoms    = new Set(rows.map(r => r.nominator_id));
  const uniqueDepts   = new Set(rows.map(r => r.recipient_department));

  // ── Categories ───────────────────────────────────────────────────────────
  const catCount:  Record<string, number> = {};
  const catValue:  Record<string, number> = {};
  const catName:   Record<string, string> = {};
  for (const r of rows) {
    catCount[r.category_id]  = (catCount[r.category_id]  || 0) + 1;
    catValue[r.category_id]  = (catValue[r.category_id]  || 0) + (parseInt(r.value) || 0);
    catName[r.category_id]   = r.category_name;
  }
  const categories = Object.entries(catCount)
    .sort((a,b) => b[1] - a[1])
    .map(([id, count]) => ({
      id, name: catName[id] || id, count,
      pct: parseFloat(((count / rows.length) * 100).toFixed(1)),
      totalValue: catValue[id] || 0,
    }));

  // ── Subcategories ────────────────────────────────────────────────────────
  const subCount: Record<string, number> = {};
  const subMeta:  Record<string, { name: string; catId: string; catName: string }> = {};
  for (const r of rows) {
    subCount[r.subcategory_id] = (subCount[r.subcategory_id] || 0) + 1;
    subMeta[r.subcategory_id]  = { name: r.subcategory_name, catId: r.category_id, catName: r.category_name };
  }
  const subcategories = Object.entries(subCount)
    .sort((a,b) => b[1] - a[1])
    .map(([id, count]) => ({
      id, name: subMeta[id]?.name || id,
      categoryId: subMeta[id]?.catId || "",
      categoryName: subMeta[id]?.catName || "",
      count,
      pct: parseFloat(((count / rows.length) * 100).toFixed(1)),
    }));

  // ── Monthly ──────────────────────────────────────────────────────────────
  const moCount: Record<string, number> = {};
  const moValue: Record<string, number> = {};
  for (const r of rows) {
    if (!r.award_date) continue;
    const d = new Date(r.award_date);
    if (isNaN(d.getTime())) continue;
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    moCount[k] = (moCount[k] || 0) + 1;
    moValue[k] = (moValue[k] || 0) + (parseInt(r.value) || 0);
  }
  const monthly = Object.keys(moCount).sort().map(k => {
    const [yr, mo] = k.split("-");
    const idx = parseInt(mo) - 1;
    return { month: MO[idx], label: `${MO[idx]} '${yr.slice(2)}`, awards: moCount[k], value: moValue[k] || 0 };
  });

  // ── Departments ──────────────────────────────────────────────────────────
  const deptAwards:  Record<string, number> = {};
  const deptValue:   Record<string, number> = {};
  const deptRecips:  Record<string, Set<string>> = {};
  const deptNoms:    Record<string, Set<string>> = {};
  for (const r of rows) {
    const d = r.recipient_department;
    deptAwards[d] = (deptAwards[d] || 0) + 1;
    deptValue[d]  = (deptValue[d]  || 0) + (parseInt(r.value) || 0);
    if (!deptRecips[d]) deptRecips[d] = new Set();
    if (!deptNoms[d])   deptNoms[d]   = new Set();
    deptRecips[d].add(r.recipient_id);
    deptNoms[d].add(r.nominator_id);
  }
  const departments = Object.entries(deptAwards)
    .sort((a,b) => b[1] - a[1])
    .map(([name, awards]) => ({
      name, awards, totalValue: deptValue[name] || 0,
      avgValue: Math.round((deptValue[name] || 0) / awards),
      uniqueRecipients: deptRecips[name]?.size || 0,
      uniqueNominators: deptNoms[name]?.size  || 0,
    }));

  // ── Seniority ────────────────────────────────────────────────────────────
  const senCount: Record<string, number> = {};
  for (const r of rows) senCount[r.recipient_seniority] = (senCount[r.recipient_seniority] || 0) + 1;
  const ORDER = ["IC","Senior IC","Manager","Senior Manager","Director","VP"];
  const seniority = Object.entries(senCount)
    .sort((a,b) => (ORDER.indexOf(a[0]) + 1 || 99) - (ORDER.indexOf(b[0]) + 1 || 99))
    .map(([level, count]) => ({
      level, count,
      pct: parseFloat(((count / rows.length) * 100).toFixed(1)),
    }));

  // ── Top Recipients ────────────────────────────────────────────────────────
  const recipCount: Record<string, number> = {};
  const recipMeta:  Record<string, { name:string; dept:string; title:string; seniority:string }> = {};
  for (const r of rows) {
    recipCount[r.recipient_id] = (recipCount[r.recipient_id] || 0) + 1;
    recipMeta[r.recipient_id]  = { name: r.recipient_name, dept: r.recipient_department, title: r.recipient_title, seniority: r.recipient_seniority };
  }
  const topRecipients = Object.entries(recipCount)
    .sort((a,b) => b[1]-a[1]).slice(0,10)
    .map(([id, awards]) => ({ id, awards, ...recipMeta[id] }));

  // ── Top Nominators ────────────────────────────────────────────────────────
  const nomCount: Record<string, number> = {};
  const nomMeta:  Record<string, { name:string; dept:string; title:string }> = {};
  for (const r of rows) {
    nomCount[r.nominator_id] = (nomCount[r.nominator_id] || 0) + 1;
    nomMeta[r.nominator_id]  = { name: r.nominator_name, dept: r.nominator_department, title: r.nominator_title };
  }
  const topNominators = Object.entries(nomCount)
    .sort((a,b) => b[1]-a[1]).slice(0,10)
    .map(([id, nominations]) => ({ id, nominations, ...nomMeta[id] }));

  // ── Skills (from recipient_skills column) ────────────────────────────────
  const skillCount: Record<string, number> = {};
  const skillCat:   Record<string, Record<string, number>> = {};
  for (const r of rows) {
    const skills = (r.recipient_skills || "").split(",").map(s => s.trim()).filter(Boolean);
    for (const sk of skills) {
      skillCount[sk] = (skillCount[sk] || 0) + 1;
      if (!skillCat[sk]) skillCat[sk] = {};
      skillCat[sk][r.category_id] = (skillCat[sk][r.category_id] || 0) + 1;
    }
  }
  const skills = Object.entries(skillCount)
    .sort((a,b) => b[1]-a[1]).slice(0,20)
    .map(([name, count]) => {
      const cats = skillCat[name] || {};
      const dominantCategory = Object.entries(cats).sort((a,b) => b[1]-a[1])[0]?.[0] || "";
      return { name, count, dominantCategory };
    });

  // ── Value Distribution ────────────────────────────────────────────────────
  const valCount: Record<string, number> = {};
  for (const r of rows) valCount[r.value] = (valCount[r.value] || 0) + 1;
  const valueDistribution = Object.entries(valCount)
    .sort((a,b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([value, count]) => ({ value: parseInt(value), count }));

  // ── Network Graph ─────────────────────────────────────────────────────────
  // Build node registry
  const nodeMap: Record<string, {
    id:string; name:string; dept:string; title:string; seniority:string;
    received:number; given:number; totalValue:number; color:string;
  }> = {};

  for (const r of rows) {
    if (!nodeMap[r.recipient_id]) {
      nodeMap[r.recipient_id] = { id:r.recipient_id, name:r.recipient_name, dept:r.recipient_department, title:r.recipient_title, seniority:r.recipient_seniority, received:0, given:0, totalValue:0, color: DEPT_COLORS[r.recipient_department] || "#888" };
    }
    nodeMap[r.recipient_id].received++;
    nodeMap[r.recipient_id].totalValue += parseInt(r.value) || 0;

    if (!nodeMap[r.nominator_id]) {
      nodeMap[r.nominator_id] = { id:r.nominator_id, name:r.nominator_name, dept:r.nominator_department, title:r.nominator_title, seniority:r.nominator_seniority, received:0, given:0, totalValue:0, color: DEPT_COLORS[r.nominator_department] || "#888" };
    }
    nodeMap[r.nominator_id].given++;
  }

  // Sort nodes by activity, take top 80 for performance
  const netNodes = Object.values(nodeMap)
    .sort((a,b) => (b.received + b.given) - (a.received + a.given))
    .slice(0, 80);
  const nodeIdSet = new Set(netNodes.map(n => n.id));

  const edgeCount: Record<string, number> = {};
  for (const r of rows) {
    if (r.nominator_id === r.recipient_id) continue;
    if (!nodeIdSet.has(r.nominator_id) || !nodeIdSet.has(r.recipient_id)) continue;
    const k = `${r.nominator_id}__${r.recipient_id}`;
    edgeCount[k] = (edgeCount[k] || 0) + 1;
  }
  const netEdges = Object.entries(edgeCount)
    .sort((a,b) => b[1]-a[1]).slice(0, 200)
    .map(([k,weight]) => { const [source,target] = k.split("__"); return {source,target,weight}; });

  // ── Culture Health ────────────────────────────────────────────────────────
  const CAT_NAMES: Record<string,string> = {};
  for (const r of rows) CAT_NAMES[r.category_id] = r.category_name;

  const cultureHealth = Array.from(uniqueDepts).map(deptName => {
    const deptRows = rows.filter(r => r.recipient_department === deptName);
    if (!deptRows.length) return null;
    const n = deptRows.length;
    const totalValue = deptRows.reduce((s,r) => s + (parseInt(r.value)||0), 0);
    const uRecips  = new Set(deptRows.map(r => r.recipient_id));
    const uNoms    = new Set(deptRows.map(r => r.nominator_id));
    const crossIn  = deptRows.filter(r => r.nominator_department !== deptName).length;
    const crossInPct = Math.round(crossIn / n * 100);

    // Category diversity (# distinct categories used)
    const usedCats = new Set(deptRows.map(r => r.category_id));
    const catDiversity = Math.round(usedCats.size / 6 * 100);

    // Participation (nominators / recipients ratio, capped 100)
    const participation = Math.min(100, Math.round(uNoms.size / Math.max(uRecips.size,1) * 100));

    // Volume (relative to max-dept, normalize to 100)
    const maxDeptAwards = Math.max(...Array.from(uniqueDepts).map(d => rows.filter(r => r.recipient_department===d).length), 1);
    const volume = Math.round(n / maxDeptAwards * 100);

    // Generosity (avg value / 1000)
    const generosity = Math.round((totalValue / n) / 1000 * 100);

    const health = Math.round(0.30*catDiversity + 0.25*participation + 0.25*volume + 0.20*generosity);

    // Per-category spread for visualization
    const catSpreadMap: Record<string, number> = {};
    for (const r of deptRows) catSpreadMap[r.category_id] = (catSpreadMap[r.category_id]||0) + 1;
    const categorySpread = Object.entries(catSpreadMap)
      .sort((a,b) => b[1]-a[1])
      .map(([id, count]) => ({ id, name: CAT_NAMES[id] || id, count }));

    return {
      name: deptName, health, totalAwards: n, totalValue,
      avgValue: Math.round(totalValue / n),
      uniqueRecipients: uRecips.size, uniqueNominators: uNoms.size,
      categoryDiversity: catDiversity, crossDeptPct: crossInPct, participation,
      scores: { diversity: catDiversity, participation, volume, generosity },
      categorySpread,
    };
  }).filter(Boolean).sort((a,b) => b!.health - a!.health) as DashboardData["cultureHealth"];

  // ── Word Cloud ────────────────────────────────────────────────────────────
  const wc: Record<string, number> = {};
  for (const r of rows) {
    const ws = (r.message || "").toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    for (const w of ws) if (!STOP.has(w)) wc[w] = (wc[w]||0)+1;
  }
  const wordCloud = Object.entries(wc).sort((a,b) => b[1]-a[1]).slice(0,40).map(([word,count]) => ({word,count}));

  // ── Message Themes per category ───────────────────────────────────────────
  const catWords: Record<string, Record<string,number>> = {};
  const catIdForName: Record<string, string> = {};
  for (const r of rows) {
    const cat = r.category_name || r.category_id;
    catIdForName[cat] = r.category_id;
    if (!catWords[cat]) catWords[cat] = {};
    const ws = (r.message || "").toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
    for (const w of ws) if (!STOP.has(w)) catWords[cat][w] = (catWords[cat][w]||0)+1;
  }
  const messageThemes = Object.entries(catWords)
    .map(([category, wmap]) => ({
      categoryId: catIdForName[category] || "",
      category,
      words: Object.entries(wmap).sort((a,b) => b[1]-a[1]).slice(0,10).map(([word,count]) => ({word,count})),
    }))
    .sort((a,b) => (b.words[0]?.count||0) - (a.words[0]?.count||0));

  // ── Skill Insights ────────────────────────────────────────────────────────
  const topSkills = Object.entries(skillCount)
    .sort((a,b) => b[1]-a[1]).slice(0,20)
    .map(([skill, count]) => {
      const cats = skillCat[skill] || {};
      const dominantCategory = Object.entries(cats).sort((a,b) => b[1]-a[1])[0]?.[0] || "";
      return { skill, count, dominantCategory };
    });

  // Skills by department
  const deptSkillMap: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    const d = r.recipient_department;
    if (!deptSkillMap[d]) deptSkillMap[d] = {};
    const sks = (r.recipient_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
    for (const sk of sks) deptSkillMap[d][sk] = (deptSkillMap[d][sk]||0)+1;
  }
  const byDepartment: Record<string, {skill:string;count:number}[]> = {};
  for (const [dept, skillMap] of Object.entries(deptSkillMap)) {
    byDepartment[dept] = Object.entries(skillMap).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([skill,count])=>({skill,count}));
  }

  // Skill × category matrix (top 12 skills)
  const skillCategoryMatrix = topSkills.slice(0,12).map(({ skill }) => ({
    skill,
    categories: skillCat[skill] || {},
  }));

  // ── HR INTELLIGENCE SUITE ─────────────────────────────────────────────────

  // 1. Invisible Contributors: give ≥2 nominations, receive 0
  const nomCount2: Record<string, number> = {};
  const recCount2: Record<string, number> = {};
  for (const r of rows) {
    nomCount2[r.nominator_id] = (nomCount2[r.nominator_id] || 0) + 1;
    recCount2[r.recipient_id] = (recCount2[r.recipient_id] || 0) + 1;
  }
  const nomMetaMap: Record<string, { name:string; dept:string; title:string; seniority:string }> = {};
  for (const r of rows) nomMetaMap[r.nominator_id] = { name:r.nominator_name, dept:r.nominator_department, title:r.nominator_title, seniority:r.nominator_seniority };

  const invisibleContributors = Object.entries(nomCount2)
    .filter(([id, given]) => given >= 2 && !recCount2[id])
    .map(([id, given]) => ({
      id, given, received: 0,
      ...nomMetaMap[id],
      riskScore: Math.min(100, given * 15),
    }))
    .sort((a,b) => b.riskScore - a.riskScore)
    .slice(0, 20);

  // 2. Momentum: per-recipient monthly award slope
  const recMonthly: Record<string, { period:string; awards:number }[]> = {};
  for (const r of rows) {
    if (!r.award_date) continue;
    const d = new Date(r.award_date);
    if (isNaN(d.getTime())) continue;
    const period = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    if (!recMonthly[r.recipient_id]) recMonthly[r.recipient_id] = [];
    const existing = recMonthly[r.recipient_id].find(x => x.period === period);
    if (existing) existing.awards++;
    else recMonthly[r.recipient_id].push({ period, awards: 1 });
  }

  const recMeta2: Record<string, { name:string; dept:string; seniority:string }> = {};
  for (const r of rows) recMeta2[r.recipient_id] = { name:r.recipient_name, dept:r.recipient_department, seniority:r.recipient_seniority };

  const momentumPeople = Object.entries(recMonthly)
    .filter(([, series]) => series.length >= 3)
    .map(([id, series]) => {
      const sorted = [...series].sort((a,b) => a.period.localeCompare(b.period));
      const vals = sorted.map(s => s.awards);
      const n = vals.length;
      const sumX = n*(n-1)/2, sumY = vals.reduce((a,b)=>a+b,0);
      const sumXY = vals.reduce((s,v,i)=>s+i*v,0), sumX2 = vals.reduce((s,_,i)=>s+i*i,0);
      const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX || 1);
      const total = vals.reduce((a,b)=>a+b,0);
      const recent = vals.slice(-3).reduce((a,b)=>a+b,0);
      return { id, slope: parseFloat(slope.toFixed(3)), total, recent, months: n, monthlyData: sorted, ...recMeta2[id] };
    });

  const risingStars = momentumPeople.filter(p => p.slope > 0).sort((a,b)=>b.slope-a.slope).slice(0,15);
  const decliningRecognition = momentumPeople.filter(p => p.slope < -0.05).sort((a,b)=>a.slope-b.slope).slice(0,15);

  // 3. Cross-dept flow matrix
  const flowMap: Record<string, Record<string,number>> = {};
  for (const r of rows) {
    if (r.nominator_department === r.recipient_department) continue;
    if (!flowMap[r.nominator_department]) flowMap[r.nominator_department] = {};
    flowMap[r.nominator_department][r.recipient_department] = (flowMap[r.nominator_department][r.recipient_department] || 0) + 1;
  }
  const crossDeptFlow = Object.entries(flowMap)
    .flatMap(([from, targets]) => Object.entries(targets).map(([to, value]) => ({ from, to, value })))
    .sort((a,b) => b.value - a.value);
  const intelligenceDepts = [...uniqueDepts].sort();

  // 4. Equity by seniority
  const senMap: Record<string, { count:number; totalVal:number; highVal:number }> = {};
  for (const r of rows) {
    const s = r.recipient_seniority;
    const v = parseInt(r.value) || 0;
    if (!senMap[s]) senMap[s] = { count:0, totalVal:0, highVal:0 };
    senMap[s].count++;
    senMap[s].totalVal += v;
    if (v >= 500) senMap[s].highVal++;
  }
  const equityData = Object.entries(senMap).map(([recipient_seniority, d]) => ({
    recipient_seniority,
    count: d.count,
    avg_value: Math.round(d.totalVal / d.count),
    total_value: d.totalVal,
    high_value: d.highVal,
    high_value_pct: parseFloat((d.highVal / d.count * 100).toFixed(1)),
  }));

  // 5. Manager reach (senior nominators who give cross-dept)
  const SENIOR = new Set(["Manager","Senior Manager","Director","VP"]);
  const mgrMap: Record<string, { name:string; dept:string; seniority:string; total:number; depts:Set<string>; totalVal:number }> = {};
  for (const r of rows) {
    if (!SENIOR.has(r.nominator_seniority)) continue;
    if (!mgrMap[r.nominator_id]) mgrMap[r.nominator_id] = { name:r.nominator_name, dept:r.nominator_department, seniority:r.nominator_seniority, total:0, depts:new Set(), totalVal:0 };
    mgrMap[r.nominator_id].total++;
    mgrMap[r.nominator_id].depts.add(r.recipient_department);
    mgrMap[r.nominator_id].totalVal += parseInt(r.value) || 0;
  }
  const managerReach = Object.entries(mgrMap)
    .filter(([, m]) => m.total >= 3)
    .map(([id, m]) => ({ id, name:m.name, dept:m.dept, seniority:m.seniority, total:m.total, unique_depts:m.depts.size, avg_value:Math.round(m.totalVal/m.total) }))
    .sort((a,b) => b.unique_depts - a.unique_depts)
    .slice(0, 20);

  // ── WORKFORCE (HR-CENTRIC PEOPLE VIEW) ───────────────────────────────────
  // Build a complete people registry from both recipient and nominator sides
  const peopleMap: Record<string, {
    id:string; name:string; dept:string; title:string; seniority:string;
    received:number; given:number; valueReceived:number;
  }> = {};

  for (const r of rows) {
    // Register recipient
    if (!peopleMap[r.recipient_id]) {
      peopleMap[r.recipient_id] = { id:r.recipient_id, name:r.recipient_name, dept:r.recipient_department, title:r.recipient_title, seniority:r.recipient_seniority, received:0, given:0, valueReceived:0 };
    }
    // Register nominator
    if (!peopleMap[r.nominator_id]) {
      peopleMap[r.nominator_id] = { id:r.nominator_id, name:r.nominator_name, dept:r.nominator_department, title:r.nominator_title, seniority:r.nominator_seniority, received:0, given:0, valueReceived:0 };
    }
    peopleMap[r.recipient_id].received++;
    peopleMap[r.recipient_id].valueReceived += parseInt(r.value) || 0;
    peopleMap[r.nominator_id].given++;
  }

  const allPeople = Object.values(peopleMap);
  const wfTotal = allPeople.length;
  const wfNeverRec = allPeople.filter(p => p.received === 0).length;
  const wfNeverGiven = allPeople.filter(p => p.given === 0).length;

  // By department
  const wfDeptMap: Record<string, { headcount:number; recognized:number; givers:number; totalReceived:number; totalValue:number }> = {};
  for (const p of allPeople) {
    if (!wfDeptMap[p.dept]) wfDeptMap[p.dept] = { headcount:0, recognized:0, givers:0, totalReceived:0, totalValue:0 };
    wfDeptMap[p.dept].headcount++;
    if (p.received > 0) wfDeptMap[p.dept].recognized++;
    if (p.given > 0) wfDeptMap[p.dept].givers++;
    wfDeptMap[p.dept].totalReceived += p.received;
    wfDeptMap[p.dept].totalValue += p.valueReceived;
  }
  const wfByDept = Object.entries(wfDeptMap).map(([dept, d]) => ({
    dept, ...d,
    coveragePct: Math.round(d.recognized / d.headcount * 100),
    participationPct: Math.round(d.givers / d.headcount * 100),
    avgAwards: parseFloat((d.totalReceived / d.headcount).toFixed(1)),
  })).sort((a,b) => b.coveragePct - a.coveragePct);

  // By seniority
  const SEN_ORDER2 = ["IC","Senior IC","Manager","Senior Manager","Director","VP"];
  const wfSenMap: Record<string, { headcount:number; recognized:number; totalReceived:number; totalGiven:number }> = {};
  for (const p of allPeople) {
    if (!wfSenMap[p.seniority]) wfSenMap[p.seniority] = { headcount:0, recognized:0, totalReceived:0, totalGiven:0 };
    wfSenMap[p.seniority].headcount++;
    if (p.received > 0) wfSenMap[p.seniority].recognized++;
    wfSenMap[p.seniority].totalReceived += p.received;
    wfSenMap[p.seniority].totalGiven += p.given;
  }
  const wfBySeniority = Object.entries(wfSenMap)
    .sort((a,b) => (SEN_ORDER2.indexOf(a[0])+1||99) - (SEN_ORDER2.indexOf(b[0])+1||99))
    .map(([level, d]) => ({
      level, ...d,
      avgReceived: parseFloat((d.totalReceived / d.headcount).toFixed(1)),
      avgGiven: parseFloat((d.totalGiven / d.headcount).toFixed(1)),
      coveragePct: Math.round(d.recognized / d.headcount * 100),
    }));

  const workforce = {
    totalPeople: wfTotal,
    neverRecognized: wfNeverRec,
    neverGiven: wfNeverGiven,
    coveragePct: Math.round((wfTotal - wfNeverRec) / wfTotal * 100),
    participationPct: Math.round((wfTotal - wfNeverGiven) / wfTotal * 100),
    byDept: wfByDept,
    bySeniority: wfBySeniority,
    people: allPeople.sort((a,b) => b.received - a.received),
  };

  // ── EMPLOYEE DIRECTORY ────────────────────────────────────────────────────
  // Build rich per-person profiles with recognition history, skills, engagement
  const dirMap: Record<string, {
    id:string; name:string; dept:string; title:string; seniority:string; skills:string[];
    received:number; given:number; valueReceived:number;
    catIds:string[]; recentAwards: DashboardData["employeeDirectory"][0]["recentAwards"];
  }> = {};

  for (const r of rows) {
    // Register both sides
    const pairs: [string, string, string, string, string, string][] = [
      [r.recipient_id, r.recipient_name, r.recipient_department, r.recipient_title, r.recipient_seniority, r.recipient_skills || ""],
      [r.nominator_id, r.nominator_name, r.nominator_department, r.nominator_title, r.nominator_seniority, ""],
    ];
    for (const [uid, name, dept, title, sen, skillsRaw] of pairs) {
      if (!dirMap[uid]) {
        const skills = skillsRaw.split(",").map(s => s.trim()).filter(s => s && s.toLowerCase() !== "nan");
        dirMap[uid] = { id:uid, name, dept, title, seniority:sen, skills, received:0, given:0, valueReceived:0, catIds:[], recentAwards:[] };
      }
    }
    // Recipient tallies
    dirMap[r.recipient_id].received++;
    dirMap[r.recipient_id].valueReceived += parseInt(r.value) || 0;
    dirMap[r.recipient_id].catIds.push(r.category_id);
    if (dirMap[r.recipient_id].recentAwards.length < 5) {
      dirMap[r.recipient_id].recentAwards.push({
        date: r.award_date,
        title: (r.award_title || "").slice(0, 60),
        value: parseInt(r.value) || 0,
        category: r.category_name,
        categoryId: r.category_id,
        subcategory: r.subcategory_name,
        fromName: r.nominator_name,
        fromDept: r.nominator_department,
        message: (r.message || "").slice(0, 250),
      });
    }
    dirMap[r.nominator_id].given++;
  }

  const REF_DATE = new Date("2026-01-01").getTime();

  const employeeDirectory = Object.values(dirMap).map(p => {
    // Sort recent awards newest first
    p.recentAwards.sort((a, b) => b.date.localeCompare(a.date));

    // Category breakdown
    const catCountMap: Record<string, number> = {};
    for (const cid of p.catIds) catCountMap[cid] = (catCountMap[cid] || 0) + 1;
    const categoryBreakdown = Object.entries(catCountMap)
      .sort((a,b) => b[1]-a[1])
      .map(([id, count]) => ({ id, count }));

    // Days since last recognition
    let daysSinceLast = 999;
    let lastAwardDate: string | null = null;
    if (p.recentAwards.length > 0) {
      lastAwardDate = p.recentAwards[0].date;
      try {
        daysSinceLast = Math.round((REF_DATE - new Date(lastAwardDate).getTime()) / 86400000);
      } catch { /* */ }
    }

    // Engagement score: recognition received (40%) + giving (30%) + category breadth (30%)
    const recScore  = Math.min(40, p.received / 7 * 40);
    const giveScore = Math.min(30, p.given / 5 * 30);
    const breadth   = Math.min(30, Object.keys(catCountMap).length / 6 * 30);
    const engagementScore = Math.round(recScore + giveScore + breadth);

    // Status
    let status: DashboardData["employeeDirectory"][0]["status"];
    if (p.received === 0)                                  status = "never_recognized";
    else if (daysSinceLast > 120)                          status = "at_risk";
    else if (daysSinceLast <= 60 && p.received >= 3)       status = "thriving";
    else if (p.given === 0)                                status = "passive";
    else                                                   status = "active";

    return {
      id: p.id, name: p.name, dept: p.dept, title: p.title, seniority: p.seniority,
      skills: p.skills, received: p.received, given: p.given, valueReceived: p.valueReceived,
      engagementScore, status, daysSinceLast, lastAwardDate, categoryBreakdown, recentAwards: p.recentAwards,
    };
  }).sort((a, b) => b.received - a.received);

  // ── EXTENDED HR KPIs ──────────────────────────────────────────────────────
  // People health
  const recCountMap: Record<string, number> = {};
  const givenCountMap: Record<string, number> = {};
  const lastAwardDateMap: Record<string, string> = {};
  const seniorityCountMap: Record<string, number> = {};

  for (const r of rows) {
    recCountMap[r.recipient_id] = (recCountMap[r.recipient_id] || 0) + 1;
    givenCountMap[r.nominator_id] = (givenCountMap[r.nominator_id] || 0) + 1;
    // Track latest award date per recipient
    if (!lastAwardDateMap[r.recipient_id] || r.award_date > lastAwardDateMap[r.recipient_id]) {
      lastAwardDateMap[r.recipient_id] = r.award_date;
    }
  }
  // Seniority from both sides of awards
  const allPeopleForKpi: Record<string, string> = {};
  for (const r of rows) {
    allPeopleForKpi[r.recipient_id] = r.recipient_seniority;
    allPeopleForKpi[r.nominator_id] = r.nominator_seniority;
  }
  for (const sen of Object.values(allPeopleForKpi)) {
    seniorityCountMap[sen] = (seniorityCountMap[sen] || 0) + 1;
  }

  const totalPeopleKpi = Object.keys(allPeopleForKpi).length;
  const REF_MS = new Date("2026-01-01").getTime();

  const highPerformers   = Object.values(recCountMap).filter(v => v >= 5).length;
  const cultureCarriers  = Object.values(givenCountMap).filter(v => v >= 5).length;
  const neverRecognizedCount = totalPeopleKpi - Object.keys(recCountMap).length;
  const atRiskCount      = Object.entries(lastAwardDateMap).filter(([, d]) => {
    try { return (REF_MS - new Date(d).getTime()) / 86400000 > 120; } catch { return false; }
  }).length;

  // Org dynamics
  const crossDeptRows = rows.filter(r => r.recipient_department !== r.nominator_department);
  const crossDeptPct  = Math.round(crossDeptRows.length / rows.length * 100);

  const SEN_ORDER_MAP: Record<string, number> = { IC:1, "Senior IC":2, Manager:3, "Senior Manager":4, Director:5, VP:6 };
  const peerRows = rows.filter(r => Math.abs((SEN_ORDER_MAP[r.recipient_seniority] || 0) - (SEN_ORDER_MAP[r.nominator_seniority] || 0)) <= 1);
  const peerRecognitionPct = Math.round(peerRows.length / rows.length * 100);

  const icCount   = (seniorityCountMap["IC"] || 0) + (seniorityCountMap["Senior IC"] || 0);
  const execCount = (seniorityCountMap["Director"] || 0) + (seniorityCountMap["VP"] || 0);
  const icRatio   = Math.round(icCount / totalPeopleKpi * 100);
  const execRatio = Math.round(execCount / totalPeopleKpi * 100);

  // Momentum — last 3 months vs prior 3 months (excluding Jan 2026 which has 1 record)
  const moAwards = monthly.filter(m => m.awards > 1); // exclude partial months
  const last3Avg = moAwards.length >= 3
    ? moAwards.slice(-3).reduce((s, m) => s + m.awards, 0) / 3 : 0;
  const prev3Avg = moAwards.length >= 6
    ? moAwards.slice(-6, -3).reduce((s, m) => s + m.awards, 0) / 3 : last3Avg;
  const momTrend = prev3Avg > 0 ? Math.round((last3Avg - prev3Avg) / prev3Avg * 100) : 0;
  const avgMonthlyAwards = Math.round(moAwards.reduce((s, m) => s + m.awards, 0) / Math.max(moAwards.length, 1));

  // ── SKILL GAP RADAR ──────────────────────────────────────────────────────
  const skillFreq: Record<string,number> = {};
  const skillDepts: Record<string,Set<string>> = {};
  const skillByDept: Record<string,Record<string,number>> = {};
  for (const r of rows) {
    const skills = (r.recipient_skills||"").split(",").map(s=>s.trim()).filter(s=>s&&s.toLowerCase()!=="nan");
    for (const sk of skills) {
      skillFreq[sk] = (skillFreq[sk]||0)+1;
      if (!skillDepts[sk]) skillDepts[sk]=new Set();
      skillDepts[sk].add(r.recipient_department);
      if (!skillByDept[sk]) skillByDept[sk]={};
      skillByDept[sk][r.recipient_department]=(skillByDept[sk][r.recipient_department]||0)+1;
    }
  }
  const allSkillCounts = Object.values(skillFreq).sort((a,b)=>a-b);
  const p33 = allSkillCounts[Math.floor(allSkillCounts.length*0.33)];
  const p66 = allSkillCounts[Math.floor(allSkillCounts.length*0.66)];
  const skillGaps = Object.entries(skillFreq).map(([skill,count])=>({
    skill, count,
    deptCount: skillDepts[skill]?.size||0,
    depts: Array.from(skillDepts[skill]||[]).sort(),
    rarity: count<=p33 ? "rare" as const : count<=p66 ? "moderate" as const : "common" as const,
    byDept: skillByDept[skill]||{},
  })).sort((a,b)=>a.count-b.count);

  // ── SEASONALITY HEATMAP ────────────────────────────────────────────────────
  const MO_NAMES_S=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthMap: Record<number,{total:number;cats:Record<string,number>}>={};
  for (const r of rows) {
    if (!r.award_date) continue;
    const d=new Date(r.award_date); if(isNaN(d.getTime())) continue;
    const m=d.getMonth()+1;
    if (!monthMap[m]) monthMap[m]={total:0,cats:{}};
    monthMap[m].total++;
    monthMap[m].cats[r.category_id]=(monthMap[m].cats[r.category_id]||0)+1;
  }
  const seasonality = Object.entries(monthMap).map(([m,d])=>{
    const dom=Object.entries(d.cats).sort((a,b)=>b[1]-a[1])[0]?.[0]||"";
    return { month:parseInt(m), monthName:MO_NAMES_S[parseInt(m)], total:d.total, byCategory:d.cats, dominantCategory:dom };
  }).sort((a,b)=>a.month-b.month);

  // ── ORG CONNECTORS ─────────────────────────────────────────────────────────
  const connectorMap: Record<string,{name:string;dept:string;seniority:string;title:string;uniquePeople:Set<string>;uniqueDepts:Set<string>;total:number}> = {};
  for (const r of rows) {
    const nid=r.nominator_id;
    if (!connectorMap[nid]) connectorMap[nid]={name:r.nominator_name,dept:r.nominator_department,seniority:r.nominator_seniority,title:r.nominator_title,uniquePeople:new Set(),uniqueDepts:new Set(),total:0};
    connectorMap[nid].uniquePeople.add(r.recipient_id);
    connectorMap[nid].uniqueDepts.add(r.recipient_department);
    connectorMap[nid].total++;
  }
  const orgConnectors = Object.entries(connectorMap)
    .filter(([,c])=>c.uniquePeople.size>=3)
    .map(([id,c])=>{
      const breadth=c.uniquePeople.size, deptReach=c.uniqueDepts.size;
      const collab=Math.round(Math.min(breadth/7*50,50)+Math.min(deptReach/12*30,30)+Math.min(c.total/10*20,20));
      return {id,name:c.name,dept:c.dept,seniority:c.seniority,title:c.title,uniquePeopleRecognized:breadth,uniqueDeptsReached:deptReach,totalGiven:c.total,collaborationScore:collab};
    })
    .sort((a,b)=>b.collaborationScore-a.collaborationScore)
    .slice(0,25);

  // ── VALUE EQUITY AUDIT ─────────────────────────────────────────────────────
  const deptValMap: Record<string,{total:number;count:number;people:Set<string>}> = {};
  for (const r of rows) {
    const dept=r.recipient_department, val=parseInt(r.value)||0;
    if (!deptValMap[dept]) deptValMap[dept]={total:0,count:0,people:new Set()};
    deptValMap[dept].total+=val; deptValMap[dept].count++;
    deptValMap[dept].people.add(r.recipient_id);
  }
  const totalValEq=rows.reduce((s,r)=>s+(parseInt(r.value)||0),0);
  const veByDept=Object.entries(deptValMap).map(([dept,d])=>({
    dept,total:d.total,avg:Math.round(d.total/d.count),
    perPerson:Math.round(d.total/d.people.size),
    pct:parseFloat((d.total/totalValEq*100).toFixed(1)),
  })).sort((a,b)=>b.total-a.total);

  const senValMap:Record<string,{total:number;count:number;highVal:number}>={};
  for (const r of rows) {
    const sen=r.recipient_seniority,val=parseInt(r.value)||0;
    if (!senValMap[sen]) senValMap[sen]={total:0,count:0,highVal:0};
    senValMap[sen].total+=val; senValMap[sen].count++;
    if(val>=500) senValMap[sen].highVal++;
  }
  const SEN_O_EQ=["IC","Senior IC","Manager","Senior Manager","Director","VP"];
  const veBySeniority=Object.entries(senValMap)
    .sort((a,b)=>(SEN_O_EQ.indexOf(a[0])+1||99)-(SEN_O_EQ.indexOf(b[0])+1||99))
    .map(([level,d])=>({level,total:d.total,avg:Math.round(d.total/d.count),highValuePct:parseFloat((d.highVal/d.count*100).toFixed(1))}));

  // Gini coefficient
  const personValsEq=Object.values(rows.reduce((acc:Record<string,number>,r)=>{
    acc[r.recipient_id]=(acc[r.recipient_id]||0)+(parseInt(r.value)||0); return acc;
  },{})).sort((a,b)=>a-b);
  const nEq=personValsEq.length, sumValsEq=personValsEq.reduce((a,b)=>a+b,0);
  const giniCoeff=parseFloat((2*personValsEq.reduce((s,v,i)=>s+(i+1)*v,0)/(nEq*sumValsEq)-(nEq+1)/nEq).toFixed(3));
  const top10Vals=personValsEq.slice(-10);
  const top10Value=top10Vals.reduce((a,b)=>a+b,0);
  const top10Pct=parseFloat((top10Value/sumValsEq*100).toFixed(1));
  const valueEquity={byDept:veByDept,bySeniority:veBySeniority,concentration:{top10Pct,top10Value,giniCoeff}};

  return {
    kpi: {
      totalAwards: rows.length,
      totalMonetary,
      avgAwardValue: Math.round(totalMonetary / rows.length),
      uniqueRecipients: uniqueRecips.size,
      uniqueNominators: uniqueNoms.size,
      uniqueDepartments: uniqueDepts.size,
      recognitionRate: Math.round(uniqueNoms.size / uniqueRecips.size * 100),
      // people health
      highPerformers,
      cultureCarriers,
      atRiskCount,
      neverRecognizedCount,
      // org dynamics
      crossDeptPct,
      peerRecognitionPct,
      icRatio,
      execRatio,
      // momentum
      momTrend,
      avgMonthlyAwards,
    },
    categories,
    subcategories,
    monthly,
    departments,
    seniority,
    topRecipients,
    topNominators,
    skills,
    valueDistribution,
    network: { nodes: netNodes, edges: netEdges },
    cultureHealth,
    wordCloud,
    messageThemes,
    skillInsights: { topSkills, byDepartment, skillCategoryMatrix },
    workforce,
    intelligence: {
      invisibleContributors,
      risingStars,
      decliningRecognition,
      crossDeptFlow,
      depts: intelligenceDepts,
      equityData,
      managerReach,
      skillGaps,
      seasonality,
      orgConnectors,
      valueEquity,
    },
    employeeDirectory,
  };
}