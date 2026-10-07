import React, { useState } from "react";
import {
  Shield,
  ShieldAlert,
  Layers,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Crosshair,
  Lock,
  ArrowRight,
  Server,
  Globe,
  Radio,
  RefreshCw,
  Plus,
  Terminal,
  Zap,
} from "lucide-react";
import {
  AuthorizedAsset,
  AttackSurfaceScopeConfig,
  AttackPath,
  AssetCriticality,
  SeverityLevel,
} from "../types";
import {
  INITIAL_AUTHORIZED_ASSETS,
  INITIAL_SCOPE_CONFIG,
  INITIAL_ATTACK_PATHS,
} from "../data/enterpriseData";

export const AttackSurfaceManager: React.FC = () => {
  const [assets, setAssets] = useState<AuthorizedAsset[]>(INITIAL_AUTHORIZED_ASSETS);
  const [scopeConfig] = useState<AttackSurfaceScopeConfig>(INITIAL_SCOPE_CONFIG);
  const [attackPaths] = useState<AttackPath[]>(INITIAL_ATTACK_PATHS);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(INITIAL_AUTHORIZED_ASSETS[0]?.id || "");
  const [scanTargetInput, setScanTargetInput] = useState("api.internal-corp.io");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [searchFilter, setSearchFilter] = useState("");

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];

  const handleRunAuthorizedScan = async () => {
    if (!scanTargetInput.trim()) return;
    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch("/api/asm/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: scanTargetInput.trim() }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch (err: any) {
      setScanResult({ error: err.message });
    } finally {
      setIsScanning(false);
    }
  };

  const filteredAssets = assets.filter((a) => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.identifier.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Scope Banner & Governance Header */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Authorized Attack Surface Management (EASM)
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                Scope Strictly Enforced
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Inventory tracking, explicit safety exclusions, and verified attack path relationships
            </p>
          </div>
        </div>

        {/* Scope stats */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500 mr-1.5">Authorized CIDRs:</span>
            <span className="text-emerald-400 font-bold">{scopeConfig.authorizedCidrs.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500 mr-1.5">Exclusions:</span>
            <span className="text-red-400 font-bold">{scopeConfig.explicitExclusions.length}</span>
          </div>
        </div>
      </div>

      {/* Interactive Scope Boundaries & Exclusion Rules Drawer */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-red-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400" />
            Mandatory Scope Exclusions & Boundary Controls
          </span>
          <span className="text-[10px] text-zinc-500">Unrestricted scanning is forbidden by system policy</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {scopeConfig.explicitExclusions.map((exc, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-red-950/20 border border-red-900/60 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-400">{exc.target}</span>
                <span className="text-[10px] text-red-500 font-semibold uppercase">EXCLUDED</span>
              </div>
              <p className="text-[11px] text-zinc-300">{exc.reason}</p>
              <div className="text-[10px] text-zinc-500">Enforced by: {exc.addedBy}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Scanner Preflight Box */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-red-400" />
            Authorized Target Scanner & Preflight Scope Verifier
          </span>
          <span className="text-[10px] text-zinc-500">Verifies CIDR and checks exclusion table before dispatch</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-zinc-400">Quick Test Targets:</span>
          <button
            onClick={() => setScanTargetInput("api.internal-corp.io")}
            className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-emerald-500"
          >
            + Authorized Gateway (api.internal-corp.io)
          </button>
          <button
            onClick={() => setScanTargetInput("10.0.0.0/24")}
            className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-emerald-500"
          >
            + Authorized DMZ (10.0.0.0/24)
          </button>
          <button
            onClick={() => setScanTargetInput("db-primary.corp.internal")}
            className="text-[10px] px-2 py-0.5 rounded bg-red-950 border border-red-700 text-red-300 hover:border-red-500"
          >
            + Test Policy Intercept (Excluded DB Tier)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter target IP, CIDR or domain to assess..."
            value={scanTargetInput}
            onChange={(e) => setScanTargetInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
          <button
            disabled={isScanning || !scanTargetInput.trim()}
            onClick={handleRunAuthorizedScan}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-lg transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Validating Scope...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Run Scope Verification & Scan
              </>
            )}
          </button>
        </div>

        {/* Scan Output Box */}
        {scanResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs space-y-2 animate-fadeIn ${
              scanResult.authorized
                ? "bg-zinc-900/90 border-emerald-700/60"
                : "bg-red-950/40 border-red-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-2">
                {scanResult.authorized ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Authorized Target Assessment Succeeded</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-300">Scope Policy Enforced — Assessment Blocked</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">{new Date().toLocaleTimeString()}</span>
            </div>

            {scanResult.reason && <p className="text-zinc-300 text-[11px]">{scanResult.reason}</p>}

            {scanResult.ports && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-zinc-400 block font-semibold">Discovered Open Ports:</span>
                <div className="flex flex-wrap gap-2">
                  {scanResult.ports.map((p: any, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-black border border-zinc-800 text-[11px] text-emerald-400">
                      {p.port}/{p.protocol} ({p.service})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Asset Inventory & Attack Path Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Inventory List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-300">Authorized Asset Inventory</span>
            <span className="text-[10px] text-zinc-500">{assets.length} Assets Registered</span>
          </div>

          <div className="space-y-2.5">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedAsset.id === asset.id
                    ? "bg-red-950/40 border-red-600 shadow-md"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-red-400">{asset.id}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      asset.isExcluded
                        ? "bg-red-950 text-red-300 border border-red-700"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-700"
                    }`}
                  >
                    {asset.isExcluded ? "EXCLUDED" : "IN SCOPE"}
                  </span>
                </div>

                <div className="text-xs font-bold text-zinc-200">{asset.name}</div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">{asset.identifier}</div>

                <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{asset.criticality.replace("_", " ")}</span>
                  <span className="text-amber-400 font-semibold">Exposure: {asset.exposureScore}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Asset Details & Attack Path Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          {/* Asset Info Card */}
          <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-850 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">{selectedAsset.name}</h3>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">{selectedAsset.identifier}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400 block">Criticality Tier</span>
                <span className="text-xs font-bold text-red-400">{selectedAsset.criticality}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Owner</span>
                <span className="font-semibold text-zinc-200">{selectedAsset.owner}</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Open Services</span>
                <span className="font-semibold text-zinc-200">{selectedAsset.discoveredServices.length}</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Vulnerabilities</span>
                <span className="font-semibold text-red-400">{selectedAsset.activeVulnerabilitiesCount}</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Last Assessed</span>
                <span className="font-semibold text-zinc-300">{selectedAsset.lastAssessed}</span>
              </div>
            </div>

            {/* Discovered Services Table */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-bold text-zinc-300">Discovered Service Fingerprints</span>
              <div className="divide-y divide-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                {selectedAsset.discoveredServices.map((svc, idx) => (
                  <div key={idx} className="p-2.5 bg-black/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-red-400">
                      Port {svc.port}/{svc.protocol}
                    </span>
                    <span className="text-zinc-300">{svc.serviceName}</span>
                    <span className="text-zinc-500 text-[11px]">{svc.version || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attack Path Relationship Graph */}
          {attackPaths.length > 0 && (
            <div className="p-5 rounded-xl bg-zinc-950 border border-red-900/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-red-400" />
                    Verified Attack Path & Lateral Exposure Analysis
                  </h4>
                  <p className="text-[11px] text-zinc-400">{attackPaths[0].name}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-bold">
                  Likelihood: {attackPaths[0].likelihood}
                </span>
              </div>

              {/* Node Sequence */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2">
                {attackPaths[0].nodes.map((node, idx) => (
                  <div
                    key={node.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 relative ${
                      node.compromised
                        ? "bg-red-950/40 border-red-600 text-red-200"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-zinc-400">Step {idx + 1}</span>
                      <span className={node.compromised ? "text-red-400 font-bold" : "text-emerald-400"}>
                        {node.compromised ? "COMPROMISED" : "PROTECTED"}
                      </span>
                    </div>
                    <div className="font-bold text-xs truncate" title={node.title}>
                      {node.title}
                    </div>
                    <div className="text-[10px] text-zinc-400">{node.description}</div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-black/80 border border-zinc-800 text-xs">
                <span className="text-red-400 font-bold mr-1">Remediation Priority:</span>
                <span className="text-zinc-300">{attackPaths[0].remediationRecommendation}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
