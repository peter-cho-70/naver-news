"use client";

import { useEffect, useState } from "react";
import type { StockImpact as StockImpactType } from "@/app/api/analyze/route";
import type { StockQuote } from "@/app/api/stocks/route";

interface StockImpactProps {
  stockImpacts: StockImpactType[];
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return "-";
  if (currency === "KRW") return new Intl.NumberFormat("ko-KR").format(Math.round(price)) + "원";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

function formatChange(change: number, currency: string): string {
  if (change === 0) return "-";
  const sign = change > 0 ? "+" : "";
  if (currency === "KRW") return sign + new Intl.NumberFormat("ko-KR").format(Math.round(change)) + "원";
  return sign + change.toFixed(2);
}

const impactConfig = {
  긍정: {
    gradient: "from-emerald-400 to-teal-400",
    bar: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "↑",
    priceUp: "text-emerald-600",
    card: "border-emerald-100/80 hover:border-emerald-200",
    glow: "shadow-emerald-100",
  },
  중립: {
    gradient: "from-slate-300 to-gray-300",
    bar: "bg-slate-300",
    badge: "bg-gray-50 text-gray-600 border-gray-200",
    icon: "→",
    priceUp: "text-gray-500",
    card: "border-gray-100/80 hover:border-gray-200",
    glow: "shadow-gray-100",
  },
  부정: {
    gradient: "from-rose-400 to-red-400",
    bar: "bg-rose-400",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "↓",
    priceUp: "text-rose-600",
    card: "border-rose-100/80 hover:border-rose-200",
    glow: "shadow-rose-100",
  },
};

function ScoreBar({ score, impact }: { score: number; impact: string }) {
  const config = impactConfig[impact as keyof typeof impactConfig] ?? impactConfig["중립"];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${config.bar}`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-400 w-6 text-right">{score}</span>
    </div>
  );
}

function StockCard({ stock, quote }: { stock: StockImpactType; quote?: StockQuote }) {
  const config = impactConfig[stock.impact] ?? impactConfig["중립"];
  const isUp = (quote?.change ?? 0) > 0;
  const isDown = (quote?.change ?? 0) < 0;
  const loading = !quote;

  const changeColor = isUp ? "text-emerald-600" : isDown ? "text-rose-600" : "text-gray-400";

  return (
    <div className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl border ${config.card} p-4 shadow-sm hover:shadow-lg ${config.glow} hover:-translate-y-0.5 transition-all duration-200`}>
      {/* Top accent line */}
      <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${config.gradient} opacity-60`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pt-1">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-bold text-gray-900 text-sm">{stock.company}</span>
            <span className="text-sm font-black" style={{ color: isUp ? "#10b981" : isDown ? "#f43f5e" : "#94a3b8" }}>
              {config.icon}
            </span>
          </div>
          <span className="text-xs text-gray-300 font-mono">{stock.ticker}</span>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${config.badge}`}>
          {stock.impact}
        </span>
      </div>

      {/* Price block */}
      <div className="rounded-xl bg-gray-50/80 px-3 py-2.5 mb-3">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse ml-auto" />
          </div>
        ) : quote?.error ? (
          <span className="text-xs text-gray-300">주가 조회 불가</span>
        ) : (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base font-black text-gray-900 tracking-tight">
              {formatPrice(quote!.price, quote!.currency)}
            </span>
            <div className="text-right">
              <div className={`text-xs font-bold ${changeColor}`}>
                {isUp ? "▲" : isDown ? "▼" : ""}
                {" "}{quote!.changePercent >= 0 ? "+" : ""}{quote!.changePercent.toFixed(2)}%
              </div>
              <div className={`text-xs ${changeColor}`}>
                {formatChange(quote!.change, quote!.currency)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">AI 영향도</span>
          <span className="text-xs font-bold text-gray-600">{stock.score}/10</span>
        </div>
        <ScoreBar score={stock.score} impact={stock.impact} />
      </div>

      {/* Reason */}
      <p className="text-xs text-gray-400 leading-relaxed pt-2.5 border-t border-gray-100">
        {stock.reason}
      </p>
    </div>
  );
}

export default function StockImpact({ stockImpacts }: StockImpactProps) {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  useEffect(() => {
    if (stockImpacts.length === 0) { setLoadingQuotes(false); return; }
    const tickers = stockImpacts.map((s) => s.ticker).join(",");
    fetch(`/api/stocks?tickers=${encodeURIComponent(tickers)}`)
      .then((r) => r.json())
      .then((data) => { setQuotes(data); setLoadingQuotes(false); })
      .catch(() => setLoadingQuotes(false));
  }, [stockImpacts]);

  if (stockImpacts.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 p-10 text-center shadow-sm">
        <p className="text-gray-300 text-sm">이 뉴스와 관련된 상장 기업이 감지되지 않았습니다.</p>
      </div>
    );
  }

  const sorted = [...stockImpacts].sort((a, b) => {
    const order = { 긍정: 0, 부정: 1, 중립: 2 };
    return (order[a.impact] ?? 2) - (order[b.impact] ?? 2) || b.score - a.score;
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        {(["긍정", "부정", "중립"] as const).map((type) => {
          const cnt = stockImpacts.filter((s) => s.impact === type).length;
          if (!cnt) return null;
          const dot = { 긍정: "bg-emerald-400", 부정: "bg-rose-400", 중립: "bg-gray-300" };
          return (
            <span key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full ${dot[type]}`} />
              {type} {cnt}
            </span>
          );
        })}
        {!loadingQuotes && (
          <span className="ml-auto text-xs text-gray-300 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Yahoo Finance 실시간
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sorted.map((stock, i) => (
          <div key={stock.ticker} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in-up">
            <StockCard stock={stock} quote={loadingQuotes ? undefined : quotes[stock.ticker]} />
          </div>
        ))}
      </div>
    </div>
  );
}
