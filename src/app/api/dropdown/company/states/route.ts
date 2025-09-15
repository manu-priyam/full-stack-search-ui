import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { getDb } from "@/utils/db";

export async function GET() {
  const db = await getDb();
  const rows = await db.all("SELECT DISTINCT state FROM companies WHERE state IS NOT NULL");

  const options = rows.map((r) => ({ value: r.state, label: r.state }));
  return NextResponse.json(options);
}
