import { NextRequest, NextResponse } from "next/server";
import { getBoard, saveBoard } from "@/lib/db";
import { isAuthorized } from "@/lib/auth";

interface Task {
  id: string;
  [key: string]: unknown;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

// POST /api/board/update
// Body: { taskId: string, updates: {...} }
// Updates specific fields of a task without moving it

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { taskId, updates } = await request.json();
    
    if (!taskId || !updates) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing taskId or updates" 
      }, { status: 400 });
    }
    
    const columns = await getBoard() as Column[] | null;
    if (!columns) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to fetch board" 
      }, { status: 500 });
    }
    
    // Find the task
    let found = false;
    for (const column of columns) {
      const taskIndex = column.tasks.findIndex((t: any) => t.id === taskId);
      if (taskIndex !== -1) {
        // Apply updates (but protect id and createdAt)
        const { id: _id, createdAt: _createdAt, ...safeUpdates } = updates;
        column.tasks[taskIndex] = {
          ...column.tasks[taskIndex],
          ...safeUpdates,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        found = true;
        break;
      }
    }
    
    if (!found) {
      return NextResponse.json({ 
        success: false, 
        error: `Task ${taskId} not found` 
      }, { status: 404 });
    }
    
    // Save
    const success = await saveBoard(columns);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Updated ${taskId}` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Database write failed" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("POST /api/board/update error:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
