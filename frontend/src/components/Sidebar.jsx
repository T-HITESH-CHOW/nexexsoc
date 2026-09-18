import React from "react";
import { 
  LayoutDashboard, 
  Terminal, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  Cpu, 
  Server, 
  CheckCircle2, 
  GitCommit, 
  Radio, 
  Bot, 
  Globe, 
  Bell, 
  BarChart3, 
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  activeIncidentsCount = 0,
  criticalAlertsCount = 0,
  onOpenAICopilot
}) {
  const navSections = [
    {
      title: "SECURITY OPERATIONS",
      items: [
        { id: "command_center", label: "Command Center", icon: LayoutDashboard },
        { id: "live_threats", label: "Live Threats", icon: Terminal, pulse: true },
        { 
          id: "alerts", 
          label: "Alerts Matrix", 
          icon: Bell, 
          badge: criticalAlertsCount, 
          badgeColor: "bg-red-500/20 text-red-400 border-red-500/30" 
        },
        { 
          id: "incidents", 
          label: "Incident Dossiers", 
          icon: AlertTriangle, 
          badge: activeIncidentsCount, 
          badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30" 
        },
        { id: "timeline", label: "Attack Timeline", icon: GitCommit }
      ]
    },
    {
      title: "AI & INTELLIGENCE",
      items: [
        { 
          id: "ai_analyst", 
          label: "AI Security Analyst", 
          icon: Bot, 
          accent: "text-purple-400", 
          special: true,
          tag: "AI COPILOT"
        },
        { id: "attack_surface", label: "Attack Surface & Blocks", icon: Globe },
        { id: "analytics", label: "Throughput & Stress", icon: BarChart3 }
      ]
    },
    {
      title: "CYBER RANGE & EXERCISE",
      items: [
        { id: "simulator", label: "Attack Simulator", icon: Flame, accent: "text-red-400" },
        { id: "vulnerable_app", label: "Vulnerable App Sandbox", icon: ShieldAlert, accent: "text-amber-400" },
        { id: "system_status", label: "Platform Health", icon: Server },
        { id: "requirements", label: "Judge Evaluation Matrix", icon: CheckCircle2, accent: "text-emerald-400" }
      ]
    }
  ];

  return (
    <aside className="w-64 shrink-0 bg-soc-card/95 border-r border-soc-border min-h-[calc(100vh-57px)] flex flex-col justify-between p-3 select-none">
      <div className="space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono tracking-widest uppercase text-slate-500 font-bold">
              {section.title}
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive 
                      ? item.id === "ai_analyst"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple font-semibold"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-cyber-sm font-semibold" 
                      : item.special
                        ? "text-purple-300 hover:bg-purple-950/40 border border-purple-500/20 hover:border-purple-500/40"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? (item.id === "ai_analyst" ? "text-white" : "text-cyan-400") : (item.accent || "text-slate-400")}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono shrink-0">
                    {item.tag && !isActive && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {item.tag}
                      </span>
                    )}

                    {item.pulse && !isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}

                    {item.badge > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${
                        isActive ? "bg-cyan-400 text-black border-cyan-400" : item.badgeColor
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info / Active Defender Box */}
      <div className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-xl text-[11px] font-mono space-y-2 mt-4">
        <div className="flex items-center justify-between text-slate-400">
          <span>Range Network:</span>
          <span className="text-cyan-400 font-bold">127.0.0.1 (Loopback)</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Defense Policy:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Active Quarantine
          </span>
        </div>
        <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-800 flex items-center justify-between">
          <span>College Hackathon</span>
          <span className="text-cyan-400 font-semibold">Tier-2 SOC</span>
        </div>
      </div>
    </aside>
  );
}
