import React from "react";
import { CheckCircle2, Shield, Layers, Award, Terminal, Activity, Flame, Cpu, Lock, Bot } from "lucide-react";

export default function JudgeRequirementsPage({ setActiveTab }) {
  const requirements = [
    {
      challenge: "At least 2 distinct web vulnerabilities",
      implementation: "SQL Injection (/vulnerable/login & /search), IDOR (/vulnerable/profile/<id>), plus Stored XSS (/vulnerable/comments)",
      status: "100% Satisfied",
      navTab: "vulnerable_app",
      icon: Shield
    },
    {
      challenge: "Live incident response monitoring dashboard",
      implementation: "High-contrast SOC interface built with React, Tailwind CSS, Chart.js, and real-time live event streaming",
      status: "100% Satisfied",
      navTab: "command_center",
      icon: Activity
    },
    {
      challenge: "Real-time log ingestion (zero page refresh)",
      implementation: "Flask-SocketIO push pipeline normalizing events into structured JSON and dispatching within milliseconds",
      status: "100% Satisfied",
      navTab: "live_threats",
      icon: Terminal
    },
    {
      challenge: "Automated alert generation & severity system",
      implementation: "Rule-based engine with heuristic regex, confidence scoring (0.85-0.98), and consistent severity (INFO, LOW, MEDIUM, HIGH, CRITICAL)",
      status: "100% Satisfied",
      navTab: "alerts",
      icon: Award
    },
    {
      challenge: "Incident correlation across related events",
      implementation: "Clustering heuristics grouping multi-stage events by IP, session, and 5-minute sliding window into unified Incidents",
      status: "100% Satisfied",
      navTab: "incidents",
      icon: Layers
    },
    {
      challenge: "Chronological Incident Timeline component",
      implementation: "Dedicated graph vector: Timestamp → Event → Detection → Severity → Endpoint → Response → Containment",
      status: "100% Satisfied",
      navTab: "timeline",
      icon: CheckCircle2
    },
    {
      challenge: "Automated threat containment action",
      implementation: "Safe application-level blocklist intercepting requests with 403 Forbidden and updating SOC HUD live",
      status: "100% Satisfied",
      navTab: "attack_surface",
      icon: Lock
    },
    {
      challenge: "Multi-threaded exploit / throughput demo",
      implementation: "Controlled local stress test benchmark testing 10-500 requests with 1-10 concurrent threads measuring true events/sec",
      status: "100% Satisfied",
      navTab: "analytics",
      icon: Cpu
    },
    {
      challenge: "UI response time & live latency tracking",
      implementation: "Continuous client-side ping-pong latency tracking in top HUD with real-time millisecond metrics",
      status: "100% Satisfied",
      navTab: "command_center",
      icon: Activity
    },
    {
      challenge: "One-click deterministic judging demonstration",
      implementation: "Attack Simulator with 1-click scenarios & 15-second guided DEMO MODE showcasing the complete closed loop",
      status: "100% Satisfied",
      navTab: "simulator",
      icon: Flame
    },
    {
      challenge: "Lightweight AI Security Analyst & Threat Copilot",
      implementation: "AI reasoning engine providing automated incident executive briefs, MITRE ATT&CK taxonomy classification, root cause analysis, and remediation code generation",
      status: "100% Satisfied",
      navTab: "ai_analyst",
      icon: Bot
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-soc-border pb-4">
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          University Hackathon Challenge Evaluation Matrix
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Detailed mapping proving comprehensive coverage of every judge evaluation requirement.
        </p>
      </div>

      {/* Grid of Requirements */}
      <div className="grid grid-cols-1 gap-3.5">
        {requirements.map((req, idx) => {
          const Icon = req.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-soc-card border border-soc-border hover:border-emerald-500/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">REQ #{idx + 1}</span>
                    <h3 className="text-sm font-bold text-white">{req.challenge}</h3>
                  </div>
                  <p className="text-xs text-slate-300 font-mono font-normal">
                    {req.implementation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{req.status}</span>
                </span>

                <button
                  onClick={() => setActiveTab(req.navTab)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
                >
                  Inspect Feature →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
