import React, { useState } from "react";
import { 
  Layers, 
  ArrowRight, 
  Shield, 
  Terminal, 
  Cpu, 
  Flame, 
  Activity, 
  Radio, 
  CheckCircle2, 
  Database,
  Lock,
  Bot,
  Zap,
  Server,
  Code
} from "lucide-react";

export default function ArchitecturePage() {
  const [selectedNodeId, setSelectedNodeId] = useState("detection");

  const architectureNodes = [
    {
      id: "red_team",
      title: "RED TEAM ATTACK ENGINE",
      stage: "STAGE 01",
      icon: Flame,
      category: "Offense",
      latency: "< 15ms",
      badge: "Red Team",
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/40",
      description: "Generates real HTTP exploitation payloads against target endpoints (SQLi, IDOR, Stored XSS, Brute Force).",
      inputs: "Scenario selection, target IP/URL, parameter fuzzing profiles",
      outputs: "Raw HTTP requests with malicious payloads (UNION SELECT, tampering headers, scripts)",
      technology: "Python requests / automated execution suites / multi-threaded worker pools"
    },
    {
      id: "target_app",
      title: "VULNERABLE TRAINING TARGET",
      stage: "STAGE 02",
      icon: Server,
      category: "Target",
      latency: "< 5ms",
      badge: "Vulnerable App",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      description: "Deliberately vulnerable enterprise application serving mock banking, user accounts, and customer feedback.",
      inputs: "Attacker HTTP requests, legitimate user requests",
      outputs: "Database query execution, user profile responses, reflected DOM scripts, HTTP status codes",
      technology: "Flask micro-framework, SQLite database, raw string concatenation queries, unescaped DOM rendering"
    },
    {
      id: "telemetry",
      title: "TELEMETRY MIDDLEWARE",
      stage: "STAGE 03",
      icon: Terminal,
      category: "Observability",
      latency: "< 1ms",
      badge: "Collector",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      description: "Intersects all inbound requests at the gateway level before and after application processing.",
      inputs: "HTTP request headers, query strings, post body, client IP, user agent, response code",
      outputs: "Normalized JSON security telemetry events dispatched to the asynchronous queue",
      technology: "WSGI Before/After request hooks, Flask request inspection, microsecond timestamping"
    },
    {
      id: "ingestion",
      title: "EVENT INGESTION BUS",
      stage: "STAGE 04",
      icon: Database,
      category: "Pipeline",
      latency: "< 2ms",
      badge: "Ingestion",
      badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
      description: "Persists events into the transactional log and distributes them across WebSocket broadcast channels.",
      inputs: "Normalized JSON events from telemetry middleware",
      outputs: "SQLite event records, real-time Socket.IO broadcasts to client SOC dashboards",
      technology: "SQLite with WAL mode, Flask-SocketIO streaming, atomic transaction safety"
    },
    {
      id: "detection",
      title: "HEURISTIC DETECTION ENGINE",
      stage: "STAGE 05",
      icon: Zap,
      category: "Defense",
      latency: "< 4ms",
      badge: "Detection",
      badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
      description: "Evaluates raw payloads against multi-vector heuristic rules, tokenizers, and threshold counters.",
      inputs: "Raw event payload, endpoint, HTTP parameters, IP history",
      outputs: "Security alerts (CRITICAL, HIGH, MEDIUM), matched rule ID, confidence score",
      technology: "AST parsing, boolean tautology matching, sliding window rate limits, session boundary verification"
    },
    {
      id: "correlation",
      title: "INCIDENT CORRELATION MATRIX",
      stage: "STAGE 06",
      icon: Activity,
      category: "Correlation",
      latency: "< 8ms",
      badge: "Correlation",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
      description: "Aggregates related alerts within a temporal window into a single cohesive incident dossier.",
      inputs: "Individual alerts sharing source IP, target resource, or attack vector chain",
      outputs: "Correlated Security Incident with status (OPEN, INVESTIGATING, CONTAINED)",
      technology: "Temporal sliding window correlation, graph relationship linking, state machine tracking"
    },
    {
      id: "ai_analyst",
      title: "AI SECURITY COPILOT",
      stage: "STAGE 07",
      icon: Bot,
      category: "Intelligence",
      latency: "< 50ms",
      badge: "AI Analyst",
      badgeColor: "bg-pink-500/20 text-pink-400 border-pink-500/40",
      description: "Synthesizes structured 8-part digital forensic incident assessments and answers natural language SOC queries.",
      inputs: "Incident timeline, correlated alerts, raw telemetry samples, MITRE taxonomy",
      outputs: "8-part AI Summary (what_happened, attack_type, severity, progression, recommended_response)",
      technology: "Dual-mode AI (Deterministic rule-grounded forensic engine + optional LLM API fallback)"
    },
    {
      id: "containment",
      title: "CLOSED-LOOP CONTAINMENT",
      stage: "STAGE 08",
      icon: Lock,
      category: "Response",
      latency: "< 1ms",
      badge: "Containment",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      description: "Automatically or manually enforces IP quarantine at the network edge, dropping subsequent attacker traffic.",
      inputs: "Analyst isolation trigger or automated policy threshold (e.g. repeated CRITICAL alerts)",
      outputs: "Instant HTTP 403 Forbidden gateway drop, attacker socket severance, incident resolution",
      technology: "In-memory dynamic IP blocklist, gateway drop middleware, zero-restart policy enforcement"
    }
  ];

  const selectedNode = architectureNodes.find(n => n.id === selectedNodeId) || architectureNodes[4];

  return (
    <div className="space-y-5 pb-12 font-mono select-none animate-glideIn">
      {/* Page Header */}
      <div className="p-5 cyber-panel rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold text-white tracking-wide">
              NEXES SOC CLOSED-LOOP ARCHITECTURE SPECIFICATION
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-bold">
              100% OFFLINE READY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-spectrum autonomous cyber range: from payload delivery to automated quarantine and AI forensics.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3.5 py-1 rounded-full bg-[#030611] border border-white/10 text-slate-300 shadow-sm">
            TOTAL PIPELINE LATENCY: <span className="text-cyan-400 font-extrabold">&lt; 35ms</span>
          </div>
        </div>
      </div>

      {/* Interactive 8-Stage Architecture Flow */}
      <div className="p-5 cyber-panel rounded-2xl border border-white/10 shadow-lg space-y-3.5 card-glide">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <span className="text-xs font-bold text-slate-200">DATA FLOW &amp; COMPONENT TOPOLOGY</span>
          <span className="text-[11px] text-cyan-400 font-semibold">CLICK ANY COMPONENT TO INSPECT SPECIFICATION</span>
        </div>

        {/* Horizontal Node Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {architectureNodes.map((node) => {
            const Icon = node.icon;
            const isSelected = selectedNodeId === node.id;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[115px] ${
                  isSelected
                    ? "bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-105"
                    : "bg-[#030611]/80 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1.5">
                    <span className="font-extrabold">{node.stage}</span>
                    <span className={`px-1.5 py-0.2 rounded-full border text-[8px] font-bold ${node.badgeColor}`}>
                      {node.latency}
                    </span>
                  </div>
                  <Icon className={`w-4 h-4 mb-2 ${isSelected ? "text-cyan-300" : "text-slate-500"}`} />
                  <div className="text-[11px] font-extrabold leading-tight line-clamp-2">
                    {node.title}
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 pt-1.5 border-t border-white/5 mt-1.5">
                  {node.category}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Deep-Dive Inspection Card */}
      <div className="p-6 cyber-panel rounded-2xl border border-white/10 shadow-xl space-y-4 card-glide">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <selectedNode.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{selectedNode.stage}:</span>
                <h2 className="text-base font-extrabold text-white">{selectedNode.title}</h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${selectedNode.badgeColor}`}>
                  {selectedNode.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{selectedNode.description}</p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-500">EXECUTION TIME: </span>
            <span className="text-cyan-400 font-extrabold">{selectedNode.latency}</span>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#030611] border border-white/5 rounded-xl space-y-2 card-glide">
            <span className="text-slate-400 font-extrabold text-[10px] flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" /> INPUT SIGNALS &amp; SCHEMAS
            </span>
            <p className="text-slate-200 text-xs leading-relaxed">{selectedNode.inputs}</p>
          </div>

          <div className="p-4 bg-[#030611] border border-white/5 rounded-xl space-y-2 card-glide">
            <span className="text-slate-400 font-extrabold text-[10px] flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" /> OUTPUT ARTIFACTS &amp; ACTIONS
            </span>
            <p className="text-slate-200 text-xs leading-relaxed">{selectedNode.outputs}</p>
          </div>

          <div className="p-4 bg-[#030611] border border-white/5 rounded-xl space-y-2 card-glide">
            <span className="text-slate-400 font-extrabold text-[10px] flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-purple-400" /> IMPLEMENTATION TECHNOLOGY
            </span>
            <p className="text-slate-200 text-xs leading-relaxed">{selectedNode.technology}</p>
          </div>
        </div>
      </div>

      {/* Judge Value Proposition Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 cyber-panel rounded-2xl border border-white/10 space-y-1.5 card-glide">
          <span className="text-cyan-400 font-extrabold flex items-center gap-1.5">
            <Zap className="w-4 h-4" /> 1. SUB-MILLISECOND DETECTION
          </span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            In-memory heuristic engine runs within the WSGI request lifecycle, evaluating tautologies and parameter tampering before DB commit.
          </p>
        </div>

        <div className="p-4 cyber-panel rounded-2xl border border-white/10 space-y-1.5 card-glide">
          <span className="text-purple-400 font-extrabold flex items-center gap-1.5">
            <Bot className="w-4 h-4" /> 2. 8-PART DUAL-MODE AI FORENSICS
          </span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Deterministic rule-grounded forensic summarizer works completely offline without API keys, with optional Gemini LLM enhancement.
          </p>
        </div>

        <div className="p-4 cyber-panel rounded-2xl border border-white/10 space-y-1.5 card-glide">
          <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> 3. CLOSED-LOOP SELF-HEALING
          </span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            When malicious patterns are correlated, active containment drops attacker traffic with zero restart required, completing the loop.
          </p>
        </div>
      </div>
    </div>
  );
}
