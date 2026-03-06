"use client";

import { useState, useRef, useCallback } from "react";
import { apiUpload, type UploadResult } from "../Evaluations";

const REQUIRED = ["message", "award_title", "recipient_title", "nominator_title"];

export function UploadStep({ onUpload }: { onUpload: (result: UploadResult) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setPreview(null);

    if (!file.name.endsWith(".csv")) {
      setError("File must be a .csv");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds 10MB limit");
      return;
    }

    setUploading(true);
    try {
      const result = await apiUpload(file);

      // Client-side column validation
      const cols = result.columns.map((c: string) => c.trim().toLowerCase());
      const missing = REQUIRED.filter(r => !cols.includes(r));
      if (missing.length > 0) {
        setError(`Missing required columns: ${missing.join(", ")}`);
        setUploading(false);
        return;
      }

      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          dragging
            ? "border-[#F96400] bg-orange-50"
            : "border-gray-300 hover:border-[#00A98F] hover:bg-teal-50"
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv" onChange={onFileSelect} className="hidden" />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#F96400] border-t-transparent rounded-full animate-spin" />
            <div className="text-sm text-gray-500">Uploading & validating...</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-sm font-semibold text-[#0B3954]">
              Drop your CSV here or click to browse
            </div>
            <div className="font-mono text-[10px] text-gray-400">
              Required columns: {REQUIRED.join(", ")}
            </div>
            <div className="font-mono text-[10px] text-gray-400">Max 10MB</div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-[14px] text-[#0B3954]">{preview.filename}</div>
              <div className="font-mono text-[10px] text-gray-400">
                {preview.row_count.toLocaleString()} rows · {preview.columns.length} columns
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setPreview(null); setError(null); }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Change File
              </button>
              <button
                onClick={() => onUpload(preview)}
                className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-[#F96400] text-white hover:bg-[#E05A00] cursor-pointer shadow-sm"
              >
                Continue →
              </button>
            </div>
          </div>

          {/* Column badges */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-mono text-[8px] tracking-widest uppercase text-gray-400 mb-2">Columns Detected</div>
            <div className="flex flex-wrap gap-1.5">
              {preview.columns.map(col => {
                const isRequired = REQUIRED.includes(col.trim().toLowerCase());
                return (
                  <span key={col} className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    isRequired
                      ? "bg-teal-50 text-[#00A98F] border border-teal-200 font-semibold"
                      : "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}>
                    {isRequired && "✓ "}{col}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Sample rows */}
          {preview.sample_rows && preview.sample_rows.length > 0 && (
            <div className="px-4 py-3">
              <div className="font-mono text-[8px] tracking-widest uppercase text-gray-400 mb-2">
                Sample Rows (first {preview.sample_rows.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr>
                      {preview.columns.slice(0, 6).map(col => (
                        <th key={col} className="px-2 py-1.5 text-left font-mono text-[8px] tracking-widest uppercase text-gray-500 bg-gray-50 border-b border-gray-200">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample_rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        {preview.columns.slice(0, 6).map(col => (
                          <td key={col} className="px-2 py-1.5 text-[#0B3954] max-w-[200px] truncate">
                            {String(row[col] || "—").slice(0, 80)}
                            {String(row[col] || "").length > 80 && "…"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}