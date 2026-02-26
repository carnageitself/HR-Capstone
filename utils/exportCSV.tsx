"use client";

/** Convert an array of objects to a CSV string and trigger download */
export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] ?? "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export a table element to CSV by reading its DOM */
export function exportTableToCSV(filename: string, tableId: string) {
  const table = document.getElementById(tableId) as HTMLTableElement | null;
  if (!table) return;
  const rows = Array.from(table.querySelectorAll("tr")).map(tr =>
    Array.from(tr.querySelectorAll("th,td")).map(td => td.textContent?.trim() ?? "")
  );
  const csv = rows.map(r => r.map(c => c.includes(",") ? `"${c}"` : c).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Small reusable export button */
export function ExportButton({ label = "Export CSV", onClick }: { label?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1v6M3.5 5L6 7.5 8.5 5M2 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  );
}