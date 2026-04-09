import { NextRequest, NextResponse } from "next/server";

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketState: string;
  error?: string;
}

async function fetchQuote(ticker: string): Promise<StockQuote> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return { ticker, price: 0, change: 0, changePercent: 0, currency: "KRW", marketState: "CLOSED", error: "조회 실패" };
    }

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) {
      return { ticker, price: 0, change: 0, changePercent: 0, currency: "KRW", marketState: "CLOSED", error: "데이터 없음" };
    }

    const price: number = meta.regularMarketPrice ?? meta.previousClose ?? 0;
    const prevClose: number = meta.previousClose ?? meta.chartPreviousClose ?? 0;
    const change = prevClose > 0 ? price - prevClose : 0;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      ticker,
      price,
      change,
      changePercent,
      currency: meta.currency ?? "KRW",
      marketState: meta.marketState ?? "CLOSED",
    };
  } catch {
    return { ticker, price: 0, change: 0, changePercent: 0, currency: "KRW", marketState: "CLOSED", error: "네트워크 오류" };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get("tickers");

  if (!tickersParam) {
    return NextResponse.json({ error: "tickers 파라미터가 필요합니다." }, { status: 400 });
  }

  const tickers = tickersParam.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10);

  const results = await Promise.all(tickers.map(fetchQuote));

  const quotes: Record<string, StockQuote> = {};
  for (const q of results) {
    quotes[q.ticker] = q;
  }

  return NextResponse.json(quotes);
}
