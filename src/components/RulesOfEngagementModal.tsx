import React, { useState } from "react";
import {
  FileCheck,
  Shield,
  X,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Calendar,
  Building,
  UserCheck,
  PhoneCall,
  Terminal,
} from "lucide-react";
import { RulesOfEngagementConfig } from "../types";

interface RulesOfEngagementModalProps {
  onClose: () => void;
}

export const RulesOfEngagementModal: React.FC<RulesOfEngagementModalProps> = ({
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"builder" | "principles">("builder");
  const [copied, setCopied] = useState(false);

  const [config, setConfig] = useState<RulesOfEngagementConfig>({
    organizationName: "Target Financial Global Ltd.",
    assessorName: "REDHACK Ethical Security Team",
    assessmentType: "Gray-Box Penetration Test & Security Assessment",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    testingHours: "20:00 - 04:00 UTC (Off-peak)",
    authorizedCidrs: "10.0.0.0/16, 194.26.29.0/24, *.target-corp.internal",
    outOfScopeAssets: "Production Payment Processing Gateway (10.0.50.0/24), Third-Party Cloud SaaS, Physical Facilities",
    emergencyContact: "CISO Incident Response Desk",
    emergencyPhone: "+1 (555) 019-2834 / soc@target-corp.internal",
    emergencyStopProcedure: "Immediate trigger via Emergency Stop Kill-Switch in header or contact lead auditor directly at emergency phone.",
    nonDestructiveOnly: true,
    authorizedBy: "Chief Information Security Officer (CISO)",
    signedDate: new Date().toISOString().split("T")[0],
  });

  const generatedRoeDocument = `# RULES OF ENGAGEMENT (RoE) & ETHICAL AUTHORIZATION CHARTER
**PROJECT REF:** REDHACK-SEC-${Date.now().toString().slice(-6)}
**STATUS:** FORMALLY AUTHORIZED // CONFIDENTIAL

---

## 1. Executive Authorization & Scope of Assessment
Permission is hereby granted to **${config.assessorName}** by **${config.organizationName}** to perform an authorized **${config.assessmentType}**.

- **Testing Window:** ${config.startDate} to ${config.endDate}
- **Authorized Testing Hours:** ${config.testingHours}
- **Assessment Scope & Authorized IP Ranges:**
\`\`\`
${config.authorizedCidrs}
\`\`\`

---

## 2. Explicit Out-of-Scope Exclusions & Prohibitions
Under no circumstances may testing activities target or compromise:
\`\`\`
${config.outOfScopeAssets}
\`\`\`

The following activities are **STRICTLY FORBIDDEN**:
1. Denial of Service (DoS/DDoS) stress attacks against production critical infrastructure.
2. Ransomware, wiper payload injection, or permanent data destruction.
3. Social engineering or phishing of customer-facing operational helpdesks without explicit prior written annexes.
4. Physical intrusion into unauthorized data centers.

---

## 3. Non-Destructive Testing & Operational Rules
- **Non-Destructive Constraint:** ${config.nonDestructiveOnly ? "MANDATORY (Safe verification and proof-of-concept evidence only. No disruptive payloads)." : "Conditional (Coordination required for high-risk exploits)."}
- **Stealth & Logging:** Assessors must tag all automated HTTP probes with user-agent header \`User-Agent: REDHACK-Security-Audit/1.0\`.
- **Finding Escalation:** Any discovered **CRITICAL (CVSS ≥ 9.0)** vulnerability or unauthorized third-party backdoor must be reported within **60 minutes** to the Emergency Contact.

---

## 4. Emergency Escalation & Kill-Switch Contacts
If unexpected system instability, latency spikes, or live compromises occur during testing, the engagement must immediately pause and notify:
- **Lead Contact:** ${config.emergencyContact}
- **Direct Emergency Phone / Channel:** ${config.emergencyPhone}

---

## 5. Ethical Oath & Legal Authorization Sign-off
Testing is conducted in strict compliance with the **Computer Fraud and Abuse Act (CFAA)** safe-harbor standards and applicable local data privacy laws.

- **Authorized on Behalf of Organization:** ${config.authorizedBy}
- **Lead Assessor:** ${config.assessorName}
- **Date Signed:** ${config.signedDate}
- **Verification Hash:** \`SHA256: ${Math.random().toString(36).substring(2, 15).toUpperCase()}E8A37D2\``;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedRoeDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedRoeDocument], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RoE-Authorization-${config.organizationName.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950 border border-red-700 text-red-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Rules of Engagement (RoE) & Ethical Operating Charter
              </h3>
              <span className="text-[10px] text-zinc-400">
                Formal legal boundary agreements, authorized scope definitions & ethical safeguards
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

        {/* Tab Toggle */}
        <div className="px-4 py-2 bg-black border-b border-zinc-800 flex gap-2">
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
              activeTab === "builder"
                ? "bg-red-950 text-red-200 border border-red-600"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            1. RoE Scope & Charter Generator
          </button>

          <button
            onClick={() => setActiveTab("principles")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
              activeTab === "principles"
                ? "bg-red-950 text-red-200 border border-red-600"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            2. Core Ethical Principles & Safe Harbor
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs space-y-4">
          {activeTab === "builder" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form Config */}
              <div className="space-y-3 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
                  Engagement Parameters
                </h4>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">TARGET ORGANIZATION</label>
                  <input
                    type="text"
                    value={config.organizationName}
                    onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
                    className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">AUTHORIZED CIDRS / DOMAINS</label>
                  <textarea
                    rows={2}
                    value={config.authorizedCidrs}
                    onChange={(e) => setConfig({ ...config, authorizedCidrs: e.target.value })}
                    className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1 text-red-400">
                    EXPLICIT OUT-OF-SCOPE ASSETS
                  </label>
                  <textarea
                    rows={2}
                    value={config.outOfScopeAssets}
                    onChange={(e) => setConfig({ ...config, outOfScopeAssets: e.target.value })}
                    className="w-full p-2 rounded bg-zinc-950 border border-red-900/60 text-zinc-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">START DATE</label>
                    <input
                      type="date"
                      value={config.startDate}
                      onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                      className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">END DATE</label>
                    <input
                      type="date"
                      value={config.endDate}
                      onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                      className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">EMERGENCY KILL-SWITCH CONTACT</label>
                  <input
                    type="text"
                    value={config.emergencyContact}
                    onChange={(e) => setConfig({ ...config, emergencyContact: e.target.value })}
                    className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 text-zinc-300 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.nonDestructiveOnly}
                    onChange={(e) => setConfig({ ...config, nonDestructiveOnly: e.target.checked })}
                    className="rounded text-red-600 bg-zinc-950 border-zinc-700"
                  />
                  <span className="text-[11px]">Enforce Strict Non-Destructive Simulation</span>
                </label>
              </div>

              {/* Generated RoE Preview */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">
                    Generated RoE Agreement
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 rounded text-[10px] flex items-center gap-1 font-bold"
                    >
                      <Download className="w-3 h-3" />
                      Export .MD
                    </button>
                  </div>
                </div>

                <pre className="flex-1 p-3 bg-black rounded-xl border border-zinc-800 text-zinc-300 text-[10.5px] leading-relaxed overflow-y-auto max-h-[380px] select-text">
                  {generatedRoeDocument}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-zinc-950 to-zinc-950 border border-red-900/60 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                  <Shield className="w-4 h-4" />
                  <span>TuChii Hunnid Cybersecurity Ethos</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-bold">
                  "Offense Builds Insight. Defense Builds Resilience. Know Both. Protect All."
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  REDHACK AI operates strictly under the legal and ethical doctrine that offensive understanding exists solely to build impenetrable defenses. Every offensive simulation is paired with detection signatures and patches.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="text-red-400 font-bold flex items-center gap-1.5 text-[11px]">
                    <Lock className="w-3.5 h-3.5" />
                    1. Explicit Authorization
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Never scan, probe, or interact with infrastructure without signed, written authorization from the verified system owner.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    2. Non-Destructive Execution
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Always use safe proof-of-concept markers (e.g. \`id\`, \`whoami\`, non-disruptive headers) rather than damaging payloads or denial of service attempts.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="text-blue-400 font-bold flex items-center gap-1.5 text-[11px]">
                    <UserCheck className="w-3.5 h-3.5" />
                    3. Rapid Responsible Disclosure
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Discovered critical vulnerabilities or active external intruder traces must be escalated to the designated incident response team within 60 minutes.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                    <Shield className="w-3.5 h-3.5" />
                    4. Continuous Remediation Pairing
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Every identified attack vector must be matched with actionable Sigma/YARA detection rules, firewall filters, and source code remediations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">
            Compliant with NIST SP 800-115 & PTES (Penetration Testing Execution Standard)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
