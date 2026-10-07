import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  X,
  Sparkles,
  ArrowRight,
  Flame,
  FileText,
  MessageSquare,
  FileCode2,
  Ticket,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ThreatAlert } from "../types";

interface ContainmentModalProps {
  alert: ThreatAlert | null;
  onClose: () => void;
  onResolve: (alertId: string, containmentCommand: string) => void;
  onSendToChat: (alert: ThreatAlert) => void;
  onAddToReport: (alert: ThreatAlert) => void;
}

export const ContainmentModal: React.FC<ContainmentModalProps> = ({
  alert,
  onClose,
  onResolve,
  onSendToChat,
  onAddToReport,
}) => {
  if (!alert) return null;

  const [activeTab, setActiveTab] = useState<"containment" | "sigma" | "jira" | "splunk">("containment");
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [containmentCmd, setContainmentCmd] = useState(
    alert.containmentCommand ||
      `sudo iptables -I INPUT 1 -s ${alert.sourceIp} -j DROP && echo "[REDHACK-SOC] IP ${alert.sourceIp} Quarantined"`
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteContainment = () => {
    setIsExecuting(true);
    setExecutionOutput("Initiating REDHACK Automated First-Response Playbook...\nConnecting to security control plane...");

    setTimeout(() => {
      setExecutionOutput((prev) => `${prev}\n> Executing perimeter firewall rule: DROP ${alert.sourceIp}`);
    }, 400);

    setTimeout(() => {
      setExecutionOutput((prev) => `${prev}\n> Updating IP reputation blacklist & SIEM correlate DB...\n> Host isolation / rule sync: SUCCESS 200 OK`);
    }, 900);

    setTimeout(() => {
      setIsExecuting(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ef4444", "#3b82f6", "#10b981"],
        });
      } catch (e) {
        // ignore
      }
      onResolve(alert.id, containmentCmd);
    }, 1400);
  };

  // Formatted Jira / ServiceNow ticket
  const jiraTicketMarkdown = `h2. [SECURITY INCIDENT] ${alert.title}
*Severity:* ${alert.severity}
*Alert ID:* ${alert.id}
*Timestamp:* ${alert.timestamp}
*Category:* ${alert.category}
*MITRE ATT&CK:* ${alert.mitreId} - ${alert.mitreTechnique}

h3. Network IOCs
* *Source IP:* {color:red}${alert.sourceIp}{color}
* *Target Asset:* ${alert.destinationIp}:${alert.targetPort} (${alert.protocol})
* *Status:* ${alert.status}

h3. Raw Forensic Evidence
{noformat}
${alert.rawLog}
{noformat}

h3. Recommended Remediation & Containment
# Execute host/firewall block: \`${containmentCmd}\`
# Check secondary authentication logs for lateral movement.
# Add IP to edge CDN / WAF blocklist.`;

  // Formatted Sigma rule
  const sigmaRuleYaml = `title: Detect ${alert.title.replace(/[^a-zA-Z0-9 ]/g, "")}
id: redhack-${alert.id.toLowerCase()}
status: experimental
description: Auto-generated detection rule for ${alert.mitreId} (${alert.mitreTechnique})
references:
  - https://attack.mitre.org/techniques/${alert.mitreId.split(" ")[0]}
author: REDHACK AI SOC Studio
date: ${new Date().toISOString().split("T")[0]}
tags:
  - attack.${alert.mitreId.toLowerCase().split(" ")[0]}
logsource:
  category: network_traffic
  product: linux
detection:
  selection:
    src_ip: '${alert.sourceIp}'
    dst_port: ${alert.targetPort}
  condition: selection
level: ${alert.severity.toLowerCase()}`;

  const splunkSpl = `index=security src_ip="${alert.sourceIp}" dest_port="${alert.targetPort}" | stats count by src_ip, dest_ip, dest_port, signature | sort - count`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="containment-modal"
        className="relative w-full max-w-2xl bg-zinc-950 border border-red-800/80 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.3)] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/90 border-b border-red-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-900/60 text-red-200 border border-red-600 font-bold">
                  {alert.severity}
                </span>
                <span className="text-xs font-mono text-zinc-400">ID: {alert.id}</span>
              </div>
              <h2 className="text-base font-bold text-zinc-100 font-mono mt-0.5">
                {alert.title}
              </h2>
            </div>
          </div>

          <button
            id="close-containment-modal"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs */}
        <div className="px-6 py-2 bg-black border-b border-zinc-800 flex flex-wrap gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab("containment")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === "containment"
                ? "bg-red-950 text-red-200 border border-red-600 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>1-Click Containment</span>
          </button>

          <button
            onClick={() => setActiveTab("sigma")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === "sigma"
                ? "bg-red-950 text-red-200 border border-red-600 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Sigma Detection Rule</span>
          </button>

          <button
            onClick={() => setActiveTab("jira")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === "jira"
                ? "bg-red-950 text-red-200 border border-red-600 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-amber-400" />
            <span>Jira / ServiceNow Ticket</span>
          </button>

          <button
            onClick={() => setActiveTab("splunk")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === "splunk"
                ? "bg-red-950 text-red-200 border border-red-600 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Splunk SPL Query</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-mono text-xs text-zinc-300">
          {/* Attack Vector & Targets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
            <div>
              <span className="text-zinc-500 block text-[10px]">SOURCE IP</span>
              <span className="text-red-400 font-semibold">{alert.sourceIp}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">TARGET IP/PORT</span>
              <span className="text-blue-400 font-semibold">
                {alert.destinationIp}:{alert.targetPort}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">PROTOCOL</span>
              <span className="text-zinc-300 font-semibold">{alert.protocol}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">MITRE TECHNIQUE</span>
              <span className="text-amber-400 font-semibold">{alert.mitreId}</span>
            </div>
          </div>

          {activeTab === "containment" && (
            <>
              {/* Raw Log Evidence */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-red-400" />
                    Raw Security Event Evidence
                  </span>
                  <button
                    onClick={() => handleCopy(alert.rawLog)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy Log
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-black border border-zinc-800 text-zinc-300 text-[11px] overflow-x-auto font-mono whitespace-pre-wrap">
                  {alert.rawLog}
                </pre>
              </div>

              {/* Automated Containment Script */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-red-400 text-xs font-semibold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    Instant First-Response Containment Command
                  </span>
                  <span className="text-[10px] text-zinc-500">Auto-generated by REDHACK Engine</span>
                </div>
                <div className="relative">
                  <textarea
                    value={containmentCmd}
                    onChange={(e) => setContainmentCmd(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-lg bg-zinc-900/90 border border-red-900/60 text-red-200 text-xs font-mono focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Containment bash or PowerShell commands..."
                  />
                </div>
              </div>

              {/* Terminal output simulation */}
              {executionOutput && (
                <div className="p-3 rounded-lg bg-black/90 border border-emerald-900/60 text-emerald-400 text-xs font-mono whitespace-pre-wrap animate-fadeIn">
                  {executionOutput}
                </div>
              )}

              {/* Status Message */}
              {alert.status === "CONTAINED" && (
                <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-lg text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>This threat was successfully neutralized & quarantined at {alert.containedAt || "just now"}.</span>
                </div>
              )}
            </>
          )}

          {activeTab === "sigma" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-bold text-xs">Production Sigma YAML Detection Rule</span>
                <button
                  onClick={() => handleCopy(sigmaRuleYaml)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy Sigma Rule
                </button>
              </div>
              <pre className="p-3.5 bg-black rounded-lg border border-zinc-800 text-emerald-400 text-xs overflow-x-auto leading-relaxed">
                {sigmaRuleYaml}
              </pre>
            </div>
          )}

          {activeTab === "jira" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold text-xs">Formatted Jira / ServiceNow Security Ticket</span>
                <button
                  onClick={() => handleCopy(jiraTicketMarkdown)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy Ticket Markup
                </button>
              </div>
              <pre className="p-3.5 bg-black rounded-lg border border-zinc-800 text-zinc-200 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {jiraTicketMarkdown}
              </pre>
            </div>
          )}

          {activeTab === "splunk" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold text-xs">Splunk Search Processing Language (SPL)</span>
                <button
                  onClick={() => handleCopy(splunkSpl)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy SPL
                </button>
              </div>
              <pre className="p-3.5 bg-black rounded-lg border border-zinc-800 text-emerald-400 text-xs overflow-x-auto leading-relaxed">
                {splunkSpl}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-zinc-900/90 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              id="modal-send-to-chat-btn"
              onClick={() => {
                onSendToChat(alert);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Ask Copilot
            </button>
            <button
              id="modal-add-to-report-btn"
              onClick={() => {
                onAddToReport(alert);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Add to Vuln Report
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors"
            >
              Dismiss
            </button>
            <button
              id="execute-containment-btn"
              disabled={isExecuting || alert.status === "CONTAINED"}
              onClick={handleExecuteContainment}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-lg ${
                alert.status === "CONTAINED"
                  ? "bg-emerald-950 border border-emerald-600 text-emerald-300 opacity-80 cursor-default"
                  : isExecuting
                  ? "bg-red-800 text-white animate-pulse"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-900/50 hover:shadow-red-800/80"
              }`}
            >
              {isExecuting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Quarantining...
                </>
              ) : alert.status === "CONTAINED" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Neutralized
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Execute 1-Click Instant Containment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

