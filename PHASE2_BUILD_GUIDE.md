# PHASE 2 Implementation - Admin + Pipeline Comparison Menu

Status: Starting implementation
No git commits. No emojis.

## Build Sequence

### 1. Types & Utilities (From Taxonomy project)
- Copy types from Taxonomy/employee-dashboard/src/types/dashboard.ts
- Copy processComparison.ts from Taxonomy/employee-dashboard/src/utils/
- Create lib/pipelineTypes.ts with PipelineRun, Taxonomy, Phase2Data, ComparisonData types
- Create lib/processComparison.ts with comparison logic

### 2. API Routes (Back-end)
- app/api/companies/route.ts (GET list, POST create)
- app/api/upload/route.ts (POST file upload)
- app/api/pipeline/run/route.ts (POST spawn python)
- app/api/pipeline/status/route.ts (GET status.json)
- app/api/pipeline/runs/route.ts (GET all runs)

### 3. Pipeline Python Updates
- taxonomy_pipeline/run_pipeline.py: Add --awards-csv, --status-file args, write status.json during phases
- taxonomy_pipeline/config.py: Add COMPANY_ID, COMPANY_DATA_DIR support

### 4. UI Components (Front-end)
- components/PipelineTab.tsx (main shell with 3 sub-tabs)
- components/pipeline/UploadSection.tsx (CSV upload)
- components/pipeline/RunSection.tsx (Pipeline trigger + progress)
- components/pipeline/CompareSection.tsx (Results display)
- components/pipeline/PipelineComparison.tsx (Ported from Taxonomy)

### 5. Integration
- Update components/HRDashboardClient.tsx: Add "pipeline" tab
- Update lib/dataManager.ts if needed for company context

## Files Status
- Ready: lib/dataManager.ts, lib/csvAppender.ts, groq_client.py
- Needed: Everything else above

## Notes
- Use Tailwind, not styled-components
- No database, file-based only
- Status file: outputs/runs/<runName>/status.json (JSON with phase, status, provider, elapsed time)
- Python spawned asynchronously, API returns immediately
- Frontend polls status every 3 seconds

Next: Create types and API routes
