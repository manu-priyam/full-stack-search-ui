import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "builtwith.db");
const db = new Database(dbPath, { readonly: true });

function logRows(title: string, rows: any[]) {
  console.log(`\n=== ${title} (${rows.length} rows) ===`);
  for (const row of rows) {
    console.log(row);
  }
}

// 1. Get 5 companies with their metadata
const domains = db.prepare(`
  SELECT count(distinct domain) FROM domain_technologies limit 50;
`).all();
logRows("Sample Domains", domains);

const subdomains = db.prepare(`
  SELECT count(distinct subdomain) FROM domain_technologies limit 50;
`).all();
logRows("Sample Subdomains", subdomains);

const domain_tech = db.prepare(`
  SELECT count(*) FROM domain_technologies limit 50;
`).all();
logRows("Sample domain_technologies", domain_tech);

// const techs = db.prepare(`
//   SELECT count(distinct technology_name) FROM domain_technologies limit 50;
// `).all();
// logRows("Sample domain_technologies", techs);

// const techs = db.prepare(`
//   SELECT count(*) as cnt, domain FROM domain_technologies group by domain;
// `).all();
// logRows("Sample domain_technologies", techs);

// const techs = db.prepare(`
//   SELECT domain FROM indexed_domains where domain in (select domain from companies);
// `).all();
// logRows("Sample domain_technologies", techs);

// const domain = db.prepare(`
//   WITH all_domains AS (
//       SELECT domain
//       FROM companies
//       UNION
//       SELECT domain
//       FROM indexed_domains
//     ) select * from all_domains where domain in ('a-different-approach.com', 'a-zreclamation.com')
// `).all();
// logRows("All domains", domain);

// const tech = db.prepare(` 
//   SELECT domain FROM (SELECT domain FROM companies UNION SELECT domain FROM indexed_domains) where domain in ('a-different-approach.com', 'a-zreclamation.com') union select domain from companies where domain in ('a-different-approach.com', 'a-zreclamation.com');
// `).all();
// logRows("Sample domains", tech);


// companies in the UK using Shopify

const tech = db.prepare(`
  SELECT distinct name FROM technologies where name in (select distinct technology_name from domain_technologies);
`).all();
logRows("Sample", tech);

db.close();

