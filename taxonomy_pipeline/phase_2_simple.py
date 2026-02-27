"""
phase_2_simple.py
Simple Phase 2 - Classify awards into Phase 1 taxonomy categories
Uses keyword matching on award messages to assign categories
"""

import logging
import json
from pathlib import Path
from typing import Dict, List, Tuple
import csv

logger = logging.getLogger("phase_2")


def run(taxonomy: Dict = None, awards_csv: str = None) -> Tuple[Dict, Dict]:
    """
    Simple classification: Match award messages to taxonomy categories
    by looking for keywords in category descriptions and subcategories.

    Returns: (phase2_data, candidate_categories)
    """
    if not taxonomy or not awards_csv:
        logger.error("Missing taxonomy or awards_csv")
        return ({}, {})

    logger.info("Phase 2: Simple Award Classification")

    # Load awards from CSV
    awards = []
    try:
        with open(awards_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            awards = list(reader)
        logger.info(f"Loaded {len(awards)} awards from CSV")
    except Exception as e:
        logger.error(f"Failed to load awards: {e}")
        return ({}, {})

    # Build keyword index from taxonomy
    category_keywords = {}
    categories = taxonomy.get('taxonomy', {}).get('categories', [])

    for cat in categories:
        cat_id = cat.get('id')
        cat_name = cat.get('name', '')
        cat_desc = cat.get('description', '')
        keywords = set()

        # Add category name and description keywords
        for word in (cat_name + " " + cat_desc).lower().split():
            if len(word) > 3:
                keywords.add(word.strip('.,!?;'))

        # Add subcategory keywords
        for subcat in cat.get('subcategories', []):
            subcat_name = subcat.get('name', '')
            for word in subcat_name.lower().split():
                if len(word) > 3:
                    keywords.add(word.strip('.,!?;'))

        category_keywords[cat_id] = {
            'name': cat_name,
            'keywords': keywords
        }

    # Classify awards
    classifications = {}
    candidate_categories = {}

    for award in awards:
        award_id = award.get('award_id', '')
        award_title = award.get('award_title', '')
        award_msg = award.get('award_message', '')

        # Combine title and message for classification
        text = (award_title + " " + award_msg).lower()

        best_category = None
        best_score = 0

        # Score each category based on keyword matches
        for cat_id, cat_info in category_keywords.items():
            score = 0
            for keyword in cat_info['keywords']:
                if keyword in text:
                    score += 1

            if score > best_score:
                best_score = score
                best_category = cat_id

        # Assign category (default to first if no matches)
        if not best_category and categories:
            best_category = categories[0].get('id')
            best_score = 0.5

        if best_category:
            classifications[award_id] = {
                'category_id': best_category,
                'category_name': category_keywords[best_category]['name'],
                'confidence': min(0.95, 0.5 + (best_score * 0.1))
            }

    logger.info(f"Classified {len(classifications)} awards")

    # Build phase2 results
    phase2_data = {
        'metadata': {
            'total_messages': len(awards),
            'total_classified': len(classifications),
            'average_confidence': sum(c['confidence'] for c in classifications.values()) / max(len(classifications), 1)
        },
        'classifications': classifications,
        'candidate_categories': candidate_categories
    }

    return (phase2_data, candidate_categories)
