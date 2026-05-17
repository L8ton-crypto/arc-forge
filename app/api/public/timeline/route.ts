import { NextResponse } from "next/server";
import { getBoard } from "@/lib/db";
import { Task, ColumnId, Audience } from "@/lib/types";

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

export async function GET() {
  try {
    const columns = (await getBoard()) as Column[] | null;
    if (!columns) {
      return NextResponse.json({ error: "Board not initialised" }, { status: 503 });
    }

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

    return NextResponse.json({
      weeks,
      meta: {
        totalWeeks: weeks.length,
        oldestWeek: weeks[weeks.length - 1]?.weekNumber ?? null,
        newestWeek: weeks[0]?.weekNumber ?? null,
      },
    });
  } catch (err) {
    console.error("GET /api/public/timeline error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
