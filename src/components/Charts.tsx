"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AnalysisResult } from "@/app/api/analyze/route";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function SentimentChart({ sentiments }: { sentiments: AnalysisResult["sentiments"] }) {
  return (
    <ChartCard title="감성 분석">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={sentiments}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {sentiments.map((entry, i) => (
              <Cell key={i} fill={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value}%`]}
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}
          />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-5 mt-1">
        {sentiments.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-gray-500">{s.name}</span>
            <span className="text-xs font-bold text-gray-800">{s.value}%</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

export function CategoryChart({ categories }: { categories: AnalysisResult["categories"] }) {
  return (
    <ChartCard title="카테고리 분포">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={categories} layout="vertical" margin={{ left: 4, right: 28, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} width={56} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]} label={{ position: "right", fontSize: 11, fill: "#9ca3af" }}>
            {categories.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function KeywordCloud({ keywords }: { keywords: AnalysisResult["keywords"] }) {
  const maxWeight = Math.max(...keywords.map((k) => k.weight));

  const palette = [
    ["bg-indigo-50 text-indigo-700 hover:bg-indigo-100"],
    ["bg-sky-50 text-sky-700 hover:bg-sky-100"],
    ["bg-violet-50 text-violet-700 hover:bg-violet-100"],
    ["bg-cyan-50 text-cyan-700 hover:bg-cyan-100"],
    ["bg-blue-50 text-blue-700 hover:bg-blue-100"],
  ];

  return (
    <ChartCard title="핵심 키워드">
      <div className="flex flex-wrap gap-2 items-center justify-center min-h-[150px]">
        {keywords
          .sort((a, b) => b.weight - a.weight)
          .map((keyword, i) => {
            const ratio = keyword.weight / maxWeight;
            const size = Math.round(11 + ratio * 14);
            const colors = palette[i % palette.length][0];
            return (
              <span
                key={keyword.word}
                className={`inline-block px-3 py-1 rounded-full font-semibold cursor-default transition-all duration-150 ${colors}`}
                style={{ fontSize: `${size}px`, opacity: 0.55 + ratio * 0.45 }}
              >
                {keyword.word}
              </span>
            );
          })}
      </div>
    </ChartCard>
  );
}

export default function Charts({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <SentimentChart sentiments={analysis.sentiments} />
      <CategoryChart categories={analysis.categories} />
      <KeywordCloud keywords={analysis.keywords} />
    </div>
  );
}
