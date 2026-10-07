import React, { useState } from "react";
import {
  FileCheck,
  Shield,
  Lock,
  UserCheck,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Filter,
  Download,
  Copy,
  AlertTriangle,
  Flame,
  Activity,
  Check,
} from "lucide-react";
import {
  ComplianceControlItem,
  SystemAuditLogEntry,
  UserRole,
  RulesOfEngagementConfig,
} from "../types";
import {
  INITIAL_COMPLIANCE_CONTROLS,
  INITIAL_AUDIT_LOGS,
} from "../data/enterpriseData";

interface GovernanceComplianceProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  onOpenRoeModal?: () => void;
}

export const GovernanceCompliance: React.FC<GovernanceComplianceProps> = ({
  currentRole,
  setCurrentRole,
  onOpenRoeModal,
}) => {
  const [controls] = useState<ComplianceControlItem[]>(INITIAL_COMPLIANCE_CONTROLS);
  const [auditLogs] = useState<SystemAuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [selectedStandard, setSelectedStandard] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"controls" | "audit" | "rbac">("controls");

  const filteredControls = controls.filter((ctrl) => {
    if (selectedStandard !== "ALL" && ctrl.standard !== selectedStandard) return false;
    return true;
  });

  const implementedCount = controls.filter((c) => c.status === "IMPLEMENTED").length;

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Header */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Governance, Risk & Compliance (GRC)
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                Auditor Workspace
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Rules of Engagement enforcement, RBAC personas, tamper-evident audit logs & compliance control evidence
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab("controls")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === "controls"
                ? "bg-red-950 border border-red-600 text-red-200"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Compliance Matrix ({implementedCount}/{controls.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === "audit"
                ? "bg-red-950 border border-red-600 text-red-200"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("rbac")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === "rbac"
                ? "bg-red-950 border border-red-600 text-red-200"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            RBAC Personas
          </button>
        </div>
      </div>

      {/* Rules of Engagement Status Strip */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs font-bold text-zinc-200">
              Active Rules of Engagement (RoE) Charter Signed & Approved
            </div>
            <div className="text-[11px] text-zinc-400">
              Authorized Testing Scope: <span className="text-emerald-400">10.0.0.0/24, internal-corp.io</span> • Policy: <span className="text-red-400">Non-Destructive Only</span>
            </div>
          </div>
        </div>

        {onOpenRoeModal && (
          <button
            onClick={onOpenRoeModal}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Inspect RoE Scope Document
          </button>
        )}
      </div>

      {/* TAB 1: COMPLIANCE CONTROLS MATRIX */}
      {activeTab === "controls" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Standards Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "NIST CSF 2.0", "ISO 27001:2022", "SOC 2 Type II", "MITRE ATT&CK"].map((std) => (
              <button
                key={std}
                onClick={() => setSelectedStandard(std)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedStandard === std
                    ? "bg-red-950 border border-red-600 text-red-200 shadow"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {std}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredControls.map((ctrl) => (
              <div
                key={ctrl.id}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-zinc-700 transition-colors space-y-2 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400">
                    {ctrl.standard} • {ctrl.controlCode}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      ctrl.status === "IMPLEMENTED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : "bg-amber-950 text-amber-300 border border-amber-700"
                    }`}
                  >
                    {ctrl.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-zinc-200">{ctrl.title}</h4>

                <div className="p-2.5 rounded bg-black/60 border border-zinc-900 text-xs space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold block">IMPLEMENTATION EVIDENCE</span>
                  <p className="text-zinc-300 text-[11px]">{ctrl.implementationEvidence}</p>
                </div>

                <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-1">
                  <span>Mapped Feature: <span className="text-zinc-300">{ctrl.mappedFeature}</span></span>
                  <span className="text-emerald-400 font-semibold">Verified in Codebase</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl animate-fadeIn">
          <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-200">
              Tamper-Evident System Audit Trail ({auditLogs.length} events recorded)
            </span>
            <span className="text-zinc-500">Immutable ledger of approvals, scope blocks and simulations</span>
          </div>

          <div className="divide-y divide-zinc-900 overflow-x-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-zinc-900/50 transition-colors text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono">[{log.timestamp}]</span>
                    <span className="font-bold text-zinc-200">{log.action}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700 text-zinc-400">
                      {log.role}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : log.status === "BLOCKED"
                        ? "bg-red-950 text-red-300 border border-red-700"
                        : "bg-amber-950 text-amber-300 border border-amber-700"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>

                <div className="text-[11px] text-zinc-400">
                  Resource: <span className="text-zinc-300 font-semibold">{log.resource}</span> • Actor: <span className="text-zinc-300">{log.actor}</span>
                </div>
                <div className="text-[11px] text-zinc-500">{log.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RBAC PERSONA SWITCHER */}
      {activeTab === "rbac" && (
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4 animate-fadeIn">
          <div className="border-b border-zinc-850 pb-3">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-red-400" />
              Role-Based Access Control (RBAC) Persona Switching
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Simulate enterprise security privileges for SOC Level 1, Level 2, Purple Team, and CISO auditors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                role: "L1_ANALYST" as const,
                title: "SOC Level 1 Triage Analyst",
                permissions: ["View normalized telemetry", "Triage active alerts", "Add incident case notes", "Run low-risk automated queries"],
                restrictions: ["Cannot execute high-consequence containment actions without L2/CISO approval"],
              },
              {
                role: "L2_INVESTIGATOR" as const,
                title: "Senior Incident Responder (L2)",
                permissions: ["Approve high-consequence containment", "Isolate endpoints", "Apply border firewall rules", "Perform digital forensics"],
                restrictions: ["Must record formal blast radius and rollback plan"],
              },
              {
                role: "PURPLE_TEAM_LEAD" as const,
                title: "Purple Team Simulation Lead",
                permissions: ["Execute authorized adversary simulations", "Validate defensive detection coverage", "Trigger emergency kill switch"],
                restrictions: ["Strictly constrained to pre-authorized CIDRs; zero out-of-scope probes"],
              },
              {
                role: "CISO_AUDITOR" as const,
                title: "CISO / Lead Compliance Auditor",
                permissions: ["Sign Rules of Engagement charters", "Audit immutable logs", "Review NIST CSF & ISO 27001 evidence", "Export STIX 2.1 intelligence"],
                restrictions: ["Read-only telemetry access"],
              },
            ].map((p) => (
              <div
                key={p.role}
                onClick={() => setCurrentRole(p.role)}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2.5 ${
                  currentRole === p.role
                    ? "bg-red-950/40 border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-100">{p.title}</h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      currentRole === p.role
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {currentRole === p.role ? "ACTIVE SESSION" : "SWITCH ROLE"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold block">GRANTED PERMISSIONS</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-300">
                    {p.permissions.map((perm, i) => (
                      <li key={i}>{perm}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1 pt-1 border-t border-zinc-850">
                  <span className="text-[10px] text-zinc-500 font-bold block">POLICY GUARDRAILS</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-zinc-400">
                    {p.restrictions.map((rst, i) => (
                      <li key={i}>{rst}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
