import React, { useState, useEffect } from "react";
import {
  Bot,
  Shield,
  ShieldAlert,
  Code,
  Globe,
  FileCode,
  Terminal,
  FileText,
  Cpu,
  Play,
  CheckCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
} from "lucide-react";
import { SpecializedAgent, AgentRun } from "../db/models";

interface MultiAgentConsoleProps {
  onOpenApprovalInSoar?: () => void;
}

export const MultiAgentConsole: React.FC<MultiAgentConsoleProps> = ({
  onOpenApprovalInSoar,
}) => {
  const [agents, setAgents] = useState<SpecializedAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<SpecializedAgent | null>(null);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [testTarget, setTestTarget] = useState("10.0.1.5 (K8s API Gateway)");
  const [runResult, setRunResult] = useState<any>(null);

  const fetchAgentsAndRuns = async () => {
    try {
      setLoading(true);
      const [resAgents, resRuns] = await Promise.all([
        fetch("/api/v2/agents"),
        fetch("/api/v2/agents/runs"),
      ]);
      if (resAgents.ok) {
        const ags = await resAgents.json();
        setAgents(ags);
        if (ags.length > 0 && !selectedAgent) {
          setSelectedAgent(ags[0]);
        }
      }
      if (resRuns.ok) {
        const rns = await resRuns.json();
        setAgentRuns(rns);
      }
    } catch (e) {
      console.error("Failed to load agent console data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsAndRuns();
  }, []);

  const handleRunAgent = async (agent: SpecializedAgent) => {
    try {
      setExecuting(true);
      setRunResult(null);
      const res = await fetch("/api/v2/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentCodeName: agent.codeName,
          triggerType: "MANUAL",
          inputContext: {
            target: testTarget,
            objective: `Autonomous ${agent.displayName} security validation and analysis.`,
          },
          invokedBy: "Marcus Vance (SOC Admin)",
        }),
      });

      if (res.ok) {
        const runData = await res.json();
        setRunResult(runData);
        fetchAgentsAndRuns();
      }
    } catch (e) {
      console.error("Agent execution failed", e);
    } finally {
      setExecuting(false);
    }
  };

  const getAgentIcon = (codeName: string) => {
    switch (codeName) {
      case "orchestrator":
        return <Cpu className="h-5 w-5 text-indigo-400" />;
      case "security_analyst":
        return <Shield className="h-5 w-5 text-blue-400" />;
      case "code_security":
        return <Code className="h-5 w-5 text-emerald-400" />;
      case "threat_intel":
        return <Globe className="h-5 w-5 text-purple-400" />;
      case "detection_engineer":
        return <FileCode className="h-5 w-5 text-yellow-400" />;
      case "incident_response":
        return <Terminal className="h-5 w-5 text-red-400" />;
      case "validation_agent":
        return <ShieldAlert className="h-5 w-5 text-orange-400" />;
      case "reporting_agent":
        return <FileText className="h-5 w-5 text-cyan-400" />;
      case "ai_security_agent":
        return <Bot className="h-5 w-5 text-pink-400" />;
      default:
        return <Bot className="h-5 w-5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              MULTI-AGENT ARCHITECTURE
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              9 Specialized Agents Online with Scoped Tools
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Autonomous Cybersecurity Agent Swarm & Guardrails
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 max-w-3xl">
            Modern cybersecurity operations require division of labor: every agent runs with strictly defined tool permissions.
            Destructive, external, or high-consequence operations mandate explicit Human-in-the-Loop approval.
          </p>
        </div>

        <button
          onClick={fetchAgentsAndRuns}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Swarm
        </button>
      </div>

      {/* Main Grid: Agent Selector + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 9 Agents List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Specialized Agents (9)
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Zero Unrestricted Shell Access
            </span>
          </div>

          <div className="space-y-2">
            {agents.map((agent) => {
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-zinc-800/90 border-red-500/50 shadow-md shadow-red-950/20"
                      : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      {getAgentIcon(agent.codeName)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">
                          {agent.displayName}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {agent.availableTools.length} tools
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {agent.roleDescription}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`h-4 w-4 mt-2 transition-transform ${
                      isSelected ? "text-red-400 translate-x-1" : "text-zinc-600"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Agent Deep-Dive & Execution Console */}
        <div className="lg:col-span-7 space-y-5">
          {selectedAgent ? (
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-5">
              {/* Agent Title & Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    {getAgentIcon(selectedAgent.codeName)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {selectedAgent.displayName}
                    </h3>
                    <p className="text-xs font-mono text-zinc-400">
                      ID: {selectedAgent.codeName} • Status: Active
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunAgent(selectedAgent)}
                    disabled={executing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition-colors shadow-lg shadow-red-900/30"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {executing ? "Agent Running..." : "Execute Scoped Agent"}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/60">
                <span className="text-xs font-mono uppercase text-zinc-400 block mb-1">
                  Agent Mandate & Boundaries
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedAgent.roleDescription}
                </p>
              </div>

              {/* Scoped Tools vs Human Approval Gates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Permitted Scoped Tools */}
                <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/40 space-y-2.5">
                  <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Permitted Scoped Tools
                  </span>
                  <div className="space-y-2">
                    {selectedAgent.availableTools.map((tool, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded border border-zinc-850 bg-zinc-900/60 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-zinc-200 font-semibold">{tool.name}()</span>
                          <span className="text-[10px] text-zinc-500">{tool.requiredPermission}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">{tool.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mandated Human Approval Gates */}
                <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 space-y-2.5">
                  <span className="text-xs font-mono font-semibold text-red-400 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Mandatory Human Approval Required
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    The agent is strictly blocked from executing these actions autonomously. A human approver must confirm:
                  </p>
                  <div className="space-y-1.5">
                    {selectedAgent.requiresHumanApprovalFor.map((action, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 rounded border border-red-500/20 bg-red-950/30 text-xs font-mono text-red-300 flex items-center gap-2"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Execution Target Input */}
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2">
                <label className="text-xs font-mono text-zinc-400 block">
                  Simulated Target Asset / Scope Input:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testTarget}
                    onChange={(e) => setTestTarget(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                    placeholder="e.g. 10.0.1.5 or api.internal-corp.io"
                  />
                  <button
                    onClick={() => handleRunAgent(selectedAgent)}
                    disabled={executing}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 rounded border border-zinc-600 transition-colors"
                  >
                    Test Run
                  </button>
                </div>
              </div>

              {/* Live Run Output Display */}
              {runResult && (
                <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-950/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      Agent Execution Completed Successfully
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      ID: {runResult.id}
                    </span>
                  </div>
                  <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 space-y-1">
                    <p className="text-emerald-400 font-semibold">
                      Analysis: {runResult.outputResult?.analysis}
                    </p>
                    <p className="text-zinc-400">
                      Confidence: {runResult.outputResult?.confidence}
                    </p>
                    <div className="mt-2 text-zinc-300">
                      <span className="text-zinc-400">Recommendations:</span>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        {runResult.outputResult?.recommendations?.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-900/40 text-zinc-500">
              Select an agent from the left to inspect its scoped permissions and tool configuration.
            </div>
          )}

          {/* Recent Agent Swarm Execution Log */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <span className="text-xs font-mono uppercase text-zinc-400">
                Recent Swarm Execution Audit Trail
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Immutable agent ledger
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {agentRuns.length > 0 ? (
                agentRuns.map((run) => (
                  <div
                    key={run.id}
                    className="p-2.5 rounded border border-zinc-850 bg-zinc-950/60 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span className="font-semibold text-zinc-200">
                        {run.agentDisplayName}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        [{run.triggerType}]
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-zinc-400">
                        {run.toolCalls?.length || 1} tool calls
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(run.startedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-500 py-3 text-center">
                  No previous agent runs recorded in this workspace session.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
