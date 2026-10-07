import React, { useState } from "react";
import {
  Shield,
  ShieldAlert,
  Activity,
  Layers,
  Search,
  Filter,
  Flame,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CornerDownRight,
  Plus,
  Send,
  Eye,
  RefreshCw,
  Server,
  Lock,
  ArrowRight,
} from "lucide-react";
import {
  TelemetryEvent,
  SocCase,
  IngestionAdapterStatus,
  UserRole,
  SeverityLevel,
} from "../types";
import {
  INITIAL_INGESTION_ADAPTERS,
  INITIAL_TELEMETRY_EVENTS,
  INITIAL_SOC_CASES,
} from "../data/enterpriseData";

interface EnterpriseSocWorkspaceProps {
  currentRole: UserRole;
  onOpenCaseInChat?: (socCase: SocCase) => void;
}

export const EnterpriseSocWorkspace: React.FC<EnterpriseSocWorkspaceProps> = ({
  currentRole,
  onOpenCaseInChat,
}) => {
  const [workspaceLevel, setWorkspaceLevel] = useState<"L1_TRIAGE" | "L2_INVESTIGATION">("L1_TRIAGE");
  const [adapters] = useState<IngestionAdapterStatus[]>(INITIAL_INGESTION_ADAPTERS);
  const [events, setEvents] = useState<TelemetryEvent[]>(INITIAL_TELEMETRY_EVENTS);
  const [cases, setCases] = useState<SocCase[]>(INITIAL_SOC_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(INITIAL_SOC_CASES[0]?.id || "");
  const [newNoteText, setNewNoteText] = useState("");
  const [telemetryFilterCategory, setTelemetryFilterCategory] = useState("ALL");
  const [telemetrySearch, setTelemetrySearch] = useState("");

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const handleAddNote = () => {
    if (!newNoteText.trim() || !selectedCase) return;
    const newNote = {
      id: `NOTE-${Date.now()}`,
      author: currentRole === "L2_INVESTIGATOR" ? "Senior L2 Analyst" : "SOC Operator",
      role: currentRole,
      text: newNoteText.trim(),
      timestamp: new Date().toLocaleTimeString() + " UTC",
    };

    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id
          ? {
              ...c,
              updatedAt: new Date().toLocaleTimeString() + " UTC",
              analystNotes: [...c.analystNotes, newNote],
              timeline: [
                ...c.timeline,
                {
                  timestamp: new Date().toLocaleTimeString() + " UTC",
                  actor: newNote.author,
                  event: `Added case note: "${newNote.text.slice(0, 50)}..."`,
                  type: "ANALYST",
                },
              ],
            }
          : c
      )
    );
    setNewNoteText("");
  };

  const handleUpdateCaseStatus = (status: SocCase["status"]) => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id
          ? {
              ...c,
              status,
              updatedAt: new Date().toLocaleTimeString() + " UTC",
              timeline: [
                ...c.timeline,
                {
                  timestamp: new Date().toLocaleTimeString() + " UTC",
                  actor: currentRole,
                  event: `Changed status to ${status}`,
                  type: "ANALYST",
                },
              ],
            }
          : c
      )
    );
  };

  const filteredEvents = events.filter((e) => {
    if (telemetryFilterCategory !== "ALL" && e.eventCategory !== telemetryFilterCategory) return false;
    if (telemetrySearch.trim()) {
      const q = telemetrySearch.toLowerCase();
      return (
        e.action.toLowerCase().includes(q) ||
        e.sourceIp.toLowerCase().includes(q) ||
        e.sourceType.toLowerCase().includes(q) ||
        e.rawPayload.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Workspace Switcher Header */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Enterprise SOC Operation Center
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-400">
                Role: {currentRole}
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Multi-tier ingestion, normalized security event store & incident case workspaces
            </p>
          </div>
        </div>

        {/* Level Toggle Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setWorkspaceLevel("L1_TRIAGE")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              workspaceLevel === "L1_TRIAGE"
                ? "bg-red-950 border border-red-600 text-red-200 shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Level 1: Triage & Telemetry
          </button>
          <button
            onClick={() => setWorkspaceLevel("L2_INVESTIGATION")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              workspaceLevel === "L2_INVESTIGATION"
                ? "bg-red-950 border border-red-600 text-red-200 shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Level 2: Deep Forensics & Cases ({cases.length})
          </button>
        </div>
      </div>

      {/* Ingestion Adapters Status Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-red-400" />
            Centralized Ingestion Adapters & Sensor Health
          </span>
          <span className="text-[11px] text-zinc-500">6 Telemetry Sources Connected</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {adapters.map((ad) => (
            <div
              key={ad.sourceType}
              className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 transition-colors shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 truncate max-w-[100px]" title={ad.displayName}>
                    {ad.displayName.split(" ")[0]}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                </div>
                <div className="text-xs font-bold text-zinc-200 mt-1 truncate">{ad.displayName}</div>
              </div>

              <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                <span>{ad.eps} EPS</span>
                <span className="text-emerald-400 font-semibold">{ad.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LEVEL 1: TRIAGE & NORMALIZED TELEMETRY STREAM */}
      {workspaceLevel === "L1_TRIAGE" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Search normalized events (IP, user, process, technique)..."
                value={telemetrySearch}
                onChange={(e) => setTelemetrySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["ALL", "Network", "Web App", "Endpoint", "Identity", "Cloud"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTelemetryFilterCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    telemetryFilterCategory === cat
                      ? "bg-red-950 border border-red-600 text-red-200 shadow"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Telemetry Events Table */}
          <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">
                Normalized Telemetry Event Store ({filteredEvents.length} events)
              </span>
              <span className="text-[11px] text-zinc-400">OCSF / ECS Schema Normalized</span>
            </div>

            <div className="divide-y divide-zinc-900 overflow-x-auto">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 hover:bg-zinc-900/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-zinc-900 border border-zinc-700 text-zinc-300">
                        {evt.sourceType.toUpperCase()}
                      </span>
                      <span className="font-bold text-zinc-100">{evt.action}</span>
                      <span className="text-[10px] text-zinc-500">{evt.timestamp}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          evt.riskScore >= 90
                            ? "bg-red-950 text-red-300 border border-red-600"
                            : evt.riskScore >= 70
                            ? "bg-amber-950 text-amber-300 border border-amber-600"
                            : "bg-blue-950 text-blue-300 border border-blue-600"
                        }`}
                      >
                        Risk: {evt.riskScore}/100
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-3">
                      <span>
                        Source: <span className="text-zinc-200 font-semibold">{evt.sourceIp}</span>
                      </span>
                      <span>
                        Dest: <span className="text-zinc-200 font-semibold">{evt.destinationIp}</span>
                        {evt.destinationPort && `:${evt.destinationPort}`}
                      </span>
                      {evt.user && (
                        <span>
                          User: <span className="text-amber-300">{evt.user}</span>
                        </span>
                      )}
                      {evt.process && (
                        <span>
                          Process: <span className="text-emerald-300">{evt.process}</span>
                        </span>
                      )}
                      {evt.mitreId && (
                        <span className="text-red-400 font-semibold">
                          MITRE: {evt.mitreId} ({evt.mitreTechnique})
                        </span>
                      )}
                    </div>

                    <pre className="mt-1 p-2 rounded bg-black/80 text-zinc-300 text-[10px] font-mono overflow-x-auto border border-zinc-900">
                      {evt.rawPayload}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 2: INVESTIGATION WORKSPACE & CASE MANAGEMENT */}
      {workspaceLevel === "L2_INVESTIGATION" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Case List Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-zinc-300">Active Incident Cases</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-bold">
                {cases.length} Open
              </span>
            </div>

            <div className="space-y-2.5">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedCase?.id === c.id
                      ? "bg-red-950/40 border-red-600 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-red-400">{c.id}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        c.priority === "P1"
                          ? "bg-red-900 text-white"
                          : c.priority === "P2"
                          ? "bg-amber-900 text-amber-200"
                          : "bg-blue-900 text-blue-200"
                      }`}
                    >
                      {c.priority} • {c.severity}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-zinc-200 line-clamp-1">{c.title}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{c.summary}</p>

                  <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Assignee: {c.assignee.split(" ")[0]}</span>
                    <span className="text-amber-400 font-semibold">{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Case Detail Workspace */}
          {selectedCase && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-850 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-400">{selectedCase.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-semibold">
                        Priority: {selectedCase.priority}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-semibold">
                        {selectedCase.severity}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-zinc-100 mt-1">{selectedCase.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{selectedCase.summary}</p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCase.status}
                      onChange={(e) => handleUpdateCaseStatus(e.target.value as any)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                    >
                      <option value="NEW">Status: NEW</option>
                      <option value="TRIAGE">Status: TRIAGE</option>
                      <option value="INVESTIGATION">Status: INVESTIGATION</option>
                      <option value="CONTAINMENT">Status: CONTAINMENT</option>
                      <option value="RESOLVED">Status: RESOLVED</option>
                      <option value="CLOSED">Status: CLOSED</option>
                    </select>

                    {onOpenCaseInChat && (
                      <button
                        onClick={() => onOpenCaseInChat(selectedCase)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold hover:from-red-500 hover:to-red-600 transition-all flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Investigate with AI
                      </button>
                    )}
                  </div>
                </div>

                {/* MITRE Tactics & Correlated Alerts */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-zinc-500">ATT&CK Mapping:</span>
                  {selectedCase.mitreTactics.map((tac, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-red-900/50 text-red-300 text-[11px]"
                    >
                      {tac}
                    </span>
                  ))}
                </div>

                {/* Evidence Vault */}
                <div className="p-3.5 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-red-400" />
                    Forensic Evidence Vault ({selectedCase.evidenceItems.length} items)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedCase.evidenceItems.map((ev) => (
                      <div key={ev.id} className="p-2.5 rounded bg-black/60 border border-zinc-800 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span className="font-bold text-red-400">{ev.type}</span>
                          <span>{ev.addedAt}</span>
                        </div>
                        <div className="text-xs font-mono text-zinc-200 truncate" title={ev.value}>
                          {ev.value}
                        </div>
                        <div className="text-[11px] text-zinc-400">{ev.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Incident Timeline */}
                <div className="p-3.5 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-400" />
                    Chronological Audit Trail & Timeline
                  </div>
                  <div className="space-y-1.5">
                    {selectedCase.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                        <CornerDownRight className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-zinc-500 text-[11px] mr-2">[{item.timestamp}]</span>
                          <span className="font-semibold text-zinc-200">{item.actor}: </span>
                          <span>{item.event}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analyst Notes & Collaboration */}
                <div className="p-3.5 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-red-400" />
                      Analyst Notes & Escalation Log
                    </span>
                    <span className="text-[11px] text-zinc-500">{selectedCase.analystNotes.length} notes</span>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedCase.analystNotes.map((note) => (
                      <div key={note.id} className="p-2.5 rounded bg-black/60 border border-zinc-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="font-bold text-zinc-200">{note.author}</span>
                          <span className="text-zinc-500">{note.timestamp}</span>
                        </div>
                        <p className="text-zinc-300 text-[11px]">{note.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add verified finding or containment observation..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                      className="flex-1 px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Add Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
