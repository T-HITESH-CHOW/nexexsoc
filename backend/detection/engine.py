import uuid
from datetime import datetime, timezone
from database.db import get_db_connection
from detection.rules import (
    evaluate_sqli,
    evaluate_idor,
    evaluate_xss,
    evaluate_brute_force
)
from containment.engine import containment_engine
from config import AUTO_CONTAIN_CRITICAL_COUNT

class DetectionEngine:
    def __init__(self):
        self._socketio = None
        self._correlation_engine = None

    def set_dependencies(self, socketio, correlation_engine):
        self._socketio = socketio
        self._correlation_engine = correlation_engine

    def analyze_event(self, event: dict):
        """
        Analyzes an ingested telemetry event against detection rules.
        Generates alerts, triggers correlation, and applies containment if threshold is crossed.
        Returns the created alert dict (or None if no alert triggered).
        """
        path = event.get("path", "")
        method = event.get("method", "GET")
        source_ip = event.get("source_ip", "127.0.0.1")
        payload = event.get("payload") or {}
        user = event.get("user")

        payload_str = ""
        if isinstance(payload, dict):
            # Combine all string values in payload
            payload_str = " ".join([str(v) for v in payload.values()])
        elif isinstance(payload, str):
            payload_str = payload

        alert = None

        # 1. SQL Injection Rule check
        is_sqli, sqli_sev, sqli_conf, sqli_reason, sqli_act = evaluate_sqli(payload_str, path, source_ip)
        if is_sqli:
            alert = self._create_alert(
                alert_type="SQL_INJECTION",
                severity=sqli_sev,
                confidence=sqli_conf,
                reason=sqli_reason,
                event=event,
                recommended_action=sqli_act
            )

        # 2. IDOR Rule check
        elif "/vulnerable/profile" in path:
            requested_id = payload.get("requested_id")
            session_id = payload.get("session_user_id") or user
            is_idor, idor_sev, idor_conf, idor_reason, idor_act = evaluate_idor(session_id, requested_id, source_ip)
            if is_idor:
                alert = self._create_alert(
                    alert_type="IDOR",
                    severity=idor_sev,
                    confidence=idor_conf,
                    reason=idor_reason,
                    event=event,
                    recommended_action=idor_act
                )

        # 3. Stored XSS Rule check
        elif "/vulnerable/comments" in path or "comment" in payload_str.lower():
            is_xss, xss_sev, xss_conf, xss_reason, xss_act = evaluate_xss(payload_str, path, source_ip)
            if is_xss:
                alert = self._create_alert(
                    alert_type="STORED_XSS",
                    severity=xss_sev,
                    confidence=xss_conf,
                    reason=xss_reason,
                    event=event,
                    recommended_action=xss_act
                )

        # 4. Brute Force Rule check
        if "/vulnerable/login" in path and event.get("status") in ["FAILED", "DETECTED"]:
            is_bf, bf_sev, bf_conf, bf_reason, bf_act = evaluate_brute_force(source_ip, success=False)
            if is_bf and not alert:
                alert = self._create_alert(
                    alert_type="BRUTE_FORCE",
                    severity=bf_sev,
                    confidence=bf_conf,
                    reason=bf_reason,
                    event=event,
                    recommended_action=bf_act
                )

        # If alert was generated, process it
        if alert:
            self._save_and_broadcast_alert(alert, event)

            # Check for incident correlation
            if self._correlation_engine:
                incident = self._correlation_engine.correlate_alert(alert, event)
                if incident:
                    alert["incident_id"] = incident["incident_id"]

            # Containment check: If CRITICAL or confirmed exploit attack, auto-contain
            if alert["severity"] == "CRITICAL" or alert.get("recommended_action") == "TEMPORARILY_BLOCK_SOURCE":
                containment_engine.contain_source(
                    ip=source_ip,
                    reason=f"Automated threat response: {alert['type']} detected ({alert['reason']})",
                    duration_seconds=60,
                    incident_id=alert.get("incident_id")
                )

        return alert

    def _create_alert(self, alert_type: str, severity: str, confidence: float, reason: str, event: dict, recommended_action: str):
        now = datetime.now(timezone.utc).isoformat()
        alert_id = f"ALT-{uuid.uuid4().hex[:6].upper()}"
        return {
            "alert_id": alert_id,
            "type": alert_type,
            "severity": severity,
            "confidence": round(confidence, 2),
            "reason": reason,
            "event_id": event.get("event_id"),
            "recommended_action": recommended_action,
            "source_ip": event.get("source_ip"),
            "endpoint": event.get("path"),
            "timestamp": now
        }

    def _save_and_broadcast_alert(self, alert: dict, event: dict):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO alerts (alert_id, type, severity, confidence, reason, event_id, recommended_action, source_ip, endpoint, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                alert["alert_id"],
                alert["type"],
                alert["severity"],
                alert["confidence"],
                alert["reason"],
                alert["event_id"],
                alert["recommended_action"],
                alert["source_ip"],
                alert["endpoint"],
                alert["timestamp"]
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[DetectionEngine] Error saving alert to DB: {e}")

        # Broadcast via WebSocket
        if self._socketio:
            self._socketio.emit("new_alert", alert)
            print(f"[DetectionEngine] Alert Broadcast: {alert['alert_id']} - {alert['type']} [{alert['severity']}]")

detection_engine = DetectionEngine()
