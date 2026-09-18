import React from "react";
import { 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  Terminal, 
  Activity, 
  Lock, 
  Radio, 
  CheckCircle2, 
  Clock,
  Zap,
  Target
} from "lucide-react";

export default function HeroOperationStatus({ 
  latestIncident, 
  activeContainmentsCount = 0, 
  criticalAlertsCount = 0 
}) {
  // Determine operation status stage
  let stage = 0; // 0: Normal, 1: Attack Detected, 2: Investigating, 3: Contained
  if (activeContainmentsCount > 0) {
    stage = 3;
  } else if (criticalAlertsCount > 0 || (latestIncident && (latestIncident.status === "OPEN" || latestIncident.status === "INVESTIGATING"))) {
    stage = 2;
  } else if (latestIncident) {
    stage = 1;
  }

  const steps = [
    { label: "ATTACK DETECTED", sub: "Signal Triggered", active: stage >= 1 },
    { label: "INVESTIGATING", sub: "Correlation Active", active: stage >= 2 },
    { label: "CONTAINMENT", sub: "Gateway Intercept", active: stage >= 3 },
    { label: "RESOLVED", sub: "Threat Quarantined", active: stage >= 3 && activeContainmentsCount === 0 }
  ];

  const adversaryIp = latestIncident?.source_ip || (activeContainmentsCount > 0 ? "127.0.0.1" : "None");
  const vectorName = latestIncident?.attack_type || (criticalAlertsCount > 0 ? "SQL INJECTION" : "SYSTEM OPERATIONAL");
  const severity = latestIncident?.severity || (criticalAlertsCount > 0 ? "CRITICAL" : "NORMAL");

  return (
    <div className="cyber-panel p-5 rounded-2xl border border-white/10 select-none font-mono relative overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.5)] card-glide">
      {/* Ambient background light flare */}
      <div className={`absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
        stage === 3 ? "bg-red-500" : stage >= 1 ? "bg-orange-500" : "bg-cyan-500"
      }`} />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
        
        {/* Left: Operation Identifier */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl border transition-all duration-300 ${
            stage === 3 
              ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.4)]" 
              : stage >= 1
                ? "bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          }`}>
            {stage === 3 ? <Lock className="w-6 h-6 animate-pulse" /> : <Radio className="w-6 h-6 animate-pulse" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <Target className="w-3 h-3 text-cyan-400" />
                NEXES MISSION POSTURE
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                stage === 3 
                  ? "bg-red-950/90 text-red-300 border-red-700/80 shadow-sm" 
                  : stage >= 1
                    ? "bg-orange-950/90 text-orange-300 border-orange-700/80 shadow-sm"
                    : "bg-emerald-950/90 text-emerald-300 border-emerald-700/80 shadow-sm"
              }`}>
                {stage === 3 ? "CONTAINMENT ACTIVE" : stage >= 1 ? "EXPLOIT IN PROGRESS" : "STATUS NORMAL"}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white font-sans tracking-wide mt-1">
              {vectorName}
            </h2>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
              <span>SOURCE IP: <strong className="text-cyan-400 font-mono">{adversaryIp}</strong></span>
              <span className="text-slate-600">&bull;</span>
              <span>TIER: <strong className={severity === "CRITICAL" ? "text-red-400 font-bold" : "text-emerald-400"}>{severity}</strong></span>
              {latestIncident && (
                <>
                  <span className="text-slate-600">&bull;</span>
                  <span>DOSSIER: <strong className="text-purple-300 font-mono">{latestIncident.incident_id}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Stepper Progression with Gliding Glow Connectors */}
        <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-2 sm:gap-4 text-center">
          {steps.map((s, idx) => {
            const isCompleted = s.active;
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center group">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold border transition-all duration-300 ${
                    isCompleted 
                      ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-black border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105" 
                      : "bg-[#050914] text-slate-600 border-slate-800"
                  }`}>
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 tracking-wider transition-colors ${
                    isCompleted ? "text-slate-100" : "text-slate-500"
                  }`}>
                    {s.label}
                  </span>
                  <span className="text-[9px] text-slate-500 hidden sm:inline">
                    {s.sub}
                  </span>
                </div>

                {!isLast && (
                  <div className={`h-0.5 w-6 sm:w-12 mb-5 rounded-full transition-all duration-500 ${
                    steps[idx + 1].active ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-slate-800/80"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
