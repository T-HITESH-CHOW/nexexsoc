import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.latency = 0;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect() {
    if (this.socket) return this.socket;

    // Connect to same origin or port 5000 in development
    const socketUrl = window.location.port === "3000" 
      ? "http://127.0.0.1:5000" 
      : window.location.origin;

    this.socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    });

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("[SocketService] Connected to SENTINEL-X SOC backend:", this.socket.id);
      this._emitToListeners("status_change", { connected: true, id: this.socket.id });
      this.startLatencyPing();
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log("[SocketService] Disconnected from SOC backend");
      this._emitToListeners("status_change", { connected: false });
    });

    this.socket.on("pong_response", (data) => {
      if (data && data.server_time) {
        const roundtrip = Date.now() - data.server_time;
        this.latency = Math.max(1, Math.round(roundtrip));
        this._emitToListeners("latency_update", this.latency);
      }
    });

    // Ingest events
    const events = ["new_event", "new_alert", "incident_updated", "threat_contained", "threat_unblocked", "stats_updated", "demo_step"];
    events.forEach(evt => {
      this.socket.on(evt, (data) => {
        this._emitToListeners(evt, data);
      });
    });

    return this.socket;
  }

  startLatencyPing() {
    setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit("ping_check", { client_time: Date.now() });
      }
    }, 4000);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  _emitToListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[SocketService] Error in listener for ${event}:`, err);
        }
      });
    }
  }
}

export const socketService = new SocketService();
