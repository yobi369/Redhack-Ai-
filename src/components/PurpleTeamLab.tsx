import React, { useState } from "react";
import {
  Flame,
  Shield,
  ShieldAlert,
  Play,
  Square,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Activity,
  Terminal,
  RefreshCw,
  Sparkles,
  Zap,
  Radio,
  Sliders,
  Check,
} from "lucide-react";
import {
  SimulationScenario,
  SimulationExecutionRecord,
} from "../types";
import { INITIAL_SIMULATION_SCENARIOS } from "../data/enterpriseData";

interface PurpleTeamLabProps {
  onSimulationAlertEmitted?: (alertTitle: string, mitreId: string) => void;
}

export const PurpleTeamLab: React.FC<PurpleTeamLabProps> = ({
  onSimulationAlertEmitted,
}) => {
  const [scenarios] = useState<SimulationScenario[]>(INITIAL_SIMULATION_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(INITIAL_SIMULATION_SCENARIOS[0]?.id || "");
  const [targetAssetInput, setTargetAssetInput] = useState("10.0.0.0/24");
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [emergencyStopped, setEmergencyStopped] = useState(false);
  const [executionRecord, setExecutionRecord] = useState<SimulationExecutionRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"catalog" | "posture">("catalog");

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleRunSimulation = async () => {
    if (!targetAssetInput.trim()) return;
    setIsRunning(true);
    setEmergencyStopped(false);
    setExecutionRecord(null);

    try {
      const res = await fetch("/api/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          targetAsset: targetAssetInput.trim(),
          timeoutSeconds,
          authorizedBy: "Purple Team Operator",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setExecutionRecord({
          id: `SIM-FAIL-${Date.now()}`,
          scenarioId: selectedScenario.id,
          scenarioTitle: selectedScenario.title,
          mitreId: selectedScenario.mitreId,
          targetAsset: targetAssetInput,
          startedAt: new Date().toLocaleTimeString(),
          status: "BLOCKED_BY_SCOPE",
          scopeValidationResult: {
            authorized: false,
            reason: data.reason || data.message || "Scope Enforcement Aborted Execution.",
          },
          telemetryGeneratedCount: 0,
          detectionVerified: false,
          coverageGapFound: true,
          executionLogs: [`[PREFLIGHT ERROR] ${data.reason || data.message}`],
          postureBefore: { detectionRate: 80, riskScore: 70 },
          postureAfter: { detectionRate: 80, riskScore: 70, gapRemediated: false },
        });
      } else {
        setExecutionRecord(data);
        if (onSimulationAlertEmitted) {
          onSimulationAlertEmitted(selectedScenario.title, selectedScenario.mitreId);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      await fetch("/api/simulation/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredBy: "Manual Kill-Switch UI" }),
      });
      setIsRunning(false);
      setEmergencyStopped(true);
      if (executionRecord) {
        setExecutionRecord({
          ...executionRecord,
          status: "STOPPED_BY_EMERGENCY",
          executionLogs: [
            ...executionRecord.executionLogs,
            `[EMERGENCY KILL-SWITCH] Operator pressed Kill-Switch. Simulation terminated immediately.`,
          ],
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Header Banner with Kill Switch */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Controlled Adversary Simulation & Purple Team Engine
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                Safe Lab Mode
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              MITRE ATT&CK technique mapping, preflight scope validation, and defensive coverage verification
            </p>
          </div>
        </div>

        {/* Emergency Kill Switch Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEmergencyStop}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/90 border border-red-600 text-red-200 hover:bg-red-900 text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
          >
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span>EMERGENCY STOP (KILL SWITCH)</span>
          </button>
        </div>
      </div>

      {emergencyStopped && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-600 text-red-200 text-xs flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2 font-bold">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            EMERGENCY KILL SWITCH ENGAGED — All active simulation processes halted. Safety state preserved.
          </span>
          <button
            onClick={() => setEmergencyStopped(false)}
            className="px-2 py-1 rounded bg-zinc-900 text-[10px] text-zinc-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Simulation Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Catalog */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-300">ATT&CK Technique Scenarios</span>
            <span className="text-[10px] text-zinc-500">{scenarios.length} Safe Scenarios</span>
          </div>

          <div className="space-y-2.5">
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedScenario.id === sc.id
                    ? "bg-red-950/40 border-red-600 shadow-md"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-red-400">{sc.mitreId}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                    {sc.safetyProfile.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs font-bold text-zinc-200">{sc.title}</div>
                <div className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{sc.description}</div>
                <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Tactic: {sc.mitreTactic}</span>
                  <span className="text-amber-400 font-semibold">{sc.timeoutSeconds}s max</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Scenario Controller & Live Console */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-850 pb-3">
              <div>
                <span className="text-xs font-bold text-red-400">{selectedScenario.mitreId} • {selectedScenario.mitreTactic}</span>
                <h3 className="text-base font-extrabold text-zinc-100 mt-0.5">{selectedScenario.title}</h3>
                <p className="text-xs text-zinc-400 mt-1">{selectedScenario.description}</p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold uppercase">
                {selectedScenario.safetyProfile}
              </span>
            </div>

            {/* Target & Execution Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-zinc-400">Target Asset / Subnet:</span>
                <input
                  type="text"
                  value={targetAssetInput}
                  onChange={(e) => setTargetAssetInput(e.target.value)}
                  placeholder="e.g. 10.0.0.0/24 or api.internal-corp.io"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                />
                <span className="text-[10px] text-zinc-500 block">
                  Requirement: {selectedScenario.targetScopeRequirement}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Execution Timeout:</span>
                  <span className="text-red-400 font-bold">{timeoutSeconds} seconds</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(parseInt(e.target.value, 10))}
                  className="w-full accent-red-500"
                />
                <span className="text-[10px] text-zinc-500 block">
                  Isolated lab execution limit (Fail-safe auto termination)
                </span>
              </div>
            </div>

            {/* Synthetic Payload & Defensive Expectation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 block font-bold">SYNTHETIC PAYLOAD PREVIEW (BENIGN)</span>
                <pre className="text-zinc-300 text-[11px] font-mono whitespace-pre-wrap">
                  {selectedScenario.syntheticPayloadPreview}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 block font-bold">EXPECTED DEFENSIVE DETECTION</span>
                <p className="text-emerald-400 text-xs font-semibold">{selectedScenario.expectedDefensiveDetection}</p>
                <p className="text-[10px] text-zinc-400">{selectedScenario.defensiveAssertion}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={isRunning}
                onClick={handleRunSimulation}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executing Isolated Simulation...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Preflight Scope Check & Simulate
                  </>
                )}
              </button>

              <span className="text-[11px] text-zinc-500">
                Non-destructive test fixtures only • No real payloads
              </span>
            </div>
          </div>

          {/* Execution Output & Before-and-After Comparison */}
          {executionRecord && (
            <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  {executionRecord.status === "COMPLETED" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : executionRecord.status === "BLOCKED_BY_SCOPE" ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <AlertOctagon className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">
                      Simulation Run: {executionRecord.scenarioTitle}
                    </h4>
                    <span className="text-[10px] text-zinc-500">ID: {executionRecord.id} • Target: {executionRecord.targetAsset}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    executionRecord.status === "COMPLETED"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                      : "bg-red-950 text-red-300 border border-red-700"
                  }`}
                >
                  {executionRecord.status}
                </span>
              </div>

              {/* Scope Reason */}
              {executionRecord.scopeValidationResult && (
                <div
                  className={`p-2.5 rounded-lg border text-xs ${
                    executionRecord.scopeValidationResult.authorized
                      ? "bg-emerald-950/20 border-emerald-800 text-emerald-300"
                      : "bg-red-950/40 border-red-800 text-red-300"
                  }`}
                >
                  <span className="font-bold mr-1">Preflight Scope Gate:</span>
                  {executionRecord.scopeValidationResult.reason}
                </div>
              )}

              {/* Execution Logs */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 block">Simulation Evidence Stream:</span>
                <div className="p-3 rounded-lg bg-black text-xs font-mono text-zinc-300 space-y-1 max-h-40 overflow-y-auto border border-zinc-900">
                  {executionRecord.executionLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              </div>

              {/* Before vs After Posture Comparison */}
              {executionRecord.status === "COMPLETED" && (
                <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-red-400" />
                    Security Posture & Detection Coverage Comparison
                  </span>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                    <div className="p-3 rounded bg-black/60 border border-zinc-800 space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase block">BEFORE SIMULATION</span>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Detection Rate:</span>
                        <span className="text-zinc-200 font-bold">{executionRecord.postureBefore.detectionRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Risk Score:</span>
                        <span className="text-amber-400 font-bold">{executionRecord.postureBefore.riskScore}/100</span>
                      </div>
                    </div>

                    <div className="p-3 rounded bg-black/60 border border-emerald-900/60 space-y-1">
                      <span className="text-[10px] text-emerald-400 uppercase block font-bold">AFTER VALIDATION</span>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Detection Rate:</span>
                        <span className="text-emerald-400 font-bold">{executionRecord.postureAfter.detectionRate}% (+9%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Risk Score:</span>
                        <span className="text-emerald-400 font-bold">{executionRecord.postureAfter.riskScore}/100 (-14)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
