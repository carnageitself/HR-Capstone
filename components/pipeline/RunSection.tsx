"use client";

import { useState, useEffect } from "react";

interface RunSectionProps {
  selectedCompanyId: string;
  onCompanyChange: (id: string) => void;
}

interface RunStatus {
  phase: number;
  status: string;
  provider: string;
  elapsed_seconds?: number;
  duration_seconds?: number;
}

export default function RunSection({
  selectedCompanyId,
  onCompanyChange,
}: RunSectionProps) {
  const [runName, setRunName] = useState("");
  const [phase1Models, setPhase1Models] = useState({ groq: true, groq_qwen: true });
  const [isRunning, setIsRunning] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, RunStatus>>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [enriching, setEnriching] = useState<Record<string, boolean>>({});

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
    }
  }

  async function triggerPipeline(provider: string) {
    if (!runName.trim()) {
      alert("Please enter a run name");
      return;
    }

    // Sanitize run name: replace spaces with underscores, remove special chars
    const sanitizedRunName = runName.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
    const finalRunName = `${selectedCompanyId}_${provider}_${sanitizedRunName}`;

    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runName: finalRunName,
          provider,
          companyId: selectedCompanyId,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setIsRunning(true);
        setStatuses({
          ...statuses,
          [finalRunName]: { phase: 1, status: "starting", provider },
        });
        pollStatus(finalRunName);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Failed to start pipeline: ${error}`);
    }
  }

  async function enrichDashboard(finalRunName: string) {
    setEnriching((prev) => ({ ...prev, [finalRunName]: true }));
    try {
      const res = await fetch("/api/pipeline/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          runName: finalRunName,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        console.log(`Enriched ${data.rowsWritten} awards for dashboard`);
      } else {
        console.error("Enrich error:", data.error);
      }
    } catch (error) {
      console.error("Failed to enrich dashboard:", error);
    } finally {
      setEnriching((prev) => ({ ...prev, [finalRunName]: false }));
    }
  }

  async function pollStatus(runName: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pipeline/status?runName=${runName}`);
        const data = await res.json();

        if (data.ok) {
          const status = data.status;
          setStatuses((prev) => ({ ...prev, [runName]: status }));

          if (status.status === "complete" && status.phase === 3) {
            clearInterval(interval);
            setIsRunning(false);
            // Auto-trigger enrichment for dashboard
            enrichDashboard(runName);
          }
        }
      } catch (error) {
        console.error("Poll error:", error);
      }
    }, 3000);
  }

  const phaseLabels = {
    1: "Taxonomy Seeding",
    2: "Bulk Classification",
    3: "Taxonomy Finalization",
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Configure and Run Pipeline</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Run Name (identifier)
            </label>
            <input
              type="text"
              placeholder="e.g. experiment_1"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Phase 1 Models to Evaluate (All via Groq)
          </label>
          <div className="flex gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={phase1Models.groq}
                onChange={(e) =>
                  setPhase1Models({ ...phase1Models, groq: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm">Llama 3.3 70B - $0.10/$0.32</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={phase1Models.groq_qwen}
                onChange={(e) =>
                  setPhase1Models({ ...phase1Models, groq_qwen: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm">Qwen 3 32B - $0.29/$0.59</span>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-gray-600 mb-3 bg-blue-50 border border-blue-200 rounded p-3">
            <span className="font-medium">Multi-Model Evaluation:</span> All checked models run in parallel for automatic comparison. Phase 1 will test all selected models and show results side-by-side in the scorecard.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => triggerPipeline("groq")}
              disabled={isRunning || (!phase1Models.groq && !phase1Models.groq_qwen)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
            >
              Run Pipeline
            </button>
          </div>
        </div>
      </div>

      {Object.entries(statuses).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pipeline Progress</h3>
          {Object.entries(statuses).map(([name, status]) => (
            <div key={name} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{name}</h4>
                  <p className="text-xs text-gray-500">
                    Provider: {status.provider ? status.provider.toUpperCase() : "Unknown"}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    status.status === "complete"
                      ? "text-green-600"
                      : "text-blue-600"
                  }`}
                >
                  {status.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2">
                {[1, 2, 3].map((phase) => {
                  const phaseDescriptions: Record<number, { title: string; description: string }> = {
                    1: {
                      title: "Taxonomy Discovery",
                      description: "Cloud LLM analyzes sample award messages and discovers recognition categories"
                    },
                    2: {
                      title: "Award Classification",
                      description: "Local Llama (llama3:8b) classifies all your awards into discovered categories"
                    },
                    3: {
                      title: "Taxonomy Refinement",
                      description: "Cloud LLM polishes categories based on classification results"
                    }
                  };
                  const desc = phaseDescriptions[phase];

                  return (
                    <div
                      key={phase}
                      className="flex items-center gap-3 group relative"
                      title={`${desc.title}: ${desc.description}`}
                    >
                      <span className="text-xs font-medium w-24 text-gray-600">
                        Phase {phase}:
                      </span>
                      <div className="flex-1 relative">
                        <div
                          className={`h-2 rounded-full ${
                            status.phase > phase
                              ? "bg-green-500"
                              : status.phase === phase && status.status === "running"
                              ? "bg-blue-500"
                              : "bg-gray-200"
                          }`}
                        />
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10 pointer-events-none">
                          <div className="font-semibold">{desc.title}</div>
                          <div className="text-gray-200">{desc.description}</div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {status.phase > phase
                          ? "Complete"
                          : status.phase === phase && status.status === "running"
                          ? "Running"
                          : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {status.duration_seconds && (
                <p className="text-xs text-gray-500 mt-3">
                  Duration: {status.duration_seconds.toFixed(1)}s
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!isRunning && Object.entries(statuses).length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            Pipeline runs complete!
            {Object.entries(enriching).some(([_, e]) => e) && (
              <span> Enriching dashboard data...</span>
            )}
            {!Object.entries(enriching).some(([_, e]) => e) && (
              <span> Go to "Compare Results" to view side-by-side analysis.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
