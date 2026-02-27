"use client";

import { useState, useEffect } from "react";

interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
}

interface UploadSectionProps {
  selectedCompanyId: string;
  onCompanyChange: (id: string) => void;
}

const EXPECTED_COLUMNS: Record<string, string[]> = {
  awards: [
    "award_id",
    "recipient_id",
    "nominator_id",
    "award_title",
    "award_message",
    "category_id",
    "reasoning",
    "award_date",
    "monetary_value_usd",
    "award_status",
  ],
  employees: [
    "employee_id",
    "first_name",
    "last_name",
    "department_id",
    "job_title",
  ],
  departments: ["department_id", "department_name"],
};

export default function UploadSection({
  selectedCompanyId,
  onCompanyChange,
}: UploadSectionProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCompanyModal, setNewCompanyModal] = useState(false);
  const [uploads, setUploads] = useState<Record<string, File | null>>({
    awards: null,
    employees: null,
    departments: null,
  });
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: "",
    industry: "",
    size: "",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (data.ok) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCompany() {
    if (!newCompanyForm.name || !newCompanyForm.industry || !newCompanyForm.size) {
      setUploadStatus({
        ...uploadStatus,
        create: "Please fill all fields",
      });
      return;
    }

    try {
      setUploadStatus({ ...uploadStatus, create: "Creating..." });
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompanyForm),
      });

      const data = await res.json();
      if (data.ok) {
        setCompanies([...companies, data.company]);
        onCompanyChange(data.company.id);
        setNewCompanyModal(false);
        setNewCompanyForm({ name: "", industry: "", size: "" });
        setUploadStatus({ ...uploadStatus, create: "Company created" });
      } else {
        setUploadStatus({ ...uploadStatus, create: data.error });
      }
    } catch (error) {
      setUploadStatus({ ...uploadStatus, create: String(error) });
    }
  }

  async function handleUploadFile(fileType: string) {
    const file = uploads[fileType];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyId", selectedCompanyId);
    formData.append("fileType", fileType);

    try {
      setUploadStatus({ ...uploadStatus, [fileType]: "Uploading..." });
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.ok) {
        setUploadStatus({
          ...uploadStatus,
          [fileType]: `Uploaded (${data.rowCount} rows)`,
        });
        setUploads({ ...uploads, [fileType]: null });
      } else {
        setUploadStatus({ ...uploadStatus, [fileType]: data.error });
      }
    } catch (error) {
      setUploadStatus({ ...uploadStatus, [fileType]: String(error) });
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading companies...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Company
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => onCompanyChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.readonly ? "(default)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="pt-6">
          <button
            onClick={() => setNewCompanyModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium"
          >
            + New Company
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["awards", "employees", "departments"].map((fileType) => (
          <div
            key={fileType}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors"
          >
            <div className="mb-3">
              <div className="text-2xl text-gray-400 mb-2">📄</div>
              <h3 className="text-sm font-medium text-gray-900 capitalize mb-1">
                {fileType} CSV
              </h3>
              <p className="text-xs text-gray-500">
                {uploads[fileType]?.name || "No file selected"}
              </p>
              <details className="mt-2">
                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">
                  Required columns
                </summary>
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded text-left space-y-2">
                  <code className="block whitespace-pre-wrap break-words">
                    {EXPECTED_COLUMNS[fileType].join(", ")}
                  </code>
                  <a
                    href={`/api/templates?fileType=${fileType}`}
                    download
                    className="block text-blue-600 hover:text-blue-700 underline"
                  >
                    Download Sample CSV
                  </a>
                </div>
              </details>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploads({ ...uploads, [fileType]: file });
                  setUploadStatus({ ...uploadStatus, [fileType]: "" });
                }
              }}
              className="hidden"
              id={`file-${fileType}`}
            />
            <button
              onClick={() => document.getElementById(`file-${fileType}`)?.click()}
              type="button"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              Choose File
            </button>

            {uploads[fileType] && (
              <button
                onClick={() => handleUploadFile(fileType)}
                className="w-full mt-3 px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
              >
                {uploadStatus[fileType] || "Upload"}
              </button>
            )}
            {uploadStatus[fileType] && !uploadStatus[fileType].includes("...") && (
              <p className={`text-xs mt-2 ${uploadStatus[fileType].includes("Uploaded") ? "text-green-600" : "text-red-600"}`}>
                {uploadStatus[fileType]}
              </p>
            )}
          </div>
        ))}
      </div>

      {newCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Create New Company</h2>
            <input
              type="text"
              placeholder="Company Name"
              value={newCompanyForm.name}
              onChange={(e) =>
                setNewCompanyForm({ ...newCompanyForm, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
            />
            <input
              type="text"
              placeholder="Industry"
              value={newCompanyForm.industry}
              onChange={(e) =>
                setNewCompanyForm({ ...newCompanyForm, industry: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
            />
            <select
              value={newCompanyForm.size}
              onChange={(e) =>
                setNewCompanyForm({ ...newCompanyForm, size: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            >
              <option value="">Select Size</option>
              <option value="Small">Small (1-50)</option>
              <option value="Medium">Medium (51-500)</option>
              <option value="Large">Large (500+)</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setNewCompanyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCompany}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Create
              </button>
            </div>
            {uploadStatus.create && (
              <p className="text-sm mt-3 text-red-600">{uploadStatus.create}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
