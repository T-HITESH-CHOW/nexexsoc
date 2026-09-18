import React, { useState, useEffect } from "react";
import { 
  Bell, 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  Bot, 
  Lock, 
  Eye, 
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { fetchAlerts } from "../services/api";
import { socketService } from "../services/socket";

export default function AlertsPage({ onLaunchAiWithIncident, onSelectEvent, setActiveTab }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSev, setSelectedSev] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetchAlerts(100);
      if (res && res.alerts) {
        setAlerts(res.alerts);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    const unsub = socketService.on("new_alert", (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev.slice(0, 99)]);
    });

    return () => unsub();
  }, []);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "CRITICAL": return "bg-red-500/20 text-red-400 border-red-500/40 font-bold glow-critical";
      case "HIGH": return "bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold";
      case "MEDIUM": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "LOW": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSev = selectedSev === "ALL" || a.severity === selectedSev;
    const matchesType = selectedType === "ALL" || a.type === selectedType;
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      a.alert_id?.toLowerCase().includes(searchLower) ||
      a.type?.toLowerCase().includes(searchLower) ||
      a.source_ip?.toLowerCase().includes(searchLower) ||
      a.endpoint?.toLowerCase().includes(searchLower) ||
      a.reason?.toLowerCase().includes(searchLower);
    return matchesSev && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-400" />
            Security Alerts Matrix & Heuristic Detections
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Granular rule detections, confidence evaluations, pattern matches, and recommended mitigation actions.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-soc-card border border-soc-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts by ID, type, endpoint, reason, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
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
              <option value="BRUTE_FORCE">BRUTE_FORCE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-soc-card border border-soc-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 text-[11px] bg-slate-900/60">
                <th className="p-3">ALERT ID</th>
                <th className="p-3">TIME (UTC)</th>
                <th className="p-3">SEVERITY</th>
                <th className="p-3">ATTACK TYPE</th>
                <th className="p-3">CONFIDENCE</th>
                <th className="p-3">SOURCE IP</th>
                <th className="p-3">ENDPOINT</th>
                <th className="p-3">DETECTION REASON & ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No security alerts found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((a) => {
                  const confPct = Math.round((a.confidence || 0.95) * 100);
                  return (
                    <tr key={a.alert_id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-white">{a.alert_id}</td>
                      <td className="p-3 text-cyan-400">{a.timestamp?.slice(11, 19) || "00:00:00"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${getSeverityBadge(a.severity)}`}>
                          {a.severity}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200 font-bold">{a.type}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full ${confPct >= 90 ? "bg-red-400" : "bg-yellow-400"}`} 
                              style={{ width: `${confPct}%` }}
                            />
                          </div>
                          <span className="text-slate-300 text-[11px] font-semibold">{confPct}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-blue-400">{a.source_ip}</td>
                      <td className="p-3 text-emerald-400">{a.endpoint}</td>
                      <td className="p-3 max-w-xs">
                        <div className="text-slate-300 text-[11px] truncate" title={a.reason}>
                          {a.reason}
                        </div>
                        {a.recommended_action && (
                          <div className="text-[10px] text-yellow-400/90 mt-0.5 font-semibold">
                            Action: {a.recommended_action}
                          </div>
                        )}
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
