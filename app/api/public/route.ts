import { NextResponse } from "next/server";
import {
  fetchFlatTasks,
  computePipelineStats,
  projectShipped,
  projectInProgress,
} from "@/lib/public-data";

export const revalidate = 300;

export async function GET() {
  try {
    const flat = await fetchFlatTasks();
    if (!flat) {
      return NextResponse.json({ error: "Board not initialised" }, { status: 503 });
    }
    return NextResponse.json({
      stats: computePipelineStats(flat),
      shipped: projectShipped(flat, 50),
      inProgress: projectInProgress(flat, 8),
    });
  } catch (err) {
    console.error("GET /api/public error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
