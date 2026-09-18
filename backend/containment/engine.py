import time
import uuid
from datetime import datetime, timezone, timedelta
from database.db import get_db_connection
from config import CONTAINMENT_DURATION_SECONDS

class ContainmentEngine:
    """
    Application-level safe threat containment engine.
    Maintains a simulated blocklist in memory and SQLite.
    Does NOT modify operating system firewalls or external networks.
    """
    def __init__(self):
        self.blocked_sources = {}  # ip -> { expires_at, reason, action_id, incident_id }
        self._socketio = None

    def set_socketio(self, socketio):
        self._socketio = socketio

    def is_source_blocked(self, ip: str):
        """Checks if an IP is currently blocked, cleaning up expired entries."""
        now = datetime.now(timezone.utc)
        if ip in self.blocked_sources:
            entry = self.blocked_sources[ip]
            if now < entry["expires_at"]:
                remaining_seconds = int((entry["expires_at"] - now).total_seconds())
                return True, {
                    "ip": ip,
                    "reason": entry["reason"],
                    "action_id": entry["action_id"],
                    "remaining_seconds": remaining_seconds,
                    "expires_at": entry["expires_at"].isoformat()
                }
            else:
                # Expired
                self.unblock_source(ip, reason="Automatic expiration of containment window")
        return False, None

    def contain_source(self, ip: str, reason: str, duration_seconds: int = CONTAINMENT_DURATION_SECONDS, incident_id: str = None):
        """Places a source IP on the application-level temporary containment blocklist."""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=duration_seconds)
        action_id = f"ACT-{uuid.uuid4().hex[:6].upper()}"

        self.blocked_sources[ip] = {
            "expires_at": expires_at,
            "reason": reason,
            "action_id": action_id,
            "incident_id": incident_id
        }

        # Record action in SQLite
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO containment_actions 
            (action_id, source_ip, reason, action_type, duration_seconds, status, timestamp, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                action_id,
                ip,
                reason,
                "TEMPORARY_APPLICATION_BLOCK",
                duration_seconds,
                "ACTIVE",
                now.isoformat(),
                expires_at.isoformat()
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[ContainmentEngine] Error recording action in DB: {e}")

        containment_data = {
            "action_id": action_id,
            "source_ip": ip,
            "reason": reason,
            "action_type": "TEMPORARY_APPLICATION_BLOCK",
            "duration_seconds": duration_seconds,
            "status": "ACTIVE",
            "timestamp": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "incident_id": incident_id
        }

        # Broadcast via WebSocket
        if self._socketio:
            self._socketio.emit("threat_contained", containment_data)

        print(f"[ContainmentEngine] CONTAINED {ip} for {duration_seconds}s. Reason: {reason}")
        return containment_data

    def unblock_source(self, ip: str, reason: str = "Manual SOC Analyst Release"):
        """Removes a source IP from the containment blocklist."""
        entry = self.blocked_sources.pop(ip, None)
        now = datetime.now(timezone.utc).isoformat()

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE containment_actions
            SET status = 'RELEASED'
            WHERE source_ip = ? AND status = 'ACTIVE';
            """, (ip,))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[ContainmentEngine] Error updating action in DB: {e}")

        payload = {
            "source_ip": ip,
            "status": "RELEASED",
            "timestamp": now,
            "reason": reason
        }

        if self._socketio:
            self._socketio.emit("threat_unblocked", payload)

        print(f"[ContainmentEngine] RELEASED {ip}. Reason: {reason}")
        return payload

    def get_active_containments(self):
        """Returns list of currently active blocked sources."""
        now = datetime.now(timezone.utc)
        active = []
        for ip, entry in list(self.blocked_sources.items()):
            if now < entry["expires_at"]:
                remaining = int((entry["expires_at"] - now).total_seconds())
                active.append({
                    "action_id": entry["action_id"],
                    "source_ip": ip,
                    "reason": entry["reason"],
                    "remaining_seconds": remaining,
                    "expires_at": entry["expires_at"].isoformat()
                })
            else:
                self.unblock_source(ip, "Expired")
        return active

    def get_all_actions(self, limit: int = 50):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM containment_actions ORDER BY timestamp DESC LIMIT ?;", (limit,))
            rows = cursor.fetchall()
            conn.close()
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"[ContainmentEngine] Error fetching actions: {e}")
            return []

containment_engine = ContainmentEngine()
