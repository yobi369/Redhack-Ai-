import React, { useState, useEffect } from "react";
import { Header, NavigationTab } from "./components/Header";
import { ExecutiveDashboard } from "./components/ExecutiveDashboard";
import { MultiAgentConsole } from "./components/MultiAgentConsole";
import { AssetInventoryView } from "./components/AssetInventoryView";
import { FindingLifecycleManager } from "./components/FindingLifecycleManager";
import { AiMcpSecurityView } from "./components/AiMcpSecurityView";
import { SecurityKnowledgeGraph } from "./components/SecurityKnowledgeGraph";
import { EvidenceCenterView } from "./components/EvidenceCenterView";
import { WorkspaceRbacModal } from "./components/WorkspaceRbacModal";
import { CommandPaletteModal } from "./components/CommandPaletteModal";
import { ThreatMonitor } from "./components/ThreatMonitor";
import { EnterpriseSocWorkspace } from "./components/EnterpriseSocWorkspace";
import { AttackSurfaceManager } from "./components/AttackSurfaceManager";
import { PurpleTeamLab } from "./components/PurpleTeamLab";
import { ThreatHuntingStudio } from "./components/ThreatHuntingStudio";
import { SoarOrchestrator } from "./components/SoarOrchestrator";
import { ThreatIntelHub } from "./components/ThreatIntelHub";
import { GovernanceCompliance } from "./components/GovernanceCompliance";
import { ChatCompanion } from "./components/ChatCompanion";
import { ReportGenerator } from "./components/ReportGenerator";
import { SecOpsTools } from "./components/SecOpsTools";
import { WorkflowMatrix } from "./components/WorkflowMatrix";
import { ContainmentModal } from "./components/ContainmentModal";
import { DemoPlaybookModal } from "./components/DemoPlaybookModal";
import { RulesOfEngagementModal } from "./components/RulesOfEngagementModal";
import { CvssCalculatorModal } from "./components/CvssCalculatorModal";
import { PrivacyComplianceModal } from "./components/PrivacyComplianceModal";
import {
  INITIAL_THREAT_ALERTS,
  INITIAL_FINDINGS,
} from "./data/sampleThreats";
import {
  ThreatAlert,
  VulnerabilityFinding,
  ChatMessage,
  CompanionMode,
  SeverityLevel,
  UserRole,
  SocCase,
} from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("executive");
  const [alerts, setAlerts] = useState<ThreatAlert[]>(INITIAL_THREAT_ALERTS);
  const [findings, setFindings] = useState<VulnerabilityFinding[]>(INITIAL_FINDINGS);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [selectedAlertForContainment, setSelectedAlertForContainment] = useState<ThreatAlert | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("L1_ANALYST");

  // Presentation, Governance & v2 Modals
  const [showDemoPlaybooks, setShowDemoPlaybooks] = useState<boolean>(false);
  const [showRulesOfEngagement, setShowRulesOfEngagement] = useState<boolean>(false);
  const [showCvssCalculator, setShowCvssCalculator] = useState<boolean>(false);
  const [showPrivacyCompliance, setShowPrivacyCompliance] = useState<boolean>(false);
  const [showWorkspaceRbac, setShowWorkspaceRbac] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);

  // Chat State
  const [chatMessages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-welcome",
      role: "assistant",
      content: `### 🛡️ REDHACK AI v2 Enterprise Cyber Defense & Adversary Simulation Platform

**"Offense Builds Insight. Defense Builds Resilience. Know Both. Protect All."**
*Authored in the spirit of TuChii Hunnid's ethical cybersecurity framework.*

The full enterprise operational defense suite is active:
- 📊 **Executive Dashboard:** Unified Security Score calculated mathematically across asset exposure, active intrusions, and verified remediation.
- 🏢 **Enterprise SOC (L1/L2):** Centralized telemetry ingestion from AWS, Falcon, Okta, Suricata & Sysmon with normalized OCSF schema.
- 🤖 **Autonomous Multi-Agent Swarm (9 Agents):** Scoped tool execution with mandatory human approval gates for high-consequence operations.
- 🔒 **AI & MCP Agent Security:** Auditing LLM systems, MCP tool bridges, and indirect prompt injection resistance.
- 🎯 **Authorized Purple Team Lab:** Verification tests strictly gated by tenant Rules of Engagement (RoE).
- ⚡ **Emergency Kill Switch:** Instant abort for any running adversary simulation.

Select any module or ask questions below to begin.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [currentMode, setCurrentMode] = useState<CompanionMode>("general_secops");
  const [externalChatPrompt, setExternalChatPrompt] = useState<string | undefined>();

  // Global Keyboard Shortcut for Command Palette: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "RESOLVED" } : a))
    );
  };

  const handleSendToChat = (alert: ThreatAlert) => {
    setExternalChatPrompt(`Investigate threat alert ${alert.id}: "${alert.title}" (${alert.severity}). Source IP: ${alert.sourceIp}, Target Port: ${alert.targetPort}. MITRE ATT&CK: ${alert.mitreId} - ${alert.mitreTechnique}. Raw log: ${alert.rawLog}. Provide triage guidance, extraction of IOCs, and recommended containment command.`);
    setActiveTab("companion");
  };

  const handleAddToReport = (alert: ThreatAlert) => {
    const finding: VulnerabilityFinding = {
      id: `fnd-${Date.now()}`,
      title: alert.title,
      severity: alert.severity,
      cvss: alert.severity === "CRITICAL" ? 9.8 : alert.severity === "HIGH" ? 8.2 : 5.5,
      cwe: "CWE-94",
      asset: `${alert.destinationIp}:${alert.targetPort}`,
      description: `Discovered from alert: ${alert.title}. Technique: ${alert.mitreTechnique} (${alert.mitreId}).`,
      impact: "Potential system compromise or unauthorized lateral movement.",
      remediation: alert.suggestedAction || "Review security logs and isolate host if unauthorized.",
      status: "OPEN",
      verified: true,
    };
    setFindings((prev) => {
      if (prev.some((f) => f.title === finding.title)) return prev;
      return [finding, ...prev];
    });
    setActiveTab("reports");
  };

  const handleManualLogIngested = (newAlert: ThreatAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleSimulationAlertEmitted = (alertTitle: string, mitreId: string) => {
    const newAlert: ThreatAlert = {
      id: `sim-alt-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      title: alertTitle,
      category: "Endpoint",
      severity: "HIGH",
      sourceIp: "10.0.0.99",
      destinationIp: "10.0.0.15",
      targetPort: 445,
      protocol: "TCP",
      mitreTechnique: "Controlled Adversary Emulation",
      mitreId,
      status: "ACTIVE",
      rawLog: `[SIMULATION ENGINE] Emulated attack behavior: ${alertTitle} (${mitreId})`,
      suggestedAction: "Validate EDR rule detection and confirm SIEM telemetry correlation.",
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleOpenCaseInChat = (socCase: SocCase) => {
    const prompt = `Investigate SOC Incident Case ${socCase.id}: "${socCase.title}". Severity is ${socCase.severity}. Correlated alert IDs: ${socCase.correlatedAlertIds.join(", ")}. Summary: ${socCase.summary}. Provide an incident commander summary, IOC extraction, and recommended containment steps.`;
    setExternalChatPrompt(prompt);
    setActiveTab("companion");
  };

  const handleAskCopilotFromWorkflow = (query: string) => {
    setExternalChatPrompt(query);
    setActiveTab("companion");
  };

  const handleSelectDemoScenario = (scenarioId: string) => {
    setShowDemoPlaybooks(false);
    if (scenarioId === "scenario-1") {
      setActiveTab("soc");
    } else if (scenarioId === "scenario-2") {
      setActiveTab("purple");
    } else if (scenarioId === "scenario-3") {
      setActiveTab("reports");
    }
  };

  const handleApplyCvssScore = (score: number, vectorString: string, severity: SeverityLevel) => {
    setShowCvssCalculator(false);
    setActiveTab("reports");
  };

  const handleEmergencyKillSwitch = async () => {
    try {
      await fetch("/api/simulation/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredBy: "Operator via Emergency Kill Switch" }),
      });
      setIsSimulating(false);
    } catch (e) {
      console.error("Emergency stop failed", e);
    }
  };

  const activeThreatsCount = alerts.filter((a) => a.status === "ACTIVE").length;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-mono flex flex-col selection:bg-red-900 selection:text-white">
      {/* HUD Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeThreatsCount={activeThreatsCount}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        currentRole={currentRole}
        onOpenDemoPlaybooks={() => setShowDemoPlaybooks(true)}
        onOpenRulesOfEngagement={() => setShowRulesOfEngagement(true)}
        onOpenCvssCalculator={() => setShowCvssCalculator(true)}
        onOpenPrivacyCompliance={() => setShowPrivacyCompliance(true)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenWorkspaceRbac={() => setShowWorkspaceRbac(true)}
        onTriggerEmergencyKillSwitch={handleEmergencyKillSwitch}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === "executive" && (
          <ExecutiveDashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenScopeModal={() => setShowRulesOfEngagement(true)}
          />
        )}

        {activeTab === "soc" && (
          <EnterpriseSocWorkspace
            currentRole={currentRole}
            onOpenCaseInChat={handleOpenCaseInChat}
          />
        )}

        {activeTab === "agents" && <MultiAgentConsole />}

        {activeTab === "assets" && <AssetInventoryView />}

        {activeTab === "findings" && <FindingLifecycleManager />}

        {activeTab === "ai_security" && <AiMcpSecurityView />}

        {activeTab === "graph" && <SecurityKnowledgeGraph />}

        {activeTab === "evidence" && <EvidenceCenterView />}

        {activeTab === "monitor" && (
          <ThreatMonitor
            alerts={alerts}
            onOpenContainmentModal={(alert) => setSelectedAlertForContainment(alert)}
            onSendToChat={handleSendToChat}
            onAddToReport={handleAddToReport}
            onManualLogIngested={handleManualLogIngested}
          />
        )}

        {activeTab === "easm" && <AttackSurfaceManager />}

        {activeTab === "purple" && (
          <PurpleTeamLab onSimulationAlertEmitted={handleSimulationAlertEmitted} />
        )}

        {activeTab === "hunting" && <ThreatHuntingStudio />}

        {activeTab === "soar" && <SoarOrchestrator />}

        {activeTab === "intel" && <ThreatIntelHub />}

        {activeTab === "reports" && (
          <ReportGenerator
            findings={findings}
            setFindings={setFindings}
          />
        )}

        {activeTab === "governance" && (
          <GovernanceCompliance
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            onOpenRoeModal={() => setShowRulesOfEngagement(true)}
          />
        )}

        {activeTab === "companion" && (
          <ChatCompanion
            messages={chatMessages}
            setMessages={setMessages}
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
            externalPrompt={externalChatPrompt}
            onClearExternalPrompt={() => setExternalChatPrompt(undefined)}
          />
        )}

        {activeTab === "tools" && <SecOpsTools />}

        {activeTab === "workflow" && (
          <WorkflowMatrix onAskCopilot={handleAskCopilotFromWorkflow} />
        )}
      </main>

      {/* Instant Containment First-Response Modal */}
      {selectedAlertForContainment && (
        <ContainmentModal
          alert={selectedAlertForContainment}
          onClose={() => setSelectedAlertForContainment(null)}
          onResolve={handleResolveAlert}
          onSendToChat={handleSendToChat}
          onAddToReport={handleAddToReport}
        />
      )}

      {/* 10-Minute Presentation & Demo Playbook Modal */}
      {showDemoPlaybooks && (
        <DemoPlaybookModal
          onSelectScenario={handleSelectDemoScenario}
          onClose={() => setShowDemoPlaybooks(false)}
        />
      )}

      {/* Rules of Engagement & Ethical Scope Charter */}
      {showRulesOfEngagement && (
        <RulesOfEngagementModal
          onClose={() => setShowRulesOfEngagement(false)}
        />
      )}

      {/* CVSS v3.1 Base Score Calculator */}
      {showCvssCalculator && (
        <CvssCalculatorModal
          onApplyCvss={handleApplyCvssScore}
          onClose={() => setShowCvssCalculator(false)}
        />
      )}

      {/* Zero-Retention Privacy & Architecture Modal */}
      {showPrivacyCompliance && (
        <PrivacyComplianceModal
          onClose={() => setShowPrivacyCompliance(false)}
        />
      )}

      {/* Workspace & Multi-Tenancy RBAC Modal */}
      {showWorkspaceRbac && (
        <WorkspaceRbacModal
          isOpen={showWorkspaceRbac}
          onClose={() => setShowWorkspaceRbac(false)}
        />
      )}

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <CommandPaletteModal
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onNavigate={(tab) => setActiveTab(tab)}
          onEmergencyStop={handleEmergencyKillSwitch}
          onOpenRoE={() => setShowRulesOfEngagement(true)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-4 px-6 text-center text-xs text-zinc-600 bg-zinc-950/80">
        <p>
          <span className="text-red-500 font-bold">REDHACK AI v2</span> — Production-Grade AI-Powered Cybersecurity Operations & Adversary Simulation Platform
        </p>
      </footer>
    </div>
  );
}
