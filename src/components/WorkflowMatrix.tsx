import React, { useState } from "react";
import {
  Layers,
  Target,
  Search,
  Bug,
  Terminal,
  ShieldAlert,
  Wrench,
  FileText,
  ArrowRight,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Code2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { REDHACK_WORKFLOW_STEPS } from "../data/sampleThreats";
import { WorkflowStep, CompanionMode } from "../types";

interface WorkflowMatrixProps {
  onAskCopilot: (prompt: string, mode: CompanionMode) => void;
}

export const WorkflowMatrix: React.FC<WorkflowMatrixProps> = ({ onAskCopilot }) => {
  const [selectedStep, setSelectedStep] = useState<WorkflowStep>(REDHACK_WORKFLOW_STEPS[0]);

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case "Target":
        return Target;
      case "Search":
        return Search;
      case "Bug":
        return Bug;
      case "Terminal":
        return Terminal;
      case "ShieldAlert":
        return ShieldAlert;
      case "Wrench":
        return Wrench;
      case "FileText":
        return FileText;
      default:
        return Layers;
    }
  };

  return (
    <div className="space-y-6 font-mono animate-fadeIn">
      {/* Banner / Ethos Header */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-zinc-950 via-red-950/40 to-zinc-950 border border-red-900/60 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
              REDHACK AI CYBERSECURITY WORKFLOW
            </span>
            <h2 className="text-lg font-extrabold text-zinc-100">
              Offense Builds Insight. Defense Builds Resilience.
            </h2>
            <p className="text-xs text-zinc-400">
              The standardized 7-stage ethical cybersecurity execution methodology for authorized testing, SOC operations, and incident defense.
            </p>
          </div>

          <div className="px-4 py-2 rounded-lg bg-black/80 border border-red-800 text-xs text-red-300 font-bold whitespace-nowrap shadow-inner">
            KNOW BOTH • PROTECT ALL
          </div>
        </div>
      </div>

      {/* 7-Step Navigation Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {REDHACK_WORKFLOW_STEPS.map((s) => {
          const Icon = getStepIcon(s.iconName);
          const isSelected = selectedStep.step === s.step;
          return (
            <button
              key={s.step}
              id={`workflow-step-btn-${s.step}`}
              onClick={() => setSelectedStep(s)}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[110px] ${
                isSelected
                  ? "bg-red-950/80 border-red-500 text-zinc-100 shadow-[0_0_15px_rgba(239,68,68,0.3)] scale-[1.02]"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-500"
                  }`}
                >
                  0{s.step}
                </span>
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? "text-red-400 animate-pulse" : "text-zinc-500"
                  }`}
                />
              </div>

              <div className="mt-2">
                <h4 className="text-[11px] font-bold line-clamp-2 leading-tight">
                  {s.title}
                </h4>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Step Breakdown Card */}
      <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-700 flex items-center justify-center text-red-400 font-extrabold">
              0{selectedStep.step}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    selectedStep.category === "offensive"
                      ? "bg-red-950 text-red-300 border border-red-700"
                      : selectedStep.category === "defensive"
                      ? "bg-blue-950 text-blue-300 border border-blue-700"
                      : "bg-emerald-950 text-emerald-300 border border-emerald-700"
                  }`}
                >
                  {selectedStep.category}
                </span>
                <span className="text-xs text-zinc-500">
                  MITRE Stage: {selectedStep.mitrePhase}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-zinc-100 mt-1">
                {selectedStep.title}
              </h3>
            </div>
          </div>

          <button
            id="workflow-ask-copilot-btn"
            onClick={() =>
              onAskCopilot(
                `Guide me through Step ${selectedStep.step} (${selectedStep.title}) of the REDHACK cybersecurity methodology. Provide practical examples, commands, and defense mechanisms.`,
                selectedStep.category === "offensive" ? "red_team" : "blue_team"
              )
            }
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white text-xs font-bold rounded-lg shadow-md transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Practice this Step with Copilot</span>
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          {selectedStep.description}
        </p>

        {/* Dual Insight Columns: Offensive vs Defensive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Offensive / Execution Insight */}
          <div className="p-4 rounded-lg bg-zinc-900/80 border border-red-950 space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
              <Flame className="w-4 h-4" />
              <span>Key Operational Actions & Tools</span>
            </div>

            <ul className="space-y-1.5 text-xs text-zinc-300">
              {selectedStep.actions.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">›</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <span className="text-[10px] text-zinc-500 block mb-1">Recommended Tools:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedStep.keyTools.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded bg-black border border-zinc-800 text-zinc-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Defensive Resilience & Detection */}
          <div className="p-4 rounded-lg bg-zinc-900/80 border border-blue-950 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Blue Team Defense & Countermeasures</span>
            </div>

            <p className="text-xs text-zinc-300">
              {selectedStep.defenseEquivalent}
            </p>

            <div className="pt-2">
              <span className="text-[10px] text-zinc-500 block mb-1">Example Command / Filter:</span>
              <pre className="p-2.5 rounded bg-black border border-zinc-800 text-emerald-400 text-[11px] overflow-x-auto">
                {selectedStep.exampleCommand}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
