import { NextRequest, NextResponse } from "next/server";
import { getBoard, saveBoard } from "@/lib/db";
import { isAuthorized } from "@/lib/auth";

interface Task {
  id?: string;
  title: string;
  description?: string;
  priority?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

// POST /api/board/add
// Body: { task: {...}, column?: string }
// Adds a new task to the specified column (default: backlog)

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { task, column = "backlog" } = await request.json();
    
    if (!task || !task.title) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing task or task.title" 
      }, { status: 400 });
    }
    
    const columns = await getBoard() as Column[] | null;
    if (!columns) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to fetch board" 
      }, { status: 500 });
    }
    
    // Find target column
    const columnIndex = columns.findIndex((c: any) => c.id === column);
    if (columnIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: `Column ${column} not found` 
      }, { status: 404 });
    }
    
    // Generate task ID if not provided
    if (!task.id) {
      const allTasks = columns.flatMap((c: any) => c.tasks);
      const maxId = allTasks.reduce((max: number, t: any) => {
        const num = parseInt(t.id?.replace('task-', '') || '0');
        return num > max ? num : max;
      }, 0);
      task.id = `task-${maxId + 1}`;
    }
    
    // Set defaults
    const today = new Date().toISOString().split('T')[0];
    task.createdAt = task.createdAt || today;
    task.updatedAt = today;
    task.priority = task.priority || "medium";
    task.tags = task.tags || [];
    
    // Check for duplicate ID
    const exists = columns.some((c: any) => 
      c.tasks.some((t: any) => t.id === task.id)
    );
    if (exists) {
      return NextResponse.json({ 
        success: false, 
        error: `Task with ID ${task.id} already exists` 
      }, { status: 409 });
    }
    
    // Add to column
    columns[columnIndex].tasks.push(task);
    
    // Save
    const success = await saveBoard(columns);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        taskId: task.id,
        message: `Added ${task.title} to ${column}` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Database write failed" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("POST /api/board/add error:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
