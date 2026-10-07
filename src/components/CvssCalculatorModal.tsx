import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  Calculator,
  X,
  Check,
  Copy,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { CvssMetrics, SeverityLevel } from "../types";

interface CvssCalculatorModalProps {
  initialCvss?: number;
  onApplyCvss: (score: number, vectorString: string, severity: SeverityLevel) => void;
  onClose: () => void;
}

export const CvssCalculatorModal: React.FC<CvssCalculatorModalProps> = ({
  onApplyCvss,
  onClose,
}) => {
  const [av, setAv] = useState<"N" | "A" | "L" | "P">("N"); // Attack Vector
  const [ac, setAc] = useState<"L" | "H">("L"); // Attack Complexity
  const [pr, setPr] = useState<"N" | "L" | "H">("N"); // Privileges Required
  const [ui, setUi] = useState<"N" | "R">("N"); // User Interaction
  const [scope, setScope] = useState<"U" | "C">("U"); // Scope
  const [c, setC] = useState<"H" | "L" | "N">("H"); // Confidentiality
  const [i, setI] = useState<"H" | "L" | "N">("H"); // Integrity
  const [a, setA] = useState<"H" | "L" | "N">("H"); // Availability
  const [copied, setCopied] = useState(false);

  // Official CVSS v3.1 Weights & Calculations
  const { baseScore, vectorString, severity } = useMemo(() => {
    // Metric weights
    const avWeight = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 }[av];
    const acWeight = { L: 0.77, H: 0.44 }[ac];
    const prWeight =
      scope === "U"
        ? { N: 0.85, L: 0.62, H: 0.27 }[pr]
        : { N: 0.85, L: 0.68, H: 0.5 }[pr];
    const uiWeight = { N: 0.85, R: 0.62 }[ui];

    const cWeight = { H: 0.56, L: 0.22, N: 0 }[c];
    const iWeight = { H: 0.56, L: 0.22, N: 0 }[i];
    const aWeight = { H: 0.56, L: 0.22, N: 0 }[a];

    // ISS (Impact Sub Score)
    const iss = 1 - (1 - cWeight) * (1 - iWeight) * (1 - aWeight);

    let impact = 0;
    if (scope === "U") {
      impact = 6.42 * iss;
    } else {
      impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
    }

    const exploitability = 8.22 * avWeight * acWeight * prWeight * uiWeight;

    let score = 0;
    if (impact <= 0) {
      score = 0;
    } else if (scope === "U") {
      score = Math.min(impact + exploitability, 10);
    } else {
      score = Math.min(1.08 * (impact + exploitability), 10);
    }

    // Round up to 1 decimal place (CVSS standard ceil(val * 10) / 10)
    const roundedScore = Math.ceil(Math.round(score * 100000) / 10000) / 10;
    const finalScore = Math.min(10.0, Math.max(0.0, roundedScore));

    let sev: SeverityLevel = "INFO";
    if (finalScore >= 9.0) sev = "CRITICAL";
    else if (finalScore >= 7.0) sev = "HIGH";
    else if (finalScore >= 4.0) sev = "MEDIUM";
    else if (finalScore >= 0.1) sev = "LOW";
    else sev = "INFO";

    const vector = `CVSS:3.1/AV:${av}/AC:${ac}/PR:${pr}/UI:${ui}/S:${scope}/C:${c}/I:${i}/A:${a}`;

    return {
      baseScore: finalScore,
      vectorString: vector,
      severity: sev,
    };
  }, [av, ac, pr, ui, scope, c, i, a]);

  const handleCopyVector = () => {
    navigator.clipboard.writeText(vectorString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-950 border border-red-700/60 text-red-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Official CVSS v3.1 Interactive Vector Calculator
              </h3>
              <span className="text-[10px] text-zinc-400">
                FIRST.Org Standard Vulnerability Severity Scoring Matrix
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Ribbon */}
        <div className="p-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1.5 rounded-lg font-mono font-extrabold text-lg border ${
                severity === "CRITICAL"
                  ? "bg-red-950/80 text-red-400 border-red-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                  : severity === "HIGH"
                  ? "bg-amber-950/80 text-amber-400 border-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : severity === "MEDIUM"
                  ? "bg-blue-950/80 text-blue-400 border-blue-600"
                  : "bg-emerald-950/80 text-emerald-400 border-emerald-600"
              }`}
            >
              {baseScore.toFixed(1)}
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                BASE RATING
              </span>
              <span
                className={`text-xs font-bold ${
                  severity === "CRITICAL"
                    ? "text-red-400"
                    : severity === "HIGH"
                    ? "text-amber-400"
                    : severity === "MEDIUM"
                    ? "text-blue-400"
                    : "text-emerald-400"
                }`}
              >
                {severity}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] bg-black/80 px-2.5 py-1.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-400 truncate max-w-[280px]">{vectorString}</span>
            <button
              onClick={handleCopyVector}
              title="Copy Vector String"
              className="text-zinc-400 hover:text-red-400"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Official Reference Presets */}
        <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-850 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Official FIRST Reference Benchmarks:</span>
          <button
            onClick={() => {
              setAv("N"); setAc("L"); setPr("N"); setUi("N"); setScope("C"); setC("H"); setI("H"); setA("H");
            }}
            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-red-300 hover:border-red-500"
          >
            Log4Shell (10.0 Critical)
          </button>
          <button
            onClick={() => {
              setAv("N"); setAc("L"); setPr("N"); setUi("N"); setScope("U"); setC("H"); setI("H"); setA("H");
            }}
            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-red-300 hover:border-red-500"
          >
            Spring4Shell (9.8 Critical)
          </button>
          <button
            onClick={() => {
              setAv("N"); setAc("L"); setPr("L"); setUi("N"); setScope("C"); setC("L"); setI("L"); setA("N");
            }}
            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-blue-300 hover:border-blue-500"
          >
            Stored XSS (6.4 Medium)
          </button>
          <button
            onClick={() => {
              setAv("L"); setAc("L"); setPr("N"); setUi("R"); setScope("U"); setC("N"); setI("N"); setA("H");
            }}
            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-blue-300 hover:border-blue-500"
          >
            Local DoS (5.5 Medium)
          </button>
        </div>

        {/* Metric Selector Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Exploitability Metrics Group */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-wider border-b border-zinc-800/80 pb-1">
              1. Exploitability Metrics
            </h4>

            {/* Attack Vector */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="text-[11px] text-zinc-300 font-semibold">Attack Vector (AV):</span>
              <div className="col-span-3 grid grid-cols-4 gap-1.5">
                {[
                  { id: "N", label: "Network (N)" },
                  { id: "A", label: "Adjacent (A)" },
                  { id: "L", label: "Local (L)" },
                  { id: "P", label: "Physical (P)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAv(item.id as any)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${
                      av === item.id
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Attack Complexity */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="text-[11px] text-zinc-300 font-semibold">Attack Complexity (AC):</span>
              <div className="col-span-3 grid grid-cols-2 gap-1.5">
                {[
                  { id: "L", label: "Low (L) - No specialized conditions" },
                  { id: "H", label: "High (H) - Complex race / specific setup" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAc(item.id as any)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${
                      ac === item.id
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Privileges Required */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="text-[11px] text-zinc-300 font-semibold">Privileges Required (PR):</span>
              <div className="col-span-3 grid grid-cols-3 gap-1.5">
                {[
                  { id: "N", label: "None (N) - Unauthenticated" },
                  { id: "L", label: "Low (L) - Basic User" },
                  { id: "H", label: "High (H) - Admin / Root" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPr(item.id as any)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${
                      pr === item.id
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User Interaction */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="text-[11px] text-zinc-300 font-semibold">User Interaction (UI):</span>
              <div className="col-span-3 grid grid-cols-2 gap-1.5">
                {[
                  { id: "N", label: "None (N) - Fully autonomous" },
                  { id: "R", label: "Required (R) - Victim click/phish" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setUi(item.id as any)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${
                      ui === item.id
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="text-[11px] text-zinc-300 font-semibold">Scope (S):</span>
              <div className="col-span-3 grid grid-cols-2 gap-1.5">
                {[
                  { id: "U", label: "Unchanged (U) - Within vulnerable component" },
                  { id: "C", label: "Changed (C) - Impacts other systems / VM escape" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setScope(item.id as any)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${
                      scope === item.id
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Impact Metrics Group */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider border-b border-zinc-800/80 pb-1">
              2. Impact Metrics (CIA Triad)
            </h4>

            {/* Confidentiality */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="text-[11px] text-zinc-300 font-semibold">Confidentiality (C):</span>
              <div className="col-span-3 grid grid-cols-3 gap-1.5">
                {[
                  { id: "H", label: "High (H) - Total disclosure" },
                  { id: "L", label: "Low (L) - Partial / info leak" },
                  { id: "N", label: "None (N) - No impact" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setC(item.id as any)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${
                      c === item.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Integrity */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="text-[11px] text-zinc-300 font-semibold">Integrity (I):</span>
              <div className="col-span-3 grid grid-cols-3 gap-1.5">
                {[
                  { id: "H", label: "High (H) - Arbitrary modification" },
                  { id: "L", label: "Low (L) - Limited modification" },
                  { id: "N", label: "None (N) - No impact" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setI(item.id as any)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${
                      i === item.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="text-[11px] text-zinc-300 font-semibold">Availability (A):</span>
              <div className="col-span-3 grid grid-cols-3 gap-1.5">
                {[
                  { id: "H", label: "High (H) - Complete DoS" },
                  { id: "L", label: "Low (L) - Reduced performance" },
                  { id: "N", label: "None (N) - No impact" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setA(item.id as any)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${
                      a === item.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            id="apply-cvss-btn"
            onClick={() => {
              onApplyCvss(baseScore, vectorString, severity);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white text-xs font-bold shadow-lg"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Score ({baseScore.toFixed(1)} - {severity})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
