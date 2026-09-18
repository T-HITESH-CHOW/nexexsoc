import React, { useState, useEffect } from "react";
import { 
  Terminal, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Download, 
  Pause, 
  Play,
  ArrowDown,
  ShieldAlert,
  Zap,
  Bot
} from "lucide-react";
import { fetchEvents } from "../services/api";
import { socketService } from "../services/socket";

export default function LiveEvents({ onSelectEvent, globalSearch = "" }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(globalSearch);
  const [selectedSev, setSelectedSev] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [isPaused, setIsPaused] = useState(false);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState(new Set());

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetchEvents(100);
      if (res && res.events) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    const unsub = socketService.on("new_event", (newEvent) => {
      if (!isPaused) {
        setEvents((prev) => [newEvent, ...prev.slice(0, 199)]);
        setNewlyArrivedIds((prev) => new Set([newEvent.event_id, ...Array.from(prev)]));
        setTimeout(() => {
          setNewlyArrivedIds((prev) => {
            const next = new Set(prev);
            next.delete(newEvent.event_id);
            return next;
          });
        }, 2500);
      }
    });

    return () => unsub();
  }, [isPaused]);

  useEffect(() => {
    if (globalSearch) setSearch(globalSearch);
  }, [globalSearch]);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "CRITICAL": return "bg-red-500/20 text-red-400 border-red-500/40 font-bold glow-critical";
      case "HIGH": return "bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold";
      case "MEDIUM": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "LOW": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSev = selectedSev === "ALL" || e.severity === selectedSev;
    const matchesType = selectedType === "ALL" || e.event_type === selectedType;
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      e.source_ip?.toLowerCase().includes(searchLower) ||
      e.path?.toLowerCase().includes(searchLower) ||
      e.description?.toLowerCase().includes(searchLower) ||
      e.event_id?.toLowerCase().includes(searchLower) ||
      e.event_type?.toLowerCase().includes(searchLower) ||
      e.user?.toLowerCase().includes(searchLower);
    return matchesSev && matchesType && matchesSearch;
  });

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sentinel-x-telemetry-${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Live Telemetry Ingestion Console
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Streaming normalized telemetry events captured by application middleware and security sensors.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-semibold transition ${
              isPaused 
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? "Resume Stream" : "Pause Stream"}</span>
          </button>

          <button
            onClick={exportJSON}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          <button
            onClick={loadEvents}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-soc-card border border-soc-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter events by IP, endpoint, payload, ID, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap font-mono">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Severity:</span>
            <select
              value={selectedSev}
              onChange={(e) => setSelectedSev(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
            >
              <option value="ALL">ALL SEVERITIES</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="SQL_INJECTION">SQL_INJECTION</option>
              <option value="IDOR">IDOR</option>
              <option value="STORED_XSS">STORED_XSS</option>
              <option value="CONTAINMENT_ENFORCED">CONTAINMENT_ENFORCED</option>
              <option value="AUTH_SUCCESS">AUTH_SUCCESS</option>
              <option value="AUTH_FAILED">AUTH_FAILED</option>
              <option value="PROFILE_VIEW">PROFILE_VIEW</option>
              <option value="COMMENT_POSTED">COMMENT_POSTED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-soc-card border border-soc-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 text-[11px] bg-slate-900/60">
                <th className="p-3">EVENT ID</th>
                <th className="p-3">TIME (UTC)</th>
                <th className="p-3">SEVERITY</th>
                <th className="p-3">EVENT TYPE</th>
                <th className="p-3">SOURCE IP</th>
                <th className="p-3">HTTP REQUEST</th>
                <th className="p-3">USER CONTEXT</th>
                <th className="p-3">GATEWAY STATUS</th>
                <th className="p-3 text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    No telemetry events found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const isNew = newlyArrivedIds.has(evt.event_id);
                  return (
                    <tr 
                      key={evt.event_id}
                      onClick={() => onSelectEvent && onSelectEvent(evt)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition ${isNew ? "animate-flash bg-blue-500/20" : ""}`}
                    >
                      <td className="p-3 font-bold text-white">{evt.event_id}</td>
                      <td className="p-3 text-cyan-400">{evt.timestamp?.slice(11, 19) || "00:00:00"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${getSeverityBadge(evt.severity)}`}>
                          {evt.severity}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200 font-semibold">{evt.event_type}</td>
                      <td className="p-3 text-blue-400">{evt.source_ip}</td>
                      <td className="p-3 text-emerald-400">
                        <span className="text-slate-400 mr-1">{evt.method}</span>
                        {evt.path}
                      </td>
                      <td className="p-3 text-yellow-400/90">{evt.user || "anonymous"}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                          evt.status === "BLOCKED" 
                            ? "bg-red-500/20 text-red-300 border-red-500/40 font-bold" 
                            : evt.status === "DETECTED" 
                              ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button className="text-slate-400 hover:text-cyan-400 p-1">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
