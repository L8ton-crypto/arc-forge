import { getBoard } from "@/lib/db";
import { AUDIENCE_CONFIG, Audience, ColumnId, Task } from "@/lib/types";

export const revalidate = 300;

interface Column {
  id: ColumnId;
  title: string;
  tasks: Task[];
}

interface TimelineCard {
  id: string;
  title: string;
  status: ColumnId;
  audience?: Audience;
  liveUrl?: string;
  repoUrl?: string;
  sourceSignal?: string;
  oneNightScope?: string;
  shippedAt?: string;
  tags: string[];
  cardType: string;
}

interface WeekBucket {
  week: string;
  weekNumber: number;
  year: number;
  weekStart: string;
  weekEnd: string;
  counts: {
    total: number;
    shipped: number;
    inProgress: number;
    backlog: number;
  };
  cards: TimelineCard[];
}

interface TimelineData {
  weeks: WeekBucket[];
  meta: { totalWeeks: number; oldestWeek: number | null; newestWeek: number | null };
}

function isoWeekToDateRange(year: number, week: number): { start: string; end: string } {
  // ISO 8601: week 1 is the week containing the first Thursday of the year
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const targetMonday = new Date(week1Monday);
  targetMonday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  const targetSunday = new Date(targetMonday);
  targetSunday.setUTCDate(targetMonday.getUTCDate() + 6);
  const iso = (d: Date) => d.toISOString().split("T")[0];
  return { start: iso(targetMonday), end: iso(targetSunday) };
}

function deriveCardType(tags: string[]): string {
  if (tags.includes("app-idea")) return "app-idea";
  if (tags.includes("linkedin-hook")) return "linkedin-hook";
  if (tags.includes("appian-tip")) return "appian-tip";
  if (tags.includes("finance-tip")) return "finance-tip";
  if (tags.includes("enhancement")) return "enhancement";
  return "other";
}

function extractWeekTag(tags: string[]): { week: string; weekNumber: number } | null {
  const match = tags.find((t) => /^trend-w\d+$/.test(t));
  if (!match) return null;
  const weekNumber = parseInt(match.replace("trend-w", ""), 10);
  return { week: `w${weekNumber}`, weekNumber };
}

async function loadTimeline(): Promise<TimelineData | null> {
  const columns = (await getBoard()) as Column[] | null;
  if (!columns) return null;

  const allTasks: Array<{ task: Task; status: ColumnId }> = [];
  for (const col of columns) {
    for (const task of col.tasks) {
      allTasks.push({ task, status: col.id });
    }
  }

  const currentYear = new Date().getUTCFullYear();
  const bucketMap = new Map<number, WeekBucket>();

  for (const { task, status } of allTasks) {
    const weekInfo = extractWeekTag(task.tags || []);
    if (!weekInfo) continue;

    const range = isoWeekToDateRange(currentYear, weekInfo.weekNumber);
    const bucket = bucketMap.get(weekInfo.weekNumber) ?? {
      week: weekInfo.week,
      weekNumber: weekInfo.weekNumber,
      year: currentYear,
      weekStart: range.start,
      weekEnd: range.end,
      counts: { total: 0, shipped: 0, inProgress: 0, backlog: 0 },
      cards: [],
    };

    bucket.counts.total += 1;
    if (status === "complete") bucket.counts.shipped += 1;
    else if (status === "in-progress" || status === "review") bucket.counts.inProgress += 1;
    else if (status === "backlog" || status === "requirements") bucket.counts.backlog += 1;

    bucket.cards.push({
      id: task.id,
      title: task.title,
      status,
      audience: task.audience,
      liveUrl: task.liveUrl,
      repoUrl: task.repoUrl,
      sourceSignal: task.sourceSignal,
      oneNightScope: task.oneNightScope,
      shippedAt: task.shippedAt,
      tags: task.tags || [],
      cardType: deriveCardType(task.tags || []),
    });

    bucketMap.set(weekInfo.weekNumber, bucket);
  }

  const weeks = [...bucketMap.values()]
    .sort((a, b) => b.weekNumber - a.weekNumber)
    .slice(0, 26);

  const statusOrder: Record<string, number> = {
    complete: 0,
    review: 1,
    "in-progress": 2,
    requirements: 3,
    backlog: 4,
  };
  for (const bucket of weeks) {
    bucket.cards.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
  }

  return {
    weeks,
    meta: {
      totalWeeks: weeks.length,
      oldestWeek: weeks[weeks.length - 1]?.weekNumber ?? null,
      newestWeek: weeks[0]?.weekNumber ?? null,
    },
  };
}

const STATUS_LABEL: Record<ColumnId, string> = {
  backlog: "Backlog",
  requirements: "Requirements",
  "in-progress": "In Progress",
  review: "Review",
  complete: "Shipped",
};

const STATUS_COLOR: Record<ColumnId, { bg: string; text: string; border: string }> = {
  backlog: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/30" },
  requirements: { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/30" },
  "in-progress": { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/30" },
  review: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30" },
  complete: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30" },
};

const CARD_TYPE_LABEL: Record<string, string> = {
  "app-idea": "App idea",
  "linkedin-hook": "LinkedIn hook",
  "appian-tip": "Appian tip",
  "finance-tip": "Finance tip",
  enhancement: "Enhancement",
  other: "Other",
};

function formatRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const month = (d: Date) => d.toLocaleString("en-GB", { month: "short" });
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${month(e)} ${e.getFullYear()}`;
  }
  return `${s.getDate()} ${month(s)} – ${e.getDate()} ${month(e)} ${e.getFullYear()}`;
}

export default async function TimelinePage() {
  const data = await loadTimeline();

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-300">
        <div className="text-center">
          <p className="text-xl mb-2">Timeline data unavailable</p>
          <p className="text-sm text-gray-500">Try again in a minute.</p>
        </div>
      </main>
    );
  }

  if (data.weeks.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-black text-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <p className="text-xl mb-2">No trend-tagged cards yet</p>
          <p className="text-sm text-gray-500">Cards posted by the Sunday research run will appear here, grouped by week.</p>
          <a href="/public" className="inline-block mt-6 text-blue-400 hover:text-blue-300">← Back to pipeline</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-black text-gray-100">
      {/* Header */}
      <section className="border-b border-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
          <div className="text-[11px] uppercase tracking-[0.2em] text-blue-400 font-medium mb-3">
            Research to ship, week by week
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Pipeline timeline
          </h1>
          <p className="text-gray-400 max-w-2xl leading-relaxed">
            Every Sunday a research run drops a batch of cards on the kanban. Each card carries a{" "}
            <code className="text-xs bg-gray-800 px-1.5 py-0.5 rounded">trend-w&lt;N&gt;</code> tag.
            This page groups everything by week, so you can see what was proposed, what shipped,
            what stalled.
          </p>
          <div className="mt-6">
            <a href="/public" className="text-sm text-blue-400 hover:text-blue-300">
              ← Back to live pipeline
            </a>
          </div>
        </div>
      </section>

      {/* Weeks */}
      <section>
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-3">
          {data.weeks.map((wk, idx) => (
            <details
              key={wk.weekNumber}
              open={idx < 2}
              className="group bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden"
            >
              <summary className="cursor-pointer list-none px-5 py-4 hover:bg-gray-900/90 transition-colors">
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-semibold text-white">W{wk.weekNumber}</span>
                    <span className="text-sm text-gray-500">{formatRange(wk.weekStart, wk.weekEnd)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">{wk.counts.total} cards</span>
                    {wk.counts.shipped > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
                        {wk.counts.shipped} shipped
                      </span>
                    )}
                    {wk.counts.inProgress > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 font-medium">
                        {wk.counts.inProgress} building
                      </span>
                    )}
                    {wk.counts.backlog > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/30 font-medium">
                        {wk.counts.backlog} backlog
                      </span>
                    )}
                    <span className="text-gray-600 ml-2 group-open:rotate-90 transition-transform inline-block">›</span>
                  </div>
                </div>
              </summary>
              <div className="px-5 pb-5 pt-2 border-t border-gray-800/60">
                <ul className="divide-y divide-gray-800/60">
                  {wk.cards.map((card) => {
                    const audience = card.audience ? AUDIENCE_CONFIG[card.audience] : null;
                    const status = STATUS_COLOR[card.status];
                    return (
                      <li key={card.id} className="py-3 flex items-start gap-3 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${status.bg} ${status.text} ${status.border} font-medium mt-0.5`}
                        >
                          {STATUS_LABEL[card.status]}
                        </span>
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm text-gray-100 font-medium">{card.title}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                              {CARD_TYPE_LABEL[card.cardType] || card.cardType}
                            </span>
                            {audience && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full border ${audience.bg} ${audience.text} ${audience.border} font-medium`}
                              >
                                {audience.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px]">
                            {card.liveUrl && (
                              <a
                                href={card.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-300 hover:text-emerald-200 font-medium"
                              >
                                Live →
                              </a>
                            )}
                            {card.repoUrl && (
                              <a
                                href={card.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-200"
                              >
                                Code
                              </a>
                            )}
                            {card.sourceSignal && /^https?:\/\//.test(card.sourceSignal) && (
                              <a
                                href={card.sourceSignal}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                Source
                              </a>
                            )}
                            {card.shippedAt && card.status === "complete" && (
                              <span className="text-gray-600">
                                shipped {new Date(card.shippedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-gray-500">
          <div>
            <span className="text-gray-400 font-medium">Arc Forge</span> — Pipeline timeline
          </div>
          <div className="flex gap-4">
            <a href="/public" className="hover:text-gray-300">Pipeline</a>
            <span className="text-gray-700">|</span>
            <a href="/" className="hover:text-gray-300">Kanban</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
