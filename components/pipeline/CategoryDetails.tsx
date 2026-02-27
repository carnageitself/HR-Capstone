"use client";

import { useState } from "react";
import { Taxonomy } from "@/lib/pipelineTypes";

interface CategoryDetailsProps {
  taxonomy: Taxonomy;
  title?: string;
}

export default function CategoryDetails({
  taxonomy,
  title = "Category & Annotation Details",
}: CategoryDetailsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    taxonomy.categories.length > 0 ? taxonomy.categories[0].id : null
  );

  const selectedCat = taxonomy.categories.find((c) => c.id === selectedCategory);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Category List */}
      <div className="md:col-span-1">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {taxonomy.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category.id
                    ? "bg-blue-100 border-l-4 border-blue-500 text-blue-900 font-medium"
                    : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                }`}
              >
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {category.subcategories.length} subcategories
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Details */}
      <div className="md:col-span-2">
        {selectedCat ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedCat.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    ID: {selectedCat.id}
                  </p>
                </div>
                {selectedCat.color && (
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-200"
                    style={{ backgroundColor: selectedCat.color }}
                  />
                )}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {selectedCat.description}
              </p>
            </div>

            {/* Subcategories with Annotations */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Subcategories & Annotations
              </h3>
              <div className="space-y-4">
                {selectedCat.subcategories.length > 0 ? (
                  selectedCat.subcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="mb-3">
                        <div className="flex items-baseline gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {subcategory.name}
                          </h4>
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {subcategory.id}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {subcategory.description}
                        </p>
                      </div>

                      {/* Annotations/Examples */}
                      {subcategory.examples && subcategory.examples.length > 0 && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-blue-900 mb-3 uppercase tracking-wide">
                            Annotations & Examples
                          </p>
                          <ul className="space-y-2">
                            {subcategory.examples.map((example, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-blue-800 flex items-start gap-3"
                              >
                                <span className="text-blue-400 flex-shrink-0 mt-1">
                                  ▹
                                </span>
                                <span className="flex-1">{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(!subcategory.examples || subcategory.examples.length === 0) && (
                        <p className="text-xs text-gray-500 italic mt-2">
                          No annotations provided
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No subcategories defined
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">Select a category to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
