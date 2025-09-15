"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Response } from "./SearchPage";
import { downloadData, ExportFormat } from "../../utils/exportData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

// Columns definition
const allColumns = [
  { key: "domain", label: "Domain" },
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "zip", label: "Zip" },
  { key: "spend", label: "Monthly Spend" },
  { key: "first_indexed", label: "First Indexed" },
  { key: "last_indexed", label: "Last Indexed" },
  { key: "tech_count", label: "Tech Count" },
  { key: "technology_names", label: "Techs Used" },
];

type Props = {
  data: Response[];
};

export default function ResultsTable({ data }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    allColumns.map((col) => col.key) // start with all visible
  );

  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const totalPages = Math.ceil(data.length / pageSize);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const valA = a[sortConfig.key as keyof Response];
      const valB = b[sortConfig.key as keyof Response];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }

      return sortConfig.direction === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data, sortConfig]);

  // Pagination
  const paginatedData = sortedData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleExport = (format: ExportFormat) => {
    downloadData(sortedData, "results", format);
  };

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex justify-between items-center mb-2">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <div>
            <label className="mr-2">Rows per page:</label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="border rounded p-1"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div>Total rows: {data.length}</div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Column selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-3 py-1 rounded bg-black text-white cursor-pointer hover:bg-gray-900">
                Show Columns
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-white text-gray-900">
              {allColumns.map((col) => (
                <DropdownMenuItem
                  key={col.key}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColumn(col.key);
                  }}
                  className="flex items-center gap-2"
                >
                  <Checkbox checked={visibleColumns.includes(col.key)} />
                  {col.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-3 py-1 rounded bg-black text-white cursor-pointer hover:bg-gray-900 transition-colors duration-200">
                Export
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-36 bg-black text-white">
              <DropdownMenuItem
                className="hover:bg-gray-800 cursor-pointer"
                onClick={() => handleExport("csv")}
              >
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-gray-800 cursor-pointer"
                onClick={() => handleExport("json")}
              >
                Export JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            {allColumns
              .filter((col) => visibleColumns.includes(col.key))
              .map((col) => (
                <TableHead
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig.key === col.key && (
                      <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </TableHead>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((row) => (
            <TableRow key={row.domain}>
              {allColumns
                .filter((col) => visibleColumns.includes(col.key))
                .map((col) => (
                  <TableCell key={col.key}>
                    {row[col.key as keyof Response]}
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        {/* Prev / Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200 text-gray-700 font-medium"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200 text-gray-700 font-medium"
          >
            Next
          </button>
        </div>

        {/* Page numbers */}
        <Pagination>
          <PaginationContent>
            {page > 2 && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => setPage(1)}
                  className="cursor-pointer"
                >
                  1
                </PaginationLink>
              </PaginationItem>
            )}

            {page > 3 && (
              <PaginationItem>
                <PaginationLink aria-disabled="true">…</PaginationLink>
              </PaginationItem>
            )}

            {page > 1 && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => setPage(page - 1)}
                  className="cursor-pointer"
                >
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationLink isActive className="cursor-pointer">
                {page}
              </PaginationLink>
            </PaginationItem>

            {page < totalPages && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => setPage(page + 1)}
                  className="cursor-pointer"
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {page < totalPages - 2 && (
              <PaginationItem>
                <PaginationLink aria-disabled="true">…</PaginationLink>
              </PaginationItem>
            )}

            {page < totalPages - 1 && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => setPage(totalPages)}
                  className="cursor-pointer"
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>

        {/* Info */}
        <div className="ml-4 whitespace-nowrap">
          Page {page} of {totalPages}
        </div>
      </div>
    </div>
  );
}
