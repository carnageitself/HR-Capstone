"use client";

import { useEffect } from "react";

export function Modal({
  title,
  subtitle,
  width = 720,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  width?: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal card — fixed height, internal scroll */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width, maxWidth: "100%", maxHeight: "85vh" }}
      >
        {/* Header — pinned */}
        <div className="shrink-0 px-5 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-2xl bg-white">
          <div>
            <div className="font-bold text-[15px] text-[#0B3954]">{title}</div>
            {subtitle && (
              <div className="font-mono text-[10px] text-gray-400">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-gray-200 grid place-items-center cursor-pointer text-gray-500 hover:bg-gray-100 shrink-0 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}