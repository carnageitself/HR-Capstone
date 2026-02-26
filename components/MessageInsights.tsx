"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/loadDashboardData";
import { CAT_COLORS } from "@/constants/colors";
import { SH } from "@/constants/primitives";

export function MessageInsights({ data }: { data: DashboardData }) {
  const [catFilter, setCatFilter] = useState("All");
  const cats = ["All", ...[...new Set(data.messageThemes.map(t => t.category))].slice(0, 6)];
  const filteredWords = catFilter === "All" ? data.wordCloud : data.messageThemes.find(t => t.category === catFilter)?.words || [];
  const filteredMax = filteredWords[0]?.count || 1;
  const wordColors = ["#F96400", "#00A98F", "#8E44AD", "#3B5BDB", "#27AE60", "#F39C12"];
  const themes = data.messageThemes.slice(0, 5) as (typeof data.messageThemes[0] & { categoryId: string })[];

  const top1 = data.wordCloud[0]?.word || "support";
  const top2 = data.wordCloud[1]?.word || "team";
  const top1c = data.wordCloud[0]?.count || 0;
  const top2c = data.wordCloud[1]?.count || 0;

  return (
    <div>
      <SH eye="Language Analysis" title="Message Insights" eyeColorCls="text-[#8E44AD]" />
      <div className="flex gap-2 flex-wrap mb-5">
        {cats.map(c => (
          <button key={c}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${catFilter === c ? "bg-[#0B3954] text-white border-[#0B3954]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}
            onClick={() => setCatFilter(c)}>
            {c === "All" ? "All Categories" : c.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        {/* Word cloud */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-[#8E44AD] mb-1">WORD CLOUD</div>
          <div className="text-[13px] font-bold text-[#0B3954] mb-4">Language in Award Messages</div>
          <div className="flex flex-wrap gap-2 items-center leading-loose">
            {filteredWords.slice(0, 28).map((w, i) => {
              const size = Math.round(10 + (w.count / filteredMax) * 20);
              const opacity = 0.5 + (w.count / filteredMax) * 0.5;
              return (
                <span key={w.word}
                  style={{ fontSize: size, fontWeight: w.count > filteredMax * 0.6 ? 800 : w.count > filteredMax * 0.3 ? 600 : 400, color: wordColors[i % wordColors.length], opacity, lineHeight: 1.2, transition: "all .2s", cursor: "default" }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "1"; (e.target as HTMLElement).style.transform = "scale(1.1)"; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.opacity = String(opacity); (e.target as HTMLElement).style.transform = "none"; }}
                  title={`${w.count} occurrences`}>{w.word}</span>
              );
            })}
          </div>
        </div>

        {/* Category themes */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="font-mono text-[9px] tracking-[.16em] uppercase text-[#8E44AD] mb-1">CATEGORY THEMES</div>
          <div className="text-[13px] font-bold text-[#0B3954] mb-4">Top Words per Category</div>
          <div className="flex flex-col gap-3">
            {themes.map(t => (
              <div key={t.category}
                className="p-2.5 rounded-lg border cursor-pointer transition-all duration-150"
                style={{ background: catFilter === t.category ? "#F5EEF8" : "white", borderColor: catFilter === t.category ? "#D7BDE2" : "#E9ECEF" }}
                onClick={() => setCatFilter(catFilter === t.category ? "All" : t.category)}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[t.categoryId] || "#888" }} />
                  <div className="text-[11px] font-bold text-[#0B3954]">{t.category}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.words.slice(0, 5).map((w, j) => (
                    <span key={w.word} className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{ background: j === 0 ? "#F5EEF8" : "#F8F9FA", color: j === 0 ? "#8E44AD" : "#6C757D", borderColor: j === 0 ? "#D7BDE2" : "#E9ECEF", fontWeight: j === 0 ? 700 : 400 }}>
                      {w.word}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#F5EEF8] rounded-lg border border-[#D7BDE2] flex gap-2.5">
        <span className="text-xl shrink-0">🔍</span>
        <div>
          <div className="font-mono text-[9px] tracking-[.12em] uppercase text-[#8E44AD] mb-1">LANGUAGE INSIGHT</div>
          <p className="text-xs text-[#0B3954] leading-relaxed">
            <strong>&quot;{top1}&quot;</strong> ({top1c} mentions) and <strong>&quot;{top2}&quot;</strong> ({top2c} mentions) dominate award messages.
            {" "}Collaboration &amp; Teamwork is the most common category ({data.categories.find(c => c.id === "D")?.count || 0} awards, {data.categories.find(c => c.id === "D")?.pct || 0}%), while Operational Excellence has the least recognition.
          </p>
        </div>
      </div>
    </div>
  );
}