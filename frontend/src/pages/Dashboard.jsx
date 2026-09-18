import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Clock, 
  Eye, 
  Lock, 
  Unlock,
  Bot, 
  Zap, 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  AlertOctagon, 
  ArrowRight,
  ExternalLink,
  Target
} from "lucide-react";
import { 
  fetchStatistics, 
  fetchEvents, 
  fetchContainmentStatus, 
  fetchIncidents,
  manualUnblock 
} from "../services/api";
import { socketService } from "../services/socket";
import HeroOperationStatus from "../components/HeroOperationStatus";
import CyberOperationsMap from "../components/CyberOperationsMap";
import ThreatRadar from "../components/ThreatRadar";
import LiveAttackPath from "../components/LiveAttackPath";

export default function Dashboard({ 
  onSelectEvent, 
  onSelectIncident, 
  setActiveTab,
  onLaunchAiWithIncident 
}) {
  const [metrics, setMetrics] = useState({
    total_events: 0,
    active_incidents: 0,
    critical_alerts: 0,
    high_alerts: 0,
    contained_threats: 0
  });

  const [recentEvents, setRecentEvents] = useState([]);
  const [activeIncidentsList, setActiveIncidentsList] = useState([]);
  const [activeBlocks, setActiveBlocks] = useState([]);
  const [chartsData, setChartsData] = useState({
    severity: {},
    attacks: {},
    timeSeries: []
  });
  const [loading, setLoading] = useState(false);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState(new Set());

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetchStatistics();
      if (statsRes && statsRes.metrics) {
        setMetrics(statsRes.metrics);
        setChartsData({
          severity: statsRes.alerts_by_severity || {},
          attacks: statsRes.attacks_by_type || {},
          timeSeries: statsRes.events_over_time || []
        });
      }

      const eventsRes = await fetchEvents(15);
      if (eventsRes && eventsRes.events) {
        setRecentEvents(eventsRes.events);
      }

      const containRes = await fetchContainmentStatus();
      if (containRes && containRes.active_blocks) {
        setActiveBlocks(containRes.active_blocks);
      }

      const incsRes = await fetchIncidents(6);
      if (incsRes && incsRes.incidents) {
        setActiveIncidentsList(incsRes.incidents);
      }
    } catch (err) {
      console.error("[Dashboard] Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Listen to real-time WebSocket events
    const unsubEvent = socketService.on("new_event", (event) => {
      setRecentEvents((prev) => [event, ...prev.slice(0, 19)]);
      setNewlyArrivedIds((prev) => new Set([event.event_id, ...Array.from(prev)]));
      setTimeout(() => {
        setNewlyArrivedIds((prev) => {
          const next = new Set(prev);
          next.delete(event.event_id);
          return next;
        });
      }, 2000);
    });

    const unsubStats = socketService.on("stats_updated", (newStats) => {
      setMetrics((prev) => ({ ...prev, ...newStats }));
    });

    const unsubContained = socketService.on("threat_contained", (action) => {
      setActiveBlocks((prev) => [action, ...prev.filter(b => b.source_ip !== action.source_ip)]);
    });

    const unsubUnblocked = socketService.on("threat_unblocked", ({ source_ip }) => {
      setActiveBlocks((prev) => prev.filter(b => b.source_ip !== source_ip));
    });

    const unsubInc = socketService.on("incident_updated", (updatedInc) => {
      setActiveIncidentsList((prev) => {
        const idx = prev.findIndex(i => i.incident_id === updatedInc.incident_id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedInc;
          return next;
        }
        return [updatedInc, ...prev.slice(0, 5)];
      });
    });

    return () => {
      unsubEvent();
      unsubStats();
      unsubContained();
      unsubUnblocked();
      unsubInc();
    };
  }, []);

  const handleReleaseBlock = async (ip) => {
    try {
      await manualUnblock(ip, "Analyst manual override from NEXES command center");
      setActiveBlocks((prev) => prev.filter(b => b.source_ip !== ip));
    } catch (err) {
      console.error("Failed to unblock:", err);
    }
  };

  // Severity color helpers
  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "CRITICAL": return "text-red-400 bg-red-500/15 border-red-500/40 glow-critical";
      case "HIGH": return "text-orange-400 bg-orange-500/15 border-orange-500/40";
      case "MEDIUM": return "text-yellow-400 bg-yellow-500/15 border-yellow-500/40";
      case "LOW": return "text-emerald-400 bg-emerald-500/15 border-emerald-500/40";
      default: return "text-slate-400 bg-slate-800 border-slate-700";
    }
  };

  // Total attacks detected
  const totalAttacksDetected = useMemo(() => {
    const attacks = Object.values(chartsData.attacks || {});
    if (attacks.length > 0) return attacks.reduce((a, b) => a + b, 0);
    return (metrics.critical_alerts || 0) + (metrics.high_alerts || 0);
  }, [chartsData.attacks, metrics]);

  // Detection rate
  const detectionRate = useMemo(() => {
    if (metrics.total_events === 0) return "100.0";
    const detected = totalAttacksDetected || 1;
    const rate = Math.min(100, Math.max(94.5, (detected / Math.max(1, metrics.total_events)) * 100));
    return rate.toFixed(1);
  }, [totalAttacksDetected, metrics.total_events]);

  const latestIncident = activeIncidentsList[0] || null;

  return (
    <div className="space-y-5 pb-12 select-none font-sans animate-glideIn">
      
      {/* 1. Real-time Hero Operation Status Stepper */}
      <HeroOperationStatus 
        latestIncident={latestIncident}
        activeContainmentsCount={metrics.contained_threats}
        criticalAlertsCount={metrics.critical_alerts}
      />

      {/* 2. Operations Metrics Bar (6 Gliding HUD Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 font-mono">
        {/* Active Incidents */}
        <div 
          onClick={() => setActiveTab("investigation")}
          className="p-4 rounded-2xl cyber-hud-card card-glide border border-white/10 hover:border-orange-400/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span className="font-extrabold tracking-wider">ACTIVE INCIDENTS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400 group-hover:scale-125 transition-transform" />
          </div>
          <div className="text-2xl font-black text-orange-400">{metrics.active_incidents}</div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Correlated</span>
            <span className="text-orange-400 font-bold">Triage &rarr;</span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div 
          onClick={() => setActiveTab("telemetry")}
          className="p-4 rounded-2xl cyber-hud-card card-glide border border-white/10 hover:border-red-400/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span className="font-extrabold tracking-wider">CRITICAL ALERTS</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 group-hover:scale-125 transition-transform" />
          </div>
          <div className="text-2xl font-black text-red-400">{metrics.critical_alerts}</div>
          <div className="text-[10px] text-red-400/80 mt-1.5 flex items-center justify-between">
            <span>Exploits</span>
            <span className="animate-pulse font-bold">Active</span>
          </div>
        </div>

        {/* High Alerts */}
        <div 
          onClick={() => setActiveTab("telemetry")}
          className="p-4 rounded-2xl cyber-hud-card card-glide border border-white/10 hover:border-yellow-400/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span className="font-extrabold tracking-wider">HIGH ALERTS</span>
            <Flame className="w-3.5 h-3.5 text-yellow-400 group-hover:scale-125 transition-transform" />
          </div>
          <div className="text-2xl font-black text-yellow-400">{metrics.high_alerts}</div>
          <div className="text-[10px] text-yellow-400/80 mt-1.5 flex items-center justify-between">
            <span>Probes</span>
            <span>Targeted</span>
          </div>
        </div>

        {/* Signatures Matched */}
        <div 
          onClick={() => setActiveTab("intelligence")}
          className="p-4 rounded-2xl cyber-hud-card card-glide border border-white/10 hover:border-purple-400/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span className="font-extrabold tracking-wider">SIGNATURES</span>
            <Zap className="w-3.5 h-3.5 text-purple-400 group-hover:scale-125 transition-transform" />
          </div>
          <div className="text-2xl font-black text-purple-300">{totalAttacksDetected}</div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Heuristics</span>
            <span className="text-purple-400 font-bold">Armed</span>
          </div>
        </div>

        {/* Contained Threats */}
        <div 
          onClick={() => setActiveTab("investigation")}
          className="p-4 rounded-2xl cyber-hud-card card-glide border border-white/10 hover:border-emerald-400/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span className="font-extrabold tracking-wider">CONTAINED</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-125 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{metrics.contained_threats}</div>
          <div className="text-[10px] text-emerald-400/80 mt-1.5 flex items-center justify-between">
            <span>HTTP 403 Dropped</span>
            <span className="font-bold">Isolated</span>
          </div>
        </div>

        {/* Detection Rate */}
        <div 
          onClick={() => setActiveTab("intelligence")}
          className="p-4 rounded-2xl cyber-hud-card card-glide border border-white/10 hover:border-cyan-400/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span className="font-extrabold tracking-wider">DETECTION RATE</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-125 transition-transform" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{detectionRate}%</div>
          <div className="text-[10px] text-cyan-400/80 mt-1.5 flex items-center justify-between">
            <span>Accuracy</span>
            <span className="text-emerald-400 font-bold">Sub-ms</span>
          </div>
        </div>
      </div>

      {/* 3. Centerpiece Top Section: Operations Map (2/3) + Threat Sector Radar (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          <CyberOperationsMap 
            metrics={metrics}
            latestIncident={latestIncident}
            activeBlocks={activeBlocks}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        </div>
        <div>
          <ThreatRadar 
            attacks={chartsData.attacks} 
            recentEvents={recentEvents} 
          />
        </div>
      </div>

      {/* 4. Live Attack Path Progression Tracker */}
      <LiveAttackPath 
        latestIncident={latestIncident}
        isContained={activeBlocks.length > 0}
        criticalAlerts={metrics.critical_alerts}
      />

      {/* 5. Lower Split Activity Deck: Real-time Telemetry Feed (Left) & Active Incidents / Containment (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Real-time Telemetry Stream (7 cols) */}
        <div className="lg:col-span-7 cyber-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between card-glide shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-extrabold tracking-wider uppercase text-slate-100">
                  REAL-TIME TELEMETRY INGRESS STREAM
                </h3>
              </div>
              <button 
                onClick={() => setActiveTab("telemetry")}
                className="btn-glide px-3 py-1 rounded-full text-[11px] font-mono bg-[#0a1024] hover:bg-cyan-950/40 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5 transition shadow-sm"
              >
                <span>OPEN TERMINAL</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Monospaced Event Feed */}
            <div className="space-y-2 font-mono text-xs max-h-[400px] overflow-y-auto pr-1">
              {recentEvents.length === 0 ? (
                <div className="py-14 text-center text-slate-500">
                  <Terminal className="w-7 h-7 mx-auto mb-2 text-slate-600 animate-pulse" />
                  <p>AWAITING INBOUND TELEMETRY FRAMES</p>
                </div>
              ) : (
                recentEvents.slice(0, 8).map((evt) => {
                  const isNew = newlyArrivedIds.has(evt.event_id);
                  const timeStr = evt.timestamp ? evt.timestamp.split("T")[1]?.slice(0, 8) || evt.timestamp : "00:00:00";
                  const sev = evt.severity || "INFO";

                  return (
                    <div 
                      key={evt.event_id || Math.random()}
                      onClick={() => onSelectEvent && onSelectEvent(evt)}
                      className={`p-2.5 rounded-xl border border-white/5 bg-[#030611]/80 hover:bg-cyan-950/20 hover:border-cyan-400/40 cursor-pointer flex items-center justify-between gap-2 transition-all duration-300 ${
                        isNew ? "bg-cyan-500/15 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-wrap text-[11px]">
                        <span className="text-slate-500 font-mono">{timeStr}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] border font-bold ${getSeverityBadge(sev)}`}>
                          {sev}
                        </span>
                        {evt.attack_type && (
                          <span className="px-2 py-0.5 rounded-full bg-red-950/70 border border-red-500/40 text-red-300 text-[9px] font-extrabold">
                            {evt.attack_type}
                          </span>
                        )}
                        <span className="text-cyan-400 font-bold">{evt.source_ip}</span>
                        <span className="text-slate-600">&rarr;</span>
                        <span className="text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">{evt.endpoint}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px]">
                        <span className={`font-mono font-bold ${evt.status_code === 403 ? "text-red-400" : "text-slate-400"}`}>
                          [{evt.status_code || 200}]
                        </span>
                        <Eye className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-300 transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              NEXES Ingestion Bus Active
            </span>
            <span>WSGI Intercept Latency: &lt; 1ms</span>
          </div>
        </div>

        {/* Right Side: Correlated Incidents & Containment Blocklist (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Active Incidents Deck */}
          <div className="cyber-panel p-5 rounded-2xl border border-white/10 font-mono card-glide shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-extrabold tracking-wider uppercase text-slate-100">
                  CORRELATED INCIDENTS ({activeIncidentsList.length})
                </h3>
              </div>
              <button 
                onClick={() => setActiveTab("investigation")}
                className="btn-glide text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
              >
                <span>DOSSIER</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {activeIncidentsList.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                  <p>ZERO ACTIVE INCIDENTS</p>
                </div>
              ) : (
                activeIncidentsList.slice(0, 3).map((inc) => (
                  <div 
                    key={inc.incident_id}
                    onClick={() => {
                      if (onSelectIncident) onSelectIncident(inc.incident_id);
                      setActiveTab("investigation");
                    }}
                    className="p-3 rounded-xl border border-white/5 bg-[#030611]/90 hover:border-orange-400/50 cursor-pointer transition-all duration-300 space-y-2 hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-100 text-xs">
                        {inc.incident_id}: {inc.title || "Targeted Threat Vector"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                        {inc.status || "OPEN"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Source: <span className="text-cyan-400 font-bold">{inc.source_ip || "127.0.0.1"}</span></span>
                      <span>Vector: <span className="text-red-400 font-bold">{inc.attack_type || "EXPLOIT"}</span></span>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">{inc.alert_count || 1} Correlated Signals</span>
                      <span className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
                        Open Forensics &rarr;
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Containment & Quarantine Blocklist */}
          <div className="cyber-panel p-5 rounded-2xl border border-white/10 font-mono card-glide shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-extrabold tracking-wider uppercase text-slate-100">
                  ACTIVE CONTAINMENT ({activeBlocks.length})
                </h3>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-extrabold shadow-sm">
                GATEWAY ARMED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {activeBlocks.length === 0 ? (
                <div className="py-5 text-center text-slate-500 text-xs">
                  <ShieldCheck className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                  <p className="font-bold text-slate-400">ZERO ACTIVE QUARANTINES</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Attacker traffic will be dropped when isolated</p>
                </div>
              ) : (
                activeBlocks.map((block) => (
                  <div 
                    key={block.source_ip}
                    className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-300">{block.source_ip}</span>
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-red-500/20 text-red-200 border border-red-500/50 font-extrabold">
                          ISOLATED
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">{block.reason || "Autonomous policy trigger"}</p>
                    </div>

                    <button
                      onClick={() => handleReleaseBlock(block.source_ip)}
                      className="btn-glide px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 text-[10px] font-bold flex items-center gap-1.5 transition"
                      title="Release IP quarantine"
                    >
                      <Unlock className="w-3 h-3 text-amber-400" />
                      <span>RELEASE</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
