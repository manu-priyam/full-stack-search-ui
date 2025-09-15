import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

let dbInstance: Database | null = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: "./builtwith.db",
      driver: sqlite3.Database,
    });
  }
  return dbInstance;
}
