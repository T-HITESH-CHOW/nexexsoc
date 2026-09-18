import uuid
import json
from datetime import datetime, timezone, timedelta
from database.db import get_db_connection

class CorrelationEngine:
    """
    Correlates disparate telemetry events and security alerts into unified,
    chronological incident dossiers with attack vector reconstruction.
    """
    def __init__(self):
        self._socketio = None
        self.correlation_window_seconds = 300  # 5-minute sliding correlation window

    def set_socketio(self, socketio):
        self._socketio = socketio

    def correlate_alert(self, alert: dict, event: dict):
        """
        Groups an alert and its triggering event into an existing active incident,
        or creates a new incident if none match the correlation heuristics.
        """
        source_ip = alert.get("source_ip", "127.0.0.1")
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check for open/investigating incident from this source IP
        cursor.execute("""
        SELECT * FROM incidents 
        WHERE source_ip = ? AND status IN ('OPEN', 'INVESTIGATING', 'CONTAINED')
        ORDER BY last_time DESC LIMIT 1;
        """, (source_ip,))
        row = cursor.fetchone()

        incident = None
        if row:
            # Check if within time window
            last_dt = datetime.fromisoformat(row["last_time"])
            if (now - last_dt).total_seconds() < self.correlation_window_seconds:
                incident = dict(row)

        if incident:
            # Update existing incident
            incident_id = incident["incident_id"]
            new_event_count = incident["event_count"] + 1
            # Severity elevation
            sev_weights = {"INFO": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
            current_sev = incident["severity"]
            new_sev = alert["severity"] if sev_weights.get(alert["severity"], 0) > sev_weights.get(current_sev, 0) else current_sev
            
            # Combine attack type if multi-vector
            types = set(incident["attack_type"].split(" + "))
            types.add(alert["type"])
            combined_type = " + ".join(sorted(types))

            # Determine attack phase
            phase = self._determine_attack_phase(alert["type"], event)

            cursor.execute("""
            UPDATE incidents 
            SET last_time = ?, event_count = ?, severity = ?, attack_type = ?
            WHERE incident_id = ?;
            """, (now_iso, new_event_count, new_sev, combined_type, incident_id))

            # Add to incident_events
            cursor.execute("""
            INSERT INTO incident_events (incident_id, event_id, order_index, attack_phase)
            VALUES (?, ?, ?, ?);
            """, (incident_id, event["event_id"], new_event_count, phase))

            incident["last_time"] = now_iso
            incident["event_count"] = new_event_count
            incident["severity"] = new_sev
            incident["attack_type"] = combined_type
        else:
            # Create a brand new incident
            incident_id = f"INC-{uuid.uuid4().hex[:4].upper()}"
            title = f"Unauthorized Attack Vector: {alert['type']} ({source_ip})"
            attack_type = alert["type"]
            severity = alert["severity"]
            status = "OPEN"
            phase = self._determine_attack_phase(alert["type"], event)

            cursor.execute("""
            INSERT INTO incidents (incident_id, title, attack_type, severity, status, source_ip, start_time, last_time, event_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);
            """, (incident_id, title, attack_type, severity, status, source_ip, now_iso, now_iso))

            cursor.execute("""
            INSERT INTO incident_events (incident_id, event_id, order_index, attack_phase)
            VALUES (?, ?, 1, ?);
            """, (incident_id, event["event_id"], phase))

            incident = {
                "incident_id": incident_id,
                "title": title,
                "attack_type": attack_type,
                "severity": severity,
                "status": status,
                "source_ip": source_ip,
                "start_time": now_iso,
                "last_time": now_iso,
                "event_count": 1
            }

        conn.commit()
        conn.close()

        # Broadcast incident update via WebSocket
        if self._socketio:
            self._socketio.emit("incident_updated", incident)
            print(f"[CorrelationEngine] Incident Updated: {incident['incident_id']} - {incident['title']}")

        return incident

    def attach_event_to_incident(self, incident_id: str, event_id: str, attack_phase: str = "Reconnaissance"):
        """Attaches any telemetry event (including precursor normal events) to an incident."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM incident_events WHERE incident_id = ?;", (incident_id,))
            count = cursor.fetchone()[0]
            cursor.execute("""
            INSERT INTO incident_events (incident_id, event_id, order_index, attack_phase)
            VALUES (?, ?, ?, ?);
            """, (incident_id, event_id, count + 1, attack_phase))
            
            cursor.execute("UPDATE incidents SET event_count = event_count + 1 WHERE incident_id = ?;", (incident_id,))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[CorrelationEngine] Error attaching event to incident: {e}")

    def update_incident_status(self, incident_id: str, new_status: str):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE incidents SET status = ? WHERE incident_id = ?;", (new_status, incident_id))
            conn.commit()
            cursor.execute("SELECT * FROM incidents WHERE incident_id = ?;", (incident_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                incident = dict(row)
                if self._socketio:
                    self._socketio.emit("incident_updated", incident)
                return incident
        except Exception as e:
            print(f"[CorrelationEngine] Error updating incident status: {e}")
        return None

    def get_incident_timeline(self, incident_id: str):
        """
        Reconstructs the complete chronological timeline for an incident.
        Combines event data, detection alerts, payloads, and containment outcomes.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM incidents WHERE incident_id = ?;", (incident_id,))
        incident_row = cursor.fetchone()
        if not incident_row:
            conn.close()
            return None

        incident = dict(incident_row)

        cursor.execute("""
        SELECT ie.order_index, ie.attack_phase,
               e.event_id, e.timestamp, e.source_ip, e.method, e.path, e.event_type, 
               e.severity, e.status, e.user, e.description, e.request_id, e.payload,
               a.alert_id, a.type AS alert_type, a.confidence, a.reason AS alert_reason, a.recommended_action
        FROM incident_events ie
        JOIN events e ON ie.event_id = e.event_id
        LEFT JOIN alerts a ON e.event_id = a.event_id
        WHERE ie.incident_id = ?
        ORDER BY ie.order_index ASC, e.timestamp ASC;
        """, (incident_id,))

        rows = cursor.fetchall()
        conn.close()

        timeline = []
        for r in rows:
            item = dict(r)
            if item.get("payload"):
                try:
                    item["payload"] = json.loads(item["payload"])
                except Exception:
                    pass
            timeline.append(item)

        incident["timeline"] = timeline
        return incident

    def get_all_incidents(self, limit: int = 50):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incidents ORDER BY last_time DESC LIMIT ?;", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def _determine_attack_phase(self, alert_type: str, event: dict):
        if alert_type == "BRUTE_FORCE":
            return "Reconnaissance / Credential Access"
        elif alert_type == "SQL_INJECTION":
            return "Active Exploitation (SQLi Authentication Bypass)"
        elif alert_type == "IDOR":
            return "Privilege Escalation & Unauthorized Data Exfiltration"
        elif alert_type == "STORED_XSS":
            return "Client-Side Code Execution Injection"
        elif event.get("event_type") == "CONTAINMENT_ENFORCED":
            return "Automated Threat Containment"
        return "Tactical Action"

correlation_engine = CorrelationEngine()
