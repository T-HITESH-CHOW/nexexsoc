import json
import uuid
from datetime import datetime, timezone
from database.db import get_db_connection
from detection.engine import detection_engine

class TelemetryEngine:
    """
    Central telemetry ingestion and dispatch engine.
    Ingests requests, parses, normalizes into standard schema,
    persists to database, invokes detection engine, and emits WebSocket events.
    """
    def __init__(self):
        self._socketio = None

    def set_socketio(self, socketio):
        self._socketio = socketio

    def record_event(
        self,
        source_ip: str,
        method: str,
        path: str,
        event_type: str,
        severity: str,
        status: str,
        description: str,
        user: str = "anonymous",
        payload: dict = None,
        request_id: str = None
    ):
        now = datetime.now(timezone.utc).isoformat()
        event_id = f"EVT-{uuid.uuid4().hex[:6].upper()}"
        req_id = request_id or f"REQ-{uuid.uuid4().hex[:6].upper()}"
        payload_data = payload or {}

        event = {
            "event_id": event_id,
            "timestamp": now,
            "source_ip": source_ip,
            "method": method.upper(),
            "path": path,
            "event_type": event_type,
            "severity": severity,
            "status": status,
            "user": user or "anonymous",
            "description": description,
            "request_id": req_id,
            "payload": payload_data
        }

        # 1. Persist to SQLite
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO events 
            (event_id, timestamp, source_ip, method, path, event_type, severity, status, user, description, request_id, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                event_id,
                now,
                source_ip,
                method.upper(),
                path,
                event_type,
                severity,
                status,
                user or "anonymous",
                description,
                req_id,
                json.dumps(payload_data)
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[TelemetryEngine] Error persisting event {event_id}: {e}")

        # 2. Ingest into Detection Engine
        alert = detection_engine.analyze_event(event)

        # 3. Real-Time Broadcast to SOC Live Dashboard via Socket.IO
        if self._socketio:
            self._socketio.emit("new_event", event)
            # Send updated top-level metrics
            self.broadcast_stats()

        return event, alert

    def broadcast_stats(self):
        """Calculates current SOC metrics and pushes to all connected clients."""
        if not self._socketio:
            return

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM events;")
            total_events = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM incidents WHERE status IN ('OPEN', 'INVESTIGATING');")
            active_incidents = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM alerts WHERE severity = 'CRITICAL';")
            critical_alerts = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM alerts WHERE severity = 'HIGH';")
            high_alerts = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM containment_actions WHERE status = 'ACTIVE';")
            contained_threats = cursor.fetchone()[0]

            conn.close()

            stats = {
                "total_events": total_events,
                "active_incidents": active_incidents,
                "critical_alerts": critical_alerts,
                "high_alerts": high_alerts,
                "contained_threats": contained_threats,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

            self._socketio.emit("stats_updated", stats)
        except Exception as e:
            print(f"[TelemetryEngine] Error calculating stats: {e}")

    def get_events(self, limit: int = 100, event_type: str = None, severity: str = None):
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM events"
        params = []
        conditions = []

        if event_type:
            conditions.append("event_type = ?")
            params.append(event_type)
        if severity:
            conditions.append("severity = ?")
            params.append(severity)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY timestamp DESC LIMIT ?;"
        params.append(limit)

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        conn.close()

        events = []
        for r in rows:
            item = dict(r)
            if item.get("payload"):
                try:
                    item["payload"] = json.loads(item["payload"])
                except Exception:
                    pass
            events.append(item)
        return events

telemetry_engine = TelemetryEngine()
