"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import NewsCard from "@/components/NewsCard";
import type { NewsItem, AnalysisResult } from "@/app/api/analyze/route";

const Charts = dynamic(() => import("@/components/Charts"), { ssr: false });
const StockImpact = dynamic(() => import("@/components/StockImpact"), { ssr: false });

const PRESET_QUERIES = [
  "주요뉴스",
  "경제",
  "정치",
  "AI 인공지능",
  "스포츠",
  "엔터테인먼트",
  "국제",
  "IT 기술",
];

type Status = "idle" | "fetching" | "analyzing" | "done" | "error";

const INSIGHT_COLORS = [
  "border-l-violet-400 bg-violet-50/60",
  "border-l-sky-400 bg-sky-50/60",
  "border-l-emerald-400 bg-emerald-50/60",
  "border-l-amber-400 bg-amber-50/60",
  "border-l-rose-400 bg-rose-50/60",
];

export default function Home() {
  const [query, setQuery] = useState("주요뉴스");
  const [status, setStatus] = useState<Status>("idle");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAndAnalyze = useCallback(async (q: string) => {
    setStatus("fetching");
    setErrorMsg("");
    setAnalysis(null);
    setNews([]);

    try {
      const newsRes = await fetch(`/api/news?query=${encodeURIComponent(q)}&display=20&sort=date`);
      const newsData = await newsRes.json();
      if (!newsRes.ok || newsData.error) throw new Error(newsData.error || "뉴스를 가져오지 못했습니다.");

      const items: NewsItem[] = newsData.items || [];
      setNews(items);
      setStatus("analyzing");

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news: items }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok || analyzeData.error) throw new Error(analyzeData.error || "분석에 실패했습니다.");

      setAnalysis(analyzeData);
      setLastUpdated(new Date());
      setStatus("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
      setStatus("error");
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) fetchAndAnalyze(query.trim());
  };

  const handlePreset = (q: string) => {
    setQuery(q);
    fetchAndAnalyze(q);
  };

  const isLoading = status === "fetching" || status === "analyzing";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#eef6ff 0%,#f0f4ff 40%,#f5f0ff 100%)" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/75 border-b border-white/60 shadow-[0_1px_20px_rgba(99,102,241,.07)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-4.5 h-4.5 text-white" style={{width:18,height:18}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-base bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">
                AI 뉴스
              </span>
              <span className="font-semibold text-base text-gray-700 tracking-tight"> 분석</span>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="뉴스 키워드 검색..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200/80 bg-white/90 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-300 transition-all shadow-sm"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200/60 active:scale-95"
            >
              {isLoading ? "분석 중…" : "검색"}
            </button>
          </form>

          {lastUpdated && (
            <span className="text-xs text-gray-400 hidden md:flex items-center gap-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              {lastUpdated.toLocaleTimeString("ko-KR")}
            </span>
          )}
        </div>

        {/* Preset chips */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2.5 flex gap-1.5 overflow-x-auto">
          {PRESET_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handlePreset(q)}
              disabled={isLoading}
              className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium border transition-all duration-150 ${
                query === q
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-white/80 text-gray-600 border-gray-200/80 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/60"
              } disabled:opacity-50`}
            >
              {q}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* ── Idle ── */}
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center py-28 text-center animate-fade-in-up">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-300/50">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white shadow" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
              AI{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                뉴스 분석
              </span>{" "}
              대시보드
            </h1>
            <p className="text-gray-500 text-lg max-w-sm leading-relaxed mb-10">
              키워드를 검색하면 네이버 뉴스를 실시간 수집하고<br />
              GPT로 감성·카테고리·주가 영향도를 분석합니다
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {PRESET_QUERIES.map((q, i) => (
                <button
                  key={q}
                  onClick={() => handlePreset(q)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="animate-fade-in-up px-4 py-2 bg-white rounded-xl border border-gray-200/80 text-gray-700 text-sm font-medium hover:border-indigo-400 hover:text-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-scale-in">
            <div className="relative w-20 h-20 mb-7">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-cyan-400 animate-spin" />
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-indigo-50 to-cyan-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-800 font-bold text-xl tracking-tight mb-1">
              {status === "fetching" ? "뉴스 수집 중…" : "AI 분석 중…"}
            </p>
            <p className="text-gray-400 text-sm">
              {status === "fetching"
                ? "네이버에서 최신 뉴스를 가져오고 있습니다"
                : "GPT-4o mini로 감성·카테고리·주가 영향도를 분석합니다"}
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div className="max-w-md mx-auto animate-fade-in-up">
            <div className="bg-white rounded-3xl border border-red-100 p-8 text-center shadow-lg shadow-red-50">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-gray-800 font-bold text-lg mb-1">오류가 발생했습니다</h3>
              <p className="text-red-400 text-sm mb-5">{errorMsg}</p>
              <button
                onClick={() => fetchAndAnalyze(query)}
                className="px-5 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-md shadow-red-200"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {status === "done" && analysis && (
          <div className="space-y-8 animate-fade-in-up">

            {/* Summary Banner */}
            <div className="relative overflow-hidden rounded-3xl p-6 shadow-xl shadow-indigo-200/40"
              style={{ background: "linear-gradient(135deg,#4f46e5 0%,#2563eb 50%,#0891b2 100%)" }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%,#fff 0%,transparent 60%)" }} />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">AI 뉴스 요약</span>
                    <span className="text-xs bg-white/15 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-white/90 font-medium">
                      &ldquo;{query}&rdquo; · {news.length}건
                    </span>
                  </div>
                  <p className="text-white/95 leading-relaxed text-sm sm:text-base font-medium">{analysis.summary}</p>
                </div>
              </div>
            </div>

            {/* Insights */}
            <section>
              <SectionTitle>핵심 인사이트</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.insights.map((insight, i) => (
                  <div
                    key={i}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className={`animate-fade-in-up bg-white/80 backdrop-blur-sm rounded-2xl border-l-4 border border-gray-100/80 px-4 py-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${INSIGHT_COLORS[i % INSIGHT_COLORS.length]}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 text-xs font-black text-gray-300 mt-0.5 w-4">{i + 1}</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Charts */}
            <section>
              <SectionTitle>통계 분석</SectionTitle>
              <Charts analysis={analysis} />
            </section>

            {/* Stock Impact */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <SectionTitle>주가 영향도 분석</SectionTitle>
                <span className="text-xs bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold shadow-sm">
                  AI 분석
                </span>
              </div>
              <StockImpact stockImpacts={analysis.stockImpacts ?? []} />
            </section>

            {/* News List */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>뉴스 목록</SectionTitle>
                <span className="text-xs bg-white/80 text-gray-500 border border-gray-200/80 px-2.5 py-1 rounded-full font-medium shadow-sm">
                  {news.length}건
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {news.map((item, i) => {
                  const topStory =
                    analysis.topStories.find(
                      (ts) => ts.title.slice(0, 15) === item.title.replace(/<[^>]*>/g, "").slice(0, 15)
                    ) || (i < analysis.topStories.length ? analysis.topStories[i] : undefined);
                  return (
                    <div key={item.link + i} style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }} className="animate-fade-in-up">
                      <NewsCard item={item} index={i} topStory={topStory} />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-gray-400 border-t border-gray-100/60 mt-8">
        <span className="inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
          네이버 뉴스 API
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
          OpenAI GPT-4o mini
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
          Yahoo Finance
        </span>
      </footer>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{children}</h2>
  );
}
