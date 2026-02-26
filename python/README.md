# Topic Taxonomy Pipeline

Creates topic taxonomies from employee recognition data using Claude AI.

## Overview

Pipeline functions:
1. Extract recognition data via SQL
2. Build taxonomy using AI analysis
3. Annotate records with categories
4. Generate visualization reports

## Complete Workflow

### Step 1: Extract Award Data

Generate and execute SQL query to pull award data from your database:

```bash
python generate_award_query.py
```

Follow the interactive prompts:
- **Client ID**: Enter your client ID (e.g., 33)
- **Start date**: Beginning of date range (YYYY-MM-DD)
- **End date**: End of date range (YYYY-MM-DD)

Output:
- SQL query with recipient/nominator data
- Copied to clipboard
- Optional file save

**Filtering by Award IDs (Optional):**
```python
# Filter using specific award IDs
mask = df[df['award_id'].isin(target_award_ids)].reset_index()
```

### Step 2: Prepare Data Files

1. Execute the SQL query in your database
2. Export results as CSV (e.g., `client-370-award.csv`)
3. Place the CSV file in the `data/` directory
4. Ensure your data includes these columns:
   - Award information: `award_id`, `title`, `message`, `award_reason`, `award_date`, `value`
   - Recipient info: `rec_id`, `rec_name`, `rec_job_title`, `rec_department_name`, `rec_business_unit_name`
   - Nominator info: `nom_id`, `nom_name`, `nom_job_title`, `nom_department_name`, `nom_business_unit_name`

### Step 3: Create Topic Taxonomy

Generate a taxonomy from your recognition data:

```bash
python create_taxonomy.py
```

Configuration options:
- **Input file**: Your CSV file (e.g., `client-370-award.csv`)
- **Sample size**: Number of records to analyze (recommended: 10,000)
- **Batch range**: Start and end batch numbers
- **Compression interval**: Compress taxonomy every N batches (default: 10)

Process:
1. Sample and deduplicate messages
2. Process in 20-record batches
3. Build taxonomy iteratively
4. Compress similar categories
5. Add hierarchical IDs (A, A1, A2, etc.)

**Output**: `taxonomy_results/compressed_taxonomy_with_ids.json`

### Step 4: Prepare for Annotation

1. Copy the generated taxonomy to the data folder:
```bash
cp taxonomy_results/compressed_taxonomy_with_ids.json data/compressed_taxonomy_with_ids_GE.json
```

2. Ensure you have the award data file renamed appropriately:
```bash
cp data/client-370-award.csv data/award_GE.csv
```

### Step 5: Run Topic Annotation

Annotate your recognition data with the taxonomy:

```bash
python run_topic_annotation.py
```

Configuration prompts:
- **Award CSV filename**: `award_GE.csv`
- **Sample size**: Number of records to annotate (max 10,000)
- **Temperature**: Claude's creativity level (0.0-1.0, default 0.1)
- **Workers**: Concurrent processing threads (1-10, default 4)
- **Output filename**: Name for results file
- **Taxonomy filename**: `compressed_taxonomy_with_ids_GE.json`

Process:
- 20-record batches
- Category assignment with reasoning
- Cost tracking
- Results in `output/`

### Step 6: Filter Results (Optional)

Clean low-frequency categories:

```python
import pandas as pd

df = pd.read_csv('output/annotated_results.csv')

# Check category distribution
category_counts = df.groupby('category_name').size().reset_index(name='count')
print("Category distribution:")
print(category_counts)

# Reclassify low-frequency categories (< 150 occurrences)
low_frequency_categories = category_counts[category_counts['count'] < 150]['category_name'].tolist()
df_cleaned = df.copy()
df_cleaned.loc[df_cleaned['category_name'].isin(low_frequency_categories), 'category_name'] = 'Unclassified'

# Save cleaned data
df_cleaned.to_csv('output/annotated_results_cleaned.csv', index=False)

# Summary
total_reclassified = len(df[df['category_name'].isin(low_frequency_categories)])
print(f"\nReclassified {total_reclassified} records ({total_reclassified/len(df)*100:.1f}%) as 'Unclassified'")
```

### Step 7: Create Visualizations

Use the R script to generate charts and insights:

```r
# In R or RStudio
source('simple_visual.R')
```

Before running, update the script configuration:
```r
DATA_FILE <- "output/annotated_results_cleaned.csv"  # Your cleaned data file
OUTPUT_DIR <- "output"  # Output directory for charts
```

Generated outputs:
1. **Donut chart**: Category distribution
2. **Treemaps**: Subcategory breakdown per category
3. **Stacked bar chart**: Categories by award type
4. **Statistical insights**: Ready for presentation

## Directory Structure

```
topic-taxonomy/
├── data/                          # Input data files
│   ├── award_GE.csv              # Award data (from Step 4)
│   └── compressed_taxonomy_with_ids_GE.json  # Taxonomy (from Step 4)
├── output/                        # Results and visualizations
│   ├── annotated_results.csv     # Raw annotation results
│   ├── annotated_results_cleaned.csv  # Filtered results
│   ├── work_topics_donut.png    # Category distribution chart
│   ├── work_topics_treemap_*.png # Individual category treemaps
│   └── work_topics_by_award_type_filtered.png  # Award type analysis
├── taxonomy_results/              # Taxonomy creation outputs
│   └── compressed_taxonomy_with_ids.json  # Final taxonomy
└── claude_responses/              # API response logs (for debugging)
```

## Cost Estimation

- **Taxonomy Creation**: ~$50 for 10k messages. 


## Advanced Usage

### Customizing Prompts and Batch Size

Modify directly in code:

**1. Taxonomy Compression** (`create_taxonomy.py`, line ~351):
```python
def compress_taxonomy(taxonomy: Dict[str, Any]) -> Dict[str, Any]:
    prompt = f'''
    Role: You are a qualitative researcher specializing in taxonomy creation and optimization.
    # Modify this prompt to change compression behavior
    '''
```

**2. Topic Annotation** (`run_topic_annotation.py`, line ~236):
```python
prompt = f'''
Role: You are a HR researcher.
# Modify this prompt to change annotation criteria
'''
```

**3. Batch Size** (default is 20 messages per batch):
```python
# In create_taxonomy.py and run_topic_annotation.py
df['batch_id'] = np.ceil((np.arange(len(df)) + 1) / 20).astype(int)  # Change 20 to your desired batch size
```

### Resuming Taxonomy Creation
```bash
python create_taxonomy.py
# Enter start batch > 1 to resume
```

### Custom Filtering
```python
# Date range example
df_filtered = df_clean[
    (df_clean['award_date'] >= '2024-01-01') & 
    (df_clean['award_date'] <= '2024-12-31')
]
```

### Taxonomy Refinement
1. Increase sample size
2. Adjust compression interval
3. Edit JSON manually
4. Modify prompts for domain specificity

## Requirements

- Python 3.9+
- R 4.0+ (for visualizations)
- AWS credentials with Claude API access
- Required R packages: readr, dplyr, ggplot2, treemapify, scales

## Future Improvements

Current limitations and potential optimizations:

- **Performance**: Batch processing can be parallelized further
- **Cost reduction**: Implement caching for repeated API calls
- **Prompt engineering**: Domain-specific prompts yield better results
- **Scale**: Tested up to 10K records; larger datasets need optimization
- **Language**:Output in English-only; Support multi-language input. 

Fork and modify as needed. No support provided.