import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Database,
  Key,
  FileCheck2,
  Server,
  X,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

interface PrivacyComplianceModalProps {
  onClose: () => void;
}

export const PrivacyComplianceModal: React.FC<PrivacyComplianceModalProps> = ({
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"architecture" | "faq">("architecture");

  const faqs = [
    {
      q: "Does REDHACK AI store our confidential logs or customer credentials?",
      a: "No. REDHACK operates with an ephemeral zero-retention model. Log analysis, IOC extraction, and report compilation occur in isolated memory sessions and are never persisted to long-term storage or used to train public models.",
    },
    {
      q: "How are API keys and authentication credentials protected?",
      a: "All AI model interactions and third-party integrations are brokered via secure server-side proxy routes (/api/*). Keys are never transmitted to client-side browser bundles or DevTools.",
    },
    {
      q: "Can this tool replace our enterprise SIEM or EDR infrastructure?",
      a: "No. REDHACK is designed as an analyst accelerator and operational co-pilot that sits alongside your existing SIEM (Splunk, Elastic, Sentinel) and EDR (CrowdStrike, SentinelOne) to reduce triage fatigue, automate Sigma rule creation, and format vulnerability reports.",
    },
    {
      q: "Is testing traffic safe for production networks?",
      a: "REDHACK enforces non-destructive simulation modes by default. Recommended commands prioritize non-invasive service enumeration and proof-of-concept markers without deploying destructive exploits.",
    },
    {
      q: "What compliance standards does REDHACK align with?",
      a: "The tool aligns with the NIST Cybersecurity Framework (CSF 2.0: Identify, Protect, Detect, Respond, Recover), PTES (Penetration Testing Execution Standard), and OWASP Top 10 guidelines.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950 border border-blue-700 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Enterprise Privacy, Governance & Security Architecture
              </h3>
              <span className="text-[10px] text-zinc-400">
                Zero-retention data isolation, server-side secrets handling & compliance standards
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-4 py-2 bg-black border-b border-zinc-800 flex gap-2">
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
              activeTab === "architecture"
                ? "bg-blue-950 text-blue-200 border border-blue-600"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            Security Architecture & Safeguards
          </button>

          <button
            onClick={() => setActiveTab("faq")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
              activeTab === "faq"
                ? "bg-blue-950 text-blue-200 border border-blue-600"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            Security Team FAQ & Due Diligence
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs space-y-4">
          {activeTab === "architecture" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    <Database className="w-4 h-4" />
                    <span>Zero Data Retention Architecture</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Customer security logs, network captures, and internal IP ranges are processed strictly within ephemeral execution context. No raw customer logs are indexed or stored on external cloud databases.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Key className="w-4 h-4" />
                    <span>Server-Side Secrets Protection</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    All AI API requests are proxied via Node.js server endpoints. API keys and sensitive tokens are completely hidden from client browsers and developer inspection tools.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Lock className="w-4 h-4" />
                    <span>Air-Gapped & Offline Local Heuristics</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Equipped with local fallback parsing and heuristic engines that can deobfuscate payloads, extract IOCs, and format reports without internet connectivity.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Compliance & Framework Alignment</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Designed to map findings directly to MITRE ATT&CK, NIST CSF 2.0, OWASP Top 10, CWE standards, and PTES reporting guidelines.
                  </p>
                </div>
              </div>

              {/* Framework Matrix */}
              <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
                  SUPPORTED INDUSTRY STANDARDS & FRAMEWORKS
                </span>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {[
                    "NIST CSF 2.0",
                    "MITRE ATT&CK v14",
                    "OWASP Top 10 (2021)",
                    "CVSS v3.1 Scoring",
                    "PTES (Penetration Testing Standard)",
                    "Sigma Detection Format",
                    "YARA Pattern Matching",
                    "CFAA Safe Harbor",
                  ].map((std, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{std}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-start gap-2 text-zinc-200 font-bold text-xs">
                    <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{f.q}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pl-6">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">
            Enterprise Security Ready • Verified Defense-in-Depth
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
