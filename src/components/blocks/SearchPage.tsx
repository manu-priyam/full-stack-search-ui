"use client";

import { useState, useRef, useEffect } from "react";
import SearchForm from "./SearchForm";
import ResultsTable from "./ResultsTable";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export type Response = {
  domain: string;
  name: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  spend: number | null;
  first_indexed: string | null;
  last_indexed: string | null;
  technology_names: string | null;
  tech_count: number | null
}

export default function SearchPage() {
  const [results, setResults] = useState<Response[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const isResizing = useRef(false);

  const handleSearch = async (filters: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = () => {
    isResizing.current = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    setSidebarWidth(Math.max(200, e.clientX)); // min width = 200px
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {/* <aside className="w-64 border-r bg-muted p-4">
        <SearchForm onSearch={handleSearch} />
      </aside> */}
      <aside
        className="border-r bg-muted p-4 relative"
        style={{ width: sidebarWidth }}
      >
        <SearchForm onSearch={handleSearch} />

        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-gray-300 hover:bg-gray-500"
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : results === null ? (
          <Card className="flex items-center justify-center h-full text-muted-foreground">
            Make your search
          </Card>
        ) : results.length === 0 ? (
          <Card className="flex items-center justify-center h-full text-muted-foreground">
            No results
          </Card>
        ) : (
          <ResultsTable data={results} />
        )}
      </main>
    </div>
  );
}

