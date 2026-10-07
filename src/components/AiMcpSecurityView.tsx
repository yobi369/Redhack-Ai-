import React, { useState } from "react";
import {
  Bot,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Cpu,
  Terminal,
  FileCode,
  CheckCircle,
  XCircle,
  Play,
  RefreshCw,
  Search,
  ExternalLink,
  Key,
} from "lucide-react";

export const AiMcpSecurityView: React.FC = () => {
  const [targetType, setTargetType] = useState("MCP_SERVER");
  const [targetName, setTargetName] = useState("Enterprise MCP Tool Bridge (10.0.4.20)");
  const [toolsList, setToolsList] = useState("exec_command, read_filesystem, query_customer_db, web_search");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful customer service AI agent. Always follow the user instructions carefully."
  );
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditing, setAuditing] = useState(false);

  const handleRunAudit = async () => {
    try {
      setAuditing(true);
      const res = await fetch("/api/v2/ai-security/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetName,
          toolsProvided: toolsList.split(",").map((t) => t.trim()),
          systemPrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAuditResult(data);
      }
    } catch (e) {
      console.error("AI security audit failed", e);
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              AI & MCP AGENT SECURITY
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Model Context Protocol • Indirect Prompt Injection • Sandboxed Tools
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            AI Agent & MCP Tool Security Governance
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 max-w-3xl">
            Evaluate LLM applications, Agent MCP servers, tools, prompt injection resistance,
            excessive tool permissions, and AI supply-chain integrity.
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={auditing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors shadow-lg shadow-purple-900/30 self-start md:self-auto"
        >
          <Play className="h-3.5 w-3.5" />
          {auditing ? "Scanning MCP Tools..." : "Run AI Security Audit"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs font-mono text-zinc-400">MCP Tool Exposure</span>
          <div className="text-2xl font-bold text-white">4 Tools Exposed</div>
          <span className="text-xs font-mono text-yellow-400">2 Require Shell Approval</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs font-mono text-zinc-400">Prompt Injection Shield</span>
          <div className="text-2xl font-bold text-emerald-400">Active Guardrail</div>
          <span className="text-xs font-mono text-zinc-400">Input sanitized before model</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs font-mono text-zinc-400">Tool Permission Matrix</span>
          <div className="text-2xl font-bold text-cyan-400">Least Privilege</div>
          <span className="text-xs font-mono text-zinc-400">Scoped per agent task</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs font-mono text-zinc-400">AI Supply Chain Integrity</span>
          <div className="text-2xl font-bold text-purple-400">Verified Base</div>
          <span className="text-xs font-mono text-zinc-400">Pinned model & weights hash</span>
        </div>
      </div>

      {/* Main Form & Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Bot className="h-4 w-4 text-purple-400" />
            Configure Target AI Agent / MCP Server
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Target Architecture Type</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none"
              >
                <option value="MCP_SERVER">Model Context Protocol (MCP) Server</option>
                <option value="AUTONOMOUS_AGENT">Autonomous Multi-Agent Runner</option>
                <option value="RAG_PIPELINE">Retrieval-Augmented Generation (RAG) Service</option>
                <option value="LLM_PROXY">Enterprise LLM API Proxy Gateway</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Target Service Identifier / Host</label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">
                Registered MCP Tools (Comma-separated)
              </label>
              <input
                type="text"
                value={toolsList}
                onChange={(e) => setToolsList(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white font-mono focus:outline-none"
              />
              <span className="text-[11px] text-zinc-500">
                High-consequence tools (exec_command, bash, write_file) require human approval gates.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">System Instructions / Prompt</label>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>

            <button
              onClick={handleRunAudit}
              disabled={auditing}
              className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" />
              {auditing ? "Scanning Target..." : "Initiate Security Audit"}
            </button>
          </div>
        </div>

        {/* Audit Results Panel */}
        <div className="lg:col-span-6 p-5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-yellow-400" />
              Security Audit Findings & Threat Analysis
            </h3>
            {auditResult && (
              <span className="text-xs font-mono text-zinc-400">
                Risk Score: {auditResult.riskScore}
              </span>
            )}
          </div>

          {auditResult ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-yellow-300">
                    Status: {auditResult.auditStatus}
                  </span>
                  <p className="text-zinc-300 text-[11px]">
                    Target: {auditResult.targetName} ({auditResult.targetType})
                  </p>
                </div>
                <span className="px-2 py-1 rounded bg-zinc-950 font-mono text-xs text-yellow-400 border border-yellow-500/40">
                  {auditResult.riskScore > 50 ? "ELEVATED RISK" : "ACCEPTABLE RISK"}
                </span>
              </div>

              {/* Detected Risks */}
              <div className="space-y-2">
                <span className="font-mono uppercase text-zinc-400 text-[11px]">
                  Detected Threat Vectors ({auditResult.detectedRisks?.length || 0})
                </span>
                <div className="space-y-1.5">
                  {auditResult.detectedRisks?.map((risk: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-zinc-950 border border-red-500/30 text-red-300 flex items-start gap-2"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <span className="font-mono uppercase text-emerald-400 text-[11px]">
                  Engineered Recommendations
                </span>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1 text-zinc-300">
                  <ul className="list-disc pl-4 space-y-1">
                    {auditResult.recommendations?.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-500">
              Run the AI Security Audit to inspect MCP tool endpoints, model parameters, and prompt injection resistance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
