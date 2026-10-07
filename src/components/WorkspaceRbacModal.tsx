import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Shield,
  Key,
  History,
  Lock,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Workspace, Role, User, AuditEvent } from "../db/models";

interface WorkspaceRbacModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceRbacModal: React.FC<WorkspaceRbacModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"workspaces" | "rbac" | "audit">("workspaces");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces();
      fetchAuditLogs();
    }
  }, [isOpen]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const [resWs, resAct] = await Promise.all([
        fetch("/api/v2/workspaces"),
        fetch("/api/v2/workspaces/active"),
      ]);
      if (resWs.ok) setWorkspaces(await resWs.json());
      if (resAct.ok) setActiveWorkspace(await resAct.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/v2/audit-events");
      if (res.ok) setAuditEvents(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchWorkspace = async (id: string) => {
    try {
      const res = await fetch("/api/v2/workspaces/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: id }),
      });
      if (res.ok) {
        fetchWorkspaces();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-red-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Workspace, RBAC & Audit Governance
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Organization: Apex Cyber Defense Global (Enterprise Multi-Tenant)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab("workspaces")}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
              activeTab === "workspaces"
                ? "border-red-500 text-white font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Workspaces & Tenant Isolation
          </button>
          <button
            onClick={() => setActiveTab("rbac")}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
              activeTab === "rbac"
                ? "border-red-500 text-white font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            RBAC Roles & Scopes
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
              activeTab === "audit"
                ? "border-red-500 text-white font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Immutable Audit Trail ({auditEvents.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === "workspaces" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border border-blue-500/20 bg-blue-500/5 text-zinc-300">
                <span className="font-semibold text-blue-300 block mb-1">
                  Tenant Isolation Guarantees
                </span>
                Data, assets, findings, and simulation workflows are strictly isolated per workspace.
                Switching workspaces re-binds all backend data queries to the selected tenant context.
              </div>

              <div className="space-y-3">
                {workspaces.map((ws) => {
                  const isCurrent = activeWorkspace?.id === ws.id;
                  return (
                    <div
                      key={ws.id}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-zinc-850 border-red-500/50 shadow-md"
                          : "bg-zinc-950 border-zinc-800"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{ws.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                            {ws.environment}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              ACTIVE TENANT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400">
                          Authorized Subnets: {ws.scopePolicy.authorizedSubnets.join(", ") || "None"}
                        </p>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => handleSwitchWorkspace(ws.id)}
                          className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs transition-colors"
                        >
                          Switch Context
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "rbac" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    role: "Security Administrator",
                    code: "role-admin",
                    desc: "Full access across all modules, workspace settings, integrations, and policies.",
                    perms: ["* (Full Master Control)"],
                  },
                  {
                    role: "SOC Lead & Incident Commander",
                    code: "role-soc-lead",
                    desc: "Can authorize high-consequence containment actions (host isolation, IP blocks).",
                    perms: ["soc:*", "incident:*", "evidence:*", "approvals:grant"],
                  },
                  {
                    role: "Security Analyst (Tier 1/2)",
                    code: "role-analyst",
                    desc: "Triage alerts, correlate telemetry, run non-destructive threat hunting.",
                    perms: ["soc:read", "soc:triage", "telemetry:read", "intel:read"],
                  },
                  {
                    role: "Compliance Auditor / CISO",
                    code: "role-auditor",
                    desc: "Read-only access to audit logs, compliance matrices, and executive reports.",
                    perms: ["dashboard:read", "reports:read", "audit:read", "compliance:read"],
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs">{item.role}</h4>
                      <span className="text-[10px] font-mono text-zinc-500">{item.code}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{item.desc}</p>
                    <div className="pt-2 border-t border-zinc-850">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                        Effective Scopes:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.perms.map((p, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-zinc-400 block mb-2">
                Recent Security Ledger Events
              </span>
              <div className="space-y-1.5">
                {auditEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{event.action}</span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                          {event.targetType}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Actor: <span className="text-zinc-200">{event.actorName}</span> ({event.actorType}) • IP: {event.ipAddress}
                      </div>
                    </div>

                    <span className="text-[10px] text-zinc-500">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
