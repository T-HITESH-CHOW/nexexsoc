import React from "react";
import { 
  Flame, 
  Terminal, 
  Search, 
  Bell, 
  AlertTriangle, 
  Bot, 
  ShieldCheck, 
  ChevronRight
} from "lucide-react";

export default function AttackVectorFlow({ activeStage = null, onStageClick }) {
  const stages = [
    {
      id: "attack",
      label: "RED TEAM",
      sub: "Exploit Injection",
      desc: "SQLi / IDOR / XSS",
      icon: Flame,
      color: "text-red-400",
      border: "border-red-500/40 hover:border-red-500",
      bg: "bg-red-500/10",
      tab: "simulator"
    },
    {
      id: "event",
      label: "TELEMETRY",
      sub: "Structured Ingest",
      desc: "RFC 3339 Schema",
      icon: Terminal,
      color: "text-cyan-400",
      border: "border-cyan-500/40 hover:border-cyan-500",
      bg: "bg-cyan-500/10",
      tab: "live_threats"
    },
    {
      id: "detection",
      label: "DETECTION",
      sub: "Heuristic Rules",
      desc: "Syntax & Entropy",
      icon: Search,
      color: "text-blue-400",
      border: "border-blue-500/40 hover:border-blue-500",
      bg: "bg-blue-500/10",
      tab: "alerts"
    },
    {
      id: "alert",
      label: "ALERT",
      sub: "SOC Broadcast",
      desc: "WebSocket Push",
      icon: Bell,
      color: "text-amber-400",
      border: "border-amber-500/40 hover:border-amber-500",
      bg: "bg-amber-500/10",
      tab: "alerts"
    },
    {
      id: "incident",
      label: "INCIDENT",
      sub: "Correlation Engine",
      desc: "Sliding Window",
      icon: AlertTriangle,
      color: "text-orange-400",
      border: "border-orange-500/40 hover:border-orange-500",
      bg: "bg-orange-500/10",
      tab: "incidents"
    },
    {
      id: "ai_analysis",
      label: "AI ANALYSIS",
      sub: "Incident Analyst",
      desc: "MITRE & Briefing",
      icon: Bot,
      color: "text-purple-400",
      border: "border-purple-500/40 hover:border-purple-500",
      bg: "bg-purple-500/10",
      tab: "ai_analyst"
    },
    {
      id: "response",
      label: "BLUE TEAM",
      sub: "Containment",
      desc: "HTTP 403 Quarantine",
      icon: ShieldCheck,
      color: "text-emerald-400",
      border: "border-emerald-500/40 hover:border-emerald-500",
      bg: "bg-emerald-500/10",
      tab: "attack_surface"
    }
  ];

  return (
    <div className="cyber-panel p-3.5 rounded-xl border border-soc-border select-none">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
            End-to-End Cyber Kill-Chain Architecture Pipeline
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
          Click any phase to inspect live telemetry
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isLast = idx === stages.length - 1;
          const isSelected = activeStage === stage.id;

          return (
            <div
              key={stage.id}
              onClick={() => onStageClick && onStageClick(stage.tab)}
              className={`relative group cursor-pointer p-2.5 rounded-lg border transition-all duration-200 ${
                stage.bg
              } ${stage.border} ${
                isSelected ? "ring-2 ring-cyan-400 shadow-cyber-sm" : ""
              } flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-bold tracking-wider ${stage.color}`}>
                    0{idx + 1}. {stage.label}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${stage.color} group-hover:scale-110 transition-transform`} />
                </div>
                <div className="text-xs font-sans font-semibold text-slate-100 group-hover:text-white truncate">
                  {stage.sub}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                  {stage.desc}
                </div>
              </div>

              {!isLast && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600 pointer-events-none">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
