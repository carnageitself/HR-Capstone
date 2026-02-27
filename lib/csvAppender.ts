/**
 * csvAppender.ts
 * Safely append CSV data while avoiding duplicates
 * Logic: Check for duplicate IDs, merge records intelligently
 */

import Papa from "papaparse";

interface ParseOptions {
  header: boolean;
  skipEmptyLines: boolean;
  dynamicTyping: boolean;
}

/**
 * Parse CSV string to records
 */
function parseCSV(csvText: string): Record<string, string>[] {
  return Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  }).data;
}

/**
 * Convert records back to CSV
 */
function recordsToCSV(records: Record<string, string>[], headers: string[]): string {
  const lines = [headers.join(",")];

  for (const record of records) {
    const row = headers.map((h) => {
      const val = record[h] || "";
      // Quote if contains comma or newline
      if (val.includes(",") || val.includes("\n") || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

/**
 * Append awards - avoid duplicates by award_id
 * New awards added, existing awards with same ID are skipped
 */
export function appendAwards(existing: string, newData: string): string {
  const existingRecords = parseCSV(existing);
  const newRecords = parseCSV(newData);

  // Get headers from existing
  const headers = existingRecords.length > 0 ? Object.keys(existingRecords[0]) : [];

  // Build set of existing IDs
  const existingIds = new Set(
    existingRecords
      .map((r) => r.award_id || r.id || "")
      .filter((id) => id)
  );

  // Filter out duplicates from new data
  const uniqueNew = newRecords.filter((r) => {
    const id = r.award_id || r.id || "";
    if (!id) return true; // Keep records without ID
    return !existingIds.has(id);
  });

  // Combine
  const combined = [...existingRecords, ...uniqueNew];

  return recordsToCSV(combined, headers);
}

/**
 * Update employees - update by employee_id if exists, else insert
 * Allows for updating employee info while keeping history
 */
export function updateEmployees(existing: string, newData: string): string {
  const existingRecords = parseCSV(existing);
  const newRecords = parseCSV(newData);

  // Get headers
  const headers = existingRecords.length > 0 ? Object.keys(existingRecords[0]) : [];

  // Build map of existing employees
  const existingMap = new Map(
    existingRecords.map((r) => [r.employee_id || r.id || "", r])
  );

  // Update or add
  for (const record of newRecords) {
    const id = record.employee_id || record.id || "";
    if (id) {
      existingMap.set(id, record); // Update or insert
    }
  }

  // Convert back to array
  const combined = Array.from(existingMap.values());

  return recordsToCSV(combined, headers);
}

/**
 * Update departments - update by dept_id if exists, else insert
 */
export function updateDepartments(existing: string, newData: string): string {
  const existingRecords = parseCSV(existing);
  const newRecords = parseCSV(newData);

  // Get headers
  const headers = existingRecords.length > 0 ? Object.keys(existingRecords[0]) : [];

  // Build map of existing departments
  const existingMap = new Map(
    existingRecords.map((r) => [r.dept_id || r.id || r.department_id || "", r])
  );

  // Update or add
  for (const record of newRecords) {
    const id = record.dept_id || record.id || record.department_id || "";
    if (id) {
      existingMap.set(id, record); // Update or insert
    }
  }

  // Convert back to array
  const combined = Array.from(existingMap.values());

  return recordsToCSV(combined, headers);
}

/**
 * Smart merge based on data type
 * Determines which merge strategy to use
 */
export function smartMerge(
  fileType: "employees" | "departments" | "awards",
  existing: string,
  newData: string
): string {
  if (!existing || existing.trim().length === 0) {
    return newData; // No existing data, just use new
  }

  if (!newData || newData.trim().length === 0) {
    return existing; // No new data, keep existing
  }

  switch (fileType) {
    case "awards":
      return appendAwards(existing, newData);
    case "employees":
      return updateEmployees(existing, newData);
    case "departments":
      return updateDepartments(existing, newData);
    default:
      return newData;
  }
}

/**
 * Get CSV headers
 */
export function getCSVHeaders(csvText: string): string[] {
  const records = parseCSV(csvText);
  if (records.length === 0) return [];
  return Object.keys(records[0]);
}

/**
 * Count records in CSV
 */
export function countCSVRecords(csvText: string): number {
  return parseCSV(csvText).length;
}

/**
 * Validate CSV has required columns
 */
export function validateCSVColumns(
  csvText: string,
  required: string[]
): { valid: boolean; missing: string[] } {
  const headers = getCSVHeaders(csvText);
  const missing = required.filter((col) => !headers.includes(col));

  return {
    valid: missing.length === 0,
    missing,
  };
}
