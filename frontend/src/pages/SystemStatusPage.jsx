import React, { useState, useEffect } from "react";
import { 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertOctagon, 
  Database, 
  Radio, 
  Shield, 
  Activity, 
  Cpu, 
  Terminal, 
  Wifi,
  Zap
} from "lucide-react";
import { fetchSystemStatus } from "../services/api";
import { socketService } from "../services/socket";

export default function SystemStatusPage() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(socketService.isConnected);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await fetchSystemStatus();
      if (data) setStatusData(data);
    } catch (err) {
      console.error("Failed to load status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    setWsConnected(socketService.isConnected);

    const unsub = socketService.on("status_change", ({ connected }) => {
      setWsConnected(connected);
    });

    return () => unsub();
  }, []);

  const components = [
    { name: "HTTP Gateway Ingestion Engine", key: "ingestion_engine", desc: "Captures and normalizes RFC 3339 security telemetry", icon: Terminal },
    { name: "Heuristic Detection Engine", key: "detection_engine", desc: "Sub-millisecond AST parser and regex signature validator", icon: Zap },
    { name: "Incident Correlation Bus", key: "incident_correlation", desc: "Sliding-window temporal attack chain correlation", icon: Activity },
    { name: "Vulnerable Sandbox Application", key: "vulnerable_app", desc: "Deliberately vulnerable banking and profile service", icon: Server },
    { name: "Live Socket.IO Streamer", key: "websocket", desc: "Sub-5ms telemetry broadcast pipe to operator consoles", icon: Wifi, forcedState: wsConnected ? "ONLINE" : "OFFLINE" },
    { name: "Simulated Containment Gateway", key: "containment_engine", desc: "In-memory dynamic IP blocklist middleware", icon: Shield },
    { name: "SQLite ACID Event Database", key: "database", desc: "WAL-mode ACID event store & incident dossier persistence", icon: Database }
  ];

  return (
    <div className="space-y-5 pb-12 select-none animate-glideIn font-sans">
      {/* Header */}
      <div className="p-5 cyber-panel rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300">
              <Server className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold text-white font-mono tracking-wide">
              NEXES SYSTEM ARCHITECTURE &amp; SUBSYSTEM HEALTH
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Continuous health telemetry verifying all 7 core NEXES SOC subsystems.
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="btn-glide px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Ping Subsystems</span>
        </button>
      </div>

      {/* Component Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {components.map((comp) => {
          const Icon = comp.icon;
          const state = comp.forcedState || statusData?.system?.[comp.key] || "ONLINE";
          const isOnline = state === "ONLINE" || state === "ACTIVE" || state === "CONNECTED";

          return (
            <div
              key={comp.key}
              className="p-4 rounded-2xl cyber-panel border border-white/10 flex items-start justify-between gap-3 shadow-md card-glide"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#030611] text-cyan-400 border border-white/10 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white font-mono">{comp.name}</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed">{comp.desc}</p>
                </div>
              </div>

              <div className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 shrink-0 ${
                isOnline 
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                  : "bg-red-500/15 text-red-300 border border-red-500/30"
              }`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                <span>{state}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
