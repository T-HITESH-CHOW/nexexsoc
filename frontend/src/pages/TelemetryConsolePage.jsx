import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Pause, 
  Play,
  ArrowDown, 
  ShieldAlert, 
  Zap, 
  Bot, 
  Copy, 
  Check, 
  Trash2, 
  Maximize2
} from "lucide-react";
import { fetchEvents } from "../services/api";
import { socketService } from "../services/socket";

export default function TelemetryConsolePage({ onSelectEvent, globalSearch = "" }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(globalSearch);
  const [selectedVector, setSelectedVector] = useState("ALL");
  const [selectedSev, setSelectedSev] = useState("ALL");
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState(new Set());
  const consoleBottomRef = useRef(null);

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
        }, 2000);
      }
    });

    return () => unsub();
  }, [isPaused]);

  useEffect(() => {
    if (globalSearch) setSearch(globalSearch);
  }, [globalSearch]);

  const vectors = [
    { id: "ALL", label: "[ALL]" },
    { id: "SQL_INJECTION", label: "[SQLi]" },
    { id: "IDOR", label: "[IDOR]" },
    { id: "STORED_XSS", label: "[XSS]" },
    { id: "BRUTE_FORCE", label: "[AUTH]" },
    { id: "SYSTEM", label: "[SYSTEM]" }
  ];

  const filteredEvents = events.filter((e) => {
    // Vector filter
    if (selectedVector !== "ALL") {
      if (selectedVector === "SYSTEM") {
        if (e.attack_type || (e.severity !== "LOW" && e.severity !== "INFO")) return false;
      } else if (e.attack_type !== selectedVector) {
        return false;
      }
    }

    // Severity filter
    if (selectedSev !== "ALL" && e.severity !== selectedSev) {
      return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = 
        e.source_ip?.toLowerCase().includes(q) ||
        e.endpoint?.toLowerCase().includes(q) ||
        e.attack_type?.toLowerCase().includes(q) ||
        e.severity?.toLowerCase().includes(q) ||
        e.raw_payload?.toLowerCase().includes(q) ||
        e.detection_rule?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case "CRITICAL": return "text-red-400 bg-red-500/15 border-red-500/40 font-bold";
      case "HIGH": return "text-orange-400 bg-orange-500/15 border-orange-500/40 font-semibold";
      case "MEDIUM": return "text-yellow-400 bg-yellow-500/15 border-yellow-500/40";
      case "LOW": return "text-emerald-400 bg-emerald-500/15 border-emerald-500/40";
      default: return "text-slate-400 bg-slate-800 border-slate-700";
    }
  };

  const getStatusColor = (code) => {
    if (!code) return "text-slate-500";
    if (code === 403) return "text-red-400 font-bold";
    if (code >= 500) return "text-orange-400";
    if (code >= 400) return "text-yellow-400";
    if (code >= 200) return "text-emerald-400";
    return "text-slate-400";
  };

  const handleCopyLogs = () => {
    const text = filteredEvents.map(e => 
      `[${e.timestamp}] [${e.severity || 'INFO'}] [${e.attack_type || 'NORMAL'}] ${e.source_ip} -> ${e.method} ${e.endpoint} [${e.status_code || 200}]`
    ).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-12 font-mono select-none animate-glideIn">
      {/* Console Header Bar */}
      <div className="p-5 cyber-panel rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300">
              <Terminal className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold text-white tracking-wide">
              NEXES REAL-TIME TELEMETRY OBSERVABILITY TERMINAL
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-bold">
              BUFFER: {events.length} EVENTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Kernel &amp; HTTP ingress stream with signature matcher, latency telemetry, and payload inspection.
          </p>
        </div>

        {/* Gliding Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`btn-glide px-3.5 py-1.5 rounded-full border text-xs flex items-center gap-1.5 transition ${
              isPaused 
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                : "bg-[#0a1024] text-slate-300 border-white/10 hover:bg-[#0e1738]"
            }`}
          >
            {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? "RESUME FEED" : "PAUSE STREAM"}</span>
          </button>

          <button
            onClick={handleCopyLogs}
            className="btn-glide px-3.5 py-1.5 rounded-full bg-[#0a1024] hover:bg-[#0e1738] text-slate-300 border border-white/10 text-xs flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span>{copied ? "COPIED" : "COPY TEXT"}</span>
          </button>

          <button
            onClick={() => setEvents([])}
            className="btn-glide px-3.5 py-1.5 rounded-full bg-[#0a1024] hover:bg-[#0e1738] text-slate-300 border border-white/10 text-xs flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3 h-3 text-slate-400" />
            <span>CLEAR</span>
          </button>

          <button
            onClick={loadEvents}
            disabled={loading}
            className="btn-glide px-4 py-1.5 rounded-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-400/40 text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span>RELOAD</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="p-3.5 cyber-panel rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Attack Vector Gliding Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-slate-500 text-[11px] font-bold mr-1">VECTORS:</span>
          {vectors.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVector(v.id)}
              className={`btn-glide px-3 py-1 rounded-full text-xs transition-all ${
                selectedVector === v.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105"
                  : "bg-[#030611] text-slate-400 hover:text-slate-100 border border-white/10"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Severity Filter & Search */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Filter IP, path, rule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#030611] border border-white/10 rounded-full pl-9 pr-3.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/60 w-48 lg:w-64 transition-all"
            />
          </div>

          <select
            value={selectedSev}
            onChange={(e) => setSelectedSev(e.target.value)}
            className="bg-[#030611] border border-white/10 rounded-full px-3 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-400/60 font-mono"
          >
            <option value="ALL">ALL SEVERITIES</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFO">INFO</option>
          </select>
        </div>
      </div>

      {/* Monospaced Telemetry Terminal Grid */}
      <div className="bg-[#030611]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Terminal Header */}
        <div className="bg-[#060a17] px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-bold text-slate-300 tracking-wider">STREAM: /dev/nexes/telemetry0</span>
          </div>
          <span>DISPLAYING {filteredEvents.length} FRAMES</span>
        </div>

        {/* Table Content */}
        <div className="max-h-[640px] overflow-y-auto divide-y divide-white/5 text-xs">
          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
              <p>NO TELEMETRY MATCHING CURRENT FILTERS</p>
              <p className="text-[11px] text-slate-600 mt-1">Execute attacks in the Attack Lab to trigger real-time telemetry</p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isNew = newlyArrivedIds.has(evt.event_id);
              const timeStr = evt.timestamp ? evt.timestamp.split("T")[1]?.slice(0, 8) || evt.timestamp : "00:00:00";
              const sev = evt.severity || "INFO";

              return (
                <div
                  key={evt.event_id || Math.random()}
                  onClick={() => onSelectEvent && onSelectEvent(evt)}
                  className={`px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-cyan-950/20 cursor-pointer transition-all duration-200 ${
                    isNew ? "bg-cyan-500/15 border-l-4 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 flex-wrap font-mono">
                    <span className="text-slate-500 text-[11px]">{timeStr}</span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getSeverityStyle(sev)}`}>
                      {sev}
                    </span>

                    {evt.attack_type ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-950/70 border border-red-500/40 text-red-300 text-[10px] font-bold">
                        {evt.attack_type}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 text-[10px]">
                        NORMAL
                      </span>
                    )}

                    <span className="text-cyan-400 font-bold">{evt.source_ip}</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="text-slate-400 font-bold">{evt.method || "GET"}</span>
                    <span className="text-slate-200">{evt.endpoint}</span>

                    <span className={`text-[11px] ${getStatusColor(evt.status_code)}`}>
                      [{evt.status_code || 200}]
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    {evt.detection_rule && (
                      <span className="text-slate-500 truncate max-w-xs" title={evt.detection_rule}>
                        RULE: {evt.detection_rule}
                      </span>
                    )}
                    <span className="text-cyan-400 hover:text-cyan-300 underline text-[10px] font-bold">
                      INSPECT &rarr;
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
