import { NextRequest, NextResponse } from "next/server";
import { getBoard, saveBoard } from "@/lib/db";
import { isAuthorized } from "@/lib/auth";

export async function GET() {
  try {
    const columns = await getBoard();
    return NextResponse.json({ columns });
  } catch (error) {
    console.error("GET /api/board error:", error);
    return NextResponse.json({ columns: null, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Require authentication for writes
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { columns } = body;
    
    if (!columns || !Array.isArray(columns)) {
      return NextResponse.json({ success: false, error: "Invalid columns data" }, { status: 400 });
    }
    
    const success = await saveBoard(columns);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "Database write failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("POST /api/board error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
