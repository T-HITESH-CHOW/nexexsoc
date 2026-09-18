import React, { useState, useEffect } from "react";
import { 
  GitCommit, 
  ShieldAlert, 
  ArrowDown, 
  Terminal, 
  Eye, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle,
  Bot,
  RefreshCw,
  Clock
} from "lucide-react";
import { fetchIncidents, fetchIncidentDetails } from "../services/api";

export default function AttackTimelinePage({ onSelectEvent, onLaunchAiWithIncident, preselectedIncidentId = null }) {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(preselectedIncidentId);
  const [incidentData, setIncidentData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadIncidents = async () => {
    try {
      const res = await fetchIncidents(25);
      if (res && res.incidents && res.incidents.length > 0) {
        setIncidents(res.incidents);
        if (!selectedIncidentId) {
          setSelectedIncidentId(res.incidents[0].incident_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) return;
    setLoading(true);
    fetchIncidentDetails(selectedIncidentId)
      .then((res) => {
        if (res && res.incident) {
          setIncidentData(res.incident);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedIncidentId]);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "CRITICAL": return "bg-red-500/20 text-red-400 border-red-500/40 font-bold glow-critical";
      case "HIGH": return "bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold";
      case "MEDIUM": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "LOW": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      default: return "bg-slate-700/50 text-slate-300 border-slate-600";
    }
  };

  const getPhaseColor = (phase) => {
    if (!phase) return "border-slate-700 bg-slate-800 text-slate-300";
    if (phase.includes("Exploitation")) return "border-red-500/50 bg-red-950/40 text-red-300";
    if (phase.includes("Privilege") || phase.includes("Exfiltration")) return "border-orange-500/50 bg-orange-950/40 text-orange-300";
    if (phase.includes("Containment") || phase.includes("Mitigation")) return "border-emerald-500/50 bg-emerald-950/40 text-emerald-300";
    return "border-blue-500/50 bg-blue-950/40 text-blue-300";
  };

  const getMitreTag = (alertType, eventType) => {
    if (alertType === "SQL_INJECTION" || eventType === "SQL_INJECTION") return "MITRE T1190";
    if (alertType === "IDOR" || eventType === "IDOR") return "MITRE T1530";
    if (alertType === "STORED_XSS" || eventType === "STORED_XSS") return "MITRE T1059.007";
    if (alertType === "BRUTE_FORCE") return "MITRE T1110";
    if (eventType === "CONTAINMENT_ENFORCED") return "DEFENSE D3-IR";
    return null;
  };

  const timeline = incidentData?.timeline || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="cyber-panel p-4 rounded-xl border border-soc-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-black text-white tracking-wide font-sans">
              CHRONOLOGICAL ATTACK TIMELINE & KILL-CHAIN RECONSTRUCTION
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Sequential forensic vector tracing: Ingress → Exploit → Privilege Escalation → Exfiltration → Gateway Containment.
          </p>
        </div>

        {/* Incident Switcher */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400 text-[11px]">Select Incident:</span>
          <select
            value={selectedIncidentId || ""}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-cyan-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
          >
            {incidents.map((inc) => (
              <option key={inc.incident_id} value={inc.incident_id}>
                {inc.incident_id} ({inc.attack_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Incident Summary Card */}
      {incidentData && (
        <div className="p-4 rounded-xl bg-soc-card border border-soc-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-sm">{incidentData.incident_id}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] border ${getSeverityBadge(incidentData.severity)}`}>
                {incidentData.severity}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-bold">
                {incidentData.status}
              </span>
              <span className="text-slate-400 text-[11px]">
                Adversary: <strong className="text-cyan-400">{incidentData.source_ip}</strong>
              </span>
            </div>
            <h2 className="font-sans font-semibold text-slate-200 text-sm">{incidentData.title}</h2>
            <div className="text-[11px] text-slate-400">
              Total Steps: <strong className="text-purple-300">{incidentData.event_count}</strong> • Time Window: {incidentData.start_time?.slice(11, 19)} → {incidentData.last_time?.slice(11, 19)}
            </div>
          </div>

          {onLaunchAiWithIncident && (
            <button
              onClick={() => onLaunchAiWithIncident(incidentData.incident_id)}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-purple-600/30 font-mono"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Briefing for {incidentData.incident_id}</span>
            </button>
          )}
        </div>
      )}

      {/* Timeline Stream */}
      <div className="p-6 rounded-xl bg-soc-card border border-soc-border space-y-6">
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs space-y-2">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
            <p>Reconstructing chronological attack vectors...</p>
          </div>
        ) : timeline.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs">
            No timeline steps recorded for this incident yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-orange-500 before:to-emerald-500">
            {timeline.map((item, idx) => {
              const isLast = idx === timeline.length - 1;
              const mitreTag = getMitreTag(item.alert_type, item.event_type);
              return (
                <div key={item.event_id || idx} className="relative group">
                  {/* Node Dot */}
                  <div className="absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-soc-card border-2 border-cyan-400 group-hover:scale-125 transition-transform shadow-sm shadow-cyan-400/50" />

                  {/* Step Card */}
                  <div 
                    onClick={() => onSelectEvent && onSelectEvent(item)}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                        <span className="text-cyan-400 font-bold">
                          [{item.timestamp?.slice(11, 19) || "00:00:00"}]
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${getSeverityBadge(item.severity)}`}>
                          {item.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {item.method} {item.path}
                        </span>
                        {item.attack_phase && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getPhaseColor(item.attack_phase)}`}>
                            {item.attack_phase}
                          </span>
                        )}
                        {mitreTag && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {mitreTag}
                          </span>
                        )}
                      </div>

                      <button className="text-slate-400 hover:text-cyan-400 p-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-100 font-medium font-sans">
                      {item.description}
                    </p>

                    {item.alert_type && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-red-950/40 border border-red-900/50 text-xs text-red-300 font-mono">
                        <div className="flex items-center gap-1.5 font-bold mb-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <span>Detection Rule: {item.alert_type} (Confidence: {Math.round((item.confidence || 0.95) * 100)}%)</span>
                        </div>
                        <p className="text-[11px] text-red-200/90">{item.alert_reason}</p>
                        {item.recommended_action && (
                          <div className="mt-1 text-[10px] text-yellow-400">
                            Recommended Action: <strong>{item.recommended_action}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {item.event_type === "CONTAINMENT_ENFORCED" && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 font-mono flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Threat Contained: Source IP {incidentData?.source_ip} isolated by gateway policy</span>
                      </div>
                    )}
                  </div>

                  {!isLast && (
                    <div className="flex justify-center my-1.5 text-slate-600">
                      <ArrowDown className="w-4 h-4 animate-bounce" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
