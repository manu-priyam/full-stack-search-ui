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
        SELECT DISTINCT city FROM companies
        WHERE city LIKE '%' || ? || '%' COLLATE NOCASE
        ORDER BY city
        LIMIT 50
      `,
      [query]
    );
  } else {
    rows = await db.all(
      `
        SELECT DISTINCT city FROM companies
        ORDER BY city
        LIMIT 100
      `
    );
  }
  
  const options = rows.map((r: { city: string }) => ({
    value: r.city,
    label: r.city,
  }));

  return NextResponse.json(options);
}
