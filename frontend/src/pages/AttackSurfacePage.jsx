import React, { useState, useEffect } from "react";
import { 
  Globe, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  Plus,
  RefreshCw,
  Eye,
  Key,
  DollarSign
} from "lucide-react";
import { fetchContainmentStatus, manualContain, manualUnblock } from "../services/api";
import { socketService } from "../services/socket";

export default function AttackSurfacePage() {
  const [containmentData, setContainmentData] = useState({ active_blocks: [], history: [] });
  const [loading, setLoading] = useState(false);
  const [manualIp, setManualIp] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [manualDuration, setManualDuration] = useState(60);
  const [actionMsg, setActionMsg] = useState(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetchContainmentStatus();
      if (res) setContainmentData(res);
    } catch (err) {
      console.error("Failed to load containment status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();

    const unsubContained = socketService.on("threat_contained", () => loadStatus());
    const unsubUnblocked = socketService.on("threat_unblocked", () => loadStatus());

    return () => {
      unsubContained();
      unsubUnblocked();
    };
  }, []);

  const handleManualBlock = async (e) => {
    e.preventDefault();
    if (!manualIp.trim()) return;
    try {
      await manualContain(manualIp.trim(), manualReason || "Manual SOC operator isolation", manualDuration);
      setActionMsg(`Source ${manualIp} placed in containment for ${manualDuration}s`);
      setManualIp("");
      setManualReason("");
      loadStatus();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRelease = async (ip) => {
    try {
      await manualUnblock(ip, "Manual analyst release");
      setActionMsg(`Source ${ip} released from containment`);
      loadStatus();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const endpoints = [
    {
      path: "/vulnerable/login",
      method: "POST",
      vulnerability: "SQL Injection (Authentication Bypass)",
      cwe: "CWE-89",
      severity: "CRITICAL",
      defense: "Automated Gateway Quarantine (60s)",
      targetAsset: "Users table credentials & session context",
      status: "MONITORED"
    },
    {
      path: "/vulnerable/search",
      method: "GET",
      vulnerability: "SQLi (UNION SELECT Data Probes)",
      cwe: "CWE-89",
      severity: "HIGH",
      defense: "Signature Heuristic Evaluator",
      targetAsset: "Schema structure & user metadata",
      status: "MONITORED"
    },
    {
      path: "/vulnerable/profile/<id>",
      method: "GET",
      vulnerability: "Insecure Direct Object Reference (IDOR)",
      cwe: "CWE-639",
      severity: "HIGH",
      defense: "Cross-Tenant Heuristic & Sequential Scraping Tracker",
      targetAsset: "CFO wire tokens & CISO vault keys",
      status: "MONITORED"
    },
    {
      path: "/vulnerable/comments",
      method: "POST",
      vulnerability: "Stored Cross-Site Scripting (XSS)",
      cwe: "CWE-79",
      severity: "HIGH",
      defense: "DOM Script Pattern Evaluator",
      targetAsset: "Client sessions & persistent discussions",
      status: "MONITORED"
    }
  ];

  const assets = [
    { name: "User Accounts Database", type: "SQLite ACID Table", target: "users", sensitivity: "HIGH", icon: Database },
    { name: "Executive Merger Notes & Wire Tokens", type: "IDOR Target (User 102 - CFO)", target: "secret_note", sensitivity: "CRITICAL", icon: DollarSign },
    { name: "CISO Root Vault Security PIN", type: "IDOR Target (User 103 - Admin)", target: "secret_note", sensitivity: "CRITICAL", icon: Key },
    { name: "Public Comment Storage", type: "SQLite Stored Discussion", target: "comments", sensitivity: "MEDIUM", icon: Server }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="cyber-panel p-4 rounded-xl border border-soc-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-black text-white tracking-wide font-sans">
              ATTACK SURFACE MAP & CONTAINMENT GATEWAY
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Asset inventory, exposed entry points, vulnerability surface, and simulated application-level quarantine controls.
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Surface</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Grid: Protected Endpoints & Target Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Endpoints Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-soc-card border border-soc-border shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-soc-border pb-2.5">
              <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                Monitored Vulnerable Endpoints (Attack Vectors)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-cyan-400 border border-blue-500/30">
                4 Endpoints Active
              </span>
            </div>

            <div className="space-y-3">
              {endpoints.map((ep, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 font-bold text-[10px] border border-slate-700">
                        {ep.method}
                      </span>
                      <span className="font-bold text-white text-sm">{ep.path}</span>
                    </div>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${
                      ep.severity === "CRITICAL" ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-orange-500/20 text-orange-400 border-orange-500/40"
                    }`}>
                      {ep.severity}
                    </span>
                  </div>

                  <div className="text-slate-300 font-sans text-xs">
                    {ep.vulnerability} <span className="text-purple-400 font-mono font-bold">[{ep.cwe}]</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                    <span>Target: <strong className="text-slate-200">{ep.targetAsset}</strong></span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {ep.defense}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sensitive Asset Inventory */}
          <div className="p-4 rounded-xl bg-soc-card border border-soc-border shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2 border-b border-soc-border pb-2.5">
              <Database className="w-4 h-4 text-cyan-400" />
              Target Asset Inventory & Data Classification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              {assets.map((ast, i) => {
                const Icon = ast.icon;
                return (
                  <div key={i} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-white text-xs">{ast.name}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                        ast.sensitivity === "CRITICAL" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {ast.sensitivity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{ast.type}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Containment Gateway & Manual Isolation (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Quarantines */}
          <div className="p-4 rounded-xl bg-soc-card border border-soc-border shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-soc-border pb-2.5">
              <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                Active IP Quarantines ({containmentData.active_blocks?.length || 0})
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                HTTP 403 Dropped
              </span>
            </div>

            {(!containmentData.active_blocks || containmentData.active_blocks.length === 0) ? (
              <div className="py-8 text-center text-slate-500 font-mono text-xs">
                No IP addresses are currently in active containment.
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {containmentData.active_blocks.map((b) => (
                  <div key={b.source_ip} className="p-3 rounded-lg bg-red-950/30 border border-red-900/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                        <span>{b.source_ip}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">{b.reason}</div>
                      <div className="text-[10px] text-red-400 font-semibold mt-1">
                        Remaining: <strong className="text-white">{b.remaining_seconds}s</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRelease(b.source_ip)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition"
                    >
                      Release
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Containment Action Form */}
          <div className="p-4 rounded-xl bg-soc-card border border-soc-border shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-white font-sans flex items-center gap-1.5 border-b border-soc-border pb-2">
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              Manual Analyst Containment Enforcer
            </h3>

            <form onSubmit={handleManualBlock} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Source IP Address:</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.99"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Containment Reason / Justification:</label>
                <input
                  type="text"
                  placeholder="e.g. Suspicious automated credential brute force"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Quarantine Duration (seconds):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 300].map((sec) => (
                    <button
                      type="button"
                      key={sec}
                      onClick={() => setManualDuration(sec)}
                      className={`py-1 rounded border text-center font-bold transition ${
                        manualDuration === sec ? "bg-red-600 text-white border-red-500" : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition active:scale-95 shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Enforce Application Block</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
