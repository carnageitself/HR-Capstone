/**
 * dataManager.ts
 * Multi-tenant data management for HR Analytics system
 * Handles company CRUD, data loading per company, CSV append mode
 */

import { promises as fs } from "fs";
import path from "path";

export interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  created: string;
  readonly?: boolean;
  data_dir: string;
}

export interface CompaniesData {
  companies: Company[];
  metadata: {
    lastUpdated: string;
    totalCompanies: number;
  };
}

const COMPANIES_FILE = path.join(process.cwd(), "data", "companies.json");

/**
 * Load companies metadata
 */
export async function getCompanyList(): Promise<Company[]> {
  try {
    const data = await fs.readFile(COMPANIES_FILE, "utf-8");
    const parsed: CompaniesData = JSON.parse(data);
    return parsed.companies;
  } catch (error) {
    console.error("Failed to load companies:", error);
    return [];
  }
}

/**
 * Get single company by ID
 */
export async function getCompany(id: string): Promise<Company | null> {
  const companies = await getCompanyList();
  return companies.find((c) => c.id === id) || null;
}

/**
 * Create new company
 */
export async function createCompany(
  name: string,
  industry: string,
  size: string
): Promise<Company> {
  const companies = await getCompanyList();

  // Generate ID from name (lowercase, replace spaces with underscores)
  const id = name.toLowerCase().replace(/\s+/g, "_");

  // Check if company already exists
  if (companies.find((c) => c.id === id)) {
    throw new Error(`Company with ID "${id}" already exists`);
  }

  const now = new Date().toISOString();
  const dataDir = `data/companies/${id}`;

  // Create data directory
  const fullPath = path.join(process.cwd(), dataDir);
  await fs.mkdir(fullPath, { recursive: true });

  // Create subdirectories
  await fs.mkdir(path.join(fullPath, "uploads"), { recursive: true });
  await fs.mkdir(path.join(fullPath, "outputs"), { recursive: true });

  const newCompany: Company = {
    id,
    name,
    description: `${name} HR Analytics`,
    industry,
    size,
    created: now,
    readonly: false,
    data_dir: dataDir,
  };

  // Add to companies list
  companies.push(newCompany);

  // Update companies.json
  const updated: CompaniesData = {
    companies,
    metadata: {
      lastUpdated: now,
      totalCompanies: companies.length,
    },
  };

  await fs.writeFile(COMPANIES_FILE, JSON.stringify(updated, null, 2));

  return newCompany;
}

/**
 * Delete company (and its data directory)
 */
export async function deleteCompany(id: string): Promise<void> {
  const company = await getCompany(id);

  if (!company) {
    throw new Error(`Company "${id}" not found`);
  }

  if (company.readonly) {
    throw new Error("Cannot delete read-only company");
  }

  // Get companies list
  const companies = await getCompanyList();
  const filtered = companies.filter((c) => c.id !== id);

  // Delete data directory
  const fullPath = path.join(process.cwd(), company.data_dir);
  try {
    await fs.rm(fullPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to delete directory ${fullPath}:`, error);
  }

  // Update companies.json
  const now = new Date().toISOString();
  const updated: CompaniesData = {
    companies: filtered,
    metadata: {
      lastUpdated: now,
      totalCompanies: filtered.length,
    },
  };

  await fs.writeFile(COMPANIES_FILE, JSON.stringify(updated, null, 2));
}

/**
 * Load CSV file for a company
 * fileType: 'employees' | 'departments' | 'awards'
 */
export async function loadCompanyData(
  companyId: string,
  fileType: "employees" | "departments" | "awards"
): Promise<string> {
  const company = await getCompany(companyId);

  if (!company) {
    throw new Error(`Company "${companyId}" not found`);
  }

  const filePath = path.join(
    process.cwd(),
    company.data_dir,
    `${fileType}.csv`
  );

  try {
    const data = await fs.readFile(filePath, "utf-8");
    return data;
  } catch (error) {
    console.warn(`No ${fileType}.csv found for company ${companyId}`);
    return "";
  }
}

/**
 * Save or update CSV data for a company
 * If file exists, data can be appended (append=true) or replaced
 */
export async function saveCompanyData(
  companyId: string,
  fileType: "employees" | "departments" | "awards",
  data: string,
  append: boolean = false
): Promise<void> {
  const company = await getCompany(companyId);

  if (!company) {
    throw new Error(`Company "${companyId}" not found`);
  }

  if (company.readonly) {
    throw new Error("Cannot modify read-only company");
  }

  const filePath = path.join(
    process.cwd(),
    company.data_dir,
    `${fileType}.csv`
  );

  if (append) {
    try {
      // Try to read existing file
      const existing = await fs.readFile(filePath, "utf-8");
      // Remove header from new data before appending
      const newLines = data.split("\n").slice(1);
      const combined = existing.trimEnd() + "\n" + newLines.join("\n");
      await fs.writeFile(filePath, combined);
    } catch (error) {
      // File doesn't exist, just write new data
      await fs.writeFile(filePath, data);
    }
  } else {
    // Replace mode
    await fs.writeFile(filePath, data);
  }
}

/**
 * Get all CSV files for a company
 */
export async function getCompanyFiles(
  companyId: string
): Promise<{
  employees: boolean;
  departments: boolean;
  awards: boolean;
}> {
  const company = await getCompany(companyId);

  if (!company) {
    throw new Error(`Company "${companyId}" not found`);
  }

  const dir = path.join(process.cwd(), company.data_dir);

  try {
    const files = await fs.readdir(dir);
    return {
      employees: files.includes("employees.csv"),
      departments: files.includes("departments.csv"),
      awards: files.includes("awards.csv"),
    };
  } catch (error) {
    return {
      employees: false,
      departments: false,
      awards: false,
    };
  }
}

/**
 * Get company data directory path
 */
export function getCompanyDataDir(companyId: string): string {
  return path.join(process.cwd(), "data/companies", companyId);
}

/**
 * Get default company
 */
export async function getDefaultCompany(): Promise<Company | null> {
  return getCompany("default");
}
