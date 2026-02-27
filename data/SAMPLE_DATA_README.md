# Sample Data Files for HR Analytics Demo

These sample CSV files are ready-to-use for testing and demos. They have the **exact schema required** by the system.

## Files

### 1. `sample_awards.csv` (10 columns, 15 sample records)
Awards/recognition data with:
- 15 diverse award examples across different categories
- Real-world award messages and reasoning
- Multiple departments and employees
- Monetary values ranging from 200-750

**Use for:** Testing taxonomy generation, comparing LLM results, pipeline runs

### 2. `sample_employees.csv` (5 columns, 16 sample employees)
Employee directory with:
- 16 employees across 5 departments
- Mix of individual contributors and managers
- Realistic job titles

**Use for:** Employee dashboard, recognition context

### 3. `sample_departments.csv` (2 columns, 5 departments)
Department list:
- Engineering
- Product
- Analytics
- Marketing
- Customer Support

**Use for:** Department filtering, organization structure

## How to Use

### Option 1: Upload via Dashboard UI
1. Navigate to **Pipeline → Upload Data** tab
2. Create a new company (e.g., "Demo Corp")
3. Click **"Download Sample CSV"** link in each upload zone
4. Use the provided sample files above
5. Upload all three files
6. Click **"Run with Groq"** or **"Run with Gemini"**

### Option 2: Copy to Company Data Directory
```bash
# Copy samples to a company folder
cp data/sample_awards.csv data/companies/demo_corp/awards.csv
cp data/sample_employees.csv data/companies/demo_corp/employees.csv
cp data/sample_departments.csv data/companies/demo_corp/departments.csv
```

Then select "demo_corp" company in the Pipeline tab and run.

### Option 3: Use in Default Company (Testing Only)
```bash
# Overwrite default data (careful!)
cp data/sample_awards.csv data/default/awards.csv
```

## Data Characteristics

| Field | Sample Values | Notes |
|-------|---------------|-------|
| Categories | A, B, C, D, E | Represents award types |
| Monetary Values | 200-750 USD | Realistic award amounts |
| Date Range | Jan-Mar 2025 | Recent awards |
| Statuses | Approved | All records are approved |

## Schema Validation

All files MUST have these exact columns (case-sensitive):

**Awards:**
```
award_id, recipient_id, nominator_id, award_title, award_message,
category_id, reasoning, award_date, monetary_value_usd, award_status
```

**Employees:**
```
employee_id, first_name, last_name, department_id, job_title
```

**Departments:**
```
department_id, department_name
```

## Tips for Demos

1. **Start with just awards.csv** - The dashboard will show employee count immediately without waiting for pipeline
2. **Run Groq + Gemini comparison** - Shows both providers side-by-side (need API keys set)
3. **Check pipeline logs** in `outputs/runs/<runName>/pipeline.log` for debugging
4. **Monitor status** - Frontend polls `outputs/runs/<runName>/status.json` every 3 seconds

## Next Steps

1. Set your Groq/Gemini API keys in `.env`:
   ```
   GROQ_API_KEY=gsk_...
   GOOGLE_API_KEY=AIza...
   ```

2. Start the dev server:
   ```
   npm run dev
   ```

3. Navigate to the Pipeline tab and upload sample data

4. Run the pipeline and watch real-time progress!

---

**Questions?** Check the API response error messages - they'll tell you exactly what's wrong with your CSV.
