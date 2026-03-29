import { NextRequest, NextResponse } from "next/server";
import { getBoard, saveBoard } from "@/lib/db";
import { isAuthorized } from "@/lib/auth";

// POST /api/board/delete
// Body: { taskId: string } or { taskIds: string[] }
// Removes task(s) from any column

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const taskIds: string[] = body.taskIds || (body.taskId ? [body.taskId] : []);

    if (taskIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Missing taskId or taskIds",
      }, { status: 400 });
    }

    const columns = await getBoard() as any[] | null;
    if (!columns) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch board",
      }, { status: 500 });
    }

    const removed: string[] = [];
    const notFound: string[] = [];

    for (const id of taskIds) {
      let found = false;
      for (const col of columns) {
        const idx = col.tasks.findIndex((t: any) => t.id === id);
        if (idx !== -1) {
          col.tasks.splice(idx, 1);
          removed.push(id);
          found = true;
          break;
        }
      }
      if (!found) notFound.push(id);
    }

    if (removed.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No matching tasks found",
        notFound,
      }, { status: 404 });
    }

    const success = await saveBoard(columns);

    if (success) {
      return NextResponse.json({
        success: true,
        removed,
        notFound: notFound.length > 0 ? notFound : undefined,
        message: `Deleted ${removed.length} task(s)`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Database write failed",
      }, { status: 500 });
    }
  } catch (error) {
    console.error("POST /api/board/delete error:", error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
