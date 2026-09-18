import React, { useEffect } from "react";
import { ShieldAlert, Lock, AlertTriangle, X, ArrowRight } from "lucide-react";

export default function NotificationToast({ notifications, onDismiss, onAction }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none font-mono text-xs select-none">
      {notifications.map((notif) => {
        const isContainment = notif.type === "containment";
        const isCritical = notif.severity === "CRITICAL";

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto p-3 rounded-lg border shadow-xl flex items-start justify-between gap-3 animate-fadeIn ${
              isContainment 
                ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-200" 
                : isCritical
                  ? "bg-red-950/95 border-red-500/60 text-red-200"
                  : "bg-slate-900/95 border-slate-700 text-slate-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`p-1.5 rounded mt-0.5 ${
                isContainment ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              }`}>
                {isContainment ? <Lock className="w-4 h-4 animate-pulse" /> : <ShieldAlert className="w-4 h-4 animate-pulse" />}
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5">
                  <span>{notif.title}</span>
                  {notif.idTag && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 border border-slate-700">
                      {notif.idTag}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  {notif.message}
                </p>
                {notif.actionLabel && (
                  <button
                    onClick={() => onAction && onAction(notif)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-bold flex items-center gap-1 pt-1"
                  >
                    <span>{notif.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => onDismiss && onDismiss(notif.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
