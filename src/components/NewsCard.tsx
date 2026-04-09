"use client";

import type { NewsItem } from "@/app/api/analyze/route";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

interface TopStory {
  title: string;
  summary: string;
  category: string;
  sentiment: string;
}

interface NewsCardProps {
  item: NewsItem;
  index: number;
  topStory?: TopStory;
}

const sentimentStyle: Record<string, string> = {
  긍정: "bg-emerald-50 text-emerald-700 border-emerald-200",
  중립: "bg-gray-50 text-gray-500 border-gray-200",
  부정: "bg-red-50 text-red-600 border-red-200",
};

const categoryStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";

export default function NewsCard({ item, index, topStory }: NewsCardProps) {
  const title = stripHtml(item.title);
  const description = stripHtml(item.description);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white/80 backdrop-blur-sm rounded-2xl border border-white/80 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-100 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        {/* Index badge */}
        <span className="flex-shrink-0 w-7 h-7 rounded-xl bg-gray-50 text-gray-400 text-xs font-black flex items-center justify-center mt-0.5 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors duration-150">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          {/* Badges + date */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {topStory?.category && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${categoryStyle}`}>
                {topStory.category}
              </span>
            )}
            {topStory?.sentiment && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${sentimentStyle[topStory.sentiment] ?? sentimentStyle["중립"]}`}>
                {topStory.sentiment}
              </span>
            )}
            <span className="text-xs text-gray-300 ml-auto">{formatDate(item.pubDate)}</span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-2 group-hover:text-indigo-700 transition-colors duration-150 line-clamp-2">
            {title}
          </h3>

          {/* AI summary or description */}
          {topStory?.summary ? (
            <p className="text-xs text-indigo-600/80 bg-indigo-50/70 rounded-xl px-3 py-2 leading-relaxed border border-indigo-100/60">
              {topStory.summary}
            </p>
          ) : (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{description}</p>
          )}
        </div>
      </div>
    </a>
  );
}
