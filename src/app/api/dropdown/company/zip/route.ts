import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { getDb } from "@/utils/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query")?.trim();
  const db = await getDb();
  let rows;
  if (query && query.length >= 2) {
    rows = await db.all(
      `
        SELECT DISTINCT zip FROM companies
        WHERE zip LIKE '%' || ? || '%' COLLATE NOCASE
        ORDER BY zip
        LIMIT 50
      `,
      [query]
    );
  } else {
    rows = await db.all(
      `
        SELECT DISTINCT zip FROM companies
        ORDER BY zip
        LIMIT 100
      `
    );
  }
  
  const options = rows.map((r: { zip: string }) => ({
    value: r.zip,
    label: r.zip,
  }));

  return NextResponse.json(options);
}
