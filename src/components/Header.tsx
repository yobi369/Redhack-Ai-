import React from "react";
import {
  Shield,
  ShieldAlert,
  Terminal,
  FileText,
  Wrench,
  Layers,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Radio,
  Cpu,
  Calculator,
  FileCheck,
  PlayCircle,
  Lock,
  Crosshair,
  Flame,
  Zap,
  UserCheck,
  Server,
  Bot,
  Search,
  Building2,
  Sparkles,
  Share2,
} from "lucide-react";
import { UserRole } from "../types";

export type NavigationTab =
  | "executive"
  | "soc"
  | "agents"
  | "assets"
  | "findings"
  | "ai_security"
  | "graph"
  | "evidence"
  | "monitor"
  | "easm"
  | "purple"
  | "hunting"
  | "soar"
  | "reports"
  | "intel"
  | "companion"
  | "governance"
  | "tools"
  | "workflow";

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeThreatsCount: number;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  currentRole?: UserRole;
  onOpenDemoPlaybooks?: () => void;
  onOpenRulesOfEngagement?: () => void;
  onOpenCvssCalculator?: () => void;
  onOpenPrivacyCompliance?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenWorkspaceRbac?: () => void;
  onTriggerEmergencyKillSwitch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeThreatsCount,
  isSimulating,
  setIsSimulating,
  soundEnabled,
  setSoundEnabled,
  currentRole = "L1_ANALYST",
  onOpenDemoPlaybooks,
  onOpenRulesOfEngagement,
  onOpenCvssCalculator,
  onOpenPrivacyCompliance,
  onOpenCommandPalette,
  onOpenWorkspaceRbac,
  onTriggerEmergencyKillSwitch,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 border-b border-red-900/40 backdrop-blur-md shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab("executive")}
            className="cursor-pointer relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-950 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-transform hover:scale-105"
          >
            <Shield className="w-5 h-5 text-red-100" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1
                onClick={() => setActiveTab("executive")}
                className="cursor-pointer text-lg font-extrabold tracking-wider text-zinc-100 uppercase font-mono hover:text-red-400 transition-colors"
              >
                <span className="text-red-500">RED</span>HACK{" "}
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-600 text-white font-black">v2</span>
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/80 border border-red-700/60 text-red-300 font-mono font-medium">
                ENTERPRISE SECOPS
              </span>
              <button
                onClick={onOpenWorkspaceRbac}
                className="hidden sm:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono transition-colors"
                title="Switch Workspace or View RBAC Permissions"
              >
                <Building2 className="w-3 h-3 text-red-400" />
                <span>Apex Cyber (Prod)</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-2 font-mono">
              <span className="text-red-400">DEFENSE</span> •{" "}
              <span className="text-purple-400">AI / MCP AGENTS</span> •{" "}
              <span className="text-blue-400">PURPLE TEAM</span> •{" "}
              <span className="text-emerald-400">SOAR</span>
            </p>
          </div>
        </div>

        {/* Live Status Controls & Presentation Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              title="Open Command Palette (Cmd+K / Ctrl+K)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono transition-colors shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Commands</span>
              <kbd className="text-[10px] bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-400">
                ⌘K
              </kbd>
            </button>
          )}

          {onOpenDemoPlaybooks && (
            <button
              id="header-open-demo-playbooks-btn"
              onClick={onOpenDemoPlaybooks}
              title="10-Minute Guided Demo Scenarios & Playbooks"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-red-950 to-zinc-900 border border-red-600/70 text-red-200 hover:text-white text-xs font-mono font-semibold transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
            >
              <PlayCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Demo Scenarios</span>
            </button>
          )}

          {onOpenRulesOfEngagement && (
            <button
              id="header-open-roe-btn"
              onClick={onOpenRulesOfEngagement}
              title="Rules of Engagement & Ethical Scope Charter"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>RoE Scope</span>
            </button>
          )}

          {/* Active Threat Counter */}
          <div
            id="threat-status-badge"
            onClick={() => setActiveTab("soc")}
            className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-xs ${
              activeThreatsCount > 0
                ? "bg-red-950/60 border-red-500/70 text-red-300 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                : "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
            }`}
          >
            {activeThreatsCount > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              {activeThreatsCount > 0
                ? `${activeThreatsCount} ALERTS`
                : "SYSTEMS SECURED"}
            </span>
          </div>

          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={soundEnabled ? "Mute alert audio" : "Enable alert audio"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          {/* Emergency Stop Kill Switch */}
          {onTriggerEmergencyKillSwitch && (
            <button
              onClick={onTriggerEmergencyKillSwitch}
              title="EMERGENCY KILL SWITCH: Immediately halts all active adversary simulations"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">KILL SWITCH</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between overflow-x-auto py-1.5 border-t border-zinc-800/80 no-scrollbar gap-1">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab("executive")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "executive"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Executive Posture</span>
            </button>

            <button
              onClick={() => setActiveTab("soc")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "soc"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Server className="w-3.5 h-3.5 text-red-400" />
              <span>SOC Command Center</span>
            </button>

            <button
              onClick={() => setActiveTab("agents")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "agents"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Agent Swarm</span>
            </button>

            <button
              onClick={() => setActiveTab("assets")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "assets"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span>Asset Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab("findings")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "findings"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Finding Lifecycle</span>
            </button>

            <button
              onClick={() => setActiveTab("ai_security")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "ai_security"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>AI & MCP Security</span>
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "graph"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Knowledge Graph</span>
            </button>

            <button
              onClick={() => setActiveTab("evidence")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "evidence"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Evidence Vault</span>
            </button>

            <button
              onClick={() => setActiveTab("soar")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "soar"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span>SOAR Playbooks</span>
            </button>

            <button
              onClick={() => setActiveTab("purple")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "purple"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Purple Team Lab</span>
            </button>

            <button
              onClick={() => setActiveTab("hunting")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "hunting"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-yellow-400" />
              <span>Threat Hunting</span>
            </button>

            <button
              onClick={() => setActiveTab("intel")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "intel"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Threat Intel (STIX)</span>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "reports"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-zinc-300" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => setActiveTab("companion")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "companion"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-red-400" />
              <span>AI Copilot</span>
            </button>

            <button
              onClick={() => setActiveTab("tools")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "tools"
                  ? "bg-red-950/80 text-red-200 border border-red-700/60 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-zinc-400" />
              <span>SecOps Tools</span>
            </button>
          </div>

          {onOpenCvssCalculator && (
            <div className="hidden sm:flex items-center pl-2">
              <button
                id="header-cvss-calc-btn"
                onClick={onOpenCvssCalculator}
                title="CVSS v3.1 Base Score Calculator"
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5 text-red-400" />
                <span>CVSS v3.1</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
