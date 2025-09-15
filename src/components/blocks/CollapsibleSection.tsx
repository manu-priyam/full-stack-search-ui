"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type CollapsibleSectionProps = {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CollapsibleSection({
  title,
  children,
  open,
  onOpenChange,
}: CollapsibleSectionProps) {
  return (
    <div className="border rounded-lg shadow-sm bg-white">
      {/* Header */}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between px-4 py-2 font-medium text-left hover:bg-gray-50 cursor-pointer"
      >
        <span>{title}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Content */}
      {open && <div className="p-4 border-t">{children}</div>}
    </div>
  );
}