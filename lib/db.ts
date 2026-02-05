import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS board (
      id SERIAL PRIMARY KEY,
      data JSONB,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function getBoard(): Promise<unknown[] | null> {
  try {
    await initDb();
    const rows = await sql`SELECT data FROM board ORDER BY updated_at DESC LIMIT 1`;
    if (rows.length > 0 && rows[0].data) {
      return rows[0].data as unknown[];
    }
    return null;
  } catch (error) {
    console.error("Error reading board:", error);
    return null;
  }
}

export async function saveBoard(data: unknown[]): Promise<boolean> {
  try {
    await initDb();
    
    // Check if any rows exist
    const existing = await sql`SELECT id FROM board LIMIT 1`;
    
    if (existing.length > 0) {
      // Update existing row
      await sql`
        UPDATE board 
        SET data = ${JSON.stringify(data)}, updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    } else {
      // Insert new row
      await sql`
        INSERT INTO board (data, updated_at) 
        VALUES (${JSON.stringify(data)}, NOW())
      `;
    }
    
    return true;
  } catch (error) {
    console.error("Error saving board:", error);
    return false;
  }
}
