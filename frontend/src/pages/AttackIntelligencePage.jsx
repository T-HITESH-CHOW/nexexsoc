import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Activity, 
  Target, 
  Flame, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Layers,
  ArrowRight,
  ExternalLink,
  Cpu
} from "lucide-react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { fetchStatistics } from "../services/api";
import { socketService } from "../services/socket";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend
);

export default function AttackIntelligencePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMitreTechnique, setSelectedMitreTechnique] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetchStatistics();
      if (res) setStats(res);
    } catch (err) {
      console.error("Failed to load intelligence stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    const unsub = socketService.on("stats_updated", (newStats) => {
      setStats((prev) => prev ? { ...prev, metrics: { ...prev.metrics, ...newStats } } : prev);
    });

    return () => unsub();
  }, []);

  const attackTypes = stats?.attacks_by_type || {
    SQL_INJECTION: 4,
    IDOR: 3,
    STORED_XSS: 2,
    BRUTE_FORCE: 1
  };

  const doughnutData = {
    labels: ["SQL Injection", "IDOR", "Stored XSS", "Brute Force"],
    datasets: [{
      data: [
        attackTypes["SQL_INJECTION"] || 4,
        attackTypes["IDOR"] || 3,
        attackTypes["STORED_XSS"] || 2,
        attackTypes["BRUTE_FORCE"] || 1
      ],
      backgroundColor: ["#EF4444", "#F97316", "#8B5CF6", "#F59E0B"],
      borderColor: "#060913",
      borderWidth: 2
    }]
  };

  const confidenceScores = [
    {
      vector: "SQL INJECTION (SQLi)",
      confidence: 98,
      rule: "RULE-SQLI-001: AST Token & Boolean Tautology Matcher",
      technique: "T1190 - Exploit Public-Facing Application",
      description: "Detects UNION SELECT, boolean or numeric tautologies (1=1), and comment escapes with 98% true-positive confidence."
    },
    {
      vector: "INSECURE DIRECT OBJECT REFERENCE (IDOR)",
      confidence: 95,
      rule: "RULE-IDOR-002: Cross-Tenant Session Boundary Verification",
      technique: "T1078 - Valid Accounts / Privilege Abuse",
      description: "Detects unauthorized horizontal parameter tampering where caller session ID fails owner entity match."
    },
    {
      vector: "STORED CROSS-SITE SCRIPTING (XSS)",
      confidence: 90,
      rule: "RULE-XSS-003: Polyglot DOM & Script Tag Sanitization Filter",
      technique: "T1189 - Drive-by Compromise / Stored Script Injection",
      description: "Inspects incoming user posts for executable JavaScript tags, onerror event handlers, and bypass mutations."
    },
    {
      vector: "AUTHENTICATION BRUTE FORCE",
      confidence: 85,
      rule: "RULE-AUTH-004: Sliding Window Credential Velocity Threshold",
      technique: "T1110 - Brute Force",
      description: "Tracks failure rate over 60s sliding window (>5 consecutive 401/403 responses per IP)."
    }
  ];

  const mitreMatrix = [
    {
      id: "T1190",
      name: "Exploit Public-Facing Application",
      tactic: "Initial Access",
      severity: "CRITICAL",
      vectors: ["SQL Injection", "Stored XSS"],
      mitigation: "Input parameterization, prepared statements, WAF regex inspection, automated IP isolation"
    },
    {
      id: "T1110",
      name: "Brute Force",
      tactic: "Credential Access",
      severity: "HIGH",
      vectors: ["Credential Stuffing", "Login Dictionary Attack"],
      mitigation: "Sliding window rate-limiting, CAPTCHA challenge, automated IP quarantine"
    },
    {
      id: "T1078",
      name: "Valid Accounts / Privilege Abuse",
      tactic: "Defense Evasion / Lateral Movement",
      severity: "HIGH",
      vectors: ["IDOR Profile Tampering", "Token Substitution"],
      mitigation: "Strict session ownership validation, token signing, object-level ACL verification"
    },
    {
      id: "T1059",
      name: "Command & Scripting Interpreter",
      tactic: "Execution",
      severity: "MEDIUM",
      vectors: ["JavaScript Payload Execution", "Stored Script"],
      mitigation: "Strict Content-Security-Policy (CSP), HTML output entity encoding"
    }
  ];

  return (
    <div className="space-y-5 pb-12 font-mono select-none animate-glideIn">
      {/* Header */}
      <div className="p-5 cyber-panel rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold text-white tracking-wide">
              NEXES THREAT INTELLIGENCE &amp; HEURISTICS MATRIX
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Detection engine confidence ratings, MITRE ATT&amp;CK taxonomy mapping, and vector distribution analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>4 DETECTION ENGINES ARMED</span>
          </div>
        </div>
      </div>

      {/* Top Split: Vector Distribution + Confidence Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Vector Distribution Chart */}
        <div className="p-5 cyber-panel rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between card-glide">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
            <span className="text-xs font-bold text-slate-200">ATTACK VECTOR DISTRIBUTION</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="h-52 relative flex items-center justify-center my-2">
            <Doughnut 
              data={doughnutData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { color: "#94a3b8", font: { size: 10, family: "JetBrains Mono" } }
                  }
                }
              }} 
            />
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 flex justify-between">
            <span>TOTAL DETECTIONS:</span>
            <span className="text-cyan-400 font-extrabold">
              {Object.values(attackTypes).reduce((a, b) => a + b, 0)} SIGNATURES
            </span>
          </div>
        </div>

        {/* Detection Engine Confidence Gauges (Span 2) */}
        <div className="lg:col-span-2 p-5 cyber-panel rounded-2xl border border-white/10 shadow-lg space-y-3.5 card-glide">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-xs font-bold text-slate-200">DETECTION ENGINE CONFIDENCE RATINGS</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {confidenceScores.map((item) => (
              <div key={item.vector} className="p-3.5 bg-[#030611]/90 border border-white/5 rounded-xl space-y-2 card-glide">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 truncate">{item.vector}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    item.confidence >= 95 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" 
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  }`}>
                    {item.confidence}%
                  </span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${item.confidence}%` }}
                  />
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {item.description}
                </p>

                <div className="text-[9px] text-slate-500 flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="truncate">{item.rule}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MITRE ATT&CK Matrix Mapping Section */}
      <div className="p-5 cyber-panel rounded-2xl border border-white/10 shadow-lg space-y-4 card-glide">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-200">MITRE ATT&amp;CK&reg; ENTERPRISE MAPPING MATRIX</h2>
            <p className="text-[11px] text-slate-500">
              Correlated adversary techniques observed and mitigated within the live cyber range.
            </p>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#030611] border border-white/10 text-slate-400 font-bold">
            FRAMEWORK v14
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {mitreMatrix.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedMitreTechnique(item)}
              className="p-3.5 bg-[#030611]/90 border border-white/5 hover:border-cyan-400/50 rounded-xl cursor-pointer transition-all duration-300 space-y-2 group card-glide"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 group-hover:underline">
                  {item.id}
                </span>
                <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${
                  item.severity === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                }`}>
                  {item.severity}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-200">{item.name}</div>
              <div className="text-[10px] text-slate-500">TACTIC: {item.tactic}</div>

              <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400">
                <span className="text-slate-500">Vectors:</span> {item.vectors.join(", ")}
              </div>
            </div>
          ))}
        </div>

        {selectedMitreTechnique && (
          <div className="mt-3 p-4 bg-cyan-950/20 border border-cyan-400/40 rounded-xl text-xs space-y-2 animate-glideIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300">
                INSPECTION: {selectedMitreTechnique.id} - {selectedMitreTechnique.name}
              </span>
              <button 
                onClick={() => setSelectedMitreTechnique(null)}
                className="btn-glide text-slate-400 hover:text-white text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-white/10"
              >
                CLOSE
              </button>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <span className="text-slate-400 font-bold">Mitigation Strategy: </span>
              {selectedMitreTechnique.mitigation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
