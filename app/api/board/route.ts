import { NextRequest, NextResponse } from "next/server";
import { getBoard, saveBoard } from "@/lib/db";

export async function GET() {
  const columns = await getBoard();
  return NextResponse.json({ columns });
}

export async function POST(request: NextRequest) {
  const { columns } = await request.json();
  const success = await saveBoard(columns);
  
  if (success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ success: false, error: "Failed to save" }, { status: 500 });
  }
}
