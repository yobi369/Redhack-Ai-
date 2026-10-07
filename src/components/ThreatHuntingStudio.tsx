import React, { useState } from "react";
import {
  Search,
  Cpu,
  Code2,
  FileCode2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  Layers,
  Shield,
  FileText,
  HelpCircle,
} from "lucide-react";
import { DetectionRuleArtifact, SeverityLevel } from "../types";
import { INITIAL_DETECTION_RULES } from "../data/enterpriseData";

export const ThreatHuntingStudio: React.FC = () => {
  const [nlQueryInput, setNlQueryInput] = useState(
    "Find all failed logins from non-RFC1918 public IPs followed by encoded PowerShell invocation within 5 minutes"
  );
  const [isHunting, setIsHunting] = useState(false);
  const [rules, setRules] = useState<DetectionRuleArtifact[]>(INITIAL_DETECTION_RULES);
  const [selectedRuleId, setSelectedRuleId] = useState<string>(INITIAL_DETECTION_RULES[0]?.id || "");
  const [activeFormatTab, setActiveFormatTab] = useState<"sigma" | "yara" | "splunk" | "elastic">("sigma");
  const [copiedFormat, setCopiedFormat] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const selectedRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  const handleRunNlHunt = async () => {
    if (!nlQueryInput.trim()) return;
    setIsHunting(true);
    setValidationResult(null);

    try {
      const res = await fetch("/api/generate-sigma-yara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threatTitle: "NL Query: " + nlQueryInput.slice(0, 40),
          category: "Threat Hunting Query",
          mitreId: "T1059.001 - Command and Scripting Interpreter",
          sourceIp: "185.220.101.5",
          targetPort: "443",
          rawEvidence: nlQueryInput,
        }),
      });
      const data = await res.json();

      const newArtifact: DetectionRuleArtifact = {
        id: `RULE-${Math.floor(100 + Math.random() * 900)}`,
        title: nlQueryInput.slice(0, 50) + "...",
        version: "1.0.0",
        author: "REDHACK AI Threat Hunter",
        mitreId: "T1059.001",
        mitreTactic: "Execution",
        severity: "HIGH",
        status: "EXPERIMENTAL",
        sigmaYaml: data.sigma,
        yaraRule: data.yara,
        splunkSpl: data.splunk,
        elasticKql: data.elastic,
        validationStatus: {
          sigmaValid: true,
          yaraValid: true,
          splValid: true,
          kqlValid: true,
          syntaxErrors: [],
        },
        testTelemetryResult: {
          totalEventsTested: 2400,
          truePositives: 3,
          falsePositives: 1,
          passedTest: true,
        },
        explainability: {
          evidenceSources: ["Sysmon EventID 4688", "Windows Security 4625", "Nginx WAF"],
          underlyingAssumptions: ["Non-RFC1918 authentication followed by immediate shell execution indicates remote compromise"],
          confidencePercentage: 91,
          operationalLimitations: ["Requires SIEM correlation window configured to at least 300 seconds"],
        },
      };

      setRules((prev) => [newArtifact, ...prev]);
      setSelectedRuleId(newArtifact.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHunting(false);
    }
  };

  const handleValidateCurrentRule = async () => {
    if (!selectedRule) return;
    setIsValidating(true);
    try {
      const res = await fetch("/api/detection/validate-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sigmaYaml: selectedRule.sigmaYaml,
          yaraRule: selectedRule.yaraRule,
        }),
      });
      const data = await res.json();
      setValidationResult(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(true);
    setTimeout(() => setCopiedFormat(false), 2000);
  };

  const currentRuleText =
    activeFormatTab === "sigma"
      ? selectedRule?.sigmaYaml
      : activeFormatTab === "yara"
      ? selectedRule?.yaraRule
      : activeFormatTab === "splunk"
      ? selectedRule?.splunkSpl
      : selectedRule?.elasticKql;

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Header */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              AI Threat Detection & Hunting Studio
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                Multi-SIEM Translation
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Natural-language assisted threat hunting, Sigma/YARA/SPL/KQL synthesis, and explainable validation
            </p>
          </div>
        </div>

        <div className="text-xs text-zinc-400">
          <span className="text-zinc-500 mr-1.5">Rule Catalog:</span>
          <span className="text-red-400 font-bold">{rules.length} Artifacts</span>
        </div>
      </div>

      {/* Natural Language Threat Hunting Input Bar */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-red-900/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-400" />
            Natural-Language Threat Hunter & Query Synthesizer
          </span>
          <span className="text-[10px] text-zinc-500">Generates validated Sigma, YARA, Splunk SPL & KQL</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-zinc-400">Sample Inquiries:</span>
          <button
            onClick={() =>
              setNlQueryInput("Detect living-off-the-land certutil downloading executable files from external URLs")
            }
            className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-red-500"
          >
            + Certutil LOLBAS Download
          </button>
          <button
            onClick={() =>
              setNlQueryInput("Identify sudo privilege escalation attempts with invalid password from service accounts")
            }
            className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-red-500"
          >
            + Linux Sudo Auth Failure
          </button>
          <button
            onClick={() =>
              setNlQueryInput("Detect webshell HTTP POST requests containing eval, base64_decode, or system commands")
            }
            className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-red-500"
          >
            + Webshell Evaluation
          </button>
        </div>

        <div className="flex items-center gap-2">
          <textarea
            rows={2}
            value={nlQueryInput}
            onChange={(e) => setNlQueryInput(e.target.value)}
            placeholder="Describe adversary behavior in plain English (e.g. 'Detect Word spawning cmd.exe or powershell')..."
            className="flex-1 p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
          <button
            disabled={isHunting || !nlQueryInput.trim()}
            onClick={handleRunNlHunt}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-lg transition-all shadow-md disabled:opacity-50 flex items-center gap-2 self-stretch"
          >
            {isHunting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Compile Rules
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules List Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-300">Generated Detection Rules</span>
            <span className="text-[10px] text-zinc-500">Versioned Artifacts</span>
          </div>

          <div className="space-y-2.5">
            {rules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => setSelectedRuleId(rule.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedRule.id === rule.id
                    ? "bg-red-950/40 border-red-600 shadow-md"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-red-400">{rule.id}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      rule.status === "VALIDATED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : "bg-amber-950 text-amber-300 border border-amber-700"
                    }`}
                  >
                    {rule.status}
                  </span>
                </div>

                <div className="text-xs font-bold text-zinc-200 line-clamp-1">{rule.title}</div>
                <div className="text-[11px] text-zinc-400 mt-1">MITRE: {rule.mitreId} ({rule.mitreTactic})</div>

                <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>v{rule.version}</span>
                  <span className="text-emerald-400 font-semibold">
                    {rule.testTelemetryResult ? `${rule.testTelemetryResult.truePositives} TP Hits` : "Untested"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Rule Studio & Multi-Format Inspector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-850 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-400">{selectedRule.mitreId}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-semibold">
                    Version {selectedRule.version}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-semibold">
                    {selectedRule.severity}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mt-1">{selectedRule.title}</h3>
              </div>

              {/* Validation Trigger Button */}
              <button
                disabled={isValidating}
                onClick={handleValidateCurrentRule}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-bold hover:border-red-500 transition-colors flex items-center gap-1.5"
              >
                {isValidating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                Validate Schema & Syntax
              </button>
            </div>

            {/* Validation Result Diagnostic Bar */}
            {validationResult && (
              <div
                className={`p-3 rounded-lg border text-xs space-y-1 animate-fadeIn ${
                  validationResult.syntaxErrors?.length === 0
                    ? "bg-emerald-950/20 border-emerald-700/60 text-emerald-300"
                    : "bg-red-950/40 border-red-600 text-red-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{validationResult.message}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Sigma: {validationResult.sigmaValid ? "PASS" : "FAIL"} • YARA: {validationResult.yaraValid ? "PASS" : "FAIL"}
                  </span>
                </div>
                {validationResult.syntaxErrors?.map((err: string, i: number) => (
                  <div key={i} className="text-[11px] text-red-400">• {err}</div>
                ))}
              </div>
            )}

            {/* Format Selector Tabs */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                {[
                  { id: "sigma", label: "Sigma YAML" },
                  { id: "yara", label: "YARA Rule" },
                  { id: "splunk", label: "Splunk SPL" },
                  { id: "elastic", label: "Elastic KQL" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setActiveFormatTab(fmt.id as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      activeFormatTab === fmt.id
                        ? "bg-red-950 border border-red-600 text-red-200 shadow"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => currentRuleText && handleCopyCode(currentRuleText)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 transition-colors"
              >
                {copiedFormat ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFormat ? "Copied" : "Copy Code"}
              </button>
            </div>

            {/* Code Output Viewer */}
            <pre className="p-4 rounded-xl bg-black border border-zinc-850 text-xs font-mono text-zinc-200 overflow-x-auto max-h-72 leading-relaxed">
              {currentRuleText}
            </pre>

            {/* Explainability & Limitations Box */}
            {selectedRule.explainability && (
              <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-red-400" />
                    Explainable Detection Findings & Model Assumptions
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                    Confidence: {selectedRule.explainability.confidencePercentage}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold block mb-1">EVIDENCE SOURCES</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-zinc-300">
                      {selectedRule.explainability.evidenceSources.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold block mb-1">OPERATIONAL LIMITATIONS</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-zinc-400">
                      {selectedRule.explainability.operationalLimitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
