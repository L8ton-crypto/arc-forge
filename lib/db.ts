import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS board (
      id SERIAL PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  
  // Ensure there's at least one row
  const rows = await sql`SELECT COUNT(*) as count FROM board`;
  if (parseInt(rows[0].count) === 0) {
    await sql`INSERT INTO board (data) VALUES (NULL)`;
  }
}

export async function getBoard(): Promise<unknown[] | null> {
  try {
    await initDb();
    const rows = await sql`SELECT data FROM board ORDER BY id DESC LIMIT 1`;
    return rows[0]?.data || null;
  } catch (error) {
    console.error("Error reading board:", error);
    return null;
  }
}

export async function saveBoard(data: unknown[]): Promise<boolean> {
  try {
    await initDb();
    // Update the single row or insert if empty
    const result = await sql`
      UPDATE board 
      SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
      WHERE id = (SELECT id FROM board ORDER BY id DESC LIMIT 1)
    `;
    
    if (result.length === 0) {
      await sql`INSERT INTO board (data) VALUES (${JSON.stringify(data)}::jsonb)`;
    }
    
    return true;
  } catch (error) {
    console.error("Error saving board:", error);
    return false;
  }
}
