import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { getDb } from "@/utils/db";

export async function GET() {
  const db = await getDb();
  const rows = await db.all("SELECT DISTINCT country FROM companies WHERE country IS NOT NULL");

  const options = rows.map((r) => ({ value: r.country, label: r.country }));
  return NextResponse.json(options);
}
