import { NextResponse } from "next/server";
import { fetchFlatTasks, projectWeeklyLineage } from "@/lib/public-data";

export const revalidate = 300;

export async function GET() {
  try {
    const flat = await fetchFlatTasks();
    if (!flat) {
      return NextResponse.json({ error: "Board not initialised" }, { status: 503 });
    }
    const weeks = projectWeeklyLineage(flat, 26);
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
