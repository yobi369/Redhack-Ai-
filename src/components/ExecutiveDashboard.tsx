import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Server,
  Cpu,
  Bot,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Target,
  Lock,
} from "lucide-react";
import { SecurityScoreRecord } from "../db/models";

interface ExecutiveDashboardProps {
  onNavigate: (tab: any) => void;
  onOpenScopeModal: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigate,
  onOpenScopeModal,
}) => {
  const [scoreData, setScoreData] = useState<SecurityScoreRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchScore = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v2/security-score");
      if (res.ok) {
        const data = await res.json();
        setScoreData(data);
      }
    } catch (e) {
      console.error("Failed to load security score", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, []);

  const gradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
      case "B":
        return "text-blue-400 border-blue-500/40 bg-blue-500/10";
      case "C":
        return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
      case "D":
      case "F":
        return "text-red-400 border-red-500/40 bg-red-500/10";
      default:
        return "text-zinc-400 border-zinc-700 bg-zinc-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-red-500/10 text-red-400 border border-red-500/20">
              EXECUTIVE POSTURE
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry & Finding Aggregation
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Enterprise Security Command & Resilience Posture
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 max-w-2xl">
            Unified risk index synthesized across asset exposure, active adversary intrusions, AI/MCP tool surfaces, and verified remediation lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchScore}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Recalculate
          </button>
          <button
            onClick={onOpenScopeModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-800/40 transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            Rules of Engagement
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Unified Security Score Card */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="h-20 w-20 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Unified Security Score
              </span>
              <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${gradeColor(scoreData?.letterGrade || "B")}`}>
                Grade {scoreData?.letterGrade || "B"}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {scoreData?.overallScore ?? 84}
              </span>
              <span className="text-sm font-mono text-zinc-500">/ 100</span>
              <span className="ml-auto flex items-center text-xs text-emerald-400 font-mono">
                <ArrowUpRight className="h-3.5 w-3.5" /> +4.2%
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Algorithm: Exposure $\times$ KEV $\times$ Remediated</span>
            <button
              onClick={() => onNavigate("findings")}
              className="text-red-400 hover:text-red-300 font-medium flex items-center gap-0.5"
            >
              Inspect <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Active Intrusions & Incidents Card */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldAlert className="h-20 w-20 text-red-500" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Active Critical Incidents
              </span>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                ACTION REQUIRED
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-red-400 tracking-tight">
                1
              </span>
              <span className="text-xs font-mono text-zinc-400">Intrusion in progress</span>
              <span className="ml-auto flex items-center text-xs text-red-400 font-mono">
                <ArrowDownRight className="h-3.5 w-3.5" /> Containment gate pending
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>FIN-WK-09 Kerberoasting</span>
            <button
              onClick={() => onNavigate("soar")}
              className="text-red-400 hover:text-red-300 font-medium flex items-center gap-0.5"
            >
              Open SOAR <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* AI & MCP Agent Attack Surface */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bot className="h-20 w-20 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                AI & MCP Tool Security
              </span>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                AUDITED
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-purple-400 tracking-tight">
                72
              </span>
              <span className="text-sm font-mono text-zinc-500">/ 100</span>
              <span className="ml-auto text-xs text-yellow-400 font-mono">
                3 Tools Over-scoped
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>MCP Tool Calling Sandbox</span>
            <button
              onClick={() => onNavigate("ai_security")}
              className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-0.5"
            >
              Audit Tools <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Multi-Agent Swarm Status */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu className="h-20 w-20 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Autonomous SecOps Agents
              </span>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                9 / 9 ACTIVE
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-cyan-400 tracking-tight">
                100%
              </span>
              <span className="text-xs font-mono text-zinc-400">Governed by RoE</span>
              <span className="ml-auto text-xs text-emerald-400 font-mono">
                Approval Gates On
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Zero Unrestricted Shell Tools</span>
            <button
              onClick={() => onNavigate("agents")}
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5"
            >
              Agent Matrix <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Security Breakdown & Score Anatomy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Breakdown Bars */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-red-400" />
                Unified Security Score Decomposition
              </h3>
              <p className="text-xs text-zinc-400">
                Six-pillar mathematical risk evaluation calculated across the workspace.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Last audit: Just now
            </span>
          </div>

          <div className="space-y-3.5">
            {[
              {
                label: "Asset Exposure & Perimeter Surface",
                value: scoreData?.breakdown.assetExposure ?? 78,
                weight: "15%",
                desc: "Weighted calculation based on internet-facing vs internal isolated workloads.",
              },
              {
                label: "Severity & Exploitability Defense",
                value: scoreData?.breakdown.severityExploitability ?? 70,
                weight: "30%",
                desc: "Active CISA KEV catalog presence and CVSS v3.1 exploit vectors.",
              },
              {
                label: "Detection Coverage (SIEM, EDR & CloudTrail)",
                value: scoreData?.breakdown.detectionCoverage ?? 92,
                weight: "15%",
                desc: "Telemetry correlation coverage across AWS, CrowdStrike, and Sysmon endpoints.",
              },
              {
                label: "Remediation Velocity & Lifecycle Velocity",
                value: scoreData?.breakdown.remediationStatus ?? 65,
                weight: "15%",
                desc: "Ratio of discovered vulnerabilities successfully patched vs open backlog.",
              },
              {
                label: "Business Impact & Crown Jewels Protection",
                value: scoreData?.breakdown.businessImpactRisk ?? 82,
                weight: "15%",
                desc: "Protection level of mission-critical customer databases and PCI-DSS assets.",
              },
              {
                label: "AI, MCP & LLM Agent Security",
                value: 75,
                weight: "10%",
                desc: "Prompt injection resistance, tool permission sandboxing, and token isolation.",
              },
            ].map((metric, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-[11px]">(Weight: {metric.weight})</span>
                    <span className="font-mono font-semibold text-white">{metric.value}%</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metric.value >= 85
                        ? "bg-emerald-500"
                        : metric.value >= 70
                        ? "bg-blue-500"
                        : metric.value >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400">{metric.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick SecOps Action Drawer */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                Priority SecOps Operations
              </h3>
              <p className="text-xs text-zinc-400">
                Recommended tactical actions for the operational team.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    Human Approval Required
                  </span>
                  <span className="text-[10px] font-mono text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded">
                    GATE
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Host isolation queued for Finance Controller Workstation (FIN-WK-09). Requires CISO or SOC Lead sign-off.
                </p>
                <button
                  onClick={() => onNavigate("soar")}
                  className="w-full mt-2 py-1.5 px-3 rounded bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  Review Approval in SOAR
                </button>
              </div>

              <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-purple-400" />
                    MCP Bridge Security Audit
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded">
                    AI AGENTS
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Tool parameters in MCP gateway need schema validation against indirect prompt injection.
                </p>
                <button
                  onClick={() => onNavigate("ai_security")}
                  className="w-full mt-2 py-1.5 px-3 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  Audit MCP Permissions
                </button>
              </div>

              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-cyan-400" />
                    Authorized Purple Team Emulation
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    PRE-FLIGHT PASS
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Target scope 10.0.0.0/24 verified against Rules of Engagement. Production databases excluded.
                </p>
                <button
                  onClick={() => onNavigate("purple")}
                  className="w-full mt-2 py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  Launch Validation Lab
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Tenant: Apex Cyber Global</span>
            <button
              onClick={() => onNavigate("reports")}
              className="text-red-400 hover:text-red-300 font-medium"
            >
              Export Executive PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
