import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertOctagon, 
  RotateCcw, 
  Play, 
  Clock, 
  Bot, 
  Radio, 
  Terminal,
  Crosshair,
  Server,
  Cpu,
  Layers,
  Search,
  CheckCircle2,
  Gauge,
  Sparkles,
  Zap
} from "lucide-react";
import { socketService } from "../services/socket";
import { resetDemoData, runSimulation } from "../services/api";

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  activeContainmentsCount = 0, 
  criticalAlertsCount = 0,
  activeIncidentsCount = 0,
  onReset,
  globalSearch = "",
  setGlobalSearch,
  onOpenAICopilot,
  onOpenDemoComplete
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(4);
  const [demoBanner, setDemoBanner] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [utcTime, setUtcTime] = useState("");

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + " UTC");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time socket & demo listeners
  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected);

    const unsubStatus = socketService.on("status_change", ({ connected }) => {
      setIsConnected(connected);
    });

    const unsubLatency = socketService.on("latency_update", (lat) => {
      setLatency(lat);
    });

    const unsubDemo = socketService.on("demo_step", (stepData) => {
      setDemoBanner(stepData);
      if (stepData.step === 7) {
        if (onOpenDemoComplete) onOpenDemoComplete();
        setTimeout(() => setDemoBanner(null), 8000);
      }
    });

    return () => {
      unsubStatus();
      unsubLatency();
      unsubDemo();
    };
  }, [onOpenDemoComplete]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetDemoData();
      if (onReset) onReset();
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuickDemo = async () => {
    setActiveTab("simulator");
    try {
      await runSimulation("demo");
    } catch (err) {
      console.error("Demo failed:", err);
    }
  };

  const navConsoles = [
    { id: "command_center", label: "COMMAND", icon: Crosshair },
    { id: "simulator", label: "ATTACK LAB", icon: Radio },
    { id: "vulnerable_app", label: "TRAINING TARGET", icon: Server },
    { id: "investigation", label: "INVESTIGATION", icon: Activity },
    { id: "telemetry", label: "TELEMETRY", icon: Terminal },
    { id: "intelligence", label: "INTELLIGENCE", icon: Shield },
    { id: "performance", label: "PERFORMANCE", icon: Gauge },
    { id: "system", label: "SYSTEM", icon: Cpu },
    { id: "architecture", label: "ARCHITECTURE", icon: Layers }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#050917]/90 backdrop-blur-2xl border-b border-white/10 px-4 py-2 select-none shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
      {/* Top HUD Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/5">
        
        {/* Brand & System Status */}
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group card-glide" 
            onClick={() => setActiveTab("command_center")}
          >
            {/* Nexes Emblem */}
            <div className="relative p-2 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-indigo-600/30 border border-cyan-400/40 rounded-xl text-cyan-300 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all duration-300">
              <Zap className="w-5 h-5 text-cyan-300 group-hover:scale-110 group-hover:text-white transition-all duration-300" />
              <div className="absolute -inset-0.5 rounded-xl bg-cyan-400/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-lg text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 font-mono">
                  NEXES SOC
                </span>
                <span className="text-[9px] uppercase tracking-widest font-mono font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                  v2.5 GLIDE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">Next-Gen Autonomous Cyber Command & Range</p>
            </div>
          </div>

          {/* System Status: OPERATIONAL or ACTIVE ATTACK */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
            {activeIncidentsCount > 0 || criticalAlertsCount > 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/50 text-red-400 text-xs font-mono font-bold animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.25)]">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>DEFCON 1: ACTIVE ATTACK</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SYSTEM: OPERATIONAL</span>
              </div>
            )}

            {/* Active Incident Counter */}
            <div 
              onClick={() => setActiveTab("investigation")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono cursor-pointer transition-all duration-300 ${
                activeIncidentsCount > 0 
                  ? "bg-orange-500/15 border-orange-500/50 text-orange-300 font-bold hover:bg-orange-500/25 shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:scale-105" 
                  : "bg-slate-900/60 border-white/5 text-slate-400 hover:border-slate-700"
              }`}
            >
              <span>INCIDENTS:</span>
              <span className={activeIncidentsCount > 0 ? "text-orange-300 font-extrabold" : "text-slate-400"}>
                {activeIncidentsCount > 0 ? `${activeIncidentsCount} CRITICAL` : "0 CLEAR"}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Quick Search Bar */}
        <div className="hidden md:flex items-center w-72 relative">
          <Search className="w-3.5 h-3.5 text-cyan-400/70 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search telemetry, IP, CVE, vector..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch && setGlobalSearch(e.target.value)}
            className="w-full bg-[#030611]/80 backdrop-blur-md border border-white/10 focus:border-cyan-400/60 focus:shadow-[0_0_15px_rgba(6,182,212,0.25)] rounded-full pl-9 pr-9 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-mono transition-all duration-300"
          />
          <kbd className="absolute right-3 top-2 px-1.5 text-[9px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 rounded-md">
            /
          </kbd>
        </div>

        {/* Right Status Badges & Gliding Actions */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {/* WebSocket & Latency Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#030611]/80 border border-white/10 text-[11px] shadow-sm">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
            <span className={isConnected ? "text-emerald-400" : "text-red-400"}>
              {isConnected ? `WS: CONNECTED (${latency}ms)` : "WS: OFFLINE"}
            </span>
          </div>

          {/* Live UTC Clock Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#030611]/80 border border-white/10 text-slate-300 text-[11px] shadow-sm">
            <Clock className="w-3 h-3 text-cyan-400 animate-spin-slow" />
            <span>{utcTime || "00:00:00 UTC"}</span>
          </div>

          {/* Containment Active Pill */}
          {activeContainmentsCount > 0 && (
            <div 
              onClick={() => setActiveTab("investigation")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/60 text-red-300 animate-pulse font-bold text-[11px] cursor-pointer hover:bg-red-500/30 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105"
              title="Threat sources currently isolated"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>ISOLATED: {activeContainmentsCount}</span>
            </div>
          )}

          {/* AI Copilot Drawer Trigger (Gliding Purple Capsule) */}
          <button
            onClick={() => {
              if (onOpenAICopilot) onOpenAICopilot();
              else setActiveTab("investigation");
            }}
            className="btn-glide flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-600/25 via-fuchsia-600/20 to-purple-600/25 hover:from-purple-600/40 hover:to-fuchsia-600/40 text-purple-200 border border-purple-400/40 text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            title="Open NEXES AI Security Analyst Copilot"
          >
            <Bot className="w-3.5 h-3.5 text-purple-300" />
            <span>AI Copilot</span>
          </button>

          {/* 15s Guided Demo Button (Gliding Shimmering Capsule) */}
          <button
            onClick={handleQuickDemo}
            className="btn-glide flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white rounded-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] text-xs"
            title="Execute automated 15-second attack & defense demonstration for judges"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>DEMO MODE</span>
          </button>

          {/* Reset Environment Pill */}
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="btn-glide flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-full border border-white/10 disabled:opacity-50 text-xs"
            title="Reseed telemetry and reset containment blocklist"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? "animate-spin text-cyan-400" : ""}`} />
            <span className="hidden xl:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Gliding Mission Control Dock Tabs */}
      <div className="flex items-center overflow-x-auto scrollbar-none gap-1 pt-2">
        {navConsoles.map((c) => {
          const Icon = c.icon;
          const isActive = activeTab === c.id || 
            (c.id === "command_center" && activeTab === "dashboard") ||
            (c.id === "performance" && activeTab === "stress_test") ||
            (c.id === "system" && activeTab === "system_status");

          return (
            <button
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-cyan-500/25 text-cyan-300 border border-cyan-400/50 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent hover:border-white/5 hover:translate-y-[-1px]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-300" : "text-slate-500"}`} />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Real-time Demo Narration Gliding Banner */}
      {demoBanner && (
        <div className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-950/95 via-indigo-950/95 to-purple-950/95 border border-cyan-400/50 rounded-xl flex items-center justify-between text-xs animate-glideIn font-mono shadow-[0_0_25px_rgba(6,182,212,0.25)]">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-400 text-black font-extrabold text-[10px] tracking-wide shadow-sm">
              STEP {demoBanner.step}/7
            </span>
            <span className="font-bold text-cyan-200 text-sm">{demoBanner.title}</span>
            <span className="text-slate-300 hidden md:inline">— {demoBanner.description}</span>
          </div>
          <span className="text-emerald-300 font-bold animate-pulse flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            NEXES LIVE EVALUATION
          </span>
        </div>
      )}
    </header>
  );
}
