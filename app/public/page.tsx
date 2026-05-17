import { AUDIENCE_CONFIG } from "@/lib/types";
import {
  fetchFlatTasks,
  computePipelineStats,
  projectShipped,
  projectInProgress,
  PipelineStats,
  ShippedItem,
  InProgressItem,
} from "@/lib/public-data";

export const revalidate = 300;

interface PublicData {
  stats: PipelineStats;
  shipped: ShippedItem[];
  inProgress: InProgressItem[];
}

async function loadPublicData(): Promise<PublicData | null> {
  const flat = await fetchFlatTasks();
  if (!flat) return null;
  return {
    stats: computePipelineStats(flat),
    shipped: projectShipped(flat, 50),
    inProgress: projectInProgress(flat, 8),
  };
}

function formatRelativeDays(days: number | null): string {
  if (days === null) return "never";
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default async function PublicDashboard() {
  const data = await loadPublicData();

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-300">
        <div className="text-center">
          <p className="text-xl mb-2">Pipeline data unavailable</p>
          <p className="text-sm text-gray-500">Try again in a minute.</p>
        </div>
      </main>
    );
  }

  const { stats, shipped, inProgress } = data;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-black text-gray-100">
      {/* Hero */}
      <section className="border-b border-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
          <div className="inline-block text-[11px] uppercase tracking-[0.2em] text-blue-400 font-medium mb-4">
            Autonomous overnight pipeline
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-none">
            <span className="text-white">{stats.totalShipped}</span>
            <span className="text-gray-500"> apps shipped</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mb-8 leading-relaxed">
            Every app on this page was scoped by Sunday trend research, built overnight by an
            autonomous pipeline, and deployed to production. No mockups. Click any link to see
            the live app.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-gray-300">
            <div>
              <span className="text-white font-semibold text-2xl mr-1">{stats.shippedThisWeek}</span>
              <span className="text-gray-500">shipped this week</span>
            </div>
            <div>
              <span className="text-white font-semibold text-2xl mr-1">{stats.activeBuilds}</span>
              <span className="text-gray-500">building now</span>
            </div>
            <div>
              <span className="text-white font-semibold text-2xl mr-1">{stats.backlogSize}</span>
              <span className="text-gray-500">in backlog</span>
            </div>
            <div>
              <span className="text-gray-500 mr-1">Last ship:</span>
              <span className="text-white font-medium">{formatRelativeDays(stats.lastShipDaysAgo)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Active builds strip */}
      <section className="border-b border-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">
              Building now
            </h2>
            <span className="text-xs text-gray-600">Next research sweep: Sunday</span>
          </div>
          {inProgress.length === 0 ? (
            <div className="text-gray-500 text-sm italic">
              Pipeline idle. Next research sweep Sunday.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {inProgress.map((t) => {
                const audience = t.audience ? AUDIENCE_CONFIG[t.audience] : null;
                return (
                  <div
                    key={t.id}
                    className="bg-gray-900/60 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-100 leading-tight">{t.title}</h3>
                      {audience && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap ${audience.bg} ${audience.text} ${audience.border} font-medium`}
                        >
                          {audience.label}
                        </span>
                      )}
                    </div>
                    {t.oneNightScope && (
                      <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                        {t.oneNightScope}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Shipped grid */}
      <section>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">
              Shipped {stats.totalShipped > 50 && <span className="normal-case tracking-normal">— showing last 50</span>}
            </h2>
            <a href="/public/timeline" className="text-xs text-blue-400 hover:text-blue-300">
              View timeline by week →
            </a>
          </div>
          {shipped.length === 0 ? (
            <div className="text-gray-500 text-sm italic">
              Nothing shipped yet. Stay tuned.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shipped.map((app) => {
                const audience = app.audience ? AUDIENCE_CONFIG[app.audience] : null;
                const shippedDate = app.shippedAt ? new Date(app.shippedAt) : null;
                return (
                  <div
                    key={app.id}
                    className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:bg-gray-900/80 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-base font-semibold text-white leading-tight group-hover:text-blue-300 transition-colors">
                        {app.title}
                      </h3>
                      {audience && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${audience.bg} ${audience.text} ${audience.border} font-medium`}
                        >
                          {audience.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed min-h-[3.5rem]">
                      {app.description}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex gap-2">
                        {app.liveUrl && (
                          <a
                            href={app.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-300 hover:text-emerald-200 font-medium"
                          >
                            Live →
                          </a>
                        )}
                        {app.repoUrl && (
                          <a
                            href={app.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-200"
                          >
                            Code
                          </a>
                        )}
                      </div>
                      {shippedDate && (
                        <span className="text-gray-600">
                          {shippedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-gray-500">
          <div>
            <span className="text-gray-400 font-medium">Arc Forge</span> — Live pipeline
          </div>
          <div className="flex gap-4">
            <a href="/" className="hover:text-gray-300">Kanban</a>
            <span className="text-gray-700">|</span>
            <a href="/public/timeline" className="hover:text-gray-300">Timeline</a>
            <span className="text-gray-700">|</span>
            <a href="https://github.com/L8ton-crypto" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
