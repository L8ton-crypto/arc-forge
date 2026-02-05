import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BOARD_FILE = path.join(DATA_DIR, "board.json");

export async function GET() {
  try {
    if (!existsSync(BOARD_FILE)) {
      return NextResponse.json({ columns: null });
    }
    const data = await readFile(BOARD_FILE, "utf-8");
    return NextResponse.json({ columns: JSON.parse(data) });
  } catch (error) {
    console.error("Error reading board:", error);
    return NextResponse.json({ columns: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { columns } = await request.json();
    
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }
    
    await writeFile(BOARD_FILE, JSON.stringify(columns, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving board:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
