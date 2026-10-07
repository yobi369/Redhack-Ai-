import React, { useState, useEffect } from "react";
import {
  Search,
  Shield,
  ShieldAlert,
  Server,
  Bot,
  Terminal,
  FileText,
  Lock,
  Layers,
  Sparkles,
  Command,
  ArrowRight,
} from "lucide-react";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: any) => void;
  onEmergencyStop: () => void;
  onOpenRoE: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onEmergencyStop,
  onOpenRoE,
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: "exec", title: "Executive Security Dashboard", desc: "View unified posture & security score", tab: "executive", icon: <Shield className="h-4 w-4 text-emerald-400" /> },
    { id: "soc", title: "SOC Command Center & Telemetry", desc: "Live alert triage & event pipeline", tab: "soc", icon: <ShieldAlert className="h-4 w-4 text-red-400" /> },
    { id: "agents", title: "Multi-Agent Security Swarm", desc: "Inspect 9 specialized autonomous agents", tab: "agents", icon: <Bot className="h-4 w-4 text-cyan-400" /> },
    { id: "assets", title: "Asset Inventory & Perimeter", desc: "Review cloud workloads & attack surface", tab: "assets", icon: <Server className="h-4 w-4 text-blue-400" /> },
    { id: "findings", title: "Unified Finding Lifecycle", desc: "Discovered → Triaged → Validated → Resolved", tab: "findings", icon: <Sparkles className="h-4 w-4 text-yellow-400" /> },
    { id: "ai_sec", title: "AI & MCP Tool Security", desc: "Audit LLMs, MCP servers, and prompt injection", tab: "ai_security", icon: <Bot className="h-4 w-4 text-purple-400" /> },
    { id: "graph", title: "Security Knowledge Graph", desc: "Interactive blast radius & attack path visualization", tab: "graph", icon: <Layers className="h-4 w-4 text-cyan-400" /> },
    { id: "evidence", title: "Digital Forensics & Evidence Vault", desc: "SHA-256 verified artifacts & PCAPs", tab: "evidence", icon: <FileText className="h-4 w-4 text-emerald-400" /> },
    { id: "soar", title: "SOAR Incident Response & Playbooks", desc: "Containment actions & approval gates", tab: "soar", icon: <Terminal className="h-4 w-4 text-red-400" /> },
    { id: "purple", title: "Purple Team Adversary Simulation", desc: "Authorized safe validation & MITRE coverage", tab: "purple", icon: <ShieldAlert className="h-4 w-4 text-orange-400" /> },
    { id: "reports", title: "Executive & Technical Reports", desc: "Export Markdown, JSON, HTML, CSV, PDF", tab: "reports", icon: <FileText className="h-4 w-4 text-blue-400" /> },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl space-y-2">
        {/* Search input */}
        <div className="flex items-center gap-3 p-3.5 border-b border-zinc-800 bg-zinc-950">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search modules (e.g. 'SOC', 'Agents', 'Assets', 'MCP')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onNavigate(item.tab);
                onClose();
              }}
              className="p-2.5 rounded-lg hover:bg-zinc-800 cursor-pointer flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded bg-zinc-950 border border-zinc-800">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-red-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400">{item.desc}</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
            </div>
          ))}

          {/* Quick Actions */}
          <div className="pt-2 border-t border-zinc-800 mt-2">
            <span className="text-[10px] font-mono uppercase text-zinc-500 px-2 block mb-1">
              Emergency & Policy Controls
            </span>
            <div
              onClick={() => {
                onOpenRoE();
                onClose();
              }}
              className="p-2 rounded-lg hover:bg-zinc-800 cursor-pointer flex items-center justify-between text-xs text-zinc-300"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-yellow-400" />
                <span>Configure Rules of Engagement (RoE) Scope</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Authorized Subnets</span>
            </div>

            <div
              onClick={() => {
                onEmergencyStop();
                onClose();
              }}
              className="p-2 rounded-lg hover:bg-red-950/40 cursor-pointer flex items-center justify-between text-xs text-red-400"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span className="font-semibold">EMERGENCY KILL SWITCH: Halt All Active Operations</span>
              </div>
              <span className="text-[10px] font-mono text-red-500">Instant Abort</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
