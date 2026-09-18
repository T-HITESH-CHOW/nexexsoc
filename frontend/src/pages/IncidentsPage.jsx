import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  GitCommit, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  Lock,
  Bot,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { fetchIncidents, updateIncidentStatus } from "../services/api";
import { socketService } from "../services/socket";

export default function IncidentsPage({ onSelectIncident, onLaunchAiWithIncident }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const res = await fetchIncidents(50);
      if (res && res.incidents) {
        setIncidents(res.incidents);
      }
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();

    const unsub = socketService.on("incident_updated", (updatedInc) => {
      setIncidents((prev) => {
        const idx = prev.findIndex(i => i.incident_id === updatedInc.incident_id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedInc;
          return next;
        } else {
          return [updatedInc, ...prev];
        }
      });
    });

    return () => unsub();
  }, []);

  const handleStatusChange = async (e, incidentId) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    try {
      const updated = await updateIncidentStatus(incidentId, newStatus);
      if (updated && updated.incident) {
        setIncidents((prev) => prev.map(i => i.incident_id === incidentId ? updated.incident : i));
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "CRITICAL": return "bg-red-500/20 text-red-400 border-red-500/40 font-bold glow-critical";
      case "HIGH": return "bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold";
      case "MEDIUM": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      default: return "bg-slate-700/50 text-slate-300 border-slate-600";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "OPEN": return "bg-red-950/80 text-red-400 border-red-800";
      case "INVESTIGATING": return "bg-yellow-950/80 text-yellow-400 border-yellow-800";
      case "CONTAINED": return "bg-emerald-950/80 text-emerald-400 border-emerald-800";
      case "RESOLVED": return "bg-blue-950/80 text-blue-400 border-blue-800";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesStatus = statusFilter === "ALL" || inc.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      inc.incident_id?.toLowerCase().includes(searchLower) ||
      inc.title?.toLowerCase().includes(searchLower) ||
      inc.source_ip?.toLowerCase().includes(searchLower) ||
      inc.attack_type?.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-12 select-none font-sans">
      {/* Header */}
      <div className="cyber-panel p-4 rounded-xl border border-soc-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Correlated Incident Management & Kill Chains
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Heuristic correlation engine clustering multi-stage telemetry into actionable incident dossiers.
          </p>
        </div>

        <button
          onClick={loadIncidents}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-mono text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-soc-card border border-soc-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by incident ID, title, IP, or attack vector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400 text-xs">Filter State:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">ALL STATES</option>
            <option value="OPEN">OPEN</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="CONTAINED">CONTAINED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      <div className="grid grid-cols-1 gap-3 font-mono text-xs">
        {filteredIncidents.length === 0 ? (
          <div className="p-10 text-center cyber-panel rounded-xl text-slate-500">
            No correlated incidents found matching your search filter.
          </div>
        ) : (
          filteredIncidents.map((inc) => (
            <div
              key={inc.incident_id}
              onClick={() => onSelectIncident && onSelectIncident(inc.incident_id)}
              className="p-4 cyber-hud-card rounded-xl transition cursor-pointer shadow-sm hover:border-cyan-500/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>

                <div className="space-y-1.5 flex-1 font-sans">
                  <div className="flex items-center gap-2 flex-wrap font-mono">
                    <span className="font-bold text-white text-sm">{inc.incident_id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${getSeverityBadge(inc.severity)}`}>
                      {inc.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(inc.status)}`}>
                      {inc.status}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Source IP: <strong className="text-cyan-400">{inc.source_ip}</strong>
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-100 text-sm">
                    {inc.title}
                  </h3>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3 pt-0.5 flex-wrap">
                    <span>Attack Vectors: <strong className="text-purple-400">{inc.attack_type}</strong></span>
                    <span>•</span>
                    <span>Correlated Telemetry: <strong className="text-cyan-400">{inc.event_count} Events</strong></span>
                    <span>•</span>
                    <span>Last Ingested: {inc.last_time?.slice(11, 19)}</span>
                  </div>
                </div>
              </div>

              {/* Status Selector & Actions */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 font-mono">
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] text-slate-400">State:</span>
                  <select
                    value={inc.status}
                    onChange={(e) => handleStatusChange(e, inc.incident_id)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="CONTAINED">CONTAINED</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onLaunchAiWithIncident) {
                      onLaunchAiWithIncident(inc.incident_id);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-glow-purple"
                  title="Generate AI Incident Briefing"
                >
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Brief</span>
                </button>

                <button
                  onClick={() => onSelectIncident && onSelectIncident(inc.incident_id)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                  title="View Chronological Attack Timeline"
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Timeline</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
