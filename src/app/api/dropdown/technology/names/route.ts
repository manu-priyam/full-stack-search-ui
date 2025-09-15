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
        SELECT DISTINCT technology_name FROM domain_technologies
        WHERE technology_name LIKE '%' || ? || '%' COLLATE NOCASE
        ORDER BY technology_name
        LIMIT 50
      `,
      [query]
    );
  } else {
    rows = await db.all(
      `
        SELECT DISTINCT technology_name FROM domain_technologies
        ORDER BY technology_name
        LIMIT 100
      `
    );
  }
  
  const options = rows.map((r: { technology_name: string }) => ({
    value: r.technology_name,
    label: r.technology_name,
  }));

  return NextResponse.json(options);
}
