// utils/exportData.ts

export type ExportFormat = "csv" | "json";

/**
 * Converts an array of objects to CSV string
 */
export function convertToCSV(data: object[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers
      .map(key => {
        let value = (row as any)[key] ?? "";
        // Escape double quotes
        if (typeof value === "string" && value.includes(",")) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Triggers browser download of CSV or JSON
 */
export function downloadData(data: object[], filename: string, format: ExportFormat) {
  let blob: Blob;
  let fileExt: string;

  if (format === "csv") {
    const csvString = convertToCSV(data);
    blob = new Blob([csvString], { type: "text/csv" });
    fileExt = "csv";
  } else {
    const jsonString = JSON.stringify(data, null, 2);
    blob = new Blob([jsonString], { type: "application/json" });
    fileExt = "json";
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${fileExt}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
