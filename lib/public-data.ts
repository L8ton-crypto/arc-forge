import { getBoard } from "@/lib/db";
import { Task, ColumnId, Audience } from "@/lib/types";

// ---- Types shared across the public surfaces ----

export interface FlatTask {
  task: Task;
  status: ColumnId;
}

export interface PipelineStats {
  totalShipped: number;
  shippedThisWeek: number;
  shippedThisMonth: number;
  activeBuilds: number;
  backlogSize: number;
  lastShipDate: string | null;
  lastShipDaysAgo: number | null;
}

export interface ShippedItem {
  id: string;
  title: string;
  description: string;
  audience?: Audience;
  liveUrl?: string;
  repoUrl?: string;
  shippedAt?: string;
  tags: string[];
}

export interface InProgressItem {
  id: string;
  title: string;
  audience?: Audience;
  oneNightScope?: string;
  tags: string[];
}

export interface TimelineCard {
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

export interface WeekBucket {
  week: string;
  weekNumber: number;
  year: number;
  weekStart: string;
  weekEnd: string;
  counts: { total: number; shipped: number; inProgress: number; backlog: number };
  cards: TimelineCard[];
}

// ---- Constants used by routes and pages ----

const ONE_DAY = 24 * 60 * 60 * 1000;

const STATUS_ORDER: Record<string, number> = {
  complete: 0,
  review: 1,
  "in-progress": 2,
  requirements: 3,
  backlog: 4,
};

// ---- Pure utilities ----

export function deriveCardType(tags: string[]): string {
  if (tags.includes("app-idea")) return "app-idea";
  if (tags.includes("linkedin-hook")) return "linkedin-hook";
  if (tags.includes("appian-tip")) return "appian-tip";
  if (tags.includes("finance-tip")) return "finance-tip";
  if (tags.includes("enhancement")) return "enhancement";
  return "other";
}

export function extractWeekTag(tags: string[]): { week: string; weekNumber: number } | null {
  const match = tags.find((t) => /^trend-w\d+$/.test(t));
  if (!match) return null;
  const weekNumber = parseInt(match.replace("trend-w", ""), 10);
  return { week: `w${weekNumber}`, weekNumber };
}

export function isoWeekToDateRange(year: number, week: number): { start: string; end: string } {
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

function shippedTime(t: Task): number {
  const iso = t.shippedAt || t.updatedAt;
  const v = new Date(iso).getTime();
  return Number.isNaN(v) ? 0 : v;
}

// ---- Loader: fetch + flatten ----

export async function fetchFlatTasks(): Promise<FlatTask[] | null> {
  const columns = (await getBoard()) as Array<{ id: ColumnId; tasks: Task[] }> | null;
  if (!columns) return null;
  const flat: FlatTask[] = [];
  for (const col of columns) {
    for (const task of col.tasks) flat.push({ task, status: col.id });
  }
  return flat;
}

// ---- Projections ----

export function computePipelineStats(flat: FlatTask[]): PipelineStats {
  const completeTasks = flat.filter((f) => f.status === "complete").map((f) => f.task);
  const activeCount = flat.filter((f) => f.status === "in-progress" || f.status === "review").length;
  const backlogCount = flat.filter((f) => f.status === "backlog").length;
  const now = Date.now();
  const inWindow = (iso: string | undefined, days: number) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return false;
    return now - t <= days * ONE_DAY;
  };
  const shippedThisWeek = completeTasks.filter((t) => inWindow(t.shippedAt || t.updatedAt, 7)).length;
  const shippedThisMonth = completeTasks.filter((t) => inWindow(t.shippedAt || t.updatedAt, 30)).length;
  const sortedShipped = [...completeTasks].sort((a, b) => shippedTime(b) - shippedTime(a));
  const lastShipIso = sortedShipped[0]?.shippedAt || sortedShipped[0]?.updatedAt || null;
  const lastShipDaysAgo = lastShipIso
    ? Math.floor((now - new Date(lastShipIso).getTime()) / ONE_DAY)
    : null;

  return {
    totalShipped: completeTasks.length,
    shippedThisWeek,
    shippedThisMonth,
    activeBuilds: activeCount,
    backlogSize: backlogCount,
    lastShipDate: lastShipIso,
    lastShipDaysAgo,
  };
}

export function projectShipped(flat: FlatTask[], limit = 50): ShippedItem[] {
  const completeTasks = flat.filter((f) => f.status === "complete").map((f) => f.task);
  const sorted = [...completeTasks].sort((a, b) => shippedTime(b) - shippedTime(a));
  return sorted.slice(0, limit).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    audience: t.audience,
    liveUrl: t.liveUrl,
    repoUrl: t.repoUrl,
    shippedAt: t.shippedAt || t.updatedAt,
    tags: t.tags || [],
  }));
}

export function projectInProgress(flat: FlatTask[], limit = 8): InProgressItem[] {
  const activeTasks = flat
    .filter((f) => f.status === "in-progress" || f.status === "review")
    .map((f) => f.task);
  return activeTasks.slice(0, limit).map((t) => ({
    id: t.id,
    title: t.title,
    audience: t.audience,
    oneNightScope: t.oneNightScope,
    tags: t.tags || [],
  }));
}

export function projectWeeklyLineage(flat: FlatTask[], maxWeeks = 26): WeekBucket[] {
  const currentYear = new Date().getUTCFullYear();
  const bucketMap = new Map<number, WeekBucket>();

  for (const { task, status } of flat) {
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
    .slice(0, maxWeeks);

  for (const bucket of weeks) {
    bucket.cards.sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
  }

  return weeks;
}
