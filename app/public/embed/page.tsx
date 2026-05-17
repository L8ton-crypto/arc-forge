import type { Metadata } from "next";
import { fetchFlatTasks, computeEmbedSummary, EmbedSummary } from "@/lib/public-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "L8 — Autonomous Pipeline (live)",
  description: "Apps shipped via autonomous overnight pipeline. Live count and links.",
  openGraph: {
    title: "L8 — Autonomous Pipeline",
    description: "Apps shipped via autonomous overnight pipeline. Live receipts.",
    type: "website",
    url: "https://arc-forge-rho.vercel.app/public/embed",
    siteName: "Arc Forge",
  },
  twitter: {
    card: "summary_large_image",
    title: "L8 — Autonomous Pipeline",
    description: "Apps shipped via autonomous overnight pipeline. Live receipts.",
  },
};

async function fetchSummary(): Promise<EmbedSummary | null> {
  const flat = await fetchFlatTasks();
  if (!flat) return null;
  return computeEmbedSummary(flat);
}

function formatRelativeDays(days: number | null): string {
  if (days === null) return "no ships yet";
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default async function EmbedPage() {
  const summary = await fetchSummary();

  if (!summary) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-300 p-4">
        <p className="text-sm">Pipeline data unavailable</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-black text-gray-100 flex items-center justify-center p-4">
      <a
        href="/public"
        className="block w-full max-w-[600px] bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors no-underline text-inherit"
        style={{ minHeight: "150px" }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-medium mb-1">
              Autonomous overnight pipeline
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-white leading-none">
              {summary.totalShipped} <span className="text-gray-500 font-medium text-2xl sm:text-3xl">apps shipped</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Last ship</div>
            <div className="text-sm text-emerald-300 font-medium">{formatRelativeDays(summary.lastShipDaysAgo)}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
          <span><span className="text-white font-semibold">{summary.shippedThisWeek}</span> this week</span>
          <span><span className="text-white font-semibold">{summary.activeBuilds}</span> building</span>
          <span><span className="text-white font-semibold">{summary.backlogSize}</span> in backlog</span>
        </div>

        {summary.recentTitles.length > 0 && (
          <div className="text-[11px] text-gray-500 truncate">
            Recent: {summary.recentTitles.join(" · ")}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-800 text-[10px] text-gray-500 flex items-center justify-between">
          <span>arc-forge-rho.vercel.app/public</span>
          <span className="text-blue-400">View pipeline →</span>
        </div>
      </a>
    </main>
  );
}
