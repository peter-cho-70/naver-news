import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  originallink?: string;
}

export interface StockImpact {
  company: string;
  ticker: string;
  impact: "긍정" | "중립" | "부정";
  score: number;
  reason: string;
}

export interface AnalysisResult {
  summary: string;
  categories: { name: string; count: number; color: string }[];
  sentiments: { name: string; value: number; color: string }[];
  keywords: { word: string; weight: number }[];
  insights: string[];
  topStories: { title: string; summary: string; category: string; sentiment: string }[];
  stockImpacts: StockImpact[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

export async function POST(request: NextRequest) {
  try {
    const { news }: { news: NewsItem[] } = await request.json();

    if (!news || news.length === 0) {
      return NextResponse.json({ error: "뉴스 데이터가 없습니다." }, { status: 400 });
    }

    const newsText = news
      .slice(0, 20)
      .map(
        (item, i) =>
          `${i + 1}. 제목: ${stripHtml(item.title)}\n   내용: ${stripHtml(item.description)}`
      )
      .join("\n\n");

    const prompt = `다음은 네이버에서 수집한 최신 뉴스 기사들입니다. 이 뉴스들을 분석하여 아래 JSON 형식으로 정확히 응답해주세요.

뉴스 목록:
${newsText}

다음 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이):
{
  "summary": "전체 뉴스의 2-3문장 핵심 요약",
  "categories": [
    {"name": "카테고리명", "count": 숫자}
  ],
  "sentiments": [
    {"name": "긍정", "value": 퍼센트숫자},
    {"name": "중립", "value": 퍼센트숫자},
    {"name": "부정", "value": 퍼센트숫자}
  ],
  "keywords": [
    {"word": "키워드", "weight": 1~10사이숫자}
  ],
  "insights": ["핵심 인사이트 문장 1", "핵심 인사이트 문장 2", "핵심 인사이트 문장 3", "핵심 인사이트 문장 4", "핵심 인사이트 문장 5"],
  "topStories": [
    {"title": "기사제목", "summary": "1~2문장 요약", "category": "카테고리", "sentiment": "긍정|중립|부정"}
  ],
  "stockImpacts": [
    {"company": "기업명(한글)", "ticker": "야후파이낸스티커(예:005930.KS)", "impact": "긍정|중립|부정", "score": 1~10사이영향강도, "reason": "주가영향이유한문장"}
  ]
}

규칙:
- categories는 정치, 경제, 사회, 문화/연예, 스포츠, 국제, IT/과학, 기타 중에서 실제 등장한 것만 포함, 최대 6개
- sentiments의 value 합계는 반드시 100
- keywords는 핵심 키워드 8~12개, weight는 중요도(1~10)
- topStories는 가장 중요한 기사 5개
- stockImpacts: 뉴스에서 언급되거나 영향을 받을 한국 상장 기업 최대 8개 추출
  - ticker는 반드시 야후파이낸스 형식 사용 (KOSPI: 종목코드.KS, KOSDAQ: 종목코드.KQ)
  - 예시 ticker: 삼성전자=005930.KS, SK하이닉스=000660.KS, 네이버=035420.KS, 카카오=035720.KS, 현대차=005380.KS, LG에너지솔루션=373220.KS, 셀트리온=068270.KS, 기아=000270.KS, POSCO홀딩스=005490.KS, 삼성바이오로직스=207940.KS, LG화학=051910.KS, KB금융=105560.KS, 신한지주=055550.KS, 하이브=352820.KS, 크래프톤=259960.KS
  - 뉴스와 관련 없으면 빈 배열 []로 반환`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2500,
    });

    const content = completion.choices[0]?.message?.content || "";

    let analysis: AnalysisResult;
    try {
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      const categoryColors = [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#06B6D4",
        "#F97316",
        "#6B7280",
      ];
      const sentimentColors: Record<string, string> = {
        긍정: "#10B981",
        중립: "#6B7280",
        부정: "#EF4444",
      };

      analysis = {
        summary: parsed.summary,
        categories: parsed.categories.map(
          (c: { name: string; count: number }, i: number) => ({
            ...c,
            color: categoryColors[i % categoryColors.length],
          })
        ),
        sentiments: parsed.sentiments.map((s: { name: string; value: number }) => ({
          ...s,
          color: sentimentColors[s.name] || "#6B7280",
        })),
        keywords: parsed.keywords,
        insights: parsed.insights,
        topStories: parsed.topStories,
        stockImpacts: parsed.stockImpacts || [],
      };
    } catch {
      return NextResponse.json({ error: "AI 분석 결과 파싱 실패" }, { status: 500 });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "분석 중 오류 발생" },
      { status: 500 }
    );
  }
}
