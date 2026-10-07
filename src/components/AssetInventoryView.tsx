import React, { useState, useEffect } from "react";
import {
  Server,
  Database,
  Cloud,
  Globe,
  Bot,
  Laptop,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Lock,
  ExternalLink,
  Tag,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Asset, AssetType, ExposureLevel } from "../db/models";

export const AssetInventoryView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [exposureFilter, setExposureFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    assetType: "server" as AssetType,
    ipAddress: "",
    hostname: "",
    cloudProvider: "AWS" as const,
    exposure: "INTERNAL" as ExposureLevel,
    businessCriticality: "HIGH" as const,
    ownerTeam: "SecOps & Infra",
    tags: "production, security",
    isInTestingScope: true,
  });

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v2/assets");
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (e) {
      console.error("Failed to load assets", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v2/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAsset,
          workspaceId: "ws-prod-defense",
          tags: newAsset.tags.split(",").map((t) => t.trim()),
          securityScore: 85.0,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchAssets();
      }
    } catch (e) {
      console.error("Failed to create asset", e);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.hostname && asset.hostname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.ipAddress && asset.ipAddress.includes(searchTerm));
    const matchesType = typeFilter === "ALL" || asset.assetType === typeFilter;
    const matchesExposure = exposureFilter === "ALL" || asset.exposure === exposureFilter;
    return matchesSearch && matchesType && matchesExposure;
  });

  const getAssetTypeIcon = (type: AssetType) => {
    switch (type) {
      case "api_gateway":
        return <Globe className="h-4 w-4 text-blue-400" />;
      case "mcp_server":
        return <Bot className="h-4 w-4 text-purple-400" />;
      case "ai_model_service":
        return <Bot className="h-4 w-4 text-pink-400" />;
      case "database":
        return <Database className="h-4 w-4 text-emerald-400" />;
      case "endpoint":
        return <Laptop className="h-4 w-4 text-yellow-400" />;
      default:
        return <Server className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getExposureBadge = (exposure: ExposureLevel) => {
    switch (exposure) {
      case "PUBLIC_INTERNET":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            PUBLIC INTERNET
          </span>
        );
      case "INTERNAL":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            INTERNAL VPC
          </span>
        );
      case "RESTRICTED_ISOLATED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            AIR-GAPPED / ISOLATED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              ASSET GRAPH & INVENTORY
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {assets.length} Discovered Assets Across Cloud & On-Premise
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Enterprise Asset Inventory & Attack Surface Exposure
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 max-w-3xl">
            Inventory of all monitored infrastructure, AI services, MCP tool bridges, and endpoints.
            Authorizations and exclusions defined by the Rules of Engagement are strictly enforced.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors self-start md:self-auto shadow-md"
        >
          <Plus className="h-4 w-4" />
          Register Asset
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by asset name, IP address, or hostname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="api_gateway">API Gateway</option>
              <option value="mcp_server">MCP Server</option>
              <option value="ai_model_service">AI Model Service</option>
              <option value="database">Database</option>
              <option value="endpoint">Endpoint</option>
              <option value="server">Server</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span>Exposure:</span>
            <select
              value={exposureFilter}
              onChange={(e) => setExposureFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="ALL">All Exposures</option>
              <option value="PUBLIC_INTERNET">Public Internet</option>
              <option value="INTERNAL">Internal</option>
              <option value="RESTRICTED_ISOLATED">Restricted Isolated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono">
              <tr>
                <th className="p-3.5">Asset Name</th>
                <th className="p-3.5">Type & Hostname</th>
                <th className="p-3.5">Network Exposure</th>
                <th className="p-3.5">Criticality</th>
                <th className="p-3.5">RoE Scope Authorization</th>
                <th className="p-3.5">Health Score</th>
                <th className="p-3.5">Owner Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3.5 font-medium text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded bg-zinc-950 border border-zinc-800">
                          {getAssetTypeIcon(asset.assetType)}
                        </div>
                        <div>
                          <div className="font-semibold">{asset.name}</div>
                          <div className="text-[11px] font-mono text-zinc-500">
                            {asset.ipAddress || "No direct IP"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-zinc-300">
                      <div>{asset.hostname || "N/A"}</div>
                      <div className="text-[10px] text-zinc-500">{asset.cloudProvider || "On-Premise"}</div>
                    </td>

                    <td className="p-3.5">
                      {getExposureBadge(asset.exposure)}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          asset.businessCriticality === "MISSION_CRITICAL"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : asset.businessCriticality === "HIGH"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {asset.businessCriticality}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {asset.isInTestingScope ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                          <CheckCircle className="h-3.5 w-3.5" />
                          IN SCOPE
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 font-mono text-[11px] font-semibold bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
                          <Lock className="h-3.5 w-3.5" />
                          EXCLUDED (POLICY)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white">
                          {asset.securityScore}%
                        </span>
                        <div className="w-16 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              asset.securityScore >= 80 ? "bg-emerald-500" : "bg-yellow-500"
                            }`}
                            style={{ width: `${asset.securityScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-zinc-400">
                      {asset.ownerTeam}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No assets matched your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-red-400" />
                Register New Infrastructure Asset
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Lambda Payment Webhook"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Asset Type</label>
                  <select
                    value={newAsset.assetType}
                    onChange={(e) => setNewAsset({ ...newAsset, assetType: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="server">Server</option>
                    <option value="api_gateway">API Gateway</option>
                    <option value="mcp_server">MCP Server</option>
                    <option value="ai_model_service">AI Model Service</option>
                    <option value="database">Database</option>
                    <option value="endpoint">Endpoint</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Exposure</label>
                  <select
                    value={newAsset.exposure}
                    onChange={(e) => setNewAsset({ ...newAsset, exposure: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="INTERNAL">Internal</option>
                    <option value="PUBLIC_INTERNET">Public Internet</option>
                    <option value="RESTRICTED_ISOLATED">Restricted Isolated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">IP Address</label>
                  <input
                    type="text"
                    placeholder="10.0.x.x"
                    value={newAsset.ipAddress}
                    onChange={(e) => setNewAsset({ ...newAsset, ipAddress: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Hostname</label>
                  <input
                    type="text"
                    placeholder="svc.corp.internal"
                    value={newAsset.hostname}
                    onChange={(e) => setNewAsset({ ...newAsset, hostname: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="inScopeCheck"
                  checked={newAsset.isInTestingScope}
                  onChange={(e) => setNewAsset({ ...newAsset, isInTestingScope: e.target.checked })}
                  className="rounded border-zinc-700 text-red-600 focus:ring-0"
                />
                <label htmlFor="inScopeCheck" className="text-zinc-300">
                  Authorize asset for safe security validation testing
                </label>
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
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
