import React from "react";
import { 
  Flame, 
  Terminal, 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  ArrowRight,
  Server,
  Zap,
  Activity,
  Bot,
  Layers
} from "lucide-react";

export default function CyberOperationsMap({ 
  metrics = {}, 
  latestIncident, 
  activeBlocks = [],
  onNavigate 
}) {
  const isContained = activeBlocks.length > 0;
  const isUnderAttack = (metrics.critical_alerts || 0) > 0 || isContained;

  return (
    <div className="cyber-panel p-5 sm:p-6 rounded-2xl border border-white/10 select-none relative overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.5)] card-glide">
      {/* Dynamic Cyber Ambient Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0,transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-extrabold tracking-widest uppercase text-white flex items-center gap-2">
              NEXES LIVE OPERATIONS TOPOLOGY MAP
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">Real-time Closed-Loop Attack & Containment Flow</p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#030611]/80 border border-white/10 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isUnderAttack ? "bg-red-400 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
            {isUnderAttack ? "ACTIVE ATTACK DETECTED" : "RANGE STABLE"}
          </span>
        </div>
      </div>

      {/* Main Schematic Diagram (3 Gliding Pillars) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative items-stretch z-10">
        
        {/* COLUMN 1: RED TEAM (ATTACK ENGINE) */}
        <div className="flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-red-400 tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> RED TEAM (ADVERSARY)
            </span>
            <span className="text-[10px] font-mono text-slate-500">Source: 127.0.0.1</span>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate("simulator")}
            className="flex-1 p-4 rounded-xl bg-gradient-to-b from-[#0a0f24]/90 to-[#060a17]/90 border border-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)] transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-white">ATTACK EXECUTOR</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                  EXPLOIT LAB
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Automated multi-vector payload delivery targeting authentication, direct object references, and input reflection.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded-md bg-red-950/70 border border-red-800/80 text-red-300">SQLi Probe</span>
                <span className="px-2 py-0.5 rounded-md bg-red-950/70 border border-red-800/80 text-red-300">IDOR Scraper</span>
                <span className="px-2 py-0.5 rounded-md bg-red-950/70 border border-red-800/80 text-red-300">Stored XSS</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Simulated Attacks: <strong className="text-red-400 font-bold">{metrics.critical_alerts || 0}</strong></span>
              <span className="btn-glide text-red-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                Launch Attack &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* COLUMN 2: VULNERABLE TARGET & TELEMETRY */}
        <div className="flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> TRAINING TARGET
            </span>
            <span className="text-[10px] font-mono text-slate-500">Local Sandbox</span>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate("vulnerable_app")}
            className="flex-1 p-4 rounded-xl bg-gradient-to-b from-[#0a1228]/90 to-[#060a17]/90 border border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-white">VULNERABLE APP</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  SANDBOX
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Captures raw requests, extracts metadata, and forwards normalized RFC 3339 telemetry into the event queue.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div className="p-2 rounded-lg bg-[#030611] border border-white/5">
                  <span className="text-slate-500 block text-[9px]">EVENTS</span>
                  <span className="font-bold text-cyan-300">{metrics.total_events || 0} Ingested</span>
                </div>
                <div className="p-2 rounded-lg bg-[#030611] border border-white/5">
                  <span className="text-slate-500 block text-[9px]">STREAM</span>
                  <span className="font-bold text-emerald-400">0ms Drops</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Endpoints: <strong className="text-cyan-400">3 Protected</strong></span>
              <span className="btn-glide text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                Inspect Sandbox &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* COLUMN 3: BLUE TEAM (DETECTION & RESPONSE) */}
        <div className="flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> BLUE TEAM & GATEWAY
            </span>
            <span className="text-[10px] font-mono text-slate-500">Autonomous SOC</span>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate("investigation")}
            className="flex-1 p-4 rounded-xl bg-gradient-to-b from-[#0a1824]/90 to-[#060a17]/90 border border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-white">CORRELATION & DEFENSE</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                  isContained 
                    ? "bg-red-500/20 text-red-300 border-red-500/50" 
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                }`}>
                  {isContained ? "CONTAINMENT ACTIVE" : "GATEWAY ARMED"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Heuristic signature evaluation, sliding-window correlation, AI incident briefings, and HTTP 403 quarantine.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div className="p-2 rounded-lg bg-[#030611] border border-white/5">
                  <span className="text-slate-500 block text-[9px]">DOSSIERS</span>
                  <span className="font-bold text-orange-400">{metrics.active_incidents || 0} Open</span>
                </div>
                <div className="p-2 rounded-lg bg-[#030611] border border-white/5">
                  <span className="text-slate-500 block text-[9px]">CONTAINED</span>
                  <span className="font-bold text-emerald-400">{activeBlocks.length} Isolated</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Policy: <strong className="text-emerald-400">60s Auto-Quarantine</strong></span>
              <span className="btn-glide text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                Forensics &rarr;
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
