import { z } from "zod";

export const searchSchema = z.object({
    // Company Categories
    companyCategories: z.array(
        z.object({
            value: z.string(),
            label: z.string(),
        })
    ),

    // Company Domains
    companyDomains: z.array(
        z.object({
            value: z.string(),
            label: z.string(),
        })
    ),

    // Company Names
    companyNames: z.array(
        z.object({
            value: z.string(),
            label: z.string(),
        })
    ),

    // Company Cities
    companyCities: z.array(
        z.object({
            value: z.string(),
            label: z.string(),
        })
    ),

    // Company Countries
    companyCountries: z.array(
        z.object({
            value: z.string(),
            label: z.string(),
        })
    ),

    // Company States
    companyStates: z.array(
        z.object({
            value: z.string(),
            label: z.string(),
        })
    ),

    // Company Zip
    companyZip: z.array(
        z.object({
            value: z.string(),
            label: z.string(),
        })
    ),

    // Total Tech
    totalTechOperator: z.enum(["=", ">", "<", ">=", "<=", ""]).optional(),
    totalTechValue: z.number().min(0, "Must be >= 0").optional(),

    // Monthly Spend
    monthlySpendRange: z.tuple([
        z.number().min(0, "Min spend must be >= 0"),
        z.number().min(0, "Max spend must be >= 0"),
    ]).optional(),

    // Technologies
    includeTechnologies: z.array(
        z.object({
            value: z.string(),
            label: z.string(),
        })
    ),
    excludeTechnologies: z.array(
        z.object({
            value: z.string(),
            label: z.string(),
        })
    ),
    technologiesIncludeMode: z.enum(["ANY", "ALL"]),

    // Technology Category Filters
    techCategoryFilters: z.array(
        z.object({
            category: z.object({
                value: z.string(),
                label: z.string(),
            }),
            operator: z.enum(["=", ">", "<", ">=", "<="]),
            count: z.number().min(0, "Must be >= 0"),
        })
    ),
    techCategoryIncludeMode: z.enum(["ANY", "ALL"]),
});

export type SearchFormValues = z.infer<typeof searchSchema>;