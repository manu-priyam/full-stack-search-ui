"use client";

import React, { useMemo, useEffect, useState } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import { useFetchOptions, SelectOption } from "../../hooks/useFetchOptions";
import { createFuzzyFilter } from "../../utils/fuzzyFilter";
import { searchSchema, SearchFormValues } from "../../schema/search";
import CollapsibleSection from "./CollapsibleSection";
import { Slider } from "@/components/ui/slider";
import AsyncSelect from "react-select/async";
import isEqual from "lodash/isEqual";

type Props = {
    onSearch: (data: SearchFormValues) => void;
};

const defaultValues: SearchFormValues = {
    companyCategories: [],
    companyDomains: [],
    companyNames: [],
    companyCities: [],
    companyCountries: [],
    companyStates: [],
    companyZip: [],
    includeTechnologies: [],
    excludeTechnologies: [],
    technologiesIncludeMode: "ANY",
    totalTechOperator: "",
    totalTechValue: 0,
    monthlySpendRange: undefined,
    techCategoryFilters: [],
    techCategoryIncludeMode: "ANY",
};

export default function SearchForm({ onSearch }: Props) {
    const { control, handleSubmit, register, reset, watch, formState: { errors } } =
        useForm<SearchFormValues>({
            resolver: zodResolver(searchSchema),
            defaultValues
        });

    const [savedFilters, setSavedFilters] = useState<SearchFormValues | null>(null);
    const currentValues = watch();

    const [openSections, setOpenSections] = useState({
        companyMeta: false,
        technologies: false,
        techCategory: false,
    });

    useEffect(() => {
        const saved = localStorage.getItem("savedFilters");
        if (saved) {
            const parsed = JSON.parse(saved);
            reset(parsed);

            setOpenSections({
                companyMeta:
                    parsed.companyNames.length > 0 ||
                    parsed.companyDomains.length > 0 ||
                    parsed.companyCategories.length > 0 ||
                    parsed.companyCities.length > 0 ||
                    parsed.companyCountries.length > 0 ||
                    parsed.companyStates.length > 0 ||
                    parsed.companyZip.length > 0,
                technologies:
                    parsed.includeTechnologies.length > 0 ||
                    parsed.excludeTechnologies.length > 0 ||
                    parsed.technologiesIncludeMode !== "ANY",
                techCategory:
                    parsed.techCategoryFilters.length > 0 ||
                    parsed.techCategoryIncludeMode !== "ANY",
            });
        }
    }, [reset]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("savedFilters");
            if (saved) {
                const parsed = JSON.parse(saved);
                const merged = { ...defaultValues, ...parsed };
                reset(merged);
                setSavedFilters(merged);
            }
        }
    }, [reset]);

    const hasCustomCurrent = !isEqual(currentValues, defaultValues);
    const hasCustomSaved =
        savedFilters !== null && !isEqual(savedFilters, defaultValues);
    const showClearFilters = hasCustomCurrent || hasCustomSaved;

    const handleClearFilters = () => {
        reset(defaultValues);
        if (typeof window !== "undefined") {
            localStorage.removeItem("savedFilters");
        }
        setSavedFilters(null);
    };

    const { fields, append, remove } = useFieldArray({
        control,
        name: "techCategoryFilters",
    });

    // Fetch reusable options
    const { options: companyCategoryOptions, loading: loadingCompanyCategories } =
        useFetchOptions("/api/dropdown/company/categories");

    const { options: companyCountryOptions, loading: loadingCompanyCountries } =
        useFetchOptions("/api/dropdown/company/countries");

    const { options: companyStateOptions, loading: loadingCompanyStates } =
        useFetchOptions("/api/dropdown/company/states");

    const { options: techCategoryOptions, loading: loadingTechCategories } =
        useFetchOptions("/api/dropdown/technology/categories");

    // Memoize fuzzy filters
    const companyCategoryFilter = useMemo(
        () => createFuzzyFilter(companyCategoryOptions),
        [companyCategoryOptions]
    );
    const companyCountryFilter = useMemo(
        () => createFuzzyFilter(companyCountryOptions),
        [companyCountryOptions]
    );
    const companyStateFilter = useMemo(
        () => createFuzzyFilter(companyStateOptions),
        [companyStateOptions]
    );
    const techCategoryFilter = useMemo(
        () => createFuzzyFilter(techCategoryOptions),
        [techCategoryOptions]
    );

    const submitHandler = (data: SearchFormValues) => {
        localStorage.setItem("savedFilters", JSON.stringify(data));
        onSearch(data);
    };

    return (
        <form
            onSubmit={handleSubmit(submitHandler)}
            className="space-y-4 p-4 border rounded-md shadow-sm bg-white"
        >
            {/* Company MetaData */}
            <CollapsibleSection title="Select Company MetaData"
                open={openSections.companyMeta}
                onOpenChange={(v) =>
                    setOpenSections((prev) => ({ ...prev, companyMeta: v }))
                }>

                {/* Company Names */}
                <div className="mb-2">
                    <Controller
                        name="companyNames"
                        control={control}
                        render={({ field }) => (
                            <AsyncSelect<SelectOption, true>
                                {...field}
                                isMulti
                                cacheOptions
                                defaultOptions
                                loadOptions={async (inputValue: string) => {
                                    try {
                                        const res = await fetch(
                                            `/api/dropdown/company/names?query=${encodeURIComponent(inputValue)}`
                                        );
                                        if (!res.ok) return [];
                                        return await res.json();
                                    } catch (err) {
                                        console.error("Error fetching domains:", err);
                                        return [];
                                    }
                                }}
                                placeholder="Names..."
                                onChange={(selected) => field.onChange(selected)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.companyNames && (
                        <p className="text-red-500 text-sm">{errors.companyNames.message}</p>
                    )}
                </div>

                {/* Company Domains */}
                <div className="mb-2">
                    <Controller
                        name="companyDomains"
                        control={control}
                        render={({ field }) => (
                            <AsyncSelect<SelectOption, true>
                                {...field}
                                isMulti
                                cacheOptions
                                defaultOptions
                                loadOptions={async (inputValue: string) => {
                                    try {
                                        const res = await fetch(
                                            `/api/dropdown/company/domains?query=${encodeURIComponent(inputValue)}`
                                        );
                                        if (!res.ok) return [];
                                        return await res.json();
                                    } catch (err) {
                                        console.error("Error fetching domains:", err);
                                        return [];
                                    }
                                }}
                                placeholder="Domains..."
                                onChange={(selected) => field.onChange(selected)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.companyDomains && (
                        <p className="text-red-500 text-sm">{errors.companyDomains.message}</p>
                    )}
                </div>

                {/* Company Categories */}
                <div className="mb-2">
                    {/* <label className="block mb-1 font-medium">Company Categories</label> */}
                    <Controller
                        name="companyCategories"
                        control={control}
                        render={({ field }) => (
                            <Select<SelectOption, true>
                                {...field}
                                isMulti
                                isLoading={loadingCompanyCategories}
                                options={companyCategoryOptions}
                                placeholder="Categories..."
                                filterOption={companyCategoryFilter}
                                onChange={(selected) => field.onChange(selected)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.companyCategories && (
                        <p className="text-red-500 text-sm">
                            {errors.companyCategories.message}
                        </p>
                    )}
                </div>

                {/* Company Cities */}
                <div className="mb-2">
                    <Controller
                        name="companyCities"
                        control={control}
                        render={({ field }) => (
                            <AsyncSelect<SelectOption, true>
                                {...field}
                                isMulti
                                cacheOptions
                                defaultOptions
                                loadOptions={async (inputValue: string) => {
                                    try {
                                        const res = await fetch(
                                            `/api/dropdown/company/cities?query=${encodeURIComponent(inputValue)}`
                                        );
                                        if (!res.ok) return [];
                                        return await res.json();
                                    } catch (err) {
                                        console.error("Error fetching domains:", err);
                                        return [];
                                    }
                                }}
                                placeholder="Cities..."
                                onChange={(selected) => field.onChange(selected)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.companyCities && (
                        <p className="text-red-500 text-sm">{errors.companyCities.message}</p>
                    )}
                </div>

                {/* Company Countries */}
                <div className="mb-2">
                    {/* <label className="block mb-1 font-medium">Company Country</label> */}
                    <Controller
                        name="companyCountries"
                        control={control}
                        render={({ field }) => (
                            <Select<SelectOption, true>
                                {...field}
                                isMulti
                                isLoading={loadingCompanyCountries}
                                options={companyCountryOptions}
                                placeholder="Countries..."
                                filterOption={companyCountryFilter}
                                onChange={(selected) => field.onChange(selected)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.companyCountries && (
                        <p className="text-red-500 text-sm">
                            {errors.companyCountries.message}
                        </p>
                    )}
                </div>

                {/* Company States */}
                <div className="mb-2">
                    {/* <label className="block mb-1 font-medium">Company State</label> */}
                    <Controller
                        name="companyStates"
                        control={control}
                        render={({ field }) => (
                            <Select<SelectOption, true>
                                {...field}
                                isMulti
                                isLoading={loadingCompanyStates}
                                options={companyStateOptions}
                                placeholder="States..."
                                filterOption={companyStateFilter}
                                onChange={(selected) => field.onChange(selected)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.companyStates && (
                        <p className="text-red-500 text-sm">
                            {errors.companyStates.message}
                        </p>
                    )}
                </div>

                {/* Company Zip */}
                <div className="mb-2">
                    <Controller
                        name="companyZip"
                        control={control}
                        render={({ field }) => (
                            <AsyncSelect<SelectOption, true>
                                {...field}
                                isMulti
                                cacheOptions
                                defaultOptions
                                loadOptions={async (inputValue: string) => {
                                    try {
                                        const res = await fetch(
                                            `/api/dropdown/company/zip?query=${encodeURIComponent(inputValue)}`
                                        );
                                        if (!res.ok) return [];
                                        return await res.json();
                                    } catch (err) {
                                        console.error("Error fetching domains:", err);
                                        return [];
                                    }
                                }}
                                placeholder="Zip..."
                                onChange={(selected) => field.onChange(selected)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.companyZip && (
                        <p className="text-red-500 text-sm">{errors.companyZip.message}</p>
                    )}
                </div>
            </CollapsibleSection>

            {/* Total Tech filter */}
            <div>
                <label className="block mb-1 font-medium">Total Tech Count</label>
                <div className="flex gap-2">
                    <select
                        {...register("totalTechOperator")}
                        className="border rounded px-2 py-1"
                    // defaultValue=""
                    >
                        <option value="">--No Operator--</option>
                        <option value="=">=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                    </select>
                    <input
                        type="number"
                        {...register("totalTechValue", { valueAsNumber: true, setValueAs: (v) => (v === "" ? undefined : Number(v)), })}
                        className="border rounded px-2 py-1 w-full"

                    />
                </div>
                {errors.totalTechValue && (
                    <p className="text-red-500 text-sm">
                        {errors.totalTechValue.message}
                    </p>
                )}
            </div>

            {/* Monthly Spend */}
            <div>
                <label className="block font-medium mb-2">
                    Monthly Spend on Tech (USD)
                </label>
                <Controller
                    name="monthlySpendRange"
                    control={control}
                    render={({ field }) => (
                        <>
                            <input
                                type="checkbox"
                                checked={!!field.value}
                                onChange={(e) =>
                                    e.target.checked
                                        ? field.onChange([0, 10000])
                                        : field.onChange(undefined)
                                }
                                className="mr-2"
                            />
                            <span>Enable filter</span>

                            {field.value && (
                                <>
                                    <Slider
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        min={0}
                                        max={10000}
                                        step={50}
                                        className="w-full mt-2"
                                    />
                                    <div className="flex justify-between text-sm mt-1">
                                        <span>{field.value?.[0]}</span>
                                        <span>{field.value?.[1]}</span>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                />
                {errors.monthlySpendRange && (
                    <p className="text-red-500 text-sm">{errors.monthlySpendRange.message}</p>
                )}
            </div>

            {/* Technolgies Include/Exclude */}
            <CollapsibleSection title="Select Technologies"
                open={openSections.technologies}
                onOpenChange={(v) =>
                    setOpenSections((prev) => ({ ...prev, technologies: v }))
                }>

                {/* Technologies Include Mode Toggle */}
                <div>
                    <label className="block mb-1 font-medium">How to match included techs?</label>
                    <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="ANY"
                                {...register("technologiesIncludeMode")}
                                className="cursor-pointer"
                            />
                            Any
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="ALL"
                                {...register("technologiesIncludeMode")}
                                className="cursor-pointer"
                            />
                            All
                        </label>
                    </div>
                    {errors.technologiesIncludeMode && (
                        <p className="text-red-500 text-sm">
                            {errors.technologiesIncludeMode.message}
                        </p>
                    )}
                </div>

                {/* Include Technologies */}
                <div className="mb-2">
                    <Controller
                        name="includeTechnologies"
                        control={control}
                        render={({ field }) => (
                            <AsyncSelect<SelectOption, true>
                                {...field}
                                isMulti
                                cacheOptions
                                defaultOptions
                                loadOptions={async (inputValue: string) => {
                                    try {
                                        const res = await fetch(
                                            `/api/dropdown/technology/names?query=${encodeURIComponent(inputValue)}`
                                        );
                                        if (!res.ok) return [];
                                        return await res.json();
                                    } catch (err) {
                                        console.error("Error fetching domains:", err);
                                        return [];
                                    }
                                }}
                                placeholder="Include Techs..."
                                onChange={(selected) => field.onChange(selected)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.includeTechnologies && (
                        <p className="text-red-500 text-sm">{errors.includeTechnologies.message}</p>
                    )}
                </div>

                {/* Exclude Technologies */}
                <div className="mb-2">
                    <Controller
                        name="excludeTechnologies"
                        control={control}
                        render={({ field }) => (
                            <AsyncSelect<SelectOption, true>
                                {...field}
                                isMulti
                                cacheOptions
                                defaultOptions
                                loadOptions={async (inputValue: string) => {
                                    try {
                                        const res = await fetch(
                                            `/api/dropdown/technology/names?query=${encodeURIComponent(inputValue)}`
                                        );
                                        if (!res.ok) return [];
                                        return await res.json();
                                    } catch (err) {
                                        console.error("Error fetching domains:", err);
                                        return [];
                                    }
                                }}
                                placeholder="Exclude Techs..."
                                onChange={(selected) => field.onChange(selected)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.excludeTechnologies && (
                        <p className="text-red-500 text-sm">{errors.excludeTechnologies.message}</p>
                    )}
                </div>
            </CollapsibleSection>

            {/* Tech Category Filters */}
            <CollapsibleSection title="Select Count Per Tech Category"
                open={openSections.techCategory}
                onOpenChange={(v) =>
                    setOpenSections((prev) => ({ ...prev, techCategory: v }))
                }>
                <div>
                    <div>
                        <label className="block mb-1 font-medium">How to match tech category counts?</label>
                        <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    value="ANY"
                                    {...register("techCategoryIncludeMode")}
                                    className="cursor-pointer"
                                />
                                Any
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    value="ALL"
                                    {...register("techCategoryIncludeMode")}
                                    className="cursor-pointer"
                                />
                                All
                            </label>
                        </div>
                        {errors.techCategoryIncludeMode && (
                            <p className="text-red-500 text-sm">
                                {errors.techCategoryIncludeMode.message}
                            </p>
                        )}
                    </div>
                    {/* <label className="block mb-1 font-medium">Tech Category Count</label> */}

                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2 mb-2">
                            {/* Category Dropdown */}
                            <Controller
                                name={`techCategoryFilters.${index}.category`}
                                control={control}
                                render={({ field }) => (
                                    <Select<SelectOption, false>
                                        {...field}
                                        isClearable
                                        isLoading={loadingTechCategories}
                                        options={techCategoryOptions}
                                        placeholder="Select Tech Category..."
                                        filterOption={techCategoryFilter}
                                        value={field.value}
                                        onChange={(selected) => field.onChange(selected)}
                                    />
                                )}
                            />

                            {/* Operator */}
                            <select
                                {...register(`techCategoryFilters.${index}.operator`)}
                                className="border rounded px-2 py-1"
                            >
                                <option value="=">=</option>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value=">=">&gt;=</option>
                                <option value="<=">&lt;=</option>
                            </select>

                            {/* Count */}
                            <input
                                type="number"
                                {...register(`techCategoryFilters.${index}.count`, { valueAsNumber: true })}
                                className="border rounded px-2 py-1 w-20"
                            />

                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-red-500 hover:underline cursor-pointer"
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() =>
                            append({
                                category: { value: "", label: "" },
                                operator: ">=",
                                count: 0,
                            })
                        }
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
                    >
                        + Add Filter
                    </button>

                </div>
            </CollapsibleSection>

            <div className="flex gap-4 mt-4">
                {showClearFilters && (
                    <button
                        type="button"
                        className="px-4 py-2 bg-black text-white rounded cursor-pointer hover:bg-gray-900 transition-colors"
                        onClick={handleClearFilters}
                    >
                        Clear Filters
                    </button>
                )}

                <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded cursor-pointer hover:bg-gray-900 transition-colors"
                >
                    Search
                </button>
            </div>
        </form>
    );
}
