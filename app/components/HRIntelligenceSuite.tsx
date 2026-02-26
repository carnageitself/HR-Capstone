import { useState, useRef, useEffect } from "react";

// ── EMBEDDED DATA (from awards_enriched.csv) ─────────────────────────────────
const DATA = {"invisibleContributors": [{"id": "1089", "name": "Thomas Brown", "dept": "Product", "title": "Product Manager", "seniority": "Director", "given": 7, "received": 0, "riskScore": 100}, {"id": "1039", "name": "Patricia Martinez", "dept": "Design", "title": "Senior Designer", "seniority": "Director", "given": 5, "received": 0, "riskScore": 75}, {"id": "1227", "name": "Sarah Lee", "dept": "Customer Service", "title": "Account Manager", "seniority": "VP", "given": 5, "received": 0, "riskScore": 75}, {"id": "1274", "name": "Christopher Thomas", "dept": "Customer Service", "title": "Director", "seniority": "Manager", "given": 5, "received": 0, "riskScore": 75}, {"id": "1101", "name": "David Garcia", "dept": "Marketing", "title": "Product Marketing Manager", "seniority": "Manager", "given": 5, "received": 0, "riskScore": 75}, {"id": "1378", "name": "Matthew Martin", "dept": "IT", "title": "Specialist", "seniority": "IC", "given": 5, "received": 0, "riskScore": 75}, {"id": "1497", "name": "Susan Hernandez", "dept": "Data Science", "title": "Manager", "seniority": "Director", "given": 4, "received": 0, "riskScore": 60}, {"id": "1163", "name": "David Lee", "dept": "Finance", "title": "Manager", "seniority": "IC", "given": 4, "received": 0, "riskScore": 60}, {"id": "1302", "name": "Matthew Hernandez", "dept": "Finance", "title": "Manager", "seniority": "Manager", "given": 4, "received": 0, "riskScore": 60}, {"id": "1296", "name": "Thomas Martinez", "dept": "HR", "title": "HR Manager", "seniority": "Manager", "given": 4, "received": 0, "riskScore": 60}, {"id": "1341", "name": "Richard Rodriguez", "dept": "Legal", "title": "Attorney", "seniority": "VP", "given": 4, "received": 0, "riskScore": 60}, {"id": "1250", "name": "Nancy Jones", "dept": "Finance", "title": "Director", "seniority": "VP", "given": 3, "received": 0, "riskScore": 45}, {"id": "1036", "name": "Joseph Hernandez", "dept": "Customer Service", "title": "Director", "seniority": "Manager", "given": 3, "received": 0, "riskScore": 45}, {"id": "1034", "name": "Jennifer Wilson", "dept": "Legal", "title": "Counsel", "seniority": "IC", "given": 3, "received": 0, "riskScore": 45}, {"id": "1299", "name": "Linda Wilson", "dept": "Legal", "title": "Attorney", "seniority": "Senior Manager", "given": 3, "received": 0, "riskScore": 45}, {"id": "1318", "name": "Elizabeth Williams", "dept": "Engineering", "title": "Software Engineer", "seniority": "Manager", "given": 3, "received": 0, "riskScore": 45}, {"id": "1158", "name": "Mary Miller", "dept": "IT", "title": "Director", "seniority": "IC", "given": 3, "received": 0, "riskScore": 45}, {"id": "1407", "name": "Joseph Anderson", "dept": "Operations", "title": "Coordinator", "seniority": "VP", "given": 3, "received": 0, "riskScore": 45}, {"id": "1188", "name": "Jessica Smith", "dept": "Operations", "title": "Coordinator", "seniority": "Manager", "given": 3, "received": 0, "riskScore": 45}, {"id": "1249", "name": "Thomas Martinez", "dept": "Legal", "title": "Specialist", "seniority": "VP", "given": 3, "received": 0, "riskScore": 45}], "risingStars": [{"id": "1033", "name": "Elizabeth Johnson", "dept": "Data Science", "seniority": "Manager", "slope": 0.5, "total": 5, "recent": 5, "early": 5, "months": 3, "monthlyData": [{"period": "2025-05", "awards": 1}, {"period": "2025-07", "awards": 2}, {"period": "2025-12", "awards": 2}]}, {"id": "1107", "name": "Linda Lopez", "dept": "Product", "seniority": "IC", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-07", "awards": 1}, {"period": "2025-09", "awards": 1}, {"period": "2025-11", "awards": 2}]}, {"id": "1162", "name": "Barbara Anderson", "dept": "Operations", "seniority": "Director", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-02", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-09", "awards": 2}]}, {"id": "1369", "name": "Mary Moore", "dept": "Operations", "seniority": "Senior Manager", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-05", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-08", "awards": 2}]}, {"id": "1425", "name": "Michael Anderson", "dept": "Finance", "seniority": "Senior IC", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-01", "awards": 1}, {"period": "2025-02", "awards": 1}, {"period": "2025-07", "awards": 2}]}, {"id": "1458", "name": "Charles Moore", "dept": "IT", "seniority": "VP", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-05", "awards": 1}, {"period": "2025-09", "awards": 1}, {"period": "2025-12", "awards": 2}]}, {"id": "1467", "name": "Robert Lee", "dept": "Finance", "seniority": "Senior Manager", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-03", "awards": 1}, {"period": "2025-05", "awards": 1}, {"period": "2025-10", "awards": 2}]}, {"id": "1492", "name": "James Miller", "dept": "IT", "seniority": "VP", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-07", "awards": 1}, {"period": "2025-09", "awards": 1}, {"period": "2025-12", "awards": 2}]}, {"id": "1061", "name": "Thomas Jackson", "dept": "Finance", "seniority": "Director", "slope": 0.3, "total": 5, "recent": 4, "early": 3, "months": 4, "monthlyData": [{"period": "2025-01", "awards": 1}, {"period": "2025-03", "awards": 1}, {"period": "2025-05", "awards": 1}, {"period": "2025-09", "awards": 2}]}, {"id": "1498", "name": "Elizabeth Anderson", "dept": "Data Science", "seniority": "Senior Manager", "slope": 0.3, "total": 5, "recent": 4, "early": 3, "months": 4, "monthlyData": [{"period": "2025-01", "awards": 1}, {"period": "2025-03", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-12", "awards": 2}]}, {"id": "1393", "name": "Barbara Perez", "dept": "Sales", "seniority": "Manager", "slope": 0.143, "total": 7, "recent": 4, "early": 3, "months": 6, "monthlyData": [{"period": "2025-02", "awards": 1}, {"period": "2025-03", "awards": 1}, {"period": "2025-05", "awards": 1}, {"period": "2025-07", "awards": 1}, {"period": "2025-11", "awards": 1}, {"period": "2025-12", "awards": 2}]}, {"id": "1155", "name": "Sarah Smith", "dept": "Design", "seniority": "Senior Manager", "slope": 0.1, "total": 5, "recent": 4, "early": 4, "months": 4, "monthlyData": [{"period": "2025-01", "awards": 1}, {"period": "2025-02", "awards": 1}, {"period": "2025-08", "awards": 2}, {"period": "2025-09", "awards": 1}]}, {"id": "1176", "name": "Christopher Rodriguez", "dept": "IT", "seniority": "VP", "slope": 0.1, "total": 5, "recent": 4, "early": 4, "months": 4, "monthlyData": [{"period": "2025-02", "awards": 1}, {"period": "2025-03", "awards": 1}, {"period": "2025-05", "awards": 2}, {"period": "2025-09", "awards": 1}]}, {"id": "1210", "name": "Lisa Miller", "dept": "Engineering", "seniority": "Director", "slope": 0.1, "total": 5, "recent": 4, "early": 4, "months": 4, "monthlyData": [{"period": "2025-09", "awards": 1}, {"period": "2025-10", "awards": 1}, {"period": "2025-11", "awards": 2}, {"period": "2025-12", "awards": 1}]}, {"id": "1006", "name": "Joseph Rodriguez", "dept": "HR", "seniority": "VP", "slope": 0.0, "total": 3, "recent": 3, "early": 3, "months": 3, "monthlyData": [{"period": "2025-04", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-11", "awards": 1}]}], "decliningRecognition": [{"id": "1073", "name": "Susan Anderson", "dept": "Customer Service", "seniority": "VP", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-10", "awards": 1}, {"period": "2025-11", "awards": 1}]}, {"id": "1096", "name": "Susan Thompson", "dept": "Product", "seniority": "Manager", "slope": -0.5, "total": 5, "recent": 5, "early": 5, "months": 3, "monthlyData": [{"period": "2025-05", "awards": 2}, {"period": "2025-08", "awards": 2}, {"period": "2025-11", "awards": 1}]}, {"id": "1293", "name": "Patricia Davis", "dept": "Engineering", "seniority": "VP", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-02", "awards": 2}, {"period": "2025-04", "awards": 1}, {"period": "2025-09", "awards": 1}]}, {"id": "1320", "name": "Lisa Thompson", "dept": "Marketing", "seniority": "Manager", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-11", "awards": 1}, {"period": "2025-12", "awards": 1}]}, {"id": "1334", "name": "Joseph Thompson", "dept": "Finance", "seniority": "IC", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-04", "awards": 2}, {"period": "2025-05", "awards": 1}, {"period": "2025-10", "awards": 1}]}, {"id": "1344", "name": "Elizabeth Thompson", "dept": "Customer Service", "seniority": "Senior IC", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-06", "awards": 2}, {"period": "2025-11", "awards": 1}, {"period": "2025-12", "awards": 1}]}, {"id": "1368", "name": "William Martin", "dept": "IT", "seniority": "Senior IC", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-06", "awards": 1}, {"period": "2025-09", "awards": 1}]}, {"id": "1476", "name": "Jennifer Brown", "dept": "Customer Service", "seniority": "Manager", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-04", "awards": 1}, {"period": "2025-12", "awards": 1}]}, {"id": "1165", "name": "Thomas Lopez", "dept": "Customer Service", "seniority": "Manager", "slope": -0.3, "total": 5, "recent": 3, "early": 4, "months": 4, "monthlyData": [{"period": "2025-02", "awards": 2}, {"period": "2025-08", "awards": 1}, {"period": "2025-10", "awards": 1}, {"period": "2025-12", "awards": 1}]}, {"id": "1213", "name": "Lisa Davis", "dept": "HR", "seniority": "IC", "slope": -0.3, "total": 5, "recent": 3, "early": 4, "months": 4, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-02", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-11", "awards": 1}]}, {"id": "1400", "name": "Charles Williams", "dept": "Operations", "seniority": "Director", "slope": -0.3, "total": 5, "recent": 3, "early": 4, "months": 4, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-02", "awards": 1}, {"period": "2025-09", "awards": 1}, {"period": "2025-11", "awards": 1}]}, {"id": "1409", "name": "Patricia Martinez", "dept": "IT", "seniority": "VP", "slope": -0.3, "total": 5, "recent": 3, "early": 4, "months": 4, "monthlyData": [{"period": "2025-04", "awards": 2}, {"period": "2025-05", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-07", "awards": 1}]}, {"id": "1105", "name": "Jessica Brown", "dept": "Customer Service", "seniority": "IC", "slope": -0.1, "total": 5, "recent": 4, "early": 4, "months": 4, "monthlyData": [{"period": "2025-03", "awards": 1}, {"period": "2025-06", "awards": 2}, {"period": "2025-07", "awards": 1}, {"period": "2025-11", "awards": 1}]}, {"id": "1350", "name": "Richard Rodriguez", "dept": "Sales", "seniority": "VP", "slope": -0.1, "total": 5, "recent": 4, "early": 4, "months": 4, "monthlyData": [{"period": "2025-05", "awards": 1}, {"period": "2025-06", "awards": 2}, {"period": "2025-07", "awards": 1}, {"period": "2025-12", "awards": 1}]}], "crossDeptFlow": [{"from": "Marketing", "to": "Finance", "value": 16}, {"from": "Data Science", "to": "Product", "value": 14}, {"from": "Legal", "to": "Engineering", "value": 14}, {"from": "Legal", "to": "Marketing", "value": 13}, {"from": "Marketing", "to": "Customer Service", "value": 13}, {"from": "Product", "to": "Customer Service", "value": 13}, {"from": "Engineering", "to": "Data Science", "value": 12}, {"from": "Engineering", "to": "HR", "value": 12}, {"from": "Legal", "to": "Design", "value": 12}, {"from": "Legal", "to": "Sales", "value": 12}], "depts": ["Customer Service", "Data Science", "Design", "Engineering", "Finance", "HR", "IT", "Legal", "Marketing", "Operations", "Product", "Sales"], "equityData": [{"recipient_seniority": "Director", "count": 185, "avg_value": 420.0, "total_value": 77650, "high_value": 80, "high_value_pct": 43.2}, {"recipient_seniority": "IC", "count": 165, "avg_value": 405.0, "total_value": 66750, "high_value": 68, "high_value_pct": 41.2}, {"recipient_seniority": "Manager", "count": 131, "avg_value": 361.0, "total_value": 47250, "high_value": 51, "high_value_pct": 38.9}, {"recipient_seniority": "Senior IC", "count": 175, "avg_value": 392.0, "total_value": 68550, "high_value": 74, "high_value_pct": 42.3}, {"recipient_seniority": "Senior Manager", "count": 149, "avg_value": 422.0, "total_value": 62850, "high_value": 76, "high_value_pct": 51.0}, {"recipient_seniority": "VP", "count": 195, "avg_value": 407.0, "total_value": 79350, "high_value": 85, "high_value_pct": 43.6}], "managerReach": [{"id": "1089", "name": "Thomas Brown", "dept": "Product", "seniority": "Director", "total": 7, "unique_depts": 7, "avg_value": 379.0}], "deptMonthly": {}};

// ── DEPT COLORS ───────────────────────────────────────────────────────────────
const DC: Record<string,string> = {
  "Marketing":"#FD79A8","Data Science":"#4ECDC4","Finance":"#F9CA24",
  "Customer Service":"#FF6B6B","Product":"#00CEC9","Design":"#45B7D1",
  "Sales":"#FDCB6E","Legal":"#A29BFE","HR":"#DDA15E","IT":"#6C5CE7",
  "Engineering":"#96CEB4","Operations":"#74B9FF"
};

// ── TINY SPARKLINE ────────────────────────────────────────────────────────────
function Spark({ data, color = "#F96400", h = 28, w = 80 }: { data: {period:string;awards:number}[]; color?: string; h?: number; w?: number }) {
  if (!data || data.length < 2) return <span className="text-gray-300 text-xs">—</span>;
  const vals = data.map(d => d.awards);
  const mx = Math.max(...vals, 1), mn = Math.min(...vals);
  const rng = mx - mn || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((v - mn) / rng) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = (pts.split(" ").at(-1) ?? "").split(",");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={color}/>
    </svg>
  );
}

// ── RISK BADGE ────────────────────────────────────────────────────────────────
function RiskBadge({ score }: { score: number }) {
  const level = score >= 75
    ? { label:"HIGH", cls:"bg-red-50 text-red-600" }
    : score >= 40
    ? { label:"MED",  cls:"bg-yellow-50 text-yellow-600" }
    : { label:"LOW",  cls:"bg-green-50 text-green-600" };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide font-mono ${level.cls}`}>
      {level.label}
    </span>
  );
}

// ── AVATAR ────────────────────────────────────────────────────────────────────
function Avatar({ name, dept, size = 32 }: { name: string; dept: string; size?: number }) {
  const initials = name.split(" ").map(p=>p[0]).slice(0,2).join("");
  const color = DC[dept] || "#888";
  return (
    <div
      className="rounded-full grid place-items-center font-bold font-mono shrink-0"
      style={{ width: size, height: size, background: color+"22", border: `2px solid ${color}`, fontSize: size*0.32, color }}
    >
      {initials}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 1: INVISIBLE CONTRIBUTOR RADAR
// ═══════════════════════════════════════════════════════════════════════════════
function InvisibleRadar() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<string|null>(null);
  const depts = ["All", ...Array.from(new Set(DATA.invisibleContributors.map(x => x.dept)))];
  const filtered = filter === "All" ? DATA.invisibleContributors : DATA.invisibleContributors.filter(x => x.dept === filter);
  const sel = selected ? DATA.invisibleContributors.find(x => x.id === selected) : null;

  return (
    <div>
      {/* Header callout */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-orange-200 rounded-xl p-4 mb-5 flex gap-3 items-start">
        <span className="text-2xl">⚠️</span>
        <div>
          <div className="font-bold text-sm text-red-700 mb-1">{DATA.invisibleContributors.length} Invisible Contributors Detected</div>
          <p className="text-xs text-red-600 leading-relaxed">
            These employees actively nominate colleagues but have <strong>never been recognized themselves</strong>.
            Research shows unrecognized high-givers are <strong>3.2× more likely to disengage</strong> within 6 months.
          </p>
        </div>
      </div>

      {/* Dept filter */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {depts.map(d => (
          <button key={d} onClick={() => setFilter(d)}
            className="px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-150"
            style={{
              borderColor: filter===d ? (DC[d]||"#0B3954") : "#E9ECEF",
              background: filter===d ? (DC[d]||"#0B3954")+"18" : "white",
              color: filter===d ? (DC[d]||"#0B3954") : "#6C757D",
            }}>
            {d}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${selected ? "grid-cols-[1fr_360px]" : "grid-cols-1"}`}>
        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                {["Person","Dept","Title","Seniority","Nominations Given","Risk","Action"].map(h=>(
                  <th key={h} className="px-3.5 py-2.5 text-left font-mono text-[9px] tracking-widest uppercase text-gray-500 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} onClick={() => setSelected(selected===p.id ? null : p.id)}
                  className="border-b border-gray-100 cursor-pointer transition-colors duration-100"
                  style={{ background: selected===p.id ? "#FFF4EE" : i%2===0 ? "white" : "#FAFBFC" }}>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={p.name} dept={p.dept} size={28}/>
                      <span className="font-semibold text-[#0B3954]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-xl font-semibold"
                      style={{ background:(DC[p.dept]||"#888")+"18", color:DC[p.dept]||"#888" }}>
                      {p.dept}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-gray-500 text-[11px]">{p.title}</td>
                  <td className="px-3.5 py-3 text-gray-500 text-[11px]">{p.seniority}</td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-lg text-[#F96400]">{p.given}</span>
                      <div className="w-12 h-1 bg-gray-200 rounded">
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

        {/* Detail panel */}
        {sel && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={sel.name} dept={sel.dept} size={44}/>
              <div>
                <div className="font-bold text-[15px] text-[#0B3954]">{sel.name}</div>
                <div className="text-[11px] text-gray-500">{sel.title} · {sel.dept}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {l:"Nominations Given",v:sel.given,c:"text-[#F96400]"},
                {l:"Recognition Received",v:sel.received,c:"text-red-500"},
                {l:"Seniority",v:sel.seniority,c:"text-indigo-600"},
                {l:"Disengagement Risk",v:sel.riskScore+"%",c:"text-red-500"},
              ].map(s=>(
                <div key={s.l} className="p-2.5 bg-gray-50 rounded-lg">
                  <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-1">{s.l}</div>
                  <div className={`font-extrabold text-lg ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="bg-teal-50 rounded-lg p-3 mb-3">
              <div className="font-mono text-[9px] text-teal-600 uppercase tracking-widest mb-1.5">💡 RECOMMENDED ACTION</div>
              <p className="text-xs text-[#0B3954] leading-relaxed">
                {sel.seniority==="VP"||sel.seniority==="Director"
                  ? `Senior leaders often feel recognition "should go down not up." Prompt their manager or CEO to specifically call out ${sel.name.split(" ")[0]}'s generosity in the next all-hands.`
                  : `Reach out to ${sel.name.split(" ")[0]}'s manager today. Share that they've given ${sel.given} nominations and ask the manager to submit recognition within the week.`}
              </p>
            </div>
            <button onClick={() => setSelected(null)}
              className="w-full py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 cursor-pointer">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 2: MOMENTUM TRACKER
// ═══════════════════════════════════════════════════════════════════════════════
function MomentumTracker() {
  const [view, setView] = useState("rising");
  const [hovered, setHovered] = useState<string|null>(null);
  const people = view === "rising" ? DATA.risingStars : DATA.decliningRecognition;
  const maxSlope = Math.max(...DATA.risingStars.map(x => x.slope), 0.01);
  const minSlope = Math.min(...DATA.decliningRecognition.map(x => x.slope), -0.01);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3.5 mb-5">
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200">
          <div className="font-bold text-sm text-green-700 mb-1">🚀 {DATA.risingStars.length} Rising Stars</div>
          <p className="text-[11px] text-green-600 leading-relaxed">Recognition accelerating — high potential for promotion pipeline or leadership roles.</p>
        </div>
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
          <div className="font-bold text-sm text-red-700 mb-1">⚠️ {DATA.decliningRecognition.length} Declining Trend</div>
          <p className="text-[11px] text-red-600 leading-relaxed">Recognition momentum declining — possible disengagement signal. Schedule 1:1 check-ins.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[{id:"rising",label:"🚀 Rising Stars",active:"border-green-500 bg-green-50 text-green-700",inactive:"border-gray-200 bg-white text-gray-500"},
          {id:"declining",label:"⚠️ Declining",active:"border-red-500 bg-red-50 text-red-700",inactive:"border-gray-200 bg-white text-gray-500"}].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 cursor-pointer transition-all duration-150 ${view===v.id ? v.active : v.inactive}`}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {people.slice(0,12).map(p => {
          const isRising = view === "rising";
          const absSlope = Math.abs(p.slope);
          const intensity = isRising ? absSlope / maxSlope : absSlope / Math.abs(minSlope);
          const borderCls = isRising ? "border-green-200" : "border-red-200";
          const bgHov = isRising ? "bg-green-50" : "bg-red-50";

          return (
            <div key={p.id}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              className={`p-3.5 rounded-xl border cursor-default transition-all duration-200 ${borderCls} ${hovered===p.id ? bgHov + " shadow-md" : "bg-white shadow-sm"}`}>
              <div className="flex items-center gap-2 mb-2.5">
                <Avatar name={p.name} dept={p.dept} size={30}/>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[#0B3954] truncate">{p.name}</div>
                  <div className="text-[10px] text-gray-500">{p.dept}</div>
                </div>
              </div>
              <div className="mb-2.5">
                <Spark data={p.monthlyData} color={isRising ? "#27AE60" : "#E74C3C"} h={32} w={120}/>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  {l:"Total",v:p.total,cls:"text-[#0B3954]"},
                  {l:"Slope",v:(isRising?"+":"")+p.slope.toFixed(2),cls:isRising?"text-green-600":"text-red-500"},
                  {l:"Recent",v:p.recent,cls:"text-[#0B3954]"},
                ].map(s=>(
                  <div key={s.l} className="text-center p-1.5 bg-gray-50 rounded-md">
                    <div className="font-mono text-[7px] text-gray-500 uppercase mb-0.5">{s.l}</div>
                    <div className={`font-bold text-sm ${s.cls}`}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 h-0.5 bg-gray-200 rounded overflow-hidden">
                <div className="h-full rounded"
                  style={{ width:`${intensity*100}%`, background: isRising ? "#27AE60" : "#E74C3C" }}/>
              </div>
              <div className="font-mono text-[8px] text-gray-400 mt-1">{p.seniority} · {p.months} months tracked</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 flex gap-2.5 items-start">
        <span className="text-lg">📋</span>
        <p className="text-xs text-indigo-800 leading-relaxed">
          <strong>HR Action:</strong> Export rising stars to your promotion review pipeline.
          For declining employees, set up automated manager nudges 30 days before their last recognition date.
          Consider a <em>&quot;Recognition Streak&quot;</em> feature in your platform to gamify consistency.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 3: CROSS-DEPT INFLUENCE MAP
// ═══════════════════════════════════════════════════════════════════════════════
function CrossDeptMap() {
  const [highlight, setHighlight] = useState<string|null>(null);
  const [view, setView] = useState("matrix");
  const depts = DATA.depts;

  const matrix: Record<string, Record<string,number>> = {};
  DATA.crossDeptFlow.forEach(f => {
    if (!matrix[f.from]) matrix[f.from] = {};
    matrix[f.from][f.to] = f.value;
  });
  const getVal = (from: string, to: string): number | null => (from === to ? null : (matrix[from]?.[to] || 0));
  const maxFlow = Math.max(...DATA.crossDeptFlow.map(f => f.value));

  const heatColor = (v: number | null): string => {
    if (v == null || v === 0) return "transparent";
    const t = (v as number) / maxFlow;
    const r = Math.round(249 * t + 240 * (1-t));
    const g = Math.round(100 * t + 240 * (1-t));
    const b = Math.round(0 * t + 240 * (1-t));
    return `rgb(${r},${g},${b})`;
  };

  const giverTotals = depts.map(d => ({
    dept: d,
    total: depts.reduce((s, r) => d !== r ? s + (getVal(d,r)||0) : s, 0)
  })).sort((a,b) => b.total - a.total);

  const receiverTotals = depts.map(d => ({
    dept: d,
    total: depts.reduce((s, g) => d !== g ? s + (getVal(g,d)||0) : s, 0),
    uniqueSources: depts.filter(g => d !== g && (getVal(g,d)||0) > 0).length
  })).sort((a,b) => b.total - a.total);

  const maxGiver = giverTotals[0]?.total || 1;
  const maxReceiver = receiverTotals[0]?.total || 1;

  return (
    <div>
      <div className="bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-200 rounded-xl p-3.5 mb-5 flex gap-2.5">
        <span className="text-xl">🗺️</span>
        <p className="text-xs text-[#0B3954] leading-relaxed">
          <strong>Cross-departmental recognition reveals your org&apos;s informal influence network.</strong>{" "}
          High outflow depts are <em>culture amplifiers</em>. Low inflow depts may be <em>isolated silos</em>.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        {[{id:"matrix",label:"Heat Map"},{id:"givers",label:"🏆 Top Givers"},{id:"receivers",label:"⭐ Top Receivers"}].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-all duration-150 ${view===v.id ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 bg-white text-gray-500"}`}>
            {v.label}
          </button>
        ))}
      </div>

      {view === "matrix" && (
        <div className="overflow-x-auto">
          <table className="border-collapse text-[11px]" style={{minWidth:600}}>
            <thead>
              <tr>
                <th className="px-2 py-1.5 font-mono text-[8px] text-gray-500 uppercase border-b-2 border-gray-200 min-w-[90px] text-left">FROM ↓ TO →</th>
                {depts.map(d => (
                  <th key={d} onClick={() => setHighlight(highlight===d?null:d)}
                    className="px-1.5 py-1 font-mono text-[8px] text-center border-b-2 border-gray-200 cursor-pointer min-w-[52px] transition-colors"
                    style={{ color: highlight===d ? (DC[d]||"#888") : "#6C757D", fontWeight: highlight===d ? 700 : 400 }}>
                    {d.length > 8 ? d.slice(0,7)+"." : d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {depts.map(from => (
                <tr key={from}>
                  <td onClick={() => setHighlight(highlight===from?null:from)}
                    className="px-2 py-1 font-mono text-[9px] border-b border-gray-100 cursor-pointer whitespace-nowrap"
                    style={{ color: highlight===from ? (DC[from]||"#888") : "#6C757D", fontWeight: highlight===from ? 700 : 400 }}>
                    {from}
                  </td>
                  {depts.map(to => {
                    const v = getVal(from, to);
                    const isSelf = from === to;
                    const isHL = highlight && (highlight===from||highlight===to);
                    const dimmed = highlight && !isHL;
                    return (
                      <td key={to} className="px-1 py-0.5 text-center border-b border-gray-100 transition-opacity"
                        style={{ background: isSelf ? "#F8F9FA" : heatColor(v), opacity: dimmed ? 0.2 : 1 }}>
                        {isSelf
                          ? <span className="text-gray-200 text-[10px]">—</span>
                          : (v ?? 0) > 0
                            ? <span className="font-mono text-[10px] font-bold"
                                style={{ color: (v ?? 0) >= maxFlow*0.7 ? "white" : (v ?? 0) >= maxFlow*0.4 ? "#B03A2E" : "#6C757D" }}>{v}</span>
                            : <span className="text-gray-200 text-[9px]">·</span>
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex gap-4 items-center text-[10px] text-gray-500">
            <span>Click a dept name to highlight its row/column</span>
          </div>
        </div>
      )}

      {view === "givers" && (
        <div className="flex flex-col gap-2.5">
          {giverTotals.map((g, i) => (
            <div key={g.dept} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border ${i===0 ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200"}`}>
              <div className="w-7 h-7 rounded-md grid place-items-center text-white font-extrabold text-[11px] shrink-0"
                style={{background: DC[g.dept]||"#888"}}>{i+1}</div>
              <div className="flex-1">
                <div className="font-semibold text-[13px] text-[#0B3954]">{g.dept}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Champions {g.total} employees in other departments</div>
              </div>
              <div className="w-28 h-1.5 bg-gray-200 rounded overflow-hidden">
                <div className="h-full rounded" style={{width:`${(g.total/maxGiver)*100}%`, background:DC[g.dept]||"#888"}}/>
              </div>
              <div className="font-mono font-extrabold text-base min-w-[22px] text-right"
                style={{color: i===0 ? "#00A98F" : "#0B3954"}}>{g.total}</div>
            </div>
          ))}
        </div>
      )}

      {view === "receivers" && (
        <div className="flex flex-col gap-2.5">
          {receiverTotals.map((r, i) => (
            <div key={r.dept} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border ${i===0 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
              <div className="w-7 h-7 rounded-md grid place-items-center text-white font-extrabold text-[11px] shrink-0"
                style={{background: DC[r.dept]||"#888"}}>{i+1}</div>
              <div className="flex-1">
                <div className="font-semibold text-[13px] text-[#0B3954]">{r.dept}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Recognized by {r.uniqueSources} other depts · {r.total} cross-dept awards</div>
              </div>
              <div className="w-28 h-1.5 bg-gray-200 rounded overflow-hidden">
                <div className="h-full rounded" style={{width:`${(r.total/maxReceiver)*100}%`, background:DC[r.dept]||"#888"}}/>
              </div>
              <div className="font-mono font-extrabold text-base min-w-[22px] text-right"
                style={{color: i===0 ? "#F96400" : "#0B3954"}}>{r.total}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 4: EQUITY LENS
// ═══════════════════════════════════════════════════════════════════════════════
function EquityLens() {
  const [metric, setMetric] = useState("count");
  const eq = DATA.equityData;
  const ORDER = ["IC","Senior IC","Manager","Senior Manager","Director","VP"];
  const sorted = [...eq].sort((a,b) => ORDER.indexOf(a.recipient_seniority) - ORDER.indexOf(b.recipient_seniority));
  const maxCount = Math.max(...sorted.map(x => x.count));
  const maxValue = Math.max(...sorted.map(x => x.avg_value));
  const maxHighPct = Math.max(...sorted.map(x => x.high_value_pct));

  const barVal = (row: typeof sorted[0]) => {
    if (metric==="count") return {v:row.count, max:maxCount, fmt:String(row.count)};
    if (metric==="avg_value") return {v:row.avg_value, max:maxValue, fmt:`$${row.avg_value}`};
    return {v:row.high_value_pct, max:maxHighPct, fmt:`${row.high_value_pct}%`};
  };

  const vals = sorted.map(x => barVal(x).v);
  const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
  const std = Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length);
  const cv = (std/mean*100).toFixed(1);
  const isEquitable = parseFloat(cv) < 10;

  const SENIORITY_COLORS: Record<string,string> = {
    "IC":"#45B7D1","Senior IC":"#4ECDC4","Manager":"#F9CA24",
    "Senior Manager":"#F96400","Director":"#FF6B6B","VP":"#6C5CE7"
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className={`p-3.5 rounded-xl border ${isEquitable ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
          <div className={`font-mono text-[9px] uppercase tracking-widest mb-1.5 ${isEquitable ? "text-green-700" : "text-yellow-700"}`}>Equity Score</div>
          <div className={`font-extrabold text-3xl font-mono ${isEquitable ? "text-green-600" : "text-yellow-500"}`}>{isEquitable?"✓":"~"}</div>
          <div className={`text-[11px] mt-1 ${isEquitable ? "text-green-700" : "text-yellow-700"}`}>CV = {cv}% · {isEquitable?"Well distributed":"Moderate variance"}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
          <div className="font-mono text-[9px] text-indigo-600 uppercase tracking-widest mb-1.5">Most Recognized</div>
          <div className="font-bold text-[15px] text-[#0B3954] mb-1">{[...sorted].sort((a,b)=>b.count-a.count)[0]?.recipient_seniority}</div>
          <div className="text-[11px] text-indigo-600">{[...sorted].sort((a,b)=>b.count-a.count)[0]?.count} total awards</div>
        </div>
        <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200">
          <div className="font-mono text-[9px] text-orange-500 uppercase tracking-widest mb-1.5">Highest Avg Value</div>
          <div className="font-bold text-[15px] text-[#0B3954] mb-1">{[...eq].sort((a,b)=>b.avg_value-a.avg_value)[0]?.recipient_seniority}</div>
          <div className="text-[11px] text-orange-500">${[...eq].sort((a,b)=>b.avg_value-a.avg_value)[0]?.avg_value} avg</div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {[{id:"count",label:"Award Count"},{id:"avg_value",label:"Avg Value"},{id:"high_value_pct",label:"High-Value Rate"}].map(m => (
          <button key={m.id} onClick={() => setMetric(m.id)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${metric===m.id ? "bg-[#0B3954] border-[#0B3954] text-white" : "bg-white border-gray-200 text-gray-500"}`}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex flex-col gap-3.5">
          {sorted.sort((a,b)=>ORDER.indexOf(a.recipient_seniority)-ORDER.indexOf(b.recipient_seniority)).map(row => {
            const {v, max, fmt} = barVal(row);
            const pct = (v/max)*100;
            const color = SENIORITY_COLORS[row.recipient_seniority] || "#888";
            return (
              <div key={row.recipient_seniority}>
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{background:color}}/>
                    <span className="text-[13px] font-semibold text-[#0B3954]">{row.recipient_seniority}</span>
                  </div>
                  <span className="font-mono text-xs font-bold" style={{color}}>{fmt}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-700"
                    style={{width:`${pct}%`, background:color}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-indigo-50 rounded-xl p-3.5 flex gap-2.5">
        <span className="text-lg">⚖️</span>
        <div>
          <div className="font-mono text-[9px] text-indigo-600 uppercase tracking-widest mb-1">EQUITY INSIGHT</div>
          <p className="text-xs text-[#0B3954] leading-relaxed">
            Recognition distribution across seniority levels shows CV of <strong>{cv}%</strong>.
            {parseFloat(cv) < 10
              ? " This indicates healthy equity — recognition is not skewed toward senior employees."
              : " Consider reviewing if Junior ICs are being overlooked. High-value ($500+) awards skewing toward Senior Manager+ may signal a cultural bias worth addressing."}
            {" "}Benchmark target: all levels within <strong>±15%</strong> of each other.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SHELL
// ═══════════════════════════════════════════════════════════════════════════════
const FEATURES = [
  { id:"invisible", icon:"👁️", label:"Invisible Contributors", subtitle:"Givers who go unrecognized",
    activeCls:"border-red-500 bg-red-50", labelCls:"text-red-600", subCls:"text-red-400",
    badge: DATA.invisibleContributors.length + " at risk", component: InvisibleRadar },
  { id:"momentum",  icon:"📈", label:"Momentum Tracker",       subtitle:"Rising stars & declining trends",
    activeCls:"border-green-500 bg-green-50", labelCls:"text-green-700", subCls:"text-green-400",
    badge: DATA.risingStars.length + " rising", component: MomentumTracker },
  { id:"crossdept", icon:"🗺️", label:"Influence Map",          subtitle:"Cross-dept recognition flows",
    activeCls:"border-teal-500 bg-teal-50", labelCls:"text-teal-700", subCls:"text-teal-400",
    badge: DATA.crossDeptFlow.length + " flows", component: CrossDeptMap },
  { id:"equity",    icon:"⚖️", label:"Equity Lens",            subtitle:"Recognition fairness by seniority",
    activeCls:"border-indigo-500 bg-indigo-50", labelCls:"text-indigo-700", subCls:"text-indigo-400",
    badge: "6 levels", component: EquityLens },
];

export default function HRIntelligence() {
  const [active, setActive] = useState("invisible");
  const feat = FEATURES.find(f => f.id === active);
  const ActiveComponent = feat?.component;

  return (
    <div className="font-sans bg-gray-50 min-h-screen pb-10">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-7 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
        <div>
          <div className="font-extrabold text-[17px] text-[#0B3954] tracking-tight">🧠 HR Intelligence Suite</div>
          <div className="font-mono text-[9px] text-gray-400 tracking-widest uppercase mt-0.5">
            4 diagnostic features · awards_enriched.csv · 1,000 awards
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FEATURES.map(f => (
            <button key={f.id} onClick={() => setActive(f.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 cursor-pointer transition-all duration-200 ${active===f.id ? f.activeCls : "border-gray-200 bg-white"}`}>
              <span className="text-sm">{f.icon}</span>
              <div className="text-left">
                <div className={`text-[11px] font-bold leading-tight ${active===f.id ? f.labelCls : "text-[#0B3954]"}`}>{f.label}</div>
                <div className={`font-mono text-[8px] ${active===f.id ? f.subCls : "text-gray-400"}`}>{f.badge}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature content */}
      <div className="px-7 pt-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl grid place-items-center text-lg border border-gray-200 bg-gray-50">{feat?.icon}</div>
          <div>
            <div className="font-extrabold text-[18px] text-[#0B3954] tracking-tight">{feat?.label}</div>
            <div className="text-xs text-gray-500">{feat?.subtitle}</div>
          </div>
        </div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}