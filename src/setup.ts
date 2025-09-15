import fs from "fs";
import path from "path";
import axios from "axios";
import unzipper from "unzipper";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DATA_URL = "https://dummy-url/sample-data.zip";
const TMP_DIR = path.join(process.cwd(), "tmp");
const DB_PATH = path.join(process.cwd(), "builtwith.db");

async function downloadAndUnzip(): Promise<void> {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

  const zipPath = path.join(TMP_DIR, "sample-data.zip");
  console.log("Downloading dataset...");
  const response = await axios.get(DATA_URL, { responseType: "arraybuffer" });
  fs.writeFileSync(zipPath, response.data);

  console.log("Unzipping dataset...");
  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: TMP_DIR }))
    .promise();
}

async function setupDatabase() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  // Drop old tables
  await db.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS technology_subcategories;
    DROP TABLE IF EXISTS technologies;
    DROP TABLE IF EXISTS domain_technologies;
    DROP TABLE IF EXISTS indexed_domains;
    DROP TABLE IF EXISTS contacts;
    DROP TABLE IF EXISTS people;
    DROP TABLE IF EXISTS companies;
    PRAGMA foreign_keys = ON;
  `);

  // Create schema
  await db.exec(`
    CREATE TABLE companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      name TEXT,
      category TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      zip TEXT
    );
    CREATE INDEX idx_companies_domain ON companies(domain);
    CREATE INDEX idx_companies_category ON companies(category);
    CREATE INDEX idx_companies_country ON companies(country);
    CREATE INDEX idx_companies_name ON companies(name);
    CREATE INDEX idx_companies_city ON companies(city);
    CREATE INDEX idx_companies_state ON companies(state);
    CREATE INDEX idx_companies_zip ON companies(zip);

    CREATE TABLE people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id),
      name TEXT,
      title TEXT
    );
    CREATE INDEX idx_people_company ON people(company_id);

    CREATE TABLE contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id),
      type TEXT,
      value TEXT
    );
    CREATE INDEX idx_contacts_company ON contacts(company_id);

    CREATE TABLE indexed_domains (
      domain TEXT NOT NULL,
      spend INTEGER,
      first_indexed DATE,
      last_indexed DATE
    );
    CREATE INDEX idx_indexed_domains_domain ON indexed_domains(domain);

    CREATE TABLE domain_technologies (
      domain TEXT NOT NULL,
      subdomain TEXT,
      technology_name TEXT NOT NULL,
      first_detected DATE,
      last_detected DATE
    );
    CREATE INDEX idx_domain_technologies_domain ON domain_technologies(domain);
    CREATE INDEX idx_domain_technologies_tech ON domain_technologies(technology_name);

    CREATE TABLE technologies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      parent TEXT,
      category TEXT,
      premium TEXT,
      description TEXT,
      link TEXT,
      trends_link TEXT,
      first_added DATE,
      ticker TEXT,
      exchange TEXT,
      public_company_type TEXT,
      public_company_name TEXT
    );
    CREATE INDEX idx_technologies_name ON technologies(name);
    CREATE INDEX idx_technologies_category ON technologies(category);

    CREATE TABLE technology_subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      technology_id INTEGER NOT NULL REFERENCES technologies(id),
      subcategory TEXT NOT NULL
    );
    CREATE INDEX idx_tech_subcategories_sub ON technology_subcategories(subcategory);
  `);

  return db;
}

async function parseNDJsonLines(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  let raw = buffer.toString("utf16le");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const cleaned = raw.replace(/\0/g, "").replace(/\r\n/g, "\n");
  const lines = cleaned.split("\n").filter(line => line.trim() !== "");
  return lines.map(line => JSON.parse(line));
}

async function parseTechIndex(filePath: string) {
  const rawData = fs.readFileSync(filePath, "utf8");
  const cleanedData = rawData.replace(/,\s*]$/, "]");
  return JSON.parse(cleanedData);
}

async function populateDatabase(db: any) {
  const metaData = await parseNDJsonLines(path.join(TMP_DIR, "metaData.sample.json"));
  console.log(`Parsed ${metaData.length} rows from metaData.sample.json`);
  const techData = await parseNDJsonLines(path.join(TMP_DIR, "techData.sample.json"));
  console.log(`Parsed ${techData.length} rows from techData.sample.json`);
  const techIndex = await parseTechIndex(path.join(TMP_DIR, "techIndex.sample.json"));
  console.log(`Parsed ${techIndex.length} rows from techIndex.sample.json`);

  // Insert technologies
  for (const tech of techIndex) {
    const result = await db.run(
      `INSERT INTO technologies
        (name, parent, category, premium, description, link, trends_link, first_added, ticker, exchange, public_company_type, public_company_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tech.Name, tech.Parent, tech.Category, tech.Premium, tech.Description,
        tech.Link, tech.TrendsLink, tech.FirstAdded, tech.Ticker, tech.Exchange,
        tech.PublicCompanyType, tech.PublicCompanyName
      ]
    );

    if (tech.SubCategories) {
      for (const sub of tech.SubCategories) {
        await db.run(
          `INSERT INTO technology_subcategories (technology_id, subcategory) VALUES (?, ?)`,
          [result.lastID, sub]
        );
      }
    }
  }

  // Insert companies
  for (const company of metaData) {
    await db.run(
      `INSERT INTO companies (domain, name, category, city, state, country, zip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [company.D, company.CN, company.CAT, company.C, company.ST, company.CO, company.Z]
    );

    if (company.P) {
      for (const person of company.P) {
        await db.run(
          `INSERT INTO people (company_id, name, title)
           SELECT id, ?, ? FROM companies WHERE domain = ?`,
          [person.Name, person.Title, company.D]
        );
      }
    }

    if (company.S) {
      for (const c of company.S) {
        await db.run(
          `INSERT INTO contacts (company_id, type, value)
           SELECT id, 'social_link', ? FROM companies WHERE domain = ?`,
          [c, company.D]
        );
      }
    }
    if (company.E) {
      for (const c of company.E) {
        await db.run(
          `INSERT INTO contacts (company_id, type, value)
           SELECT id, 'email', ? FROM companies WHERE domain = ?`,
          [c, company.D]
        );
      }
    }
    if (company.T) {
      for (const c of company.T) {
        await db.run(
          `INSERT INTO contacts (company_id, type, value)
           SELECT id, 'telephone', ? FROM companies WHERE domain = ?`,
          [c, company.D]
        );
      }
    }
  }

  // Insert tech detections + spend into indexed_domains & domain_technologies
  for (const td of techData) {
    await db.run(
      `INSERT INTO indexed_domains (domain, spend, first_indexed, last_indexed)
       VALUES (?, ?, ?, ?)`,
      [td.D, td.SP, td.FI, td.LI]
    );

    for (const tech of td.T || []) {
      await db.run(
        `INSERT INTO domain_technologies (domain, subdomain, technology_name, first_detected, last_detected)
         VALUES (?, ?, ?, ?, ?)`,
        [td.D, td.SD || null, tech.N, tech.FD, tech.LD]
      );
    }
  }
}

async function main() {
  await downloadAndUnzip();
  const db = await setupDatabase();
  console.log("Database initiated and tables created successfully");
  await populateDatabase(db);
  console.log("Database setup complete at", DB_PATH);
  await db.close();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
