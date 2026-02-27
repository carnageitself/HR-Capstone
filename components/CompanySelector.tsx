"use client";

import { useState, useEffect } from "react";

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  readonly?: boolean;
}

interface CompanySelectorProps {
  selectedCompanyId: string;
  onCompanyChange: (companyId: string) => void;
}

export default function CompanySelector({
  selectedCompanyId,
  onCompanyChange,
}: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
    const interval = setInterval(fetchCompanies, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
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

  if (loading) {
    return <div className="text-xs text-gray-400">Loading companies...</div>;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
      <label className="text-xs font-semibold text-gray-600 uppercase">
        Company:
      </label>
      <select
        value={selectedCompanyId}
        onChange={(e) => onCompanyChange(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
            {company.readonly ? " (default)" : ""}
            {company.industry ? ` - ${company.industry}` : ""}
          </option>
        ))}
      </select>
      {selectedCompanyId !== "default" && (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          Custom
        </span>
      )}
    </div>
  );
}
