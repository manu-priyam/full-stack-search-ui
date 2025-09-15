import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { searchSchema, SearchFormValues } from "../../../schema/search";

export async function POST(req: Request) {
    const body = await req.json();
    const parsed = searchSchema.parse(body);
    const db = await open({ filename: "./builtwith.db", driver: sqlite3.Database });

    // Base SQL
    const sql = `
    WITH all_domains AS (
      SELECT domain FROM companies
      UNION
      SELECT domain FROM indexed_domains
    ),
    domain_info AS (
      SELECT
        d.domain,
        c.name,
        c.category,
        c.city,
        c.state,
        c.country,
        c.zip,
        i.spend,
        i.first_indexed,
        i.last_indexed
      FROM all_domains d
      LEFT JOIN companies c ON d.domain = c.domain
      LEFT JOIN indexed_domains i ON d.domain = i.domain
    ),
    grouped_domain_technologies AS (
      SELECT 
        domain,
        GROUP_CONCAT(technology_name, ', ') AS technology_names,
        COUNT(*) as tech_count
      FROM domain_technologies
      GROUP BY domain
    )
    SELECT 
      di.*,
      gdt.technology_names,
      gdt.tech_count
    FROM domain_info di
    LEFT JOIN grouped_domain_technologies gdt ON di.domain = gdt.domain
    WHERE 1=1
  `;

    const params: any[] = [];
    let whereClauses: string[] = [];

    // Company filters
    if (parsed.companyCategories.length) {
        whereClauses.push(`di.category IN (${parsed.companyCategories.map(() => '?').join(",")})`);
        params.push(...parsed.companyCategories.map(c => c.value));
    }
    if (parsed.companyDomains.length) {
        whereClauses.push(`di.domain IN (${parsed.companyDomains.map(() => '?').join(",")})`);
        params.push(...parsed.companyDomains.map(c => c.value));
    }
    if (parsed.companyNames.length) {
        whereClauses.push(`di.name IN (${parsed.companyNames.map(() => '?').join(",")})`);
        params.push(...parsed.companyNames.map(c => c.value));
    }
    if (parsed.companyCities.length) {
        whereClauses.push(`di.city IN (${parsed.companyCities.map(() => '?').join(",")})`);
        params.push(...parsed.companyCities.map(c => c.value));
    }
    if (parsed.companyCountries.length) {
        whereClauses.push(`di.country IN (${parsed.companyCountries.map(() => '?').join(",")})`);
        params.push(...parsed.companyCountries.map(c => c.value));
    }
    if (parsed.companyStates.length) {
        whereClauses.push(`di.state IN (${parsed.companyStates.map(() => '?').join(",")})`);
        params.push(...parsed.companyStates.map(c => c.value));
    }
    if (parsed.companyZip.length) {
        whereClauses.push(`di.zip IN (${parsed.companyZip.map(() => '?').join(",")})`);
        params.push(...parsed.companyZip.map(c => c.value));
    }

    // Total Tech
    if (parsed.totalTechValue !== undefined && parsed.totalTechOperator !== undefined && parsed.totalTechOperator !== "") {
        whereClauses.push(`gdt.tech_count ${parsed.totalTechOperator} ?`);
        params.push(parsed.totalTechValue);
    }

    // Monthly Spend
    if (parsed.monthlySpendRange?.length === 2) {
        whereClauses.push(`di.spend BETWEEN ? AND ?`);
        params.push(parsed.monthlySpendRange[0], parsed.monthlySpendRange[1]);
    }

    // Include Technologies
    if (parsed.includeTechnologies.length) {
        // ANY
        if (parsed.technologiesIncludeMode === "ANY") {
            whereClauses.push(`
        di.domain IN (
          SELECT DISTINCT domain
          FROM domain_technologies
          WHERE technology_name IN (${parsed.includeTechnologies.map(() => '?').join(",")})
        )
      `);
            params.push(...parsed.includeTechnologies.map(t => t.value));
        }
        // ALL
        else {
            for (const t of parsed.includeTechnologies) {
                whereClauses.push(`
          di.domain IN (
            SELECT DISTINCT domain FROM domain_technologies WHERE technology_name = ?
          )
        `);
                params.push(t.value);
            }
        }
    }

    // Exclude Technologies
    if (parsed.excludeTechnologies.length) {
        whereClauses.push(`
      di.domain NOT IN (
        SELECT DISTINCT domain
        FROM domain_technologies
        WHERE technology_name IN (${parsed.excludeTechnologies.map(() => '?').join(",")})
      )
    `);
        params.push(...parsed.excludeTechnologies.map(t => t.value));
    }

    // Tech Category Filters
    if (parsed.techCategoryFilters.length) {
        if (parsed.techCategoryIncludeMode === "ANY") {
            // ANY 
            const orClauses: string[] = [];
            parsed.techCategoryFilters.forEach(filter => {
                orClauses.push(`
          di.domain IN (
            SELECT dt.domain
            FROM domain_technologies dt
            JOIN technologies t ON dt.technology_name = t.name
            WHERE t.category = ?
            GROUP BY dt.domain
            HAVING COUNT(DISTINCT dt.technology_name) ${filter.operator} ?
          )
        `);
                params.push(filter.category.value, filter.count);
            });
            whereClauses.push(`(${orClauses.join(" OR ")})`);
        } else {
            // ALL = domain must satisfy ALL the category filters
            parsed.techCategoryFilters.forEach(filter => {
                whereClauses.push(`
          di.domain IN (
            SELECT dt.domain
            FROM domain_technologies dt
            JOIN technologies t ON dt.technology_name = t.name
            WHERE t.category = ?
            GROUP BY dt.domain
            HAVING COUNT(DISTINCT dt.technology_name) ${filter.operator} ?
          )
        `);
                params.push(filter.category.value, filter.count);
            });
        }
    }

    const finalSql = sql + (whereClauses.length ? ` AND ${whereClauses.join(" AND ")}` : "");
    console.log("Final SQL:", finalSql);
    console.log("Params:", params);

    const rows = await db.all(finalSql, params);

    return NextResponse.json(rows);
}
