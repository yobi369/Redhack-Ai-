import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  User,
  History,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Lock,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Finding, FindingLifecycleStatus, SeverityLevel } from "../db/models";

const LIFECYCLE_STEPS: FindingLifecycleStatus[] = [
  "DISCOVERED",
  "TRIAGED",
  "VALIDATING",
  "CONFIRMED",
  "REMEDIATION",
  "RETEST",
  "RESOLVED",
];

export const FindingLifecycleManager: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [transitionNotes, setTransitionNotes] = useState("");

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v2/findings");
      if (res.ok) {
        const data = await res.json();
        setFindings(data);
        if (data.length > 0 && !selectedFinding) {
          setSelectedFinding(data[0]);
        } else if (selectedFinding) {
          const updated = data.find((f: Finding) => f.id === selectedFinding.id);
          if (updated) setSelectedFinding(updated);
        }
      }
    } catch (e) {
      console.error("Failed to load findings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, []);

  const handleTransition = async (targetStatus: FindingLifecycleStatus) => {
    if (!selectedFinding) return;
    try {
      setTransitioning(true);
      const res = await fetch(`/api/v2/findings/${selectedFinding.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus: targetStatus,
          actorName: "Marcus Vance (CISO Desk)",
          notes: transitionNotes || `Transitioned finding lifecycle to ${targetStatus}`,
        }),
      });

      if (res.ok) {
        setTransitionNotes("");
        fetchFindings();
      }
    } catch (e) {
      console.error("Transition failed", e);
    } finally {
      setTransitioning(false);
    }
  };

  const filteredFindings = findings.filter((f) => {
    const matchesSev = filterSeverity === "ALL" || f.severity === filterSeverity;
    const matchesStat = filterStatus === "ALL" || f.lifecycleStatus === filterStatus;
    return matchesSev && matchesStat;
  });

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  const getLifecycleColor = (status: FindingLifecycleStatus) => {
    switch (status) {
      case "RESOLVED":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "REMEDIATION":
      case "RETEST":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "VALIDATING":
      case "CONFIRMED":
        return "text-purple-400 bg-purple-500/10 border-purple-500/30";
      case "DISMISSED":
        return "text-zinc-400 bg-zinc-800 border-zinc-700";
      default:
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-red-500/10 text-red-400 border border-red-500/20">
              UNIFIED FINDING LIFECYCLE
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              DISCOVERED → TRIAGED → VALIDATING → CONFIRMED/DISMISSED → REMEDIATION → RETEST → RESOLVED
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Vulnerability Finding Governance & Verification Pipeline
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 max-w-3xl">
            Every security finding maintains complete cryptographic evidence, business impact analysis,
            remediation guidance, and an immutable audit trail of human decisions.
          </p>
        </div>

        <button
          onClick={fetchFindings}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Pipeline
        </button>
      </div>

      {/* Main Grid: Finding List + Finding Deep-Dive Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Finding Selector List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filters */}
          <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Severity:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="ALL">All</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DISCOVERED">Discovered</option>
                <option value="TRIAGED">Triaged</option>
                <option value="VALIDATING">Validating</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="REMEDIATION">Remediation</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          {/* Finding Cards */}
          <div className="space-y-2.5">
            {filteredFindings.map((finding) => {
              const isSelected = selectedFinding?.id === finding.id;
              return (
                <div
                  key={finding.id}
                  onClick={() => setSelectedFinding(finding)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-zinc-800/90 border-red-500/50 shadow-md shadow-red-950/20"
                      : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(finding.severity)}`}>
                      {finding.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getLifecycleColor(finding.lifecycleStatus)}`}>
                      {finding.lifecycleStatus}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-white line-clamp-1">
                      {finding.title}
                    </h4>
                    <p className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
                      <span>Asset: {finding.assetName}</span>
                      {finding.cveId && <span>• {finding.cveId}</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Finding Complete Inspector */}
        <div className="lg:col-span-7 space-y-5">
          {selectedFinding ? (
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-6">
              {/* Finding Title & Header */}
              <div className="space-y-2 border-b border-zinc-800 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getSeverityBadge(selectedFinding.severity)}`}>
                      {selectedFinding.severity}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      Confidence: {selectedFinding.confidence}
                    </span>
                    {selectedFinding.cveId && (
                      <span className="text-xs font-mono text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/30">
                        {selectedFinding.cveId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    ID: {selectedFinding.id}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">
                  {selectedFinding.title}
                </h3>

                <p className="text-xs text-zinc-400 font-mono">
                  Affected Asset: <span className="text-zinc-200">{selectedFinding.assetName}</span> ({selectedFinding.assetExposure})
                </p>
              </div>

              {/* Lifecycle Progress Bar */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-zinc-400 block">
                  Current Lifecycle Progression
                </span>
                <div className="grid grid-cols-7 gap-1 bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-[10px] font-mono text-center">
                  {LIFECYCLE_STEPS.map((step, idx) => {
                    const currentIdx = LIFECYCLE_STEPS.indexOf(selectedFinding.lifecycleStatus);
                    const isPassed = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <div
                        key={step}
                        className={`py-1.5 px-1 rounded transition-colors ${
                          isCurrent
                            ? "bg-red-600 text-white font-bold shadow-md shadow-red-900/30"
                            : isPassed
                            ? "bg-zinc-800 text-zinc-300"
                            : "text-zinc-600"
                        }`}
                      >
                        {step}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Explanation & Business Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-1.5">
                  <span className="text-xs font-mono uppercase text-zinc-400">
                    Technical Explanation
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {selectedFinding.explanation}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-1.5">
                  <span className="text-xs font-mono uppercase text-zinc-400">
                    Business Impact
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {selectedFinding.businessImpact}
                  </p>
                </div>
              </div>

              {/* Captured Evidence */}
              <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-1.5">
                <span className="text-xs font-mono uppercase text-cyan-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Captured Technical Evidence Artifact
                </span>
                <div className="p-3 rounded bg-zinc-900 border border-zinc-850 font-mono text-xs text-zinc-300 break-all">
                  {selectedFinding.evidence}
                </div>
              </div>

              {/* Recommended Remediation */}
              <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-950/10 space-y-1.5">
                <span className="text-xs font-mono uppercase text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Recommended Engineering Remediation
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedFinding.recommendedRemediation}
                </p>
              </div>

              {/* Lifecycle State Transition Action Controls */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-zinc-300 font-semibold">
                    Execute Lifecycle Transition
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Requires Authorized Operator
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Optional audit notes for this status transition..."
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedFinding.lifecycleStatus === "DISCOVERED" && (
                    <button
                      onClick={() => handleTransition("TRIAGED")}
                      disabled={transitioning}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
                    >
                      Promote to TRIAGED
                    </button>
                  )}

                  {selectedFinding.lifecycleStatus === "TRIAGED" && (
                    <>
                      <button
                        onClick={() => handleTransition("VALIDATING")}
                        disabled={transitioning}
                        className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-colors"
                      >
                        Queue for VALIDATING (Safe Lab)
                      </button>
                      <button
                        onClick={() => handleTransition("DISMISSED")}
                        disabled={transitioning}
                        className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
                      >
                        Dismiss as False Positive
                      </button>
                    </>
                  )}

                  {selectedFinding.lifecycleStatus === "VALIDATING" && (
                    <>
                      <button
                        onClick={() => handleTransition("CONFIRMED")}
                        disabled={transitioning}
                        className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-xs font-medium text-white transition-colors"
                      >
                        Confirm Exploitability (CONFIRMED)
                      </button>
                      <button
                        onClick={() => handleTransition("DISMISSED")}
                        disabled={transitioning}
                        className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
                      >
                        Dismiss (Non-Exploitable)
                      </button>
                    </>
                  )}

                  {selectedFinding.lifecycleStatus === "CONFIRMED" && (
                    <button
                      onClick={() => handleTransition("REMEDIATION")}
                      disabled={transitioning}
                      className="px-3 py-1.5 rounded bg-yellow-600 hover:bg-yellow-500 text-xs font-medium text-white transition-colors"
                    >
                      Assign to Engineering (REMEDIATION)
                    </button>
                  )}

                  {selectedFinding.lifecycleStatus === "REMEDIATION" && (
                    <button
                      onClick={() => handleTransition("RETEST")}
                      disabled={transitioning}
                      className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-colors"
                    >
                      Queue for Verification RETEST
                    </button>
                  )}

                  {selectedFinding.lifecycleStatus === "RETEST" && (
                    <button
                      onClick={() => handleTransition("RESOLVED")}
                      disabled={transitioning}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
                    >
                      Verify Fixed & Close (RESOLVED)
                    </button>
                  )}

                  {selectedFinding.lifecycleStatus === "RESOLVED" && (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      Finding fully resolved and verified.
                    </span>
                  )}
                </div>
              </div>

              {/* Immutable Finding Audit Trail */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Immutable Audit Ledger ({selectedFinding.auditTrail?.length || 0} Events)
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedFinding.auditTrail?.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded border border-zinc-800 bg-zinc-950/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-300 font-semibold">{entry.actor}</span>
                        <span className="text-zinc-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-zinc-400">{entry.previousStatus}</span>
                        <ArrowRight className="h-3 w-3 text-red-400" />
                        <span className="text-white font-bold">{entry.newStatus}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px]">{entry.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-900/40 text-zinc-500">
              Select a vulnerability finding from the left to inspect its complete lifecycle, evidence, and audit history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
