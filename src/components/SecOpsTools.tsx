import React, { useState } from "react";
import {
  Wrench,
  Key,
  Terminal,
  Binary,
  Code2,
  Copy,
  Check,
  Search,
  ShieldAlert,
  Flame,
  Shield,
  Layers,
  ArrowRight,
  Filter,
  FileCode2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export const SecOpsTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<
    "decoder" | "ioc_extractor" | "defanger" | "sigma_studio" | "nmap_builder" | "hardening_gen"
  >("decoder");

  // Decoder State
  const [decoderInput, setDecoderInput] = useState("");
  const [decoderOutput, setDecoderOutput] = useState("");
  const [decoderCopied, setDecoderCopied] = useState(false);

  // IOC Extractor State
  const [iocInput, setIocInput] = useState("");
  const [extractedIocs, setExtractedIocs] = useState<{
    ips: string[];
    domains: string[];
    urls: string[];
    hashes: string[];
    cves: string[];
  }>({ ips: [], domains: [], urls: [], hashes: [], cves: [] });

  // Defanger State
  const [defangInput, setDefangInput] = useState("http://malware-drop.ru/payload.exe\n194.26.29.42\nftp://c2-beacon.darknet.cc:8080");
  const [defangOutput, setDefangOutput] = useState("");
  const [defangCopied, setDefangCopied] = useState(false);

  // Sigma Studio State
  const [sigmaTitle, setSigmaTitle] = useState("Web Shell Execution via PHP Upload");
  const [sigmaMitre, setSigmaMitre] = useState("T1505.003 - Web Shell");
  const [sigmaIp, setSigmaIp] = useState("185.220.101.5");
  const [sigmaPort, setSigmaPort] = useState("443");
  const [sigmaEvidence, setSigmaEvidence] = useState("POST /uploads/shell.php?cmd=whoami HTTP/1.1\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
  const [isGeneratingRules, setIsGeneratingRules] = useState(false);
  const [generatedRules, setGeneratedRules] = useState<{
    sigma: string;
    yara: string;
    splunk: string;
    elastic: string;
  } | null>(null);
  const [activeRuleTab, setActiveRuleTab] = useState<"sigma" | "yara" | "splunk" | "elastic">("sigma");
  const [ruleCopied, setRuleCopied] = useState(false);

  // Nmap Builder State
  const [targetHost, setTargetHost] = useState("10.0.0.1/24");
  const [scanType, setScanType] = useState("-sS");
  const [timing, setTiming] = useState("-T2");
  const [skipPing, setSkipPing] = useState(true);
  const [versionDetect, setVersionDetect] = useState(true);
  const [vulnScripts, setVulnScripts] = useState(true);
  const [ports, setPorts] = useState("-p 1-1024,8080,8443");
  const [outputFile, setOutputFile] = useState("-oN redhack_scan.txt");

  // Hardening Gen State
  const [hardeningTarget, setHardeningTarget] = useState<"linux_ufw" | "nginx_headers" | "fail2ban" | "powershell_isolate">("linux_ufw");
  const [hardeningCopied, setHardeningCopied] = useState(false);

  // Decoder functions
  const handleBase64Decode = () => {
    try {
      const decoded = atob(decoderInput.trim());
      setDecoderOutput(decoded);
    } catch (e) {
      setDecoderOutput("Error: Invalid Base64 string.");
    }
  };

  const handleBase64Encode = () => {
    try {
      const encoded = btoa(decoderInput);
      setDecoderOutput(encoded);
    } catch (e) {
      setDecoderOutput("Error: Failed to Base64 encode.");
    }
  };

  const handlePowerShellDecode = () => {
    try {
      const raw = atob(decoderInput.trim());
      // PowerShell EncodedCommand is UTF-16LE (2 bytes per char)
      let result = "";
      for (let i = 0; i < raw.length; i += 2) {
        result += raw[i];
      }
      setDecoderOutput(result || raw);
    } catch (e) {
      setDecoderOutput("Error: Invalid PowerShell Base64 UTF-16 payload.");
    }
  };

  const handleUrlDecode = () => {
    try {
      setDecoderOutput(decodeURIComponent(decoderInput));
    } catch (e) {
      setDecoderOutput("Error: Invalid URL encoded string.");
    }
  };

  const handleHexDecode = () => {
    try {
      const hex = decoderInput.replace(/\s+/g, "");
      let str = "";
      for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      setDecoderOutput(str);
    } catch (e) {
      setDecoderOutput("Error: Invalid Hex string.");
    }
  };

  // IOC Extractor
  const handleExtractIocs = () => {
    const text = iocInput;
    const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    const urlRegex = /https?:\/\/[^\s"'<>]+/g;
    const domainRegex = /\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b/g;
    const hashRegex = /\b([a-fA-F0-9]{64}|[a-fA-F0-9]{40}|[a-fA-F0-9]{32})\b/g;
    const cveRegex = /CVE-\d{4}-\d{4,7}/gi;

    const ips = Array.from(new Set(text.match(ipRegex) || []));
    const urls = Array.from(new Set(text.match(urlRegex) || []));
    const rawDomains = Array.from(new Set(text.match(domainRegex) || []));
    const domains = rawDomains.filter((d) => !ips.includes(d));
    const hashes = Array.from(new Set(text.match(hashRegex) || []));
    const cves = Array.from(new Set(text.match(cveRegex) || []));

    setExtractedIocs({ ips, domains, urls, hashes, cves });
  };

  // Defanger functions
  const handleDefang = () => {
    let defanged = defangInput
      .replace(/http:\/\//gi, "hxxp://")
      .replace(/https:\/\//gi, "hxxps://")
      .replace(/ftp:\/\//gi, "fxp://")
      .replace(/\./g, "[.]");
    setDefangOutput(defanged);
  };

  const handleRefang = () => {
    let refanged = defangInput
      .replace(/hxxp:\/\//gi, "http://")
      .replace(/hxxps:\/\//gi, "https://")
      .replace(/fxp:\/\//gi, "ftp://")
      .replace(/\[\.\]/g, ".")
      .replace(/\(\.\)/g, ".")
      .replace(/\{\.\}/g, ".");
    setDefangOutput(refanged);
  };

  // Sigma / YARA generation
  const handleGenerateRules = async () => {
    setIsGeneratingRules(true);
    try {
      const res = await fetch("/api/generate-sigma-yara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threatTitle: sigmaTitle,
          category: "Web Application / Endpoint",
          mitreId: sigmaMitre,
          sourceIp: sigmaIp,
          targetPort: sigmaPort,
          rawEvidence: sigmaEvidence,
        }),
      });
      const data = await res.json();
      setGeneratedRules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingRules(false);
    }
  };

  // Nmap Command
  const nmapCommand = `nmap ${scanType} ${timing} ${skipPing ? "-Pn" : ""} ${versionDetect ? "-sV" : ""} ${vulnScripts ? "--script vuln" : ""} ${ports} ${outputFile} ${targetHost}`.replace(/\s+/g, " ").trim();

  // Hardening scripts
  const hardeningScripts: Record<string, string> = {
    linux_ufw: `# ==========================================
# REDHACK LINUX PERIMETER FIREWALL BASELINE
# ==========================================
sudo apt update && sudo apt install ufw -y

# 1. Default Policies (Drop all incoming by default)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 2. Allow Essential Management Ports
sudo ufw allow 22/tcp comment "SSH Bastion"
sudo ufw allow 80/tcp comment "HTTP Gateway"
sudo ufw allow 443/tcp comment "HTTPS Gateway"

# 3. Rate-limit SSH against brute force
sudo ufw limit 22/tcp

# 4. Enable UFW Firewall
sudo ufw --force enable
sudo ufw status verbose`,

    nginx_headers: `# ==========================================
# REDHACK NGINX ENTERPRISE SECURITY HEADERS
# Add into /etc/nginx/conf.d/security_headers.conf
# ==========================================
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'nonce-r3dh4ck'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; frame-ancestors 'none';" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Disable Server Tokens
server_tokens off;`,

    fail2ban: `# ==========================================
# REDHACK FAIL2BAN DEFENSE JAIL CONFIG
# File: /etc/fail2ban/jail.d/redhack-sshd.local
# ==========================================
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
findtime = 600
bantime = 86400
action = iptables-multiport[name=SSH, port="ssh", protocol=tcp]`,

    powershell_isolate: `# ==========================================
# REDHACK INSTANT WINDOWS HOST ISOLATION
# Run in Administrator PowerShell
# ==========================================
# 1. Block All Inbound & Outbound Traffic except SecOps Controller
New-NetFirewallRule -DisplayName "REDHACK-Emergency-Lockdown-In" -Direction Inbound -Action Block -Profile Any
New-NetFirewallRule -DisplayName "REDHACK-Emergency-Lockdown-Out" -Direction Outbound -Action Block -Profile Any

# 2. Terminate suspicious spawned script processes
Get-Process powershell, cmd, wscript, cscript -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $PID } | Stop-Process -Force

# 3. Flush DNS resolver cache
Clear-DnsClientCache
Write-Host "[REDHACK SOC] Workstation successfully isolated from VLAN." -ForegroundColor Red`,
  };

  return (
    <div className="space-y-6 font-mono animate-fadeIn">
      {/* Tool Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800 shadow-md">
        <button
          id="tool-tab-decoder"
          onClick={() => setActiveTool("decoder")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTool === "decoder"
              ? "bg-red-950 text-red-200 border border-red-600 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Binary className="w-4 h-4" />
          <span>Cyber Deobfuscator & Decoder</span>
        </button>

        <button
          id="tool-tab-ioc"
          onClick={() => setActiveTool("ioc_extractor")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTool === "ioc_extractor"
              ? "bg-red-950 text-red-200 border border-red-600 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>IOC & Threat Extractor</span>
        </button>

        <button
          id="tool-tab-defanger"
          onClick={() => setActiveTool("defanger")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTool === "defanger"
              ? "bg-red-950 text-red-200 border border-red-600 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>IOC Defanger / Refanger</span>
        </button>

        <button
          id="tool-tab-sigma"
          onClick={() => setActiveTool("sigma_studio")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTool === "sigma_studio"
              ? "bg-red-950 text-red-200 border border-red-600 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>Sigma & YARA Studio</span>
        </button>

        <button
          id="tool-tab-nmap"
          onClick={() => setActiveTool("nmap_builder")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTool === "nmap_builder"
              ? "bg-red-950 text-red-200 border border-red-600 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Nmap Command Generator</span>
        </button>

        <button
          id="tool-tab-hardening"
          onClick={() => setActiveTool("hardening_gen")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTool === "hardening_gen"
              ? "bg-red-950 text-red-200 border border-red-600 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Hardening Script Builder</span>
        </button>
      </div>

      {/* Tool 1: Decoder / Deobfuscator */}
      {activeTool === "decoder" && (
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Cyber Payload Deobfuscator & Decoder</h3>
              <p className="text-[11px] text-zinc-500">
                Decode suspicious Base64 payloads, PowerShell UTF-16 commands, URL encoded strings, and Hex dumps
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <label className="block text-[10px] text-zinc-400">INPUT RAW ENCODED STRING</label>
              <textarea
                value={decoderInput}
                onChange={(e) => setDecoderInput(e.target.value)}
                rows={7}
                placeholder="Paste Base64 payload (e.g. JABjAGwAaQBlAG4AdAAgAD0AIABN...), URL encoded query, or Hex..."
                className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleBase64Decode}
                  className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-red-400 text-xs font-semibold"
                >
                  Base64 Decode
                </button>
                <button
                  onClick={handlePowerShellDecode}
                  className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-blue-400 text-xs font-semibold"
                >
                  PowerShell UTF-16 Decode
                </button>
                <button
                  onClick={handleUrlDecode}
                  className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 text-xs font-semibold"
                >
                  URL Decode
                </button>
                <button
                  onClick={handleHexDecode}
                  className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-purple-400 text-xs font-semibold"
                >
                  Hex Decode
                </button>
                <button
                  onClick={handleBase64Encode}
                  className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs"
                >
                  Base64 Encode
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] text-zinc-400">DEOBFUSCATED OUTPUT</label>
                {decoderOutput && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(decoderOutput);
                      setDecoderCopied(true);
                      setTimeout(() => setDecoderCopied(false), 2000);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                  >
                    {decoderCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                )}
              </div>
              <textarea
                readOnly
                value={decoderOutput}
                rows={9}
                placeholder="Decoded plain text will appear here..."
                className="w-full p-3 rounded-lg bg-black border border-zinc-800 text-emerald-400 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tool 2: IOC Extractor */}
      {activeTool === "ioc_extractor" && (
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Automated IOC & Threat Artifact Extractor</h3>
            <p className="text-[11px] text-zinc-500">
              Extract IPv4, IPv6, URLs, Domains, Hashes (MD5/SHA256), and CVE IDs from any unstructured threat report or log
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              value={iocInput}
              onChange={(e) => setIocInput(e.target.value)}
              rows={4}
              placeholder="Paste any raw threat report, phishing email headers, or packet summary here..."
              className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500"
            />

            <div className="flex justify-end">
              <button
                onClick={handleExtractIocs}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Extract All Indicators (IOCs)
              </button>
            </div>
          </div>

          {/* Extracted Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-[10px] text-red-400 font-bold block">
                IP ADDRESSES ({extractedIocs.ips.length})
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {extractedIocs.ips.length === 0 ? (
                  <span className="text-[10px] text-zinc-600">None detected</span>
                ) : (
                  extractedIocs.ips.map((ip, i) => (
                    <div key={i} className="text-zinc-200 bg-black/60 px-2 py-1 rounded text-[11px]">
                      {ip}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-[10px] text-blue-400 font-bold block">
                DOMAINS & URLS ({extractedIocs.domains.length + extractedIocs.urls.length})
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {extractedIocs.domains.length === 0 && extractedIocs.urls.length === 0 ? (
                  <span className="text-[10px] text-zinc-600">None detected</span>
                ) : (
                  [...extractedIocs.domains, ...extractedIocs.urls].map((d, i) => (
                    <div key={i} className="text-zinc-200 bg-black/60 px-2 py-1 rounded text-[11px] truncate">
                      {d}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-[10px] text-amber-400 font-bold block">
                HASHES & CVES ({extractedIocs.hashes.length + extractedIocs.cves.length})
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {extractedIocs.hashes.length === 0 && extractedIocs.cves.length === 0 ? (
                  <span className="text-[10px] text-zinc-600">None detected</span>
                ) : (
                  [...extractedIocs.cves, ...extractedIocs.hashes].map((h, i) => (
                    <div key={i} className="text-zinc-200 bg-black/60 px-2 py-1 rounded text-[11px] truncate">
                      {h}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tool: IOC Defanger & Refanger */}
      {activeTool === "defanger" && (
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Safe IOC Defanger & Refanger</h3>
            <p className="text-[11px] text-zinc-500">
              Neutralize malicious URLs, IPv4 addresses, and domain names for safe transmission in ticketing and email systems without triggering link scanners or accidental clicks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <label className="block text-[10px] text-zinc-400">INPUT RAW OR DEFANGED INDICATORS</label>
              <textarea
                value={defangInput}
                onChange={(e) => setDefangInput(e.target.value)}
                rows={7}
                placeholder="Paste active URLs (http://...), IP addresses (1.1.1.1), or domains..."
                className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleDefang}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Defang IOCs (Safe)</span>
                </button>
                <button
                  onClick={handleRefang}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refang IOCs (Restore)</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] text-zinc-400">PROCESSED RESULT</label>
                {defangOutput && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(defangOutput);
                      setDefangCopied(true);
                      setTimeout(() => setDefangCopied(false), 2000);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                  >
                    {defangCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                )}
              </div>
              <textarea
                readOnly
                value={defangOutput}
                rows={9}
                placeholder="Defanged/Refanged strings will appear here (e.g. hxxp://malware[.]com)..."
                className="w-full p-3 rounded-lg bg-black border border-zinc-800 text-emerald-400 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tool: Sigma & YARA Detection Studio */}
      {activeTool === "sigma_studio" && (
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Sigma & YARA Detection Engineering Studio</h3>
              <p className="text-[11px] text-zinc-500">
                Instantly convert threats, attack artifacts, and logs into standard Sigma YAML rules, YARA signatures, Splunk SPL, and Elastic KQL queries.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Input Config */}
            <div className="space-y-3 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">DETECTION TITLE / THREAT NAME</label>
                <input
                  type="text"
                  value={sigmaTitle}
                  onChange={(e) => setSigmaTitle(e.target.value)}
                  className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">MITRE TECHNIQUE</label>
                  <input
                    type="text"
                    value={sigmaMitre}
                    onChange={(e) => setSigmaMitre(e.target.value)}
                    className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">SOURCE IP / TARGET PORT</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={sigmaIp}
                      onChange={(e) => setSigmaIp(e.target.value)}
                      className="w-2/3 p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={sigmaPort}
                      onChange={(e) => setSigmaPort(e.target.value)}
                      className="w-1/3 p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">RAW LOG OR EVIDENCE PAYLOAD</label>
                <textarea
                  rows={4}
                  value={sigmaEvidence}
                  onChange={(e) => setSigmaEvidence(e.target.value)}
                  className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono"
                />
              </div>

              <button
                id="generate-sigma-rules-btn"
                onClick={handleGenerateRules}
                disabled={isGeneratingRules}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingRules ? "Compiling SIEM & YARA Rules..." : "Generate Detection Rules & SIEM Queries"}</span>
              </button>
            </div>

            {/* Generated Rules Output */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {(["sigma", "yara", "splunk", "elastic"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setActiveRuleTab(fmt)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                        activeRuleTab === fmt
                          ? "bg-red-950 text-red-200 border border-red-600"
                          : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                {generatedRules && (
                  <button
                    onClick={() => {
                      const text = generatedRules[activeRuleTab] || "";
                      navigator.clipboard.writeText(text);
                      setRuleCopied(true);
                      setTimeout(() => setRuleCopied(false), 2000);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                  >
                    {ruleCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                )}
              </div>

              <pre className="flex-1 p-4 bg-black rounded-xl border border-zinc-800 text-emerald-400 text-xs font-mono overflow-y-auto max-h-[350px]">
                {generatedRules
                  ? generatedRules[activeRuleTab]
                  : "# Click 'Generate Detection Rules' to compile official Sigma YAML, YARA signatures, and Splunk/Elasticsearch queries for this security event."}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tool 3: Nmap Command Generator */}
      {activeTool === "nmap_builder" && (
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Nmap Stealth & Audit Command Generator</h3>
            <p className="text-[11px] text-zinc-500">
              Construct compliant, stealthy, or comprehensive vulnerability enumeration commands for authorized lab targets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">TARGET (IP / CIDR / HOSTNAME)</label>
              <input
                type="text"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
                className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">SCAN METHOD</label>
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
                className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200"
              >
                <option value="-sS">-sS (TCP SYN Stealth Scan)</option>
                <option value="-sT">-sT (TCP Connect Scan - Full Handshake)</option>
                <option value="-sU">-sU (UDP Protocol Scan)</option>
                <option value="-sA">-sA (TCP ACK Firewall Bypass Probe)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">TIMING TEMPLATE</label>
              <select
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200"
              >
                <option value="-T2">-T2 (Polite / Stealthy - Low IDS alert)</option>
                <option value="-T3">-T3 (Normal Default)</option>
                <option value="-T4">-T4 (Aggressive / Fast Lab Speed)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={skipPing}
                onChange={(e) => setSkipPing(e.target.checked)}
                className="rounded text-red-600 bg-zinc-900 border-zinc-700"
              />
              <span>-Pn (Skip ICMP Host Discovery)</span>
            </label>

            <label className="flex items-center gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={versionDetect}
                onChange={(e) => setVersionDetect(e.target.checked)}
                className="rounded text-red-600 bg-zinc-900 border-zinc-700"
              />
              <span>-sV (Service Version Enumeration)</span>
            </label>

            <label className="flex items-center gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={vulnScripts}
                onChange={(e) => setVulnScripts(e.target.checked)}
                className="rounded text-red-600 bg-zinc-900 border-zinc-700"
              />
              <span>--script vuln (NSE Vulnerability Audit)</span>
            </label>
          </div>

          <div className="p-4 rounded-lg bg-black border border-red-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">GENERATED NMAP COMMAND</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(nmapCommand);
                  alert("Copied Nmap command to clipboard!");
                }}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy Command
              </button>
            </div>
            <pre className="text-emerald-400 text-xs font-mono">{nmapCommand}</pre>
          </div>
        </div>
      )}

      {/* Tool 4: Hardening Script Builder */}
      {activeTool === "hardening_gen" && (
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Production Hardening & Baseline Generator</h3>
              <p className="text-[11px] text-zinc-500">
                Ready-to-deploy firewall rules, security headers, fail2ban filters, and emergency isolation scripts
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { id: "linux_ufw", label: "Linux UFW" },
                { id: "nginx_headers", label: "Nginx Headers" },
                { id: "fail2ban", label: "Fail2ban Jail" },
                { id: "powershell_isolate", label: "PowerShell Isolation" },
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHardeningTarget(h.id as any)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    hardeningTarget === h.id
                      ? "bg-red-950 text-red-200 border border-red-600"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between px-3 py-1 bg-zinc-900 rounded-t-lg border border-zinc-800 text-[10px] text-zinc-400">
              <span>Configuration / Shell Script</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(hardeningScripts[hardeningTarget]);
                  setHardeningCopied(true);
                  setTimeout(() => setHardeningCopied(false), 2000);
                }}
                className="hover:text-zinc-200 flex items-center gap-1"
              >
                {hardeningCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy Script
              </button>
            </div>
            <pre className="p-4 rounded-b-lg bg-black border-x border-b border-zinc-800 text-emerald-400 text-xs font-mono overflow-x-auto max-h-[380px]">
              {hardeningScripts[hardeningTarget]}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
