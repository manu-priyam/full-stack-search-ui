import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { getDb } from "@/utils/db";

export async function GET() {
  const db = await getDb();
  const rows = await db.all("SELECT DISTINCT category FROM companies WHERE category IS NOT NULL");

  const options = rows.map((r) => ({ value: r.category, label: r.category }));
  return NextResponse.json(options);
}
