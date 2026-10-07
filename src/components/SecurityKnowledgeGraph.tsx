import React, { useState } from "react";
import {
  Share2,
  Server,
  ShieldAlert,
  AlertTriangle,
  User,
  Globe,
  Database,
  Bot,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";

interface NodeItem {
  id: string;
  name: string;
  type: "ASSET" | "VULNERABILITY" | "THREAT_ACTOR" | "ALERT" | "IDENTITY";
  details: string;
  risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  x: number;
  y: number;
}

interface EdgeItem {
  from: string;
  to: string;
  relationship: string;
}

const NODES: NodeItem[] = [
  { id: "n1", name: "FIN-WK-09 (Workstation)", type: "ASSET", details: "10.0.8.44 - Finance Exec Workstation", risk: "CRITICAL", x: 220, y: 140 },
  { id: "n2", name: "APT29 (Cozy Bear)", type: "THREAT_ACTOR", details: "State-sponsored Russian threat group", risk: "CRITICAL", x: 450, y: 60 },
  { id: "n3", name: "Suspicious PowerShell C2", type: "ALERT", details: "CrowdStrike Detection ID alt-901", risk: "CRITICAL", x: 200, y: 320 },
  { id: "n4", name: "corp\\fin_controller", type: "IDENTITY", details: "Compromised Executive Domain User", risk: "HIGH", x: 460, y: 220 },
  { id: "n5", name: "CVE-2026-21840 (MCP Tool)", type: "VULNERABILITY", details: "Unrestricted Tool Invocation in MCP", risk: "HIGH", x: 700, y: 160 },
  { id: "n6", name: "Enterprise MCP Bridge", type: "ASSET", details: "10.0.4.20 - AI Tool Bridge", risk: "HIGH", x: 680, y: 320 },
  { id: "n7", name: "Primary Customer Database", type: "ASSET", details: "10.0.2.100 - Crown Jewel Database (Excluded)", risk: "LOW", x: 450, y: 400 },
];

const EDGES: EdgeItem[] = [
  { from: "n2", to: "n1", relationship: "Targeted Spear-phish" },
  { from: "n1", to: "n3", relationship: "Generated EDR Alert" },
  { from: "n4", to: "n1", relationship: "Logged-in Session" },
  { from: "n4", to: "n7", relationship: "Potential Kerberoasting Pivot" },
  { from: "n5", to: "n6", relationship: "Affects Tool Gateway" },
  { from: "n1", to: "n6", relationship: "Lateral Movement Attempt" },
];

export const SecurityKnowledgeGraph: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NodeItem | null>(NODES[0]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const getNodeColor = (type: NodeItem["type"]) => {
    switch (type) {
      case "ASSET":
        return "#3b82f6"; // blue
      case "VULNERABILITY":
        return "#f97316"; // orange
      case "THREAT_ACTOR":
        return "#ef4444"; // red
      case "ALERT":
        return "#eab308"; // yellow
      case "IDENTITY":
        return "#a855f7"; // purple
    }
  };

  const filteredNodes = activeFilter === "ALL" ? NODES : NODES.filter((n) => n.type === activeFilter);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              SECURITY KNOWLEDGE GRAPH
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              7 Entities • 6 Relational Edges • Attack Path Traversal
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Multi-Hop Threat Relationship & Blast Radius Graph
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 max-w-3xl">
            Correlate infrastructure assets, vulnerabilities, threat actors, EDR alerts, and identities
            to visualize the full attack path and blast radius across your perimeter.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="ALL">Show All Entities</option>
            <option value="ASSET">Assets Only</option>
            <option value="THREAT_ACTOR">Threat Actors</option>
            <option value="VULNERABILITY">Vulnerabilities</option>
            <option value="ALERT">Alerts</option>
            <option value="IDENTITY">Identities</option>
          </select>
        </div>
      </div>

      {/* Main Canvas & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Canvas Area */}
        <div className="lg:col-span-8 p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          <div className="absolute top-3 left-3 flex items-center gap-3 text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800 backdrop-blur z-10">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span> Asset
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500"></span> Threat Actor
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500"></span> Vulnerability
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span> Identity
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500"></span> Alert
            </span>
          </div>

          {/* SVG Graph Render */}
          <svg className="w-full h-[440px]" viewBox="0 0 850 480">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="16"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#71717a" />
              </marker>
            </defs>

            {/* Edges */}
            {EDGES.map((edge, idx) => {
              const fromNode = NODES.find((n) => n.id === edge.from);
              const toNode = NODES.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              return (
                <g key={idx}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#3f3f46"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    markerEnd="url(#arrowhead)"
                  />
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2 - 6}
                    fill="#a1a1aa"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {edge.relationship}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node.type);
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer transition-transform hover:scale-105"
                  transform={`translate(${node.x}, ${node.y})`}
                >
                  <circle
                    r={isSelected ? "22" : "18"}
                    fill="#18181b"
                    stroke={isSelected ? "#ef4444" : color}
                    strokeWidth={isSelected ? "3" : "2"}
                    className="transition-all"
                  />
                  <circle r="6" fill={color} />
                  <text
                    y="32"
                    fill="#f4f4f5"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    {node.name}
                  </text>
                  <text
                    y="44"
                    fill="#71717a"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {node.type}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Entity Inspector */}
        <div className="lg:col-span-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Share2 className="h-4 w-4 text-cyan-400" />
              Entity Intelligence Inspector
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              {selectedNode ? selectedNode.type : "Select Node"}
            </span>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500">
                  Node Identifier & Classification
                </span>
                <div className="font-bold text-sm text-white">{selectedNode.name}</div>
                <div className="text-zinc-400 font-mono text-[11px]">
                  {selectedNode.details}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400">
                  Assessed Risk Level
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                      selectedNode.risk === "CRITICAL"
                        ? "bg-red-500/10 text-red-400 border border-red-500/30"
                        : "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                    }`}
                  >
                    {selectedNode.risk}
                  </span>
                  <span className="text-zinc-400">Active threat vector involved</span>
                </div>
              </div>

              {/* Related Connections */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-zinc-400">
                  Direct Graph Edges & Pivots
                </span>
                <div className="space-y-1.5">
                  {EDGES.filter(
                    (e) => e.from === selectedNode.id || e.to === selectedNode.id
                  ).map((edge, i) => {
                    const isOutbound = edge.from === selectedNode.id;
                    const counterpartId = isOutbound ? edge.to : edge.from;
                    const counterpart = NODES.find((n) => n.id === counterpartId);
                    return (
                      <div
                        key={i}
                        className="p-2 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono flex items-center justify-between"
                      >
                        <span className="text-zinc-400">
                          {isOutbound ? "→" : "←"} {edge.relationship}
                        </span>
                        <span className="text-white font-semibold">
                          {counterpart?.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Graph traversal allows automated correlation of MITRE ATT&CK lateral movement paths to block privilege escalation before crown jewel compromise.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              Click any node on the graph to inspect its details and pivoting relationships.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
