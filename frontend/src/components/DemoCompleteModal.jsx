import React from "react";
import { CheckCircle2, ShieldCheck, X, ArrowRight, RotateCcw, Zap } from "lucide-react";

export default function DemoCompleteModal({ isOpen, onClose, incidentId = "INC-001", onReset }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fadeIn font-mono">
      <div 
        className="w-full max-w-lg bg-[#070c1b] border-2 border-emerald-500/80 rounded-2xl shadow-[0_0_60px_rgba(16,185,129,0.35)] p-7 text-center space-y-6 relative card-glide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="space-y-2.5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.4)]">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <div className="text-xs text-emerald-400 tracking-widest uppercase font-extrabold flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            NEXES CLOSED-LOOP CYBER EXERCISE
          </div>
          <h2 className="text-2xl font-black text-white tracking-wider">
            OPERATION COMPLETE
          </h2>
          <div className="text-sm font-bold text-emerald-300">
            THREAT CONTAINED &bull; ATTACK VECTOR RECONSTRUCTED
          </div>
          <div className="text-xs text-cyan-300">
            INCIDENT DOSSIER: <span className="font-extrabold underline font-mono">{incidentId}</span>
          </div>
        </div>

        {/* Triple Division Summary */}
        <div className="border-t border-b border-white/10 py-4 grid grid-cols-3 gap-3 text-xs bg-[#030611]/60 rounded-xl">
          <div className="space-y-1">
            <div className="text-[10px] text-red-400 font-extrabold uppercase tracking-wider">
              RED TEAM
            </div>
            <div className="text-slate-100 font-bold text-xs">
              ATTACK EXECUTED
            </div>
            <div className="text-[10px] text-slate-400">
              SQLi &bull; IDOR
            </div>
          </div>

          <div className="space-y-1 border-l border-r border-white/10 px-2">
            <div className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">
              BLUE TEAM
            </div>
            <div className="text-slate-100 font-bold text-xs">
              THREAT DETECTED
            </div>
            <div className="text-[10px] text-slate-400">
              Heuristic Signatures
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">
              NEXES SOC
            </div>
            <div className="text-slate-100 font-bold text-xs">
              CONTAINED
            </div>
            <div className="text-[10px] text-slate-400">
              HTTP 403 Gateway
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {onReset && (
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="btn-glide px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Range</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="btn-glide px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-extrabold flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            <span>Review Active Telemetry</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
