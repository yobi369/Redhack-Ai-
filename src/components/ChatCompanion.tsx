import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Cpu,
  Shield,
  Terminal,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  Flame,
  ShieldAlert,
  Search,
  Wrench,
  Layers,
  ArrowRight,
  Code2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage, CompanionMode } from "../types";

interface ChatCompanionProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentMode: CompanionMode;
  setCurrentMode: (mode: CompanionMode) => void;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
}

export const ChatCompanion: React.FC<ChatCompanionProps> = ({
  messages,
  setMessages,
  currentMode,
  setCurrentMode,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-fill external prompt if passed from Threat Monitor
  useEffect(() => {
    if (externalPrompt) {
      setInputText(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt, onClearExternalPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      // Strip markdown symbols for clearer speech
      const cleanText = text.replace(/[#*`_~]/g, "").slice(0, 400);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString(),
      mode: currentMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          mode: currentMode,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: data.reply || "REDHACK AI: Analysis completed.",
        timestamp: new Date().toLocaleTimeString(),
        mode: currentMode,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ REDHACK AI Error: ${err.message || "Failed to communicate with security reasoning engine."}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      label: "SQLi Mechanism & Defense",
      prompt: "Explain how SQL Injection works in a login form, show a safe lab PoC, and provide the exact parameterized query defense.",
      mode: "red_team" as CompanionMode,
    },
    {
      label: "Stealth Nmap Scanning",
      prompt: "Show me Nmap commands for stealth scanning with timing templates (-sS -T2 -Pn), explain what each flag does, and how defenders detect it.",
      mode: "red_team" as CompanionMode,
    },
    {
      label: "Brute Force Log Detection",
      prompt: "How can I detect SSH and Web brute force attacks in logs? Provide exact grep/awk commands and a Fail2ban jail rule.",
      mode: "blue_team" as CompanionMode,
    },
    {
      label: "Linux Server Hardening Script",
      prompt: "Generate a production-ready Linux server hardening bash script (UFW rules, SSH key-only, sysctl network security, disable root login).",
      mode: "blue_team" as CompanionMode,
    },
    {
      label: "Incident Response Playbook",
      prompt: "Guide me through a step-by-step incident response workflow for an active ransomware / C2 compromise on a web server.",
      mode: "incident_response" as CompanionMode,
    },
    {
      label: "Analyze Suspicious PowerShell",
      prompt: "Analyze this suspicious encoded PowerShell command: powershell -nop -w hidden -enc JABjAGwAaQBlAG5AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0... and explain how to contain it.",
      mode: "blue_team" as CompanionMode,
    },
  ];

  const modes: { id: CompanionMode; label: string; icon: any; color: string; desc: string }[] = [
    {
      id: "red_team",
      label: "Red Team (Offensive)",
      icon: Flame,
      color: "text-red-400 border-red-800 bg-red-950/40",
      desc: "Recon, vuln discovery, payload mechanics in labs & attack surface mapping",
    },
    {
      id: "blue_team",
      label: "Blue Team (Defensive)",
      icon: Shield,
      color: "text-blue-400 border-blue-800 bg-blue-950/40",
      desc: "SIEM log analysis, Sigma/YARA rules, IOC hunting & system hardening",
    },
    {
      id: "incident_response",
      label: "Incident Response",
      icon: ShieldAlert,
      color: "text-amber-400 border-amber-800 bg-amber-950/40",
      desc: "Live triage, active breach containment, forensics & eradication",
    },
    {
      id: "vuln_analyst",
      label: "Vuln Auditor",
      icon: Search,
      color: "text-purple-400 border-purple-800 bg-purple-950/40",
      desc: "CVSS v3.1 scoring, CVE impact analysis & patch prioritization",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-mono animate-fadeIn">
      {/* Sidebar: Mode Switcher & Quick Prompts */}
      <div className="lg:col-span-1 space-y-4">
        {/* Mode Selector */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              Operational Focus Mode
            </h3>
          </div>

          <div className="space-y-2">
            {modes.map((m) => {
              const Icon = m.icon;
              const isSelected = currentMode === m.id;
              return (
                <button
                  key={m.id}
                  id={`mode-btn-${m.id}`}
                  onClick={() => setCurrentMode(m.id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    isSelected
                      ? `${m.color} border-l-4 font-bold shadow-[0_0_12px_rgba(239,68,68,0.2)]`
                      : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 font-normal line-clamp-2">
                    {m.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick SecOps Prompts */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300">Quick Prompt Templates</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="space-y-1.5">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                id={`quick-prompt-${idx}`}
                onClick={() => {
                  setCurrentMode(qp.mode);
                  handleSendMessage(qp.prompt);
                }}
                className="w-full text-left p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/80 hover:border-red-900 text-[11px] text-zinc-300 hover:text-red-300 transition-colors flex items-center justify-between group"
              >
                <span className="line-clamp-1">{qp.label}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-400" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="lg:col-span-3 flex flex-col h-[740px] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-red-950 border border-red-700/60 text-red-400">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-100 font-mono">
                  REDHACK AI NEURAL COMPANION
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {currentMode.toUpperCase().replace("_", " ")}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">
                Ethical Cyber Intelligence • Gemini-3.7 Reasoning Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="clear-chat-btn"
              onClick={() =>
                setMessages([
                  {
                    id: "init-1",
                    role: "assistant",
                    content: `### 🛡️ REDHACK AI Cybersecurity Companion Initialized.\n\n*Offense Builds Insight. Defense Builds Resilience. Know Both. Protect All.*\n\nI am configured for **${currentMode.toUpperCase().replace("_", " ")}** operations. How can I assist with threat analysis, vulnerability assessments, or incident containment?`,
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ])
              }
              title="Clear Conversation"
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 px-1 text-[10px] text-zinc-500">
                <span>{msg.role === "user" ? "Security Operator" : "REDHACK AI"}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[92%] rounded-xl p-4 shadow-md ${
                  msg.role === "user"
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                    : "bg-zinc-900/90 text-zinc-200 border border-red-950/80 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                }`}
              >
                <div className="markdown-body space-y-2 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-sm font-extrabold text-red-400 border-b border-zinc-800 pb-1 mb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xs font-bold text-red-300 mt-2 mb-1">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xs font-semibold text-zinc-200 mt-2 mb-1">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-xs text-zinc-300 whitespace-pre-wrap">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 space-y-1 text-zinc-300">
                          {children}
                        </ol>
                      ),
                      code: ({ inline, className, children, ...props }: any) => {
                        const codeString = String(children).replace(/\n$/, "");
                        if (inline) {
                          return (
                            <code className="px-1.5 py-0.5 rounded bg-black/60 border border-zinc-800 text-red-300 font-mono text-[11px]">
                              {children}
                            </code>
                          );
                        }
                        return (
                          <div className="relative my-2 rounded-lg bg-black border border-zinc-800 overflow-hidden group">
                            <div className="flex items-center justify-between px-3 py-1 bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500">
                              <span>Terminal / Script</span>
                              <button
                                onClick={() => handleCopy(codeString, msg.id)}
                                className="hover:text-zinc-200 flex items-center gap-1"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                Copy
                              </button>
                            </div>
                            <pre className="p-3 text-emerald-400 text-[11px] overflow-x-auto font-mono">
                              <code>{children}</code>
                            </pre>
                          </div>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {msg.role === "assistant" && (
                  <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-zinc-800/80">
                    <button
                      onClick={() => handleSpeak(msg.content)}
                      title={isSpeaking ? "Stop Voice Briefing" : "Read Aloud (Voice Briefing)"}
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2 py-1 rounded bg-zinc-950 border border-zinc-800"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3 h-3 text-red-400" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Voice Briefing</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2 py-1 rounded bg-zinc-950 border border-zinc-800"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Response</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-red-400 animate-pulse text-xs">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>REDHACK AI is analyzing attack vectors & security rules...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                id="chat-input-field"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Ask REDHACK AI in ${currentMode.replace("_", " ")} mode (e.g. "Harden Nginx config", "Audit SQLi probe", "Write Sigma rule")...`}
                className="w-full pl-4 pr-10 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500 shadow-inner"
              />
            </div>

            <button
              id="chat-submit-btn"
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white disabled:opacity-50 shadow-md shadow-red-900/40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500">
            <span>Powered by Gemini 3.7 Flash</span>
            <span>Ethical Security Research & Defensive Operations</span>
          </div>
        </div>
      </div>
    </div>
  );
};
