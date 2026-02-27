"use client";

import { useState } from "react";
import { Taxonomy } from "@/lib/pipelineTypes";

interface TaxonomyTreeProps {
  taxonomy: Taxonomy;
  title?: string;
}

export default function TaxonomyTree({
  taxonomy,
  title = "Taxonomy",
}: TaxonomyTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryColor = (index: number): string => {
    const colors = [
      "border-orange-500 bg-orange-50",
      "border-blue-500 bg-blue-50",
      "border-green-500 bg-green-50",
      "border-purple-500 bg-purple-50",
      "border-pink-500 bg-pink-50",
      "border-indigo-500 bg-indigo-50",
      "border-teal-500 bg-teal-50",
      "border-yellow-500 bg-yellow-50",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-900">{title}</h3>

      <div className="space-y-3">
        {taxonomy.categories.map((category, catIndex) => (
          <div
            key={category.id}
            className={`border-l-4 rounded-lg p-4 transition-all ${getCategoryColor(
              catIndex
            )}`}
          >
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 select-none">
                    {expandedCategories.has(category.id) ? "▼" : "▶"}
                  </span>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {category.name}
                  </h4>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded">
                    {category.subcategories.length}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2 ml-6">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Subcategories - Expanded */}
            {expandedCategories.has(category.id) && (
              <div className="mt-4 ml-6 space-y-3 border-t pt-4">
                {category.subcategories.length > 0 ? (
                  category.subcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="border-l-2 border-gray-300 pl-3 py-2"
                    >
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-medium text-gray-800">
                          {subcategory.name}
                        </p>
                        <span className="text-xs text-gray-400">
                          ({subcategory.id})
                        </span>
                      </div>
                      {subcategory.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {subcategory.description}
                        </p>
                      )}
                      {subcategory.examples && subcategory.examples.length > 0 && (
                        <div className="mt-2 bg-gray-50 rounded p-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Annotations:
                          </p>
                          <ul className="space-y-1">
                            {subcategory.examples.map((example, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-gray-600 flex items-start gap-2"
                              >
                                <span className="text-gray-400 flex-shrink-0">
                                  •
                                </span>
                                <span>{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    No subcategories
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Total Categories</p>
            <p className="text-lg font-bold text-orange-600">
              {taxonomy.categories.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Subcategories</p>
            <p className="text-lg font-bold text-blue-600">
              {taxonomy.categories.reduce(
                (sum, cat) => sum + cat.subcategories.length,
                0
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg per Category</p>
            <p className="text-lg font-bold text-purple-600">
              {(
                taxonomy.categories.reduce(
                  (sum, cat) => sum + cat.subcategories.length,
                  0
                ) / taxonomy.categories.length
              ).toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
