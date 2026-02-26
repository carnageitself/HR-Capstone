/**
 * Minimal CSV parser that handles quoted fields with commas/newlines.
 * Safe to use in Node.js (Next.js server components / route handlers).
 */
export function parseCSV<T extends Record<string, string>>(raw: string): T[] {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const records: T[] = [];
  let i = 0;
  let headers: string[] = [];

  const parseField = (): string => {
    if (lines[i] === '"') {
      i++; // skip opening quote
      let val = "";
      while (i < lines.length) {
        if (lines[i] === '"' && lines[i + 1] === '"') {
          val += '"';
          i += 2;
        } else if (lines[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          val += lines[i++];
        }
      }
      return val;
    } else {
      let val = "";
      while (i < lines.length && lines[i] !== "," && lines[i] !== "\n") {
        val += lines[i++];
      }
      return val;
    }
  };

  const parseLine = (): string[] => {
    const fields: string[] = [];
    while (i < lines.length && lines[i] !== "\n") {
      fields.push(parseField());
      if (lines[i] === ",") i++;
    }
    if (lines[i] === "\n") i++;
    return fields;
  };

  headers = parseLine();

  while (i < lines.length) {
    if (lines[i] === "\n") { i++; continue; }
    const values = parseLine();
    if (values.length === 0 || (values.length === 1 && values[0] === "")) continue;
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => { record[h.trim()] = (values[idx] ?? "").trim(); });
    records.push(record as T);
  }

  return records;
}