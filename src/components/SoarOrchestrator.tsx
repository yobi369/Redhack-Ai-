import React, { useState } from "react";
import {
  Zap,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  Layers,
  Lock,
  ArrowRight,
  Terminal,
  Activity,
  Play,
  FileCheck,
} from "lucide-react";
import { SoarPlaybook, SoarApprovalRequest } from "../types";
import {
  INITIAL_SOAR_PLAYBOOKS,
  INITIAL_SOAR_APPROVALS,
} from "../data/enterpriseData";

export const SoarOrchestrator: React.FC = () => {
  const [playbooks] = useState<SoarPlaybook[]>(INITIAL_SOAR_PLAYBOOKS);
  const [approvals, setApprovals] = useState<SoarApprovalRequest[]>(INITIAL_SOAR_APPROVALS);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>(INITIAL_SOAR_PLAYBOOKS[0]?.id || "");
  const [approverName, setApproverName] = useState("Marcus Vance (L2 SecOps Lead)");

  const selectedPlaybook = playbooks.find((p) => p.id === selectedPlaybookId) || playbooks[0];

  const handleApproveAction = async (approvalId: string) => {
    try {
      const res = await fetch("/api/soar/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId,
          approverName,
          role: "L2_INVESTIGATOR",
        }),
      });
      const data = await res.json();
      if (data.success && data.approval) {
        setApprovals((prev) =>
          prev.map((a) => (a.id === approvalId ? data.approval : a))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRollbackAction = async (approvalId: string) => {
    try {
      const res = await fetch("/api/soar/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId,
          actor: approverName,
        }),
      });
      const data = await res.json();
      if (data.success && data.approval) {
        setApprovals((prev) =>
          prev.map((a) => (a.id === approvalId ? data.approval : a))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCount = approvals.filter((a) => a.status === "PENDING_APPROVAL").length;

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Header */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Automated Incident Response (SOAR) & Approval Gates
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                Human-in-the-Loop Enforced
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Policy-controlled playbooks, low-risk automated enrichment & mandatory human gates for high-consequence containment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500 mr-1.5">Pending Approvals:</span>
            <span className="text-red-400 font-bold">{pendingCount} Action Requests</span>
          </div>
        </div>
      </div>

      {/* Mandatory Human Approval Gate Queue */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-red-900/60 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400" />
            High-Consequence Action Approval Queue (Human Gate)
          </span>
          <span className="text-[10px] text-zinc-500">
            AI models are strictly forbidden from bypassing human approval for network isolation, account termination or border drops
          </span>
        </div>

        {approvals.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            No pending containment action approvals in queue.
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((appr) => (
              <div
                key={appr.id}
                className={`p-4 rounded-xl border space-y-3 transition-all ${
                  appr.status === "PENDING_APPROVAL"
                    ? "bg-red-950/20 border-red-600/80 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                    : appr.status === "APPROVED_EXECUTED"
                    ? "bg-zinc-900/60 border-zinc-800"
                    : "bg-zinc-950 border-zinc-900 opacity-60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-red-400">{appr.id}</span>
                    <span className="text-xs font-bold text-zinc-100">{appr.actionTitle}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Case: {appr.caseId}</span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      appr.status === "PENDING_APPROVAL"
                        ? "bg-red-950 text-red-300 border border-red-600 animate-pulse"
                        : appr.status === "APPROVED_EXECUTED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {appr.status.replace("_", " ")}
                  </span>
                </div>

                {/* Blast Radius & Risk Assessment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-black/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">TARGET RESOURCE</span>
                    <span className="font-semibold text-zinc-200">{appr.targetResource}</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">BLAST RADIUS & RISK</span>
                    <span className="text-amber-300 text-[11px]">{appr.riskAssessment}</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">DISRUPTION ANALYSIS</span>
                    <span className="text-zinc-300 text-[11px]">{appr.potentialDisruption}</span>
                  </div>
                </div>

                {/* Command Preview */}
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Executable Action Preview:</span>
                  <pre className="p-2.5 rounded bg-black text-xs font-mono text-emerald-400 border border-zinc-900 overflow-x-auto">
                    {appr.commandPreview}
                  </pre>
                </div>

                {/* Rollback Plan */}
                <div className="p-2.5 rounded bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                  <div>
                    <span className="text-red-400 font-bold mr-1">Rollback Plan:</span>
                    <span>{appr.rollbackPlan}</span>
                  </div>
                  {appr.status === "APPROVED_EXECUTED" && (
                    <button
                      onClick={() => handleRollbackAction(appr.id)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      Undo / Rollback Action
                    </button>
                  )}
                </div>

                {/* Approval Action Buttons */}
                {appr.status === "PENDING_APPROVAL" && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-850">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-400">Approving As:</span>
                      <input
                        type="text"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        className="px-2.5 py-1 bg-black border border-zinc-800 rounded text-zinc-200 text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveAction(appr.id)}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Approve & Execute Containment
                      </button>
                    </div>
                  </div>
                )}

                {/* Execution Output */}
                {appr.executionOutput && (
                  <div className="p-2 rounded bg-black/70 border border-emerald-900/60 text-emerald-400 text-[11px]">
                    {appr.executionOutput} (Approved by: {appr.approvedBy} at {appr.approvedAt})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SOAR Playbook Catalog */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-400" />
              Automated Investigation & Containment Playbook Catalog
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">{selectedPlaybook.description}</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold">
            {selectedPlaybook.category}
          </span>
        </div>

        {/* Step-by-Step Flow */}
        <div className="space-y-2.5">
          {selectedPlaybook.steps.map((st) => (
            <div
              key={st.stepIndex}
              className={`p-3.5 rounded-lg border text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                st.isHighConsequence
                  ? "bg-red-950/20 border-red-900/60"
                  : "bg-zinc-900/80 border-zinc-800"
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                  {st.stepIndex}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200">{st.name}</span>
                    {st.isHighConsequence ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-700 font-bold">
                        REQUIRES HUMAN APPROVAL
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                        LOW RISK • AUTOMATED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{st.description}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">Action Type</span>
                <span className="text-xs font-bold text-red-400">{st.actionType}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
