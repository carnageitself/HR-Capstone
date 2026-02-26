
# =============================================================================
# WORK TOPICS DONUT AND INDIVIDUAL CATEGORY TREEMAPS USING TREEMAPIFY
# =============================================================================

# Load required libraries
suppressPackageStartupMessages({
  library(readr)
  library(dplyr)
  library(ggplot2)
  library(stringr)
  library(scales)
  library(tidyr)
  library(treemapify)  # For treemap visualization
})

# =============================================================================
# CONFIGURATION
# =============================================================================

DATA_FILE <- "output/worley_20240601_20250531_result_cleaned.csv"  # Update with your data file path
OUTPUT_DIR <- "output"         # Output directory for charts

# Create output directory if it doesn't exist
if (!dir.exists(OUTPUT_DIR)) dir.create(OUTPUT_DIR)

# Chart dimensions
DONUT_CHART_WIDTH <- 12
DONUT_CHART_HEIGHT <- 8
TREEMAP_WIDTH <- 16
TREEMAP_HEIGHT <- 10

# =============================================================================
# DATA LOADING AND PREPARATION
# =============================================================================

# Load data
df <- read_csv(DATA_FILE)

# Configuration for filtering
EXCLUDE_AWARD_REASONS <- c("NONE","Congratulations","Special Bonus","Birthday")
EXCLUDE_PRODUCT_VALUES <- c("life event","yos","yos(plateau)")

# Count excluded records
excluded_count <- sum(df$award_reason %in% EXCLUDE_AWARD_REASONS, na.rm = TRUE)

# Filter and clean data
df_filtered <- df %>%
  filter(
    !award_reason %in% EXCLUDE_AWARD_REASONS,
    if ("product" %in% colnames(df)) !product %in% EXCLUDE_PRODUCT_VALUES else TRUE,
    !is.na(category_name),
    category_name != "",
    !is.na(subcategory_name),
    subcategory_name != ""
  ) %>%
  mutate(
    category_name = str_trim(category_name),
    subcategory_name = str_trim(subcategory_name)
  ) %>%
  filter(category_name != "Unclassified")



# =============================================================================
# COLOR PALETTE SETUP
# =============================================================================

# Get the actual categories from the data (top 9)
category_summary <- df_filtered %>%
  count(category_name, sort = TRUE) 

actual_categories <- category_summary$category_name
n_categories <- length(actual_categories)

# Color palette for up to 9 categories
category_color_palette <- c(
  "#E74C3C",   # Red/Coral
  "#F39C12",   # Orange  
  "#8E44AD",   # Purple
  "#3498DB",   # Bright blue
  "#16A085",   # Teal
  "#E67E22",   # Vibrant orange
  "#9B59B6",   # Vibrant purple
  "#2ECC71",   # Green
  "#95A5A6"    # Gray
)

# Create category colors mapping
category_colors <- category_color_palette[1:n_categories]
names(category_colors) <- actual_categories

# Print color assignments
cat("=== COLOR ASSIGNMENTS ===\n")
for(i in 1:length(actual_categories)) {
  cat(sprintf("%d. %s - Color: %s\n", i, actual_categories[i], category_colors[i]))
}
cat("\n")

# =============================================================================
# CHART 1: DONUT CHART
# =============================================================================

create_donut_chart <- function(data) {
  # Calculate category percentages
  category_data <- data %>%
    count(category_name, sort = TRUE) %>%
    mutate(
      percentage = round(n / sum(n) * 100, 1),
      ymax = cumsum(n),
      ymin = lag(ymax, default = 0),
      # Create legend labels with percentages and counts
      legend_label = paste0(category_name, " (", percentage, "%, ", comma(n), " awards)")
    ) %>%
    arrange(desc(n))
  
  # Force the legend order by making it a factor
  category_data$legend_label <- factor(category_data$legend_label, 
                                       levels = category_data$legend_label)
  
  # Update colors to match legend labels
  legend_colors <- category_colors[category_data$category_name]
  names(legend_colors) <- category_data$legend_label
  
  # Calculate total subcategories
  total_subcategories <- data %>%
    summarise(total = n_distinct(subcategory_name)) %>%
    pull(total)
  
  # Create donut chart
  p_donut <- ggplot(category_data, aes(ymax = ymax, ymin = ymin, xmax = 4, xmin = 3, fill = legend_label)) +
    geom_rect() +
    # Add percentage labels in the donut segments
    geom_text(aes(x = 3.5, y = (ymax + ymin) / 2, label = paste0(percentage, "%")),
              color = "white", fontface = "bold", size = 4) +
    coord_polar(theta = "y") +
    xlim(c(2, 4)) +
    scale_fill_manual(values = legend_colors) +
    labs(
      title = "Work Topics Categories Distribution",
      subtitle = paste0("Distribution of ", comma(sum(category_data$n)), " awards across ", 
                        nrow(category_data), " main categories with ", total_subcategories, " subcategories"),
      fill = ""
    ) +
    theme_void() +
    theme(
      plot.title = element_text(size = 14, face = "bold", hjust = 0.5),
      plot.subtitle = element_text(size = 11, color = "gray40", hjust = 0.5, margin = margin(b = 15)),
      legend.position = "top",
      legend.text = element_text(size = 9),
      legend.key.size = unit(0.5, "cm"),
      plot.margin = margin(20, 20, 20, 20)
    ) +
    guides(fill = guide_legend(ncol = 2))
  
  return(p_donut)
}

# =============================================================================
# CHART 2: INDIVIDUAL CATEGORY TREEMAPS
# =============================================================================

create_category_treemap <- function(data, category_name) {
  # Filter data for specific category
  category_data <- data %>%
    filter(category_name == !!category_name) %>%
    count(subcategory_name, sort = TRUE) %>%
    mutate(
      percentage = round(n / sum(n) * 100, 1),
      percentage_overall = round(n / nrow(data) * 100, 2),
      # Create labels with both count and percentages
      label = paste0(subcategory_name, "\n", comma(n), "\n", percentage_overall, "% overall")
    )
  
  if(nrow(category_data) == 0) {
    cat("Warning: No data found for category:", category_name, "\n")
    return(NULL)
  }
  
  # Get category color
  base_color <- category_colors[category_name]
  if(is.na(base_color) || is.null(base_color)) {
    base_color <- "#E74C3C"
  }
  
  # Calculate totals
  total_awards <- sum(category_data$n)
  total_pct <- round(total_awards / nrow(data) * 100, 1)
  num_subcategories <- nrow(category_data)
  
  # Create gradient palette from base color
  # Use lighter shades for smaller values
  n_colors <- nrow(category_data)
  if(n_colors == 1) {
    fill_colors <- base_color
  } else {
    # Create gradient from base color to a lighter version
    light_color <- colorRampPalette(c(base_color, "white"))(10)[3]  # 30% lighter
    fill_colors <- colorRampPalette(c(base_color, light_color))(n_colors)
  }
  
  # Create named vector for colors
  names(fill_colors) <- category_data$subcategory_name[order(category_data$n, decreasing = TRUE)]
  
  # Create treemap using treemapify
  p_treemap <- ggplot(category_data, aes(area = n, fill = subcategory_name, label = label)) +
    geom_treemap() +
    geom_treemap_text(
      colour = "white",
      place = "centre",
      size = 15,
      fontface = "bold",
      reflow = TRUE,
      min.size = 8
    ) +
    scale_fill_manual(values = fill_colors) +
    labs(
      title = paste0(category_name, " (", num_subcategories, " subcategories)"),
      subtitle = paste0(comma(total_awards), " awards (", total_pct, "% of total)")
    ) +
    theme_minimal() +
    theme(
      plot.title = element_text(size = 16, face = "bold", hjust = 0.5),
      plot.subtitle = element_text(size = 12, color = "gray40", hjust = 0.5),
      legend.position = "none",
      plot.margin = margin(20, 20, 20, 20)
    )
  
  return(p_treemap)
}

# =============================================================================
# CHART 3: STACKED BAR CHART - TOPICS BY AWARD TYPE
# =============================================================================

create_stacked_bar_chart <- function(data) {
  # Filter out low frequency award types (less than 150 occurrences)
  award_type_counts <- data %>%
    count(award_type, name = "count") %>%
    arrange(desc(count))
  
  cat("\n=== Award Type Distribution ===\n")
  print(award_type_counts)
  
  # Identify low frequency categories
  low_frequency_categories <- award_type_counts %>%
    filter(count < 150) %>%
    pull(award_type)
  
  # Filter data to remove low frequency categories
  data_filtered <- data %>%
    filter(!award_type %in% low_frequency_categories)
  
  # Check for NA values
  na_count <- sum(is.na(data_filtered$category_name))
  empty_count <- sum(data_filtered$category_name == "", na.rm = TRUE)
  cat("\n=== NA/Empty Category Investigation ===\n")
  cat("• Records with NA category_name:", na_count, "\n")
  cat("• Records with empty category_name:", empty_count, "\n")
  
  # Remove NA and empty category_name values
  data_filtered <- data_filtered %>%
    filter(!is.na(category_name), category_name != "")
  
  cat("• Records after removing NA/empty categories:", nrow(data_filtered), "\n\n")
  
  # Group by award_type and category_name
  grouped_data <- data_filtered %>%
    count(award_type, category_name) %>%
    group_by(award_type) %>%
    mutate(
      percentage = round(n / sum(n) * 100, 1),
      # Only show labels for segments > 2%
      label = if_else(percentage > 2, paste0(percentage, "%"), "")
    ) %>%
    ungroup()
  
  # Create the stacked bar chart
  p_stacked <- ggplot(grouped_data, aes(x = award_type, y = n, fill = category_name)) +
    geom_col(position = "fill", alpha = 0.8) +
    geom_text(aes(label = label), 
              position = position_fill(vjust = 0.5), 
              size = 3, color = "white", fontface = "bold") +
    scale_fill_manual(values = category_colors) +
    scale_y_continuous(labels = label_percent(), expand = expansion(mult = c(0, 0.02))) +
    labs(
      title = "Work Topics Categories by Award Type",
      subtitle = "Proportion of work topic categories within each award type (excluding award types with <150 occurrences)",
      x = "Award Type", 
      y = "Proportion of Categories",
      fill = "Topic Category"
    ) +
    theme_minimal() +
    theme(
      plot.title = element_text(size = 14, face = "bold", hjust = 0),
      plot.subtitle = element_text(size = 11, color = "gray40", hjust = 0),
      axis.title = element_text(size = 11, face = "bold"),
      axis.text = element_text(size = 10),
      legend.title = element_text(size = 11, face = "bold"),
      legend.text = element_text(size = 9),
      panel.grid.minor = element_blank(),
      panel.grid.major = element_line(color = "gray90", linewidth = 0.3),
      strip.text = element_text(size = 10, face = "bold"),
      axis.text.x = element_text(angle = 45, hjust = 1),
      legend.position = "bottom",
      plot.margin = margin(20, 20, 20, 20, unit = "pt")
    ) +
    guides(fill = guide_legend(nrow = 2))  # Arrange legend in 2 rows
  
  # Print summary statistics
  cat("\n=== CHART SUMMARY: Topics by Award Type ===\n")
  cat("• Award types with <150 occurrences removed:", paste(low_frequency_categories, collapse = ", "), "\n")
  cat("• Remaining award types:", n_distinct(data_filtered$award_type), "\n")
  cat("• Total awards analyzed:", nrow(data_filtered), "\n\n")
  
  # Show top category for each award type
  top_categories <- data_filtered %>%
    group_by(award_type) %>%
    count(category_name) %>%
    mutate(percentage = round(n / sum(n) * 100, 1)) %>%
    slice_max(percentage, n = 1) %>%
    ungroup()
  
  cat("Top category by award type:\n")
  for(i in 1:nrow(top_categories)) {
    cat("• ", top_categories$award_type[i], ": ", 
        top_categories$category_name[i], " (", 
        top_categories$percentage[i], "%)\n", sep = "")
  }
  cat("\n")
  
  return(p_stacked)
}

# =============================================================================
# CREATE AND SAVE VISUALIZATIONS
# =============================================================================

cat("=== CREATING VISUALIZATIONS ===\n\n")

# Create donut chart
cat("Creating donut chart...\n")
p1_donut <- create_donut_chart(df_filtered)
print(p1_donut)

# Save donut chart
ggsave(
  filename = file.path(OUTPUT_DIR, "work_topics_donut.png"),
  plot = p1_donut,
  width = DONUT_CHART_WIDTH,
  height = DONUT_CHART_HEIGHT,
  dpi = 300
)
cat("✓ Donut chart saved\n\n")

# Create stacked bar chart
cat("Creating stacked bar chart by award type...\n")
p2_stacked <- create_stacked_bar_chart(df_filtered)
print(p2_stacked)

# Save stacked bar chart
ggsave(
  filename = file.path(OUTPUT_DIR, "work_topics_by_award_type_filtered.png"),
  plot = p2_stacked,
  width = 12,
  height = 6,
  dpi = 300
)
cat("✓ Stacked bar chart saved\n\n")

# Create individual treemaps for each category
cat("Creating individual category treemaps...\n\n")

for(i in seq_along(actual_categories)) {
  cat_name <- actual_categories[i]
  cat(sprintf("Creating treemap for %s...\n", cat_name))
  
  # Create treemap
  p_treemap <- create_category_treemap(df_filtered, cat_name)
  
  if(!is.null(p_treemap)) {
    # Display treemap
    print(p_treemap)
    
    # Save treemap
    filename <- paste0("work_topics_treemap_", sprintf("%02d", i), "_", 
                       gsub("[^A-Za-z0-9]", "_", cat_name), ".png")
    ggsave(
      filename = file.path(OUTPUT_DIR, filename),
      plot = p_treemap,
      width = TREEMAP_WIDTH,
      height = TREEMAP_HEIGHT,
      dpi = 300
    )
    cat(sprintf("✓ Treemap saved: %s\n", filename))
    
    # Print summary
    subcat_summary <- df_filtered %>%
      filter(category_name == cat_name) %>%
      count(subcategory_name, sort = TRUE) %>%
      mutate(percentage_overall = round(n / nrow(df_filtered) * 100, 2)) %>%
      head(3)
    
    cat("  Top 3 subcategories:\n")
    for(j in 1:min(3, nrow(subcat_summary))) {
      cat(sprintf("  - %s: %s awards (%.2f%% overall)\n", 
                  subcat_summary$subcategory_name[j],
                  comma(subcat_summary$n[j]),
                  subcat_summary$percentage_overall[j]))
    }
    cat("\n")
  }
}

# =============================================================================
# SUMMARY STATISTICS
# =============================================================================

cat("=== WORK TOPICS SUMMARY ===\n")
cat("• Total awards analyzed:", comma(nrow(df_filtered)), "\n")
cat("• Main categories:", n_distinct(df_filtered$category_name), "\n")
cat("• Total subcategories:", n_distinct(df_filtered$subcategory_name), "\n")
cat("• Average awards per category:", round(nrow(df_filtered) / n_distinct(df_filtered$category_name), 1), "\n")
cat("• Average subcategories per category:", 
    round(n_distinct(df_filtered$subcategory_name) / n_distinct(df_filtered$category_name), 1), "\n\n")

# Top subcategories overall
cat("Top 5 Subcategories Overall:\n")
top_subcats <- df_filtered %>%
  count(subcategory_name, category_name, sort = TRUE) %>%
  mutate(percentage = round(n / nrow(df_filtered) * 100, 2)) %>%
  head(5)

for(i in 1:nrow(top_subcats)) {
  cat(sprintf("%d. %s (%s): %s awards (%.2f%%)\n", 
              i, 
              top_subcats$subcategory_name[i],
              top_subcats$category_name[i],
              comma(top_subcats$n[i]),
              top_subcats$percentage[i]))
}

# =============================================================================
# ENHANCED POWERPOINT INSIGHTS GENERATION
# =============================================================================

generate_enhanced_topics_insights <- function(data) {
  insights <- character()
  
  # Calculate total subcategories
  total_subcategories <- data %>%
    summarise(total_subcats = n_distinct(subcategory_name)) %>%
    pull(total_subcats)
  
  # Overall category distribution
  category_summary <- data %>%
    count(category_name, sort = TRUE) %>%
    mutate(percentage = round(n / sum(n) * 100, 1))
  
  top_category <- category_summary[1, ]
  bottom_category <- category_summary[nrow(category_summary), ]
  
  # Main taxonomy insight
  overall_insight <- paste0(
    "Work topics taxonomy coverage: ", comma(sum(category_summary$n)), " awards analyzed across ", 
    nrow(category_summary), " main categories with ", total_subcategories, " subcategories. ",
    top_category$category_name, " dominates with ", top_category$percentage, "% (", comma(top_category$n), " awards) while ",
    bottom_category$category_name, " represents ", bottom_category$percentage, 
    "% (", comma(bottom_category$n), " awards), indicating ", 
    round(top_category$percentage / bottom_category$percentage, 1), "x difference in recognition focus"
  )
  insights <- c(insights, overall_insight)
  
  # Subcategory complexity analysis
  subcat_complexity <- data %>%
    group_by(category_name) %>%
    summarise(
      num_subcategories = n_distinct(subcategory_name),
      total_awards = n(),
      .groups = "drop"
    ) %>%
    mutate(
      avg_awards_per_subcat = round(total_awards / num_subcategories, 1)
    ) %>%
    arrange(desc(num_subcategories))
  
  if(nrow(subcat_complexity) > 1) {
    most_complex <- subcat_complexity[1, ]
    least_complex <- subcat_complexity[nrow(subcat_complexity), ]
    
    complexity_insight <- paste0(
      "Category granularity analysis: ", most_complex$category_name, " shows highest behavioral complexity with ", 
      most_complex$num_subcategories, " subcategories (", 
      most_complex$avg_awards_per_subcat, " avg awards each) vs ",
      least_complex$category_name, " with ", least_complex$num_subcategories, 
      " subcategories (", least_complex$avg_awards_per_subcat, " avg awards each), suggesting ",
      ifelse(most_complex$num_subcategories >= 2 * least_complex$num_subcategories, "significantly varied", "moderately varied"),
      " recognition patterns"
    )
    insights <- c(insights, complexity_insight)
  }
  
  # Behavioral diversity across subcategories
  subcat_diversity <- data %>%
    group_by(category_name) %>%
    summarise(
      unique_subcats = n_distinct(subcategory_name),
      total_awards = n(),
      top_subcat_awards = max(table(subcategory_name)),
      .groups = "drop"
    ) %>%
    mutate(
      concentration_ratio = round(top_subcat_awards / total_awards * 100, 1)
    ) %>%
    arrange(concentration_ratio)
  
  if(nrow(subcat_diversity) > 1) {
    most_diverse <- subcat_diversity[1, ]
    most_concentrated <- subcat_diversity[nrow(subcat_diversity), ]
    
    diversity_insight <- paste0(
      "Behavioral recognition diversity: ", most_diverse$category_name, " shows most balanced subcategory distribution (",
      most_diverse$concentration_ratio, "% in top subcategory) while ", most_concentrated$category_name, 
      " shows highest concentration (", most_concentrated$concentration_ratio, "% in top subcategory), indicating ",
      ifelse(most_concentrated$concentration_ratio - most_diverse$concentration_ratio > 20, "significant", "moderate"),
      " variation in behavioral focus patterns"
    )
    insights <- c(insights, diversity_insight)
  }
  
  # Award type pattern analysis (for stacked bar insights)
  if ("award_type" %in% colnames(data)) {
    # Filter out low frequency award types
    award_type_counts <- data %>%
      count(award_type) %>%
      filter(n >= 150)
    
    valid_award_types <- award_type_counts$award_type
    
    type_patterns <- data %>%
      filter(award_type %in% valid_award_types) %>%
      group_by(award_type) %>%
      count(category_name) %>%
      mutate(percentage = round(n / sum(n) * 100, 1)) %>%
      slice_max(percentage, n = 1) %>%
      ungroup() %>%
      arrange(desc(percentage))
    
    if(nrow(type_patterns) > 1) {
      strongest_pattern <- type_patterns[1, ]
      type_insight <- paste0(
        "Award type behavioral patterns: ", strongest_pattern$award_type, " awards show strongest category concentration toward ",
        strongest_pattern$category_name, " (", strongest_pattern$percentage, "%), while award types vary significantly in their topic focus, ",
        "suggesting type-specific recognition behaviors"
      )
      insights <- c(insights, type_insight)
    }
  }
  top_subcategories <- data %>%
    count(subcategory_name, category_name, sort = TRUE) %>%
    mutate(percentage = round(n / nrow(data) * 100, 2)) %>%
    head(3)
  
  if(nrow(top_subcategories) > 0) {
    top_subcat_insight <- paste0(
      "Leading recognition behaviors: Top subcategory '", top_subcategories$subcategory_name[1], 
      "' from ", top_subcategories$category_name[1], " represents ", top_subcategories$percentage[1], 
      "% of all awards (", comma(top_subcategories$n[1]), " awards), followed by '",
      top_subcategories$subcategory_name[2], "' (", top_subcategories$percentage[2], "%), highlighting key organizational focus areas"
    )
    insights <- c(insights, top_subcat_insight)
  }
  
  return(insights)
}

cat("\n=== ENHANCED WORK TOPICS INSIGHTS FOR POWERPOINT ===\n\n")

# Generate and display insights
tryCatch({
  enhanced_topics_insights <- generate_enhanced_topics_insights(df_filtered)
  
  for (i in seq_along(enhanced_topics_insights)) {
    cat("•", enhanced_topics_insights[i], "\n\n")
  }
}, error = function(e) {
  cat("Error generating insights:", e$message, "\n")
  enhanced_topics_insights <- c("Error generating detailed insights - check data structure")
})

# =============================================================================
# COPY-PASTE READY OUTPUT FOR POWERPOINT
# =============================================================================

cat("=== COPY-PASTE READY FOR POWERPOINT ===\n\n")
cat("Work Topics Analysis - Enhanced\n")
cat("===============================\n\n")

if (exists("enhanced_topics_insights")) {
  for (insight in enhanced_topics_insights) {
    cat("• ", insight, "\n\n")
  }
} else {
  cat("• Basic work topics analysis completed\n\n")
}

cat("Data source: Work topics taxonomy analytics with enhanced subcategory analysis\n")
cat("Categories analyzed: ", n_categories, " main categories with ", 
    n_distinct(df_filtered$subcategory_name), " total subcategories\n")
cat("Sample size: ", comma(nrow(df_filtered)), " awards with complete category data\n")
cat("Awards excluded: ", paste(EXCLUDE_AWARD_REASONS, collapse = ", "), " (", comma(excluded_count), " awards)\n")
cat("Charts generated: 1 donut overview + 1 stacked bar chart + ", length(actual_categories), " individual category treemaps\n")
cat("Analysis includes: Category distribution, award type patterns, subcategory complexity, and behavioral diversity\n")

# =============================================================================
# DETAILED CATEGORY BREAKDOWN FOR SLIDES
# =============================================================================

cat("\n=== DETAILED CATEGORY BREAKDOWN (FOR INDIVIDUAL SLIDES) ===\n\n")

# For each category, generate slide-ready insights
for(i in seq_along(actual_categories)) {
  cat_name <- actual_categories[i]
  
  cat(paste0("SLIDE ", i + 1, ": ", cat_name, "\n"))
  cat(paste0(rep("-", nchar(cat_name) + 10), collapse = ""), "\n")
  
  # Get category-specific data
  cat_data <- df_filtered %>%
    filter(category_name == cat_name)
  
  # Category overview
  cat_total <- nrow(cat_data)
  cat_pct <- round(cat_total / nrow(df_filtered) * 100, 1)
  cat_subcats <- n_distinct(cat_data$subcategory_name)
  
  cat("Overview: ", comma(cat_total), " awards (", cat_pct, "% of total) across ", 
      cat_subcats, " subcategories\n\n")
  
  # Top subcategories
  top_3 <- cat_data %>%
    count(subcategory_name, sort = TRUE) %>%
    mutate(
      pct_of_category = round(n / cat_total * 100, 1),
      pct_overall = round(n / nrow(df_filtered) * 100, 2)
    ) %>%
    head(3)
  
  cat("Top Subcategories:\n")
  for(j in 1:nrow(top_3)) {
    cat(sprintf("• %s: %s awards (%.1f%% of category, %.2f%% overall)\n",
                top_3$subcategory_name[j],
                comma(top_3$n[j]),
                top_3$pct_of_category[j],
                top_3$pct_overall[j]))
  }
  
  # Category insight
  concentration <- round(sum(top_3$n) / cat_total * 100, 1)
  cat("\nKey Insight: Top 3 subcategories represent ", concentration, "% of ", cat_name, " awards, ",
      ifelse(concentration > 60, "showing high concentration in specific behaviors",
             ifelse(concentration > 40, "indicating moderate focus areas",
                    "demonstrating diverse recognition patterns")), "\n\n")
}

cat("\n=== VISUALIZATIONS COMPLETE ===\n")
cat("Files saved to:", OUTPUT_DIR, "directory\n")
cat("• 1 donut chart showing category distribution\n")
cat("• 1 stacked bar chart showing topics by award type\n")
cat("•", length(actual_categories), "individual treemaps (one per category)\n")



# =============================================================================
# EXTRACT SLIDE 1 DATA FOR EASY INSIGHTS
# =============================================================================

extract_slide1_data <- function(data) {
  
  # Calculate category summary
  category_summary <- data %>%
    count(category_name, sort = TRUE) %>%
    mutate(
      percentage = round(n / sum(n) * 100, 1)
    ) %>%
    head(9)  # Take top 6 categories
  
  # Calculate key metrics
  total_messages <- nrow(data)
  total_subcategories <- n_distinct(data$subcategory_name)
  
  # Calculate combinations
  top2_percent <- round(category_summary$percentage[1] + category_summary$percentage[2], 1)
  top3_percent <- round(category_summary$percentage[1] + category_summary$percentage[2] + category_summary$percentage[3], 1)
  ratio_1to6 <- round(category_summary$percentage[1] / category_summary$percentage[6], 1)
  
  cat("=============================================================================\n")
  cat("SLIDE 1 DATA EXTRACTION - COPY THESE VALUES\n")
  cat("=============================================================================\n\n")
  
  cat("TOTAL MESSAGES:", comma(total_messages), "\n")
  cat("TOTAL SUBCATEGORIES:", total_subcategories, "\n\n")
  
  cat("CATEGORIES (in order):\n")
  cat("-----------------------\n")
  for(i in 1:6) {
    cat(sprintf("CATEGORY_%d: %s\n", i, category_summary$category_name[i]))
    cat(sprintf("PERCENT_%d: %.1f\n", i, category_summary$percentage[i]))
    cat(sprintf("COUNT_%d: %s\n\n", i, comma(category_summary$n[i])))
  }
  
  cat("CALCULATED COMBINATIONS:\n")
  cat("------------------------\n")
  cat("TOP 2 COMBINED:", top2_percent, "%\n")
  cat("TOP 3 COMBINED:", top3_percent, "%\n")
  cat("RATIO (Cat1/Cat6):", ratio_1to6, "x\n\n")
  
  cat("=============================================================================\n")
  cat("READY-TO-USE INSIGHTS WITH YOUR DATA\n")
  cat("=============================================================================\n\n")
  
  cat("Key Findings:\n\n")
  
  cat(sprintf("• Behavioral Focus Areas: Analysis of %s recognition messages reveals 6 main behavioral categories with %d subcategories, demonstrating comprehensive coverage of workplace behaviors\n\n",
              comma(total_messages),
              total_subcategories))
  
  cat(sprintf("• Recognition Concentration: Top 2 categories (%s at %.1f%% and %s at %.1f%%) account for %.1f%% of all recognition, indicating strong organizational emphasis on collaborative and customer-focused behaviors\n\n",
              category_summary$category_name[1],
              category_summary$percentage[1],
              category_summary$category_name[2],
              category_summary$percentage[2],
              top2_percent))
  
  cat(sprintf("• Distribution Pattern: %s dominates at %.1f%% while %s represents %.1f%% (%.1fx difference), suggesting moderately concentrated recognition approach\n\n",
              category_summary$category_name[1],
              category_summary$percentage[1],
              category_summary$category_name[6],
              category_summary$percentage[6],
              ratio_1to6))
  
  cat("Strategic Insights:\n\n")
  
  cat(sprintf("• %s Premium: The %.1f%% focus on %s (nearly 1 in %.0f recognitions) signals strong cultural emphasis on teamwork and collective achievement\n\n",
              category_summary$category_name[1],
              category_summary$percentage[1],
              tolower(category_summary$category_name[1]),
              round(100/category_summary$percentage[1])))
  
  cat(sprintf("• %s at %.1f%% represents smallest category, suggesting potential opportunity to enhance cultural and community initiatives\n\n",
              category_summary$category_name[6],
              category_summary$percentage[6]))
  
  # Return the data for further use
  return(category_summary)
}

# =============================================================================
# RUN THE EXTRACTION
# =============================================================================

# Call the function with your data
slide1_data <- extract_slide1_data(df_filtered)

# Also create a simple table view
cat("\n=============================================================================\n")
cat("SIMPLE TABLE VIEW\n")
cat("=============================================================================\n")
print(slide1_data)


