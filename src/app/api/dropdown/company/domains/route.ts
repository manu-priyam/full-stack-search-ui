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
        SELECT domain FROM (SELECT domain FROM companies UNION SELECT domain FROM indexed_domains) 
        WHERE domain LIKE '%' || ? || '%' COLLATE NOCASE
        ORDER BY domain
        LIMIT 50
      `,
      [query]
    );
  } else {
    rows = await db.all(
      `
        SELECT domain FROM companies UNION SELECT domain FROM indexed_domains 
        ORDER BY domain
        LIMIT 100
      `
    );
  }
  
  const options = rows.map((r: { domain: string }) => ({
    value: r.domain,
    label: r.domain,
  }));

  return NextResponse.json(options);
}
