import React from "react";
import { 
  Flame, 
  Terminal, 
  Search, 
  Bell, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ChevronDown,
  Zap
} from "lucide-react";

export default function LiveAttackPath({ latestIncident, isContained = false, criticalAlerts = 0 }) {
  const hasAlerts = criticalAlerts > 0;
  const hasIncident = !!latestIncident;
  const incId = latestIncident?.incident_id || "INC-001";
  const vector = latestIncident?.attack_type || "SQL_INJECTION";

  const nodes = [
    { label: "RED TEAM", sub: "Adversary Ingress", active: hasAlerts || hasIncident },
    { label: "TARGET ENDPOINT", sub: "/vulnerable/login", active: hasAlerts || hasIncident },
    { label: "PAYLOAD INJECTED", sub: "Untrusted Stream", active: hasAlerts || hasIncident },
    { label: "EXPLOIT VERIFIED", sub: vector, active: hasAlerts || hasIncident },
    { label: "DETECTION RULE", sub: "Heuristic Match", active: hasAlerts || hasIncident },
    { label: "CRITICAL ALERT", sub: "Socket.IO Broadcast", active: hasAlerts || hasIncident },
    { label: `INCIDENT ${incId}`, sub: "Dossier Correlated", active: hasIncident },
    { label: "SOURCE CONTAINED", sub: "HTTP 403 Dropped", active: isContained }
  ];

  return (
    <div className="cyber-panel p-5 rounded-2xl border border-white/10 select-none font-mono card-glide shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            NEXES LIVE ATTACK PATH &amp; KILL-CHAIN PROGRESSION
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-bold">
          8-STAGE SEQUENCE
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {nodes.map((node, idx) => {
          const isCurrent = idx === nodes.filter(n => n.active).length - 1;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                node.active
                  ? isCurrent
                    ? "bg-gradient-to-b from-cyan-950/60 to-[#060a17] border-cyan-400/80 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]"
                    : "bg-[#060a17]/90 border-white/10 text-slate-200 hover:border-white/20"
                  : "bg-[#030611]/60 border-white/5 text-slate-600 opacity-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-slate-500 font-extrabold tracking-widest">0{idx + 1}</span>
                {node.active ? (
                  <span className={`w-2 h-2 rounded-full ${isCurrent ? "bg-cyan-400 animate-ping" : "bg-emerald-400"}`} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                )}
              </div>

              <div>
                <div className="text-[11px] font-extrabold truncate tracking-tight">
                  {node.label}
                </div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">
                  {node.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
