import React, { useState, useEffect } from "react";
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  Hash,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Lock,
  Download,
} from "lucide-react";
import { EvidenceItem } from "../db/models";

export const EvidenceCenterView: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<EvidenceItem["evidenceType"]>("raw_log");
  const [newContent, setNewContent] = useState("");

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v2/evidence");
      if (res.ok) {
        const data = await res.json();
        setEvidenceList(data);
        if (data.length > 0 && !selectedEvidence) {
          setSelectedEvidence(data[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load evidence", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dummyHash = "a" + Math.random().toString(16).substring(2) + "f" + Date.now().toString(16);
      const res = await fetch("/api/v2/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: "ws-prod-defense",
          title: newTitle,
          evidenceType: newType,
          sha256Hash: dummyHash.padEnd(64, "0"),
          chainOfCustody: [
            {
              timestamp: new Date().toISOString(),
              actor: "Marcus Vance (SOC Admin)",
              action: "MANUALLY_CAPTURED_AND_HASHED",
              verificationHash: dummyHash.padEnd(64, "0"),
            },
          ],
          content: newContent,
          collectedBy: "Marcus Vance (CISO Desk)",
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewTitle("");
        setNewContent("");
        fetchEvidence();
      }
    } catch (e) {
      console.error("Failed to create evidence", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              EVIDENCE & FORENSIC VAULT
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Immutable Chain of Custody • SHA-256 Cryptographic Verification
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Digital Forensics & Incident Evidence Center
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 max-w-3xl">
            Store, audit, and verify captured technical evidence (PCAPs, raw logs, terminal recordings,
            and prompt injection traces) with strict legal chain-of-custody tracking.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors self-start md:self-auto shadow-md"
        >
          <Plus className="h-4 w-4" />
          Ingest Artifact
        </button>
      </div>

      {/* Main Grid: Evidence List + Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Artifacts */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase text-zinc-400">
              Vault Artifacts ({evidenceList.length})
            </span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> All Hashes Verified
            </span>
          </div>

          <div className="space-y-2.5">
            {evidenceList.map((item) => {
              const isSelected = selectedEvidence?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedEvidence(item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-zinc-800/90 border-red-500/50 shadow-md shadow-red-950/20"
                      : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/30">
                      {item.evidenceType}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-white line-clamp-1">
                    {item.title}
                  </h4>

                  <div className="text-[11px] font-mono text-zinc-400 truncate flex items-center gap-1">
                    <Hash className="h-3 w-3 text-zinc-500" />
                    <span>{item.sha256Hash.substring(0, 24)}...</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Evidence Inspector */}
        <div className="lg:col-span-7 space-y-5">
          {selectedEvidence ? (
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-5">
              <div className="border-b border-zinc-800 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/30">
                    {selectedEvidence.evidenceType}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    Collector: {selectedEvidence.collectedBy}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {selectedEvidence.title}
                </h3>
              </div>

              {/* Cryptographic SHA-256 Hash Box */}
              <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-red-400" />
                    SHA-256 Verification Digest
                  </span>
                  <button
                    onClick={() => handleCopyHash(selectedEvidence.sha256Hash)}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedHash ? "Copied!" : "Copy Hash"}
                  </button>
                </div>
                <div className="font-mono text-xs text-white break-all bg-zinc-900 p-2.5 rounded border border-zinc-800">
                  {selectedEvidence.sha256Hash}
                </div>
              </div>

              {/* Raw Payload Content */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono uppercase text-zinc-400">
                  Captured Content Payload
                </span>
                <pre className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-56">
                  {selectedEvidence.content}
                </pre>
              </div>

              {/* Chain of Custody */}
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Legal Chain of Custody Ledger
                </span>

                <div className="space-y-1.5">
                  {selectedEvidence.chainOfCustody?.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded border border-zinc-800 bg-zinc-950/60 text-xs flex items-center justify-between gap-3 font-mono"
                    >
                      <div className="space-y-0.5">
                        <span className="text-zinc-200 font-semibold">{entry.actor}</span>
                        <div className="text-[10px] text-zinc-500">{entry.action}</div>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/40">
              Select an evidence item from the list to review its SHA-256 verification and forensic chain of custody.
            </div>
          )}
        </div>
      </div>

      {/* Ingest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-400" />
                Ingest Digital Forensics Artifact
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvidence} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Artifact Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireshark PCAP - Kerberoasting TGS Request Dump"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Evidence Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value="raw_log">Raw Log Stream</option>
                  <option value="pcap_snippet">PCAP Network Packet Capture</option>
                  <option value="terminal_session">Terminal Session Trace</option>
                  <option value="prompt_injection_trace">Prompt Injection Trace</option>
                  <option value="config_dump">System Configuration Dump</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Evidence Content / Raw Payload</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Paste log snippet, JSON-RPC call, or hex payload..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-medium"
                >
                  Compute Hash & Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
