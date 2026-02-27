"use client";

import { useState } from "react";
import UploadSection from "./pipeline/UploadSection";
import RunSection from "./pipeline/RunSection";
import CompareSection from "./pipeline/CompareSection";

type PipelineSubTab = "upload" | "run" | "compare";

export default function PipelineTab() {
  const [subTab, setSubTab] = useState<PipelineSubTab>("upload");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("default");

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            <button
              onClick={() => setSubTab("upload")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                subTab === "upload"
                  ? "bg-orange-50 text-orange-600 border-b-2 border-orange-600"
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
              }`}
            >
              Upload Data
            </button>
            <button
              onClick={() => setSubTab("run")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                subTab === "run"
                  ? "bg-orange-50 text-orange-600 border-b-2 border-orange-600"
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
              }`}
            >
              Run Pipeline
            </button>
            <button
              onClick={() => setSubTab("compare")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                subTab === "compare"
                  ? "bg-orange-50 text-orange-600 border-b-2 border-orange-600"
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
              }`}
            >
              Compare Results
            </button>
          </div>
        </div>

        <div className="p-6">
          {subTab === "upload" && (
            <UploadSection
              selectedCompanyId={selectedCompanyId}
              onCompanyChange={setSelectedCompanyId}
            />
          )}
          {subTab === "run" && (
            <RunSection
              selectedCompanyId={selectedCompanyId}
              onCompanyChange={setSelectedCompanyId}
            />
          )}
          {subTab === "compare" && <CompareSection />}
        </div>
      </div>
    </div>
  );
}
