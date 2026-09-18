import unittest
import sys
import json
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import app, socketio
from database.db import init_db, get_db_connection
from containment.engine import containment_engine
from correlation.engine import correlation_engine
from simulator.stress_test import execute_stress_test

class TestSentinelXPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db(force_reseed=True)
        cls.client = app.test_client()

    def setUp(self):
        # Clear containment between test cases
        containment_engine.blocked_sources.clear()

    def test_01_seed_users(self):
        """Verify dummy training users exist with expected security roles."""
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, username, role, balance FROM users ORDER BY id ASC;")
        users = cur.fetchall()
        conn.close()

        self.assertEqual(len(users), 3)
        self.assertEqual(users[0]["id"], 101)
        self.assertEqual(users[0]["username"], "alice")
        self.assertEqual(users[1]["id"], 102)
        self.assertEqual(users[1]["username"], "bob")
        self.assertEqual(users[2]["id"], 103)
        self.assertEqual(users[2]["username"], "admin")

    def test_02_sqli_legitimate_vs_bypass(self):
        """Test SQL injection vulnerable login with legitimate and malicious payloads."""
        # 1. Normal login
        res_norm = self.client.post("/vulnerable/login", json={
            "username": "alice",
            "password": "password123"
        })
        self.assertEqual(res_norm.status_code, 200)
        norm_data = res_norm.get_json()
        self.assertEqual(norm_data["user"]["username"], "alice")

        # 2. SQLi Authentication Bypass
        res_sqli = self.client.post("/vulnerable/login", json={
            "username": "admin' OR '1'='1' --",
            "password": "wrong_password"
        })
        self.assertEqual(res_sqli.status_code, 200)
        sqli_data = res_sqli.get_json()
        self.assertEqual(sqli_data["flag"], "SQLI_BYPASS_SUCCESS")

        # Verify alert generated in DB
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM alerts WHERE type = 'SQL_INJECTION' AND severity = 'CRITICAL';")
        alert = cur.fetchone()
        conn.close()
        self.assertIsNotNone(alert)
        self.assertIn("SQL", alert["reason"])

    def test_03_idor_detection(self):
        """Test IDOR vulnerable profile endpoint cross-tenant access detection."""
        # Legitimate access to own profile (User 101)
        res_self = self.client.get("/vulnerable/profile/101", headers={"X-Session-User-Id": "101"})
        self.assertEqual(res_self.status_code, 200)

        # Unauthorized access to CFO Bob's profile (User 102)
        res_idor = self.client.get("/vulnerable/profile/102", headers={"X-Session-User-Id": "101"})
        self.assertEqual(res_idor.status_code, 200)
        idor_data = res_idor.get_json()
        self.assertEqual(idor_data["profile"]["username"], "bob")
        self.assertIn("CONFIDENTIAL", idor_data["profile"]["secret_note"])

        # Verify IDOR alert generated
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM alerts WHERE type = 'IDOR' ORDER BY timestamp DESC LIMIT 1;")
        alert = cur.fetchone()
        conn.close()
        self.assertIsNotNone(alert)
        self.assertEqual(alert["severity"], "HIGH")

    def test_04_stored_xss_detection(self):
        """Test Stored XSS comment submission and detection."""
        xss_payload = "<script>alert('SENTINEL-X-PWNED')</script>"
        res_xss = self.client.post("/vulnerable/comments", json={
            "author": "Attacker",
            "content": xss_payload
        })
        self.assertEqual(res_xss.status_code, 201)

        # Verify alert in DB
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM alerts WHERE type = 'STORED_XSS';")
        alert = cur.fetchone()
        conn.close()
        self.assertIsNotNone(alert)
        self.assertIn("XSS", alert["reason"])

    def test_05_incident_correlation_and_timeline(self):
        """Verify correlation groups multiple alerts into an incident with ordered timeline."""
        incidents = correlation_engine.get_all_incidents()
        self.assertGreater(len(incidents), 0)

        first_inc = incidents[0]
        timeline_data = correlation_engine.get_incident_timeline(first_inc["incident_id"])
        self.assertIsNotNone(timeline_data)
        self.assertIn("timeline", timeline_data)
        self.assertGreater(len(timeline_data["timeline"]), 0)

        # Check chronological order
        events = timeline_data["timeline"]
        for i in range(len(events) - 1):
            self.assertLessEqual(events[i]["order_index"], events[i+1]["order_index"])

    def test_06_containment_enforcement(self):
        """Test simulated application-level containment blocklist."""
        test_ip = "192.168.99.99"
        containment_engine.contain_source(test_ip, "Unit test simulated containment", duration_seconds=60)

        # Blocked IP attempting to access vulnerable endpoint
        res = self.client.get("/vulnerable/profile/101", environ_base={"REMOTE_ADDR": test_ip})
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertEqual(data["error"], "THREAT_CONTAINED")

        # Unblock and re-test
        containment_engine.unblock_source(test_ip)
        res_unblocked = self.client.get("/vulnerable/profile/101", environ_base={"REMOTE_ADDR": test_ip})
        self.assertEqual(res_unblocked.status_code, 200)

    def test_07_stress_test_metrics(self):
        """Verify multi-threaded local stress testing returns actual measured metrics."""
        result = execute_stress_test(total_requests=25, concurrency=3)
        self.assertEqual(result["events_generated"], 25)
        self.assertEqual(result["events_ingested"], 25)
        self.assertGreater(result["throughput_events_per_second"], 0.0)
        self.assertGreater(result["avg_detection_latency_ms"], 0.0)

    def test_08_ai_analyst_pipeline(self):
        """Verify AI Security Analyst generates structured incident briefs, chat replies, and event explanations."""
        # 1. Test chat endpoint
        res_chat = self.client.post("/api/ai/chat", json={"message": "What is the current threat posture?"})
        self.assertEqual(res_chat.status_code, 200)
        chat_data = res_chat.get_json()
        self.assertEqual(chat_data["status"], "success")
        self.assertIn("SOC Operations Status", chat_data["reply"])

        # 2. Test incident analysis endpoint with existing incident
        incidents = correlation_engine.get_all_incidents()
        if incidents:
            inc_id = incidents[0]["incident_id"]
            res_analysis = self.client.post("/api/ai/analyze-incident", json={"incident_id": inc_id})
            self.assertEqual(res_analysis.status_code, 200)
            analysis_data = res_analysis.get_json()
            self.assertEqual(analysis_data["status"], "success")
            self.assertIn("executive_summary", analysis_data)
            self.assertIn("mitre_attack", analysis_data)
            self.assertIn("remediation_plan", analysis_data)

        # 3. Test explain event endpoint
        res_explain = self.client.post("/api/ai/explain-event", json={
            "event": {
                "event_id": "EVT-TEST",
                "event_type": "SQL_INJECTION",
                "severity": "CRITICAL",
                "payload": {"username": "admin' OR '1'='1' --"}
            }
        })
        self.assertEqual(res_explain.status_code, 200)
        explain_data = res_explain.get_json()
        self.assertEqual(explain_data["status"], "success")
        self.assertIn("Adversary injected", explain_data["explanation"])

if __name__ == "__main__":
    unittest.main()

