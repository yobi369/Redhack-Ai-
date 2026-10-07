import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  Plus,
  Radio,
  Terminal,
  ArrowUpRight,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Lock,
  RefreshCw,
  FileText,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { ThreatAlert, SeverityLevel } from "../types";

interface ThreatMonitorProps {
  alerts: ThreatAlert[];
  onOpenContainmentModal: (alert: ThreatAlert) => void;
  onSendToChat: (alert: ThreatAlert) => void;
  onAddToReport: (alert: ThreatAlert) => void;
  onManualLogIngested: (newAlert: ThreatAlert) => void;
}

export const ThreatMonitor: React.FC<ThreatMonitorProps> = ({
  alerts,
  onOpenContainmentModal,
  onSendToChat,
  onAddToReport,
  onManualLogIngested,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showLogAnalyzer, setShowLogAnalyzer] = useState<boolean>(false);
  const [rawLogInput, setRawLogInput] = useState<string>("");
  const [isAnalyzingLog, setIsAnalyzingLog] = useState<boolean>(false);
  const [logAnalysisResult, setLogAnalysisResult] = useState<any>(null);

  // Statistics
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" && a.status !== "CONTAINED").length;
  const highCount = alerts.filter((a) => a.severity === "HIGH" && a.status !== "CONTAINED").length;
  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;
  const containedCount = alerts.filter((a) => a.status === "CONTAINED").length;

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== "ALL" && alert.severity !== filterSeverity) return false;
    if (filterStatus !== "ALL" && alert.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(q) ||
        alert.sourceIp.toLowerCase().includes(q) ||
        alert.mitreId.toLowerCase().includes(q) ||
        alert.category.toLowerCase().includes(q) ||
        alert.rawLog.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDeepLogAnalysis = async () => {
    if (!rawLogInput.trim()) return;
    setIsAnalyzingLog(true);
    setLogAnalysisResult(null);

    try {
      const res = await fetch("/api/analyze-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logText: rawLogInput }),
      });
      const data = await res.json();
      setLogAnalysisResult(data);

      // Create new Alert from analysis
      const newAlert: ThreatAlert = {
        id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString(),
        title: data.attackType || "Suspicious Network Event",
        category: "Network",
        severity: (data.severity as SeverityLevel) || "HIGH",
        sourceIp: data.iocs?.ips?.[0] || "192.168.1.100",
        destinationIp: "10.0.0.15",
        targetPort: 443,
        protocol: "HTTPS",
        mitreTechnique: data.mitreId || "T1190 - Exploit Public-Facing Application",
        mitreId: (data.mitreId || "T1190").split(" ")[0],
        status: "ACTIVE",
        rawLog: rawLogInput,
        suggestedAction: data.summary || "Quarantine source IP and review web application firewall.",
        containmentCommand: data.containmentScript || `sudo iptables -I INPUT 1 -s ${data.iocs?.ips?.[0] || "192.168.1.100"} -j DROP`,
      };

      onManualLogIngested(newAlert);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingLog(false);
    }
  };

  const sampleLogs = [
    {
      name: "SQL Injection Probe",
      log: `GET /products?id=1%20UNION%20SELECT%20null,schema_name,3%20FROM%20information_schema.schemata-- HTTP/1.1\nHost: target-api.corp\nUser-Agent: sqlmap/1.6.4#stable\nX-Forwarded-For: 198.51.100.42`,
    },
    {
      name: "SSH Brute-Force Auth Log",
      log: `Feb 22 02:45:10 host-primary sshd[28194]: Failed password for invalid user root from 185.220.101.99 port 51230 ssh2\nFeb 22 02:45:12 host-primary sshd[28196]: Failed password for invalid user admin from 185.220.101.99 port 51234 ssh2`,
    },
    {
      name: "Cobalt Strike C2 Beacon",
      log: `POST /submit.php?id=84920 HTTP/1.1\nHost: c2-node.cyber-threat.top\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\nCookie: __cfduid=d89a2bc4; session=JABjAGwAaQBlAG4AdAA... (Base64 payload beaconing interval: 60s)`,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Top Stat Cards / Threat Radar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-zinc-950 border border-red-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">CRITICAL THREATS</span>
            <Flame className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-red-500 mt-2">{criticalCount}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Immediate containment required</span>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-red-600/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-amber-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">HIGH SEVERITY</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-500 mt-2">{highCount}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Active penetration probes</span>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-600/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-blue-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">ACTIVE ALERTS</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-blue-400 mt-2">{activeCount}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Under continuous SIEM monitoring</span>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-600/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">SOLVED / CONTAINED</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">{containedCount}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Neutralized with first-response rules</span>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-600/10 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Action Bar & Log Ingest Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-md">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            id="threat-search-input"
            type="text"
            placeholder="Search by IP, attack signature, MITRE ID, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterSeverity(lvl)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterSeverity === lvl
                  ? "bg-red-950 border border-red-600 text-red-200 shadow-[0_0_8px_rgba(239,68,68,0.25)]"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Custom Log Ingest Button */}
        <button
          id="toggle-log-analyzer-btn"
          onClick={() => setShowLogAnalyzer(!showLogAnalyzer)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
            showLogAnalyzer
              ? "bg-red-600 border-red-500 text-white"
              : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-red-400"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{showLogAnalyzer ? "Close Forensic Ingest" : "Ingest & Analyze Log (AI)"}</span>
        </button>
      </div>

      {/* Forensic Log Ingest & Deep AI Analyzer Panel */}
      {showLogAnalyzer && (
        <div className="p-5 rounded-xl bg-zinc-950 border border-red-900/60 shadow-[0_0_25px_rgba(239,68,68,0.15)] space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-zinc-100">
                Deep SIEM Forensic Ingest & Neural Threat Detection
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500">Paste any raw firewall, syslog, or PCAP output</span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-zinc-400">Sample Incident Logs:</span>
            {sampleLogs.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setRawLogInput(s.log)}
                className="text-[10px] px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-red-500 hover:text-red-300 transition-colors"
              >
                + {s.name}
              </button>
            ))}
          </div>

          <textarea
            id="raw-log-input-area"
            value={rawLogInput}
            onChange={(e) => setRawLogInput(e.target.value)}
            rows={4}
            placeholder="Paste raw log lines here (e.g. Suricata EVE, Nginx access.log, Windows Security 4625, Snort alert, Linux Auth.log)..."
            className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={() => setRawLogInput("")}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
            <button
              id="analyze-log-submit-btn"
              disabled={isAnalyzingLog || !rawLogInput.trim()}
              onClick={handleDeepLogAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-lg shadow-lg disabled:opacity-50 transition-all"
            >
              {isAnalyzingLog ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing Threat Vectors...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Analyze with REDHACK AI & Auto-Quarantine
                </>
              )}
            </button>
          </div>

          {/* Analysis Results Display */}
          {logAnalysisResult && (
            <div className="p-4 rounded-lg bg-zinc-900 border border-red-900/50 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400">
                  AI Forensic Assessment: {logAnalysisResult.attackType}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 border border-red-600 text-red-200 font-bold">
                  {logAnalysisResult.severity}
                </span>
              </div>
              <p className="text-xs text-zinc-300">{logAnalysisResult.summary}</p>
              <div className="text-[11px] text-amber-400">
                MITRE ATT&CK: <span className="font-semibold">{logAnalysisResult.mitreId}</span>
              </div>
              {logAnalysisResult.containmentScript && (
                <div>
                  <span className="text-[10px] text-zinc-400 block mb-1">Generated Containment Command:</span>
                  <pre className="p-2 rounded bg-black text-emerald-400 text-[11px] overflow-x-auto">
                    {logAnalysisResult.containmentScript}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Real-time Threat Alerts Stream Table */}
      <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="px-5 py-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <h2 className="text-sm font-bold text-zinc-100 font-mono">
              Live Threat Alerts & Incident Telemetry Stream
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Showing {filteredAlerts.length} of {alerts.length} events
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs">
            No threat events match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-zinc-900 overflow-x-auto">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                id={`alert-row-${alert.id}`}
                className={`p-4 hover:bg-zinc-900/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  alert.status === "CONTAINED" ? "opacity-60 bg-zinc-950/40" : ""
                }`}
              >
                {/* Alert Info */}
                <div className="space-y-1.5 flex-1 min-w-[280px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        alert.severity === "CRITICAL"
                          ? "bg-red-950 text-red-300 border border-red-600 animate-pulse"
                          : alert.severity === "HIGH"
                          ? "bg-amber-950 text-amber-300 border border-amber-600"
                          : "bg-blue-950 text-blue-300 border border-blue-600"
                      }`}
                    >
                      {alert.severity}
                    </span>

                    <span className="text-xs font-semibold text-zinc-200">
                      {alert.title}
                    </span>

                    <span className="text-[10px] text-zinc-500 font-mono">
                      {alert.timestamp}
                    </span>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        alert.status === "CONTAINED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                          : alert.status === "INVESTIGATING"
                          ? "bg-amber-950 text-amber-300 border border-amber-700"
                          : "bg-red-950 text-red-400 border border-red-800"
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>

                  {/* Telemetry info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400">
                    <div>
                      <span className="text-zinc-500">Source: </span>
                      <span className="text-red-400 font-semibold">{alert.sourceIp}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Target: </span>
                      <span className="text-blue-400 font-semibold">
                        {alert.destinationIp}:{alert.targetPort} ({alert.protocol})
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">MITRE: </span>
                      <span className="text-amber-300">{alert.mitreId}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                    {alert.suggestedAction}
                  </p>
                </div>

                {/* Interactive Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {alert.status !== "CONTAINED" ? (
                    <button
                      id={`solve-first-btn-${alert.id}`}
                      onClick={() => onOpenContainmentModal(alert)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-900/40 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>1-Click Solve & Contain</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenContainmentModal(alert)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs font-semibold transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Containment Log</span>
                    </button>
                  )}

                  <button
                    id={`chat-alert-btn-${alert.id}`}
                    onClick={() => onSendToChat(alert)}
                    title="Send Alert to REDHACK Copilot for investigation"
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-400 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    id={`report-alert-btn-${alert.id}`}
                    onClick={() => onAddToReport(alert)}
                    title="Add incident to Vulnerability Assessment Report"
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
