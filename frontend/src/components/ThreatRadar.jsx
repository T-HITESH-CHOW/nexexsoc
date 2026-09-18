import React, { useMemo } from "react";
import { Shield, Radio, Activity, Target, Zap } from "lucide-react";

export default function ThreatRadar({ attacks = {}, recentEvents = [] }) {
  // Vector counts
  const sqliCount = attacks["SQL_INJECTION"] || 0;
  const idorCount = attacks["IDOR"] || 0;
  const xssCount = attacks["STORED_XSS"] || 0;
  const bruteCount = attacks["BRUTE_FORCE"] || 0;
  const totalThreats = sqliCount + idorCount + xssCount + bruteCount;

  // Radar points
  const vectors = [
    { label: "SQLi", count: sqliCount, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
    { label: "IDOR", count: idorCount, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
    { label: "XSS", count: xssCount, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
    { label: "AUTH", count: bruteCount, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
    { label: "STABLE", count: Math.max(1, 15 - totalThreats), color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" }
  ];

  return (
    <div className="cyber-panel p-5 rounded-2xl border border-white/10 select-none font-mono flex flex-col justify-between h-full card-glide shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">
              NEXES THREAT RADAR
            </span>
            <p className="text-[9px] text-slate-500">360° Sector Sweep</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-bold">
          SWEEP ACTIVE
        </span>
      </div>

      {/* Futuristic Radar Display */}
      <div className="relative w-52 h-52 mx-auto my-2 flex items-center justify-center">
        {/* Outer Glow Halo */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-xl pointer-events-none" />

        {/* Concentric rings */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 shadow-[inset_0_0_15px_rgba(6,182,212,0.05)]" />
        <div className="absolute inset-5 rounded-full border border-cyan-500/25" />
        <div className="absolute inset-12 rounded-full border border-slate-800" />
        <div className="absolute inset-20 rounded-full border border-slate-800/80" />

        {/* Tactical Crosshairs */}
        <div className="absolute w-full h-[1px] bg-cyan-500/20" />
        <div className="absolute h-full w-[1px] bg-cyan-500/20" />
        <div className="absolute w-full h-[1px] bg-slate-800/40 rotate-45" />
        <div className="absolute h-full w-[1px] bg-slate-800/40 rotate-45" />

        {/* Gliding Sweeper beam */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div className="w-full h-full animate-radar origin-center bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(6,182,212,0.25)_360deg)]" />
        </div>

        {/* Center Protected Sentinel Node */}
        <div className="relative z-10 w-11 h-11 rounded-full bg-[#030611] border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Shield className="w-5 h-5 text-cyan-300 animate-pulse" />
        </div>

        {/* Radar Blips */}
        {sqliCount > 0 && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 animate-glideIn">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 border border-red-500 text-red-300 font-bold">SQLi</span>
          </div>
        )}
        {idorCount > 0 && (
          <div className="absolute right-9 bottom-7 flex items-center gap-1.5 animate-glideIn">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-950 border border-orange-500 text-orange-300 font-bold">IDOR</span>
          </div>
        )}
        {xssCount > 0 && (
          <div className="absolute left-9 bottom-7 flex items-center gap-1.5 animate-glideIn">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-500 text-purple-300 font-bold">XSS</span>
          </div>
        )}
      </div>

      {/* Sector Gliding Pill Breakdown */}
      <div className="grid grid-cols-5 gap-1.5 pt-3 border-t border-white/10 text-center text-[10px]">
        {vectors.map((v) => (
          <div key={v.label} className={`p-1.5 rounded-xl border ${v.bg} transition-all duration-300 hover:scale-105`}>
            <span className="text-slate-400 block truncate text-[9px] font-bold">{v.label}</span>
            <span className={`font-black text-xs ${v.color}`}>{v.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
