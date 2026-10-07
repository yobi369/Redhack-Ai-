import React, { useState } from "react";
import {
  Sparkles,
  Play,
  CheckCircle2,
  ArrowRight,
  Shield,
  Flame,
  Terminal,
  FileText,
  Clock,
  X,
  Target,
  Send,
  Eye,
} from "lucide-react";
import { ThreatAlert } from "../types";

interface DemoPlaybookModalProps {
  onSelectScenario: (scenarioId: string, alert?: ThreatAlert) => void;
  onClose: () => void;
}

export const DemoPlaybookModal: React.FC<DemoPlaybookModalProps> = ({
  onSelectScenario,
  onClose,
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>("scenario-1");

  const scenarios = [
    {
      id: "scenario-1",
      title: "Live SOC Incident Triage & 1-Click Containment",
      subtitle: "3-Minute High-Velocity Workflow for SOC Analysts & IR Responders",
      role: "SOC Level 1/2 Analyst & Incident Responder",
      duration: "3 Minutes",
      icon: Shield,
      color: "text-red-400",
      description:
        "Demonstrates real-time log ingestion, automatic MITRE ATT&CK mapping, IOC extraction, 1-click host quarantine, and automated Jira ticket generation.",
      steps: [
        {
          num: 1,
          name: "Live Threat Feed & Severity Ingestion",
          desc: "Ingest a raw Web Application / SQL Injection probe from an untrusted external IP.",
        },
        {
          num: 2,
          name: "Instant 1-Click Solve & Contain",
          desc: "Open the containment modal to auto-generate and execute iptables/ufw drop rules in 10 seconds.",
        },
        {
          num: 3,
          name: "Enterprise Ticketing Export",
          desc: "1-Click copy formatted Jira Security Issue or ServiceNow incident markdown.",
        },
      ],
      sampleAlert: {
        id: "ALT-DEMO-99",
        timestamp: new Date().toLocaleTimeString(),
        title: "Critical Blind SQL Injection & Data Exfiltration Attempt",
        category: "Web App" as const,
        severity: "CRITICAL" as const,
        sourceIp: "185.220.101.5",
        destinationIp: "10.0.0.12",
        targetPort: 443,
        protocol: "HTTPS" as const,
        mitreTechnique: "Exploit Public-Facing Application",
        mitreId: "T1190",
        status: "ACTIVE" as const,
        rawLog: `POST /api/v1/auth/login HTTP/1.1\nHost: api.target-corp.internal\nUser-Agent: sqlmap/1.5.2#stable\nPayload: username=admin' AND (SELECT 9912 FROM (SELECT(SLEEP(5)))a)--\nResponse: 500 Internal Error (DB Query Latency: 5012ms)`,
        suggestedAction: "Immediately block IP at perimeter firewall and inspect DB query connection pool.",
        containmentCommand: "sudo iptables -I INPUT 1 -s 185.220.101.5 -j DROP",
      },
    },
    {
      id: "scenario-2",
      title: "Cyber Payload Deobfuscation & Sigma Rule Generation",
      subtitle: "3-Minute Technical Deep-Dive for Threat Hunters & Detection Engineers",
      role: "Threat Hunter & Detection Engineer",
      duration: "3 Minutes",
      icon: Terminal,
      color: "text-amber-400",
      description:
        "Demonstrates decoding a hidden Base64 PowerShell execution string, extracting C2 domains, and auto-compiling a Sigma YAML detection rule.",
      steps: [
        {
          num: 1,
          name: "Payload Deobfuscation",
          desc: "Open SecOps Tools to deobfuscate Base64 and PowerShell UTF-16 commands.",
        },
        {
          num: 2,
          name: "IOC & Threat Extraction",
          desc: "Automatically extract suspicious IPs, C2 URLs, and SHA256 hashes from raw text.",
        },
        {
          num: 3,
          name: "Sigma & YARA Rule Compilation",
          desc: "Generate production-grade Sigma YAML rules ready to deploy into Splunk, Elastic, or Sentinel.",
        },
      ],
    },
    {
      id: "scenario-3",
      title: "Executive Penetration Test Report Generation",
      subtitle: "4-Minute Reporting Workflow for Pentesters & Lead Auditors",
      role: "Lead Penetration Tester & CISO",
      duration: "4 Minutes",
      icon: FileText,
      color: "text-blue-400",
      description:
        "Demonstrates calculating CVSS v3.1 vector strings, organizing findings inventory, and generating a formal executive penetration test report.",
      steps: [
        {
          num: 1,
          name: "Interactive CVSS v3.1 Matrix",
          desc: "Launch the CVSS calculator to compute Base Score (AV, AC, PR, UI, Scope, CIA Triad).",
        },
        {
          num: 2,
          name: "AI-Powered Technical Synthesis",
          desc: "Generate executive summaries, PoC breakdown, and step-by-step remediation checklists.",
        },
        {
          num: 3,
          name: "Multi-Format Export",
          desc: "Export the full assessment to Markdown (.MD), structured JSON, or print/PDF.",
        },
      ],
    },
  ];

  const currentScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950 border border-red-700 text-red-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                10-Minute Presentation & Demo Playbook
              </h3>
              <span className="text-[10px] text-zinc-400">
                Curated walkthroughs designed to showcase high-ROI capabilities to cybersecurity teams
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

        {/* Scenario Selectors */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-black border-b border-zinc-800">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isSelected = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => setActiveScenarioId(sc.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-red-950/70 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-4 h-4 ${isSelected ? sc.color : "text-zinc-500"}`} />
                  <span className="text-[10px] text-zinc-500 font-mono">{sc.duration}</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-200 line-clamp-2 leading-tight">
                  {sc.title}
                </h4>
              </button>
            );
          })}
        </div>

        {/* Active Scenario Detail */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs space-y-4">
          <div className="space-y-1 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold uppercase">
                Target Audience: {currentScenario.role}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-zinc-100 pt-1">
              {currentScenario.title}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {currentScenario.description}
            </p>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
              DEMONSTRATION SEQUENCE:
            </span>
            <div className="space-y-2">
              {currentScenario.steps.map((st) => (
                <div
                  key={st.num}
                  className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-red-950 border border-red-700 flex items-center justify-center text-[11px] text-red-400 font-extrabold shrink-0 mt-0.5">
                    {st.num}
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-zinc-200 text-xs">{st.name}</h5>
                    <p className="text-[11px] text-zinc-400 leading-normal">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-semibold"
          >
            Close
          </button>

          <button
            id="launch-demo-scenario-btn"
            onClick={() => {
              onSelectScenario(currentScenario.id, (currentScenario as any).sampleAlert);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch This Demo Scenario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
