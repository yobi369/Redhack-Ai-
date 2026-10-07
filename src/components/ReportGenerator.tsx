import React, { useState } from "react";
import {
  FileText,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Code2,
  Printer,
  ChevronRight,
  Calculator,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { VulnerabilityFinding, SeverityLevel } from "../types";
import { CvssCalculatorModal } from "./CvssCalculatorModal";

interface ReportGeneratorProps {
  findings: VulnerabilityFinding[];
  setFindings: React.Dispatch<React.SetStateAction<VulnerabilityFinding[]>>;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  findings,
  setFindings,
}) => {
  const [targetName, setTargetName] = useState("api.target-corp.internal");
  const [assessmentType, setAssessmentType] = useState("Vulnerability Assessment & Penetration Test");
  const [scope, setScope] = useState("Web Applications, REST APIs, and Perimeter Firewall");
  const [testerName, setTesterName] = useState("REDHACK AI Security Companion");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // New finding state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCvssModal, setShowCvssModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSeverity, setNewSeverity] = useState<SeverityLevel>("HIGH");
  const [newCvss, setNewCvss] = useState(7.5);
  const [newVectorString, setNewVectorString] = useState("");
  const [newCwe, setNewCwe] = useState("CWE-89 (SQL Injection)");
  const [newAsset, setNewAsset] = useState("https://api.target-corp.internal/v1/auth");
  const [newDesc, setNewDesc] = useState("Unsanitized parameter permits arbitrary SQL execution.");
  const [newPoC, setNewPoC] = useState("' OR 1=1--");
  const [newImpact, setNewImpact] = useState("Full database compromise & credential leakage.");
  const [newRemediation, setNewRemediation] = useState("Use parameterized queries or ORM prepared statements.");

  const handleAddFinding = () => {
    if (!newTitle.trim()) return;
    const finding: VulnerabilityFinding = {
      id: `FIND-${Date.now().toString().slice(-4)}`,
      title: newTitle,
      severity: newSeverity,
      cvss: Number(newCvss),
      cwe: newCwe,
      asset: newAsset,
      description: newDesc,
      proofOfConcept: newPoC,
      impact: newImpact,
      remediation: newRemediation,
      verified: true,
    };
    setFindings((prev) => [...prev, finding]);
    setShowAddModal(false);
    // Reset
    setNewTitle("");
  };

  const handleRemoveFinding = (id: string) => {
    setFindings((prev) => prev.filter((f) => f.id !== id));
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetName,
          assessmentType,
          scope,
          testerName,
          findings,
        }),
      });
      const data = await res.json();
      setGeneratedMarkdown(data.markdown || "# Report generation finished.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!generatedMarkdown) return;
    const blob = new Blob([generatedMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `REDHACK-Report-${targetName.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const reportData = {
      target: targetName,
      assessmentType,
      scope,
      date: new Date().toISOString(),
      findingsCount: findings.length,
      findings,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `REDHACK-Audit-${targetName.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!generatedMarkdown) return;
    navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-mono animate-fadeIn">
      {/* Top Scope & Config Card */}
      <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950 border border-red-700/60 text-red-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                Automated Vulnerability & Penetration Test Report Generator
              </h2>
              <span className="text-[11px] text-zinc-500">
                AI-driven CVSS calculation, executive summaries, PoC breakdown, and remediation guides
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="generate-report-btn"
              disabled={isGenerating || findings.length === 0}
              onClick={handleGenerateReport}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-lg shadow-lg disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating Executive Report...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate AI Executive Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">TARGET HOST / SYSTEM</label>
            <input
              id="report-target-input"
              type="text"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">ASSESSMENT SCOPE</label>
            <input
              id="report-scope-input"
              type="text"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">ASSESSOR / LEAD</label>
            <input
              type="text"
              value={testerName}
              onChange={(e) => setTesterName(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Findings List & Management */}
      <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Discovered Findings & Vulnerability Inventory ({findings.length})
            </h3>
          </div>

          <button
            id="add-finding-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-red-400 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Finding
          </button>
        </div>

        {findings.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No vulnerabilities listed. Click "Add Finding" or import directly from the Threat Monitor.
          </div>
        ) : (
          <div className="space-y-2.5">
            {findings.map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        f.severity === "CRITICAL"
                          ? "bg-red-950 text-red-300 border border-red-600"
                          : f.severity === "HIGH"
                          ? "bg-amber-950 text-amber-300 border border-amber-600"
                          : "bg-blue-950 text-blue-300 border border-blue-600"
                      }`}
                    >
                      {f.severity} • CVSS {f.cvss}
                    </span>
                    <span className="font-bold text-zinc-200">{f.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({f.cwe})</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    <span className="text-zinc-500">Asset: </span>
                    <span className="text-red-300 font-mono">{f.asset}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{f.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRemoveFinding(f.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generated Report Preview */}
      {generatedMarkdown && (
        <div className="p-6 rounded-xl bg-zinc-950 border border-red-900/50 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-zinc-100">
                Generated Executive Vulnerability Report
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="copy-report-btn"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Markdown"}</span>
              </button>

              <button
                id="download-md-report-btn"
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export .MD</span>
              </button>

              <button
                id="download-json-report-btn"
                onClick={handleDownloadJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Export .JSON</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-black/80 border border-zinc-800 text-zinc-200 text-xs leading-relaxed space-y-4 max-h-[700px] overflow-y-auto">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-base font-extrabold text-red-400 border-b border-zinc-800 pb-2 mb-3">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-bold text-red-300 mt-4 mb-2 border-b border-zinc-900 pb-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs font-semibold text-amber-400 mt-3 mb-1">
                    {children}
                  </h3>
                ),
                code: ({ inline, className, children, ...props }: any) => {
                  if (inline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-red-300 text-[11px]">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="p-3 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 text-[11px] overflow-x-auto my-2">
                      <code>{children}</code>
                    </pre>
                  );
                },
              }}
            >
              {generatedMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Add Finding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-100">Add Discovered Vulnerability</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Vulnerability Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Cross-Site Scripting (Reflected XSS)"
                  className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as SeverityLevel)}
                    className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] text-zinc-400">CVSS v3.1</label>
                    <button
                      type="button"
                      onClick={() => setShowCvssModal(true)}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                    >
                      <Calculator className="w-3 h-3" />
                      Calc
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={newCvss}
                    onChange={(e) => setNewCvss(Number(e.target.value))}
                    className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200"
                  />
                </div>
              </div>

              {newVectorString && (
                <div className="p-2 bg-black rounded border border-zinc-800 text-[10px] font-mono text-emerald-400">
                  <span className="text-zinc-500">Vector: </span>
                  {newVectorString}
                </div>
              )}

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Affected Asset / Endpoint</label>
                <input
                  type="text"
                  value={newAsset}
                  onChange={(e) => setNewAsset(e.target.value)}
                  className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Remediation Recommendation</label>
                <textarea
                  value={newRemediation}
                  onChange={(e) => setNewRemediation(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-900 text-zinc-400 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFinding}
                className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Save Finding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CVSS Calculator Modal */}
      {showCvssModal && (
        <CvssCalculatorModal
          initialCvss={newCvss}
          onApplyCvss={(score, vector, severity) => {
            setNewCvss(score);
            setNewVectorString(vector);
            setNewSeverity(severity);
            setShowCvssModal(false);
          }}
          onClose={() => setShowCvssModal(false)}
        />
      )}
    </div>
  );
};
