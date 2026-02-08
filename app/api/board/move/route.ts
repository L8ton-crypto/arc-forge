import { NextRequest, NextResponse } from "next/server";
import { getBoard, saveBoard } from "@/lib/db";
import { isAuthorized } from "@/lib/auth";

interface Task {
  id: string;
  title: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

// POST /api/board/move
// Body: { taskId: string, toColumn: string }
// Moves a task from its current column to the target column

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { taskId, toColumn } = await request.json();
    
    if (!taskId || !toColumn) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing taskId or toColumn" 
      }, { status: 400 });
    }
    
    const columns = await getBoard() as Column[] | null;
    if (!columns) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to fetch board" 
      }, { status: 500 });
    }
    
    // Find the task and its current column
    let task = null;
    let fromColumnIndex = -1;
    
    for (let i = 0; i < columns.length; i++) {
      const found = columns[i].tasks.find((t: any) => t.id === taskId);
      if (found) {
        task = found;
        fromColumnIndex = i;
        break;
      }
    }
    
    if (!task || fromColumnIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: `Task ${taskId} not found` 
      }, { status: 404 });
    }
    
    // Find target column
    const toColumnIndex = columns.findIndex((c: any) => c.id === toColumn);
    if (toColumnIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: `Column ${toColumn} not found` 
      }, { status: 404 });
    }
    
    // Remove from source column
    columns[fromColumnIndex].tasks = columns[fromColumnIndex].tasks.filter(
      (t: any) => t.id !== taskId
    );
    
    // Update task timestamp
    task.updatedAt = new Date().toISOString().split('T')[0];
    
    // Add to target column
    columns[toColumnIndex].tasks.push(task);
    
    // Save
    const success = await saveBoard(columns);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Moved ${taskId} to ${toColumn}` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Database write failed" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("POST /api/board/move error:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
