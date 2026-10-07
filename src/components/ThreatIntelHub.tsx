import React, { useState } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Plus,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Layers,
  FileCode2,
  CheckCircle2,
} from "lucide-react";
import { ThreatIndicator, IocType } from "../types";
import { INITIAL_THREAT_INDICATORS } from "../data/enterpriseData";
import { defangIndicator, refangIndicator, exportToStix21, detectIocType } from "../utils/iocUtils";

export const ThreatIntelHub: React.FC = () => {
  const [indicators, setIndicators] = useState<ThreatIndicator[]>(INITIAL_THREAT_INDICATORS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showStixExportModal, setShowStixExportModal] = useState(false);
  const [stixJson, setStixJson] = useState("");
  const [copiedStix, setCopiedStix] = useState(false);
  const [revealedRefangIds, setRevealedRefangIds] = useState<Record<string, boolean>>({});

  // Add indicator state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRawIndicator, setNewRawIndicator] = useState("");
  const [newAttribution, setNewAttribution] = useState("Internal SOC Threat Hunter");
  const [newConfidence, setNewConfidence] = useState(85);
  const [newTlp, setNewTlp] = useState<"TLP:CLEAR" | "TLP:GREEN" | "TLP:AMBER" | "TLP:RED">("TLP:AMBER");

  const handleToggleRefang = (id: string) => {
    setRevealedRefangIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddIndicator = () => {
    if (!newRawIndicator.trim()) return;
    const clean = newRawIndicator.trim();
    const defanged = defangIndicator(clean);
    const iocType = detectIocType(clean);

    const newInd: ThreatIndicator = {
      id: `ind-${Date.now().toString().slice(-4)}`,
      indicator: defanged,
      rawIndicator: clean,
      type: iocType,
      threatActor: "Unknown / Suspicious Campaign",
      confidence: newConfidence,
      tlp: newTlp,
      firstSeen: new Date().toISOString(),
      lastSeen: "Just now",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
      sourceAttribution: newAttribution,
      tags: ["custom-ingest", iocType.toLowerCase()],
      activeMatchesInTelemetry: 0,
      falsePositive: false,
    };

    setIndicators((prev) => [newInd, ...prev]);
    setNewRawIndicator("");
    setShowAddForm(false);
  };

  const handleOpenStixExport = () => {
    const json = exportToStix21(indicators);
    setStixJson(json);
    setShowStixExportModal(true);
  };

  const handleCopyStix = () => {
    navigator.clipboard.writeText(stixJson);
    setCopiedStix(true);
    setTimeout(() => setCopiedStix(false), 2000);
  };

  const filteredIndicators = indicators.filter((ind) => {
    if (filterType !== "ALL" && ind.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ind.indicator.toLowerCase().includes(q) ||
        ind.rawIndicator.toLowerCase().includes(q) ||
        (ind.threatActor && ind.threatActor.toLowerCase().includes(q)) ||
        ind.sourceAttribution.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Header */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Threat Intelligence & IOC Management
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                STIX 2.1 / TAXII
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Safe indicator defanging, attribution, confidence scoring, and automated telemetry correlation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-red-400" />
            <span>Add Indicator</span>
          </button>

          <button
            onClick={handleOpenStixExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold hover:from-red-500 hover:to-red-600 transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export STIX 2.1</span>
          </button>
        </div>
      </div>

      {/* Add Indicator Drawer */}
      {showAddForm && (
        <div className="p-4 rounded-xl bg-zinc-950 border border-red-900/60 shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">Import & Normalize New Threat Indicator</span>
            <span className="text-[10px] text-zinc-500">Auto-defanged upon ingestion</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2 space-y-1">
              <span className="text-zinc-400">Raw IP, Domain, URL or Hash:</span>
              <input
                type="text"
                placeholder="e.g. http://malicious-c2.cc/stage2 or 194.26.29.112"
                value={newRawIndicator}
                onChange={(e) => setNewRawIndicator(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <span className="text-zinc-400">Attribution Source:</span>
              <input
                type="text"
                value={newAttribution}
                onChange={(e) => setNewAttribution(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <span className="text-zinc-400">TLP Classification:</span>
              <select
                value={newTlp}
                onChange={(e) => setNewTlp(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
              >
                <option value="TLP:CLEAR">TLP:CLEAR</option>
                <option value="TLP:GREEN">TLP:GREEN</option>
                <option value="TLP:AMBER">TLP:AMBER</option>
                <option value="TLP:RED">TLP:RED</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-400">
              Preview Defanged: <span className="text-emerald-400 font-mono">{defangIndicator(newRawIndicator) || "—"}</span>
            </span>
            <button
              onClick={handleAddIndicator}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Add to Threat Intel Store
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search indicators by address, actor, malware or source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "IPv4", "URL", "Domain", "SHA256"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === t
                  ? "bg-red-950 border border-red-600 text-red-200 shadow"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Indicator Table */}
      <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-200">
            Active Indicators of Compromise ({filteredIndicators.length} records)
          </span>
          <span className="text-zinc-500">Indicators defanged by default to prevent accidental execution</span>
        </div>

        <div className="divide-y divide-zinc-900 overflow-x-auto">
          {filteredIndicators.map((ind) => {
            const isRefanged = revealedRefangIds[ind.id];
            return (
              <div
                key={ind.id}
                className="p-4 hover:bg-zinc-900/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1 min-w-[280px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-zinc-900 border border-zinc-700 text-zinc-300">
                      {ind.type}
                    </span>

                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        ind.tlp === "TLP:RED"
                          ? "bg-red-950 text-red-300 border border-red-600"
                          : ind.tlp === "TLP:AMBER"
                          ? "bg-amber-950 text-amber-300 border border-amber-600"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-600"
                      }`}
                    >
                      {ind.tlp}
                    </span>

                    <span className="font-mono text-zinc-200 font-bold">
                      {isRefanged ? ind.rawIndicator : ind.indicator}
                    </span>

                    {/* Reveal Refanged Button */}
                    <button
                      onClick={() => handleToggleRefang(ind.id)}
                      title={isRefanged ? "Defang indicator" : "Safely reveal refanged indicator"}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    >
                      {isRefanged ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-3">
                    {ind.threatActor && (
                      <span>
                        Actor: <span className="text-red-400 font-semibold">{ind.threatActor}</span>
                      </span>
                    )}
                    {ind.malwareFamily && (
                      <span>
                        Malware: <span className="text-amber-300">{ind.malwareFamily}</span>
                      </span>
                    )}
                    <span>
                      Confidence: <span className="text-emerald-400 font-semibold">{ind.confidence}%</span>
                    </span>
                    <span>Source: {ind.sourceAttribution}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Telemetry Matches</span>
                    <span
                      className={`text-xs font-bold ${
                        ind.activeMatchesInTelemetry > 0 ? "text-red-400 font-extrabold" : "text-zinc-400"
                      }`}
                    >
                      {ind.activeMatchesInTelemetry} matches
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STIX 2.1 Export Modal */}
      {showStixExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-zinc-950 border border-red-900/60 rounded-xl p-5 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-red-400" />
                  STIX 2.1 Threat Intelligence Bundle Export
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Standard OASIS STIX 2.1 bundle compatible with TAXII 2.1 threat servers and MISP
                </p>
              </div>

              <button
                onClick={() => setShowStixExportModal(false)}
                className="text-xs text-zinc-500 hover:text-zinc-200"
              >
                Close
              </button>
            </div>

            <pre className="p-4 rounded-lg bg-black border border-zinc-850 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
              {stixJson}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-500">
                Includes {indicators.length} normalized SDO indicator objects
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyStix}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-bold hover:bg-zinc-850 transition-colors flex items-center gap-1.5"
                >
                  {copiedStix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedStix ? "Copied" : "Copy JSON"}
                </button>
                <button
                  onClick={() => setShowStixExportModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
