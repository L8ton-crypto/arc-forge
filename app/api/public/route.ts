import { NextResponse } from "next/server";
import { getBoard } from "@/lib/db";
import { Task, ColumnId, Audience } from "@/lib/types";

// Cache for 5 minutes at the edge. Public data, doesn't need to be real-time.
export const revalidate = 300;

interface Column {
  id: ColumnId;
  title: string;
  tasks: Task[];
}

interface ShippedItem {
  id: string;
  title: string;
  description: string;
  audience?: Audience;
  liveUrl?: string;
  repoUrl?: string;
  shippedAt?: string;
  tags: string[];
}

interface InProgressItem {
  id: string;
  title: string;
  audience?: Audience;
  oneNightScope?: string;
  tags: string[];
}

export async function GET() {
  try {
    const columns = (await getBoard()) as Column[] | null;
    if (!columns) {
      return NextResponse.json({ error: "Board not initialised" }, { status: 503 });
    }

    const byId = (id: ColumnId) => columns.find((c) => c.id === id)?.tasks ?? [];
    const completeTasks = byId("complete");
    const inProgressTasks = byId("in-progress");
    const reviewTasks = byId("review");
    const backlogTasks = byId("backlog");

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const inWindow = (iso: string | undefined, days: number) => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return false;
      return now - t <= days * ONE_DAY;
    };

    const shippedThisWeek = completeTasks.filter((t) => inWindow(t.shippedAt || t.updatedAt, 7)).length;
    const shippedThisMonth = completeTasks.filter((t) => inWindow(t.shippedAt || t.updatedAt, 30)).length;

    const sortedShipped = [...completeTasks].sort((a, b) => {
      const aT = new Date(a.shippedAt || a.updatedAt).getTime();
      const bT = new Date(b.shippedAt || b.updatedAt).getTime();
      return bT - aT;
    });

    const lastShipIso = sortedShipped[0]?.shippedAt || sortedShipped[0]?.updatedAt || null;
    const lastShipDaysAgo = lastShipIso
      ? Math.floor((now - new Date(lastShipIso).getTime()) / ONE_DAY)
      : null;

    const shipped: ShippedItem[] = sortedShipped.slice(0, 50).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      audience: t.audience,
      liveUrl: t.liveUrl,
      repoUrl: t.repoUrl,
      shippedAt: t.shippedAt || t.updatedAt,
      tags: t.tags || [],
    }));

    const inProgress: InProgressItem[] = [...inProgressTasks, ...reviewTasks]
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        title: t.title,
        audience: t.audience,
        oneNightScope: t.oneNightScope,
        tags: t.tags || [],
      }));

    return NextResponse.json({
      stats: {
        totalShipped: completeTasks.length,
        shippedThisWeek,
        shippedThisMonth,
        activeBuilds: inProgressTasks.length + reviewTasks.length,
        backlogSize: backlogTasks.length,
        lastShipDate: lastShipIso,
        lastShipDaysAgo,
      },
      shipped,
      inProgress,
    });
  } catch (err) {
    console.error("GET /api/public error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
