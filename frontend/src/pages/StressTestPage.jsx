import React, { useState } from "react";
import { Cpu, Play, CheckCircle2, Clock, Zap, AlertTriangle, Activity, BarChart2 } from "lucide-react";
import { runStressTest } from "../services/api";

export default function StressTestPage() {
  const [requests, setRequests] = useState(100);
  const [concurrency, setConcurrency] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleStartBenchmark = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await runStressTest(requests, concurrency);
      if (res && res.results) {
        setResults(res.results);
      }
    } catch (err) {
      console.error("Stress test failed:", err);
      setError(err.message || "Benchmark failed to complete");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-soc-border pb-4">
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          Ingestion Engine Multi-Threaded Stress Test
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Benchmark real ingestion throughput and detection latency under concurrent synthetic multi-threaded exploit execution.
        </p>
      </div>

      {/* Control Panel */}
      <div className="p-6 rounded-xl bg-soc-card border border-soc-border shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Requests selector */}
          <div>
            <label className="block text-xs font-mono text-slate-300 font-bold mb-2">
              Number of Simulated Telemetry Requests:
            </label>
            <div className="grid grid-cols-4 gap-2 font-mono text-xs">
              {[10, 50, 100, 500].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setRequests(count)}
                  className={`py-2 rounded-lg border text-center font-bold transition ${
                    requests === count 
                      ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30" 
                      : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Concurrency selector */}
          <div>
            <label className="block text-xs font-mono text-slate-300 font-bold mb-2">
              Worker Thread Concurrency:
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {[1, 5, 10].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConcurrency(c)}
                  className={`py-2 rounded-lg border text-center font-bold transition ${
                    concurrency === c 
                      ? "bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/30" 
                      : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                >
                  {c} {c === 1 ? "Thread" : "Threads"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between border-t border-soc-border">
          <div className="text-xs font-mono text-slate-400">
            Pipeline: <strong>Generator → Ingest → Detect → Correlate → DB</strong>
          </div>

          <button
            onClick={handleStartBenchmark}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Play className={`w-4 h-4 fill-current ${isRunning ? "animate-spin" : ""}`} />
            <span>{isRunning ? "Running Multi-Threaded Test..." : "Execute Stress Test"}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-xs font-mono text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>Stress Test Error: {error}</span>
        </div>
      )}

      {/* Measured Benchmark Results (Section 21) */}
      {results && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Measured Benchmark Telemetry Performance
            </h2>
            <span className="text-xs font-mono text-slate-400">Measured via Python time.perf_counter()</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 font-mono text-xs">
            {/* Events Ingested */}
            <div className="p-4 rounded-xl bg-soc-card border border-soc-border">
              <div className="text-slate-400 text-[11px] mb-1">EVENTS INGESTED</div>
              <div className="text-2xl font-black text-white">
                {results.events_ingested} / {results.events_generated}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">100% Ingestion Rate</div>
            </div>

            {/* Ingestion Throughput */}
            <div className="p-4 rounded-xl bg-soc-card border border-soc-border">
              <div className="text-slate-400 text-[11px] mb-1">THROUGHPUT</div>
              <div className="text-2xl font-black text-cyan-400">
                {results.throughput_events_per_second} <span className="text-xs text-slate-400">evt/s</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Sustained Processing Rate</div>
            </div>

            {/* Average Latency */}
            <div className="p-4 rounded-xl bg-soc-card border border-soc-border">
              <div className="text-slate-400 text-[11px] mb-1">AVG DETECTION LATENCY</div>
              <div className="text-2xl font-black text-emerald-400">
                {results.avg_detection_latency_ms} <span className="text-xs text-slate-400">ms</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Min: {results.min_latency_ms}ms • Max: {results.max_latency_ms}ms</div>
            </div>

            {/* Attacks Detected */}
            <div className="p-4 rounded-xl bg-soc-card border border-soc-border">
              <div className="text-slate-400 text-[11px] mb-1">EVENTS DETECTED</div>
              <div className="text-2xl font-black text-orange-400">
                {results.events_detected}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Attacks Identified by Rules</div>
            </div>
          </div>

          {/* Raw Benchmark Summary Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-2">
            <div className="text-slate-400 font-bold border-b border-slate-800 pb-2 flex justify-between">
              <span>BENCHMARK SUMMARY AUDIT REPORT</span>
              <span className="text-cyan-400">Total Duration: {results.processing_time_seconds}s</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1">
              <div>Workers: <strong className="text-white">{results.concurrency} threads</strong></div>
              <div>Ingested: <strong className="text-emerald-400">{results.events_ingested}</strong></div>
              <div>Dropped: <strong className="text-white">{results.events_dropped}</strong></div>
              <div>Throughput: <strong className="text-cyan-400">{results.throughput_events_per_second} evt/s</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
