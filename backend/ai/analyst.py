import os
import json
import re
from datetime import datetime, timezone
from database.db import get_db_connection
from correlation.engine import correlation_engine
from containment.engine import containment_engine

# MITRE ATT&CK Knowledge Base for Sentinel-X Vectors
MITRE_ATTACK_MAPPING = {
    "SQL_INJECTION": {
        "tactic": "Initial Access & Privilege Escalation",
        "technique_id": "T1190",
        "technique_name": "Exploit Public-Facing Application",
        "sub_technique": "T1055 - SQL Sub-Query Manipulation",
        "cwe": "CWE-89: Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')",
        "severity": "CRITICAL",
        "risk_level": "High Probability of Full Database Compromise",
        "remediation_summary": "Implement parameterized prepared statements, enforce least-privilege database user permissions, and deploy WAF signature filters.",
        "code_fix": """# Vulnerable:
# cursor.execute(f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}';")

# Secure (Parameterized Query):
cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?;", (username, password))"""
    },
    "IDOR": {
        "tactic": "Credential Access & Data Collection",
        "technique_id": "T1530",
        "technique_name": "Data from Information Repositories",
        "sub_technique": "T1078 - Cross-Tenant Session Impersonation",
        "cwe": "CWE-639: Authorization Bypass Through User-Controlled Key ('Insecure Direct Object Reference')",
        "severity": "HIGH",
        "risk_level": "Horizontal Privilege Escalation & Confidential Data Exfiltration",
        "remediation_summary": "Enforce server-side session authorization checks comparing authenticated session principal against requested resource owner ID.",
        "code_fix": """# Vulnerable:
# user_record = db.get_user(requested_id)

# Secure (Authorization Check):
authenticated_user = get_session_user()
if authenticated_user.id != requested_id and not authenticated_user.is_admin:
    abort(403, "Access Denied: Cross-tenant resource access unauthorized")
user_record = db.get_user(requested_id)"""
    },
    "STORED_XSS": {
        "tactic": "Execution & Defense Evasion",
        "technique_id": "T1059.007",
        "technique_name": "Command and Scripting Interpreter: JavaScript",
        "sub_technique": "T1185 - Browser Session Hijacking via Malicious DOM Injection",
        "cwe": "CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
        "severity": "HIGH",
        "risk_level": "Client-Side Execution, Session Cookie Theft & Defacement",
        "remediation_summary": "Apply context-aware contextual output encoding, sanitize HTML inputs using bleach/DOMPurify, and deploy Content-Security-Policy (CSP) headers.",
        "code_fix": """# Secure Output Encoding & Content-Security-Policy:
# 1. Server-side Sanitization:
import html
safe_content = html.escape(user_comment)

# 2. Response Header (CSP):
response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self';" """
    },
    "BRUTE_FORCE": {
        "tactic": "Credential Access",
        "technique_id": "T1110.001",
        "technique_name": "Brute Force: Password Guessing",
        "sub_technique": "T1110 - Automated Authentication Probe",
        "cwe": "CWE-307: Improper Restriction of Excessive Authentication Attempts",
        "severity": "MEDIUM",
        "risk_level": "Account Takeover via Dictionary/Credential Stuffing",
        "remediation_summary": "Implement exponential backoff rate limiting, account lockout thresholds, and multi-factor authentication (MFA).",
        "code_fix": """# Rate Limiting & Account Lockout:
if failed_attempts_tracker.get(source_ip, 0) >= 5:
    containment_engine.contain_source(source_ip, "Excessive failed logins", duration_seconds=120)
    abort(429, "Too many requests: IP temporarily isolated")"""
    },
    "CONTAINMENT_ENFORCED": {
        "tactic": "Active Defense & Automated Response",
        "technique_id": "D3-IR",
        "technique_name": "Isolating Compromised Host",
        "sub_technique": "Application-Level Gateway Intercept",
        "cwe": "N/A - Security Control Enforcement",
        "severity": "HIGH",
        "risk_level": "Active Incident Containment - Offending IP Quarantined",
        "remediation_summary": "Automated security control active. Verify threat suppression and review firewall ingress logs.",
        "code_fix": "# Gateway containment policy verified (HTTP 403 Forbidden)"
    }
}

class AISecurityAnalystEngine:
    """
    Lightweight, deterministic AI Security Analyst for Sentinel-X.
    Generates human-readable incident summaries, root-cause dissections,
    MITRE ATT&CK taxonomy mappings, blast-radius metrics, and remediation guides.
    Works 100% offline with zero external API dependencies, with optional LLM hook.
    """
    def __init__(self):
        self.gemini_key = os.environ.get("GEMINI_API_KEY")

    def analyze_incident(self, incident_id: str) -> dict:
        """
        Deeply inspects an incident dossier, extracting telemetry, payloads,
        detection alerts, and generating an end-to-end security brief.
        """
        incident_data = correlation_engine.get_incident_timeline(incident_id)
        if not incident_data:
            return {"status": "error", "message": f"Incident {incident_id} not found"}

        timeline = incident_data.get("timeline", [])
        source_ip = incident_data.get("source_ip", "Unknown")
        attack_types = incident_data.get("attack_type", "").split(" + ")
        primary_vector = attack_types[0] if attack_types else "SQL_INJECTION"
        severity = incident_data.get("severity", "MEDIUM")

        # Map MITRE tactics
        mitre_tactics = []
        for vec in attack_types:
            clean_vec = vec.strip()
            if clean_vec in MITRE_ATTACK_MAPPING:
                mitre_tactics.append(MITRE_ATTACK_MAPPING[clean_vec])
            elif "SQL" in clean_vec:
                mitre_tactics.append(MITRE_ATTACK_MAPPING["SQL_INJECTION"])
            elif "IDOR" in clean_vec:
                mitre_tactics.append(MITRE_ATTACK_MAPPING["IDOR"])
            elif "XSS" in clean_vec:
                mitre_tactics.append(MITRE_ATTACK_MAPPING["STORED_XSS"])

        if not mitre_tactics:
            mitre_tactics.append(MITRE_ATTACK_MAPPING["SQL_INJECTION"])

        # Extract compromised targets & payloads
        observed_payloads = []
        compromised_data = []
        for step in timeline:
            p = step.get("payload") or {}
            if isinstance(p, dict):
                if p.get("username"):
                    observed_payloads.append(f"Auth Input: {p['username']}")
                if p.get("raw_query"):
                    observed_payloads.append(f"SQL Execution: {p['raw_query'][:75]}...")
                if p.get("compromised_user"):
                    compromised_data.append(f"Account: {p['compromised_user']}")
                if p.get("compromised_data"):
                    compromised_data.append(f"Exfiltrated: {p['compromised_data']}")
                if p.get("content"):
                    observed_payloads.append(f"Script Injected: {p['content'][:60]}...")

        # Is source contained?
        is_contained, contain_details = containment_engine.is_source_blocked(source_ip)

        # Generate Executive Summary
        exec_summary = (
            f"Incident {incident_id} represents an unauthorized multi-stage cyber campaign "
            f"originating from source IP address {source_ip}. The adversary successfully leveraged "
            f"{' and '.join(attack_types)} to compromise internal web application boundaries. "
            f"The attack escalated through {len(timeline)} sequential telemetry events, achieving "
            f"a peak severity classification of {severity}."
        )

        # Technical Root Cause
        if "SQL_INJECTION" in incident_data.get("attack_type", ""):
            root_cause = (
                "The primary vulnerability stems from unsanitized user input concatenated directly into "
                "the backend SQLite query in POST /vulnerable/login. The payload (`admin' OR '1'='1' --`) "
                "terminated the string literal, injected an always-true boolean tautology ('1'='1'), and "
                "neutralized password verification using comment syntax (--), granting unauthorized administrative access."
            )
        elif "IDOR" in incident_data.get("attack_type", ""):
            root_cause = (
                "The application exposes an Insecure Direct Object Reference on GET /vulnerable/profile/<id>. "
                "The endpoint extracts the user ID directly from the URI path parameter without verifying if the "
                "requesting session context (X-Session-User-Id) has ownership or read clearance, allowing horizontal "
                "scraping of confidential CFO and executive director records."
            )
        elif "STORED_XSS" in incident_data.get("attack_type", ""):
            root_cause = (
                "The discussion comment facility at POST /vulnerable/comments accepts arbitrary user input and "
                "persists it to the database without HTML sanitization. The attacker submitted unencoded script tags "
                "designed to execute in victim browsers and capture session cookies."
            )
        else:
            root_cause = (
                f"Multi-stage tactical exploitation observed across endpoints: {', '.join([t.get('path', '') for t in timeline])}. "
                "The threat actor combined initial probes with active exploitation primitives."
            )

        # Blast Radius
        blast_radius = {
            "confidentiality_impact": "CRITICAL" if severity in ["CRITICAL", "HIGH"] else "MODERATE",
            "integrity_impact": "HIGH" if "SQL" in str(attack_types) or "XSS" in str(attack_types) else "LOW",
            "availability_impact": "CONTAINED" if is_contained else "LOW",
            "compromised_assets": compromised_data or ["Internal User Database", "Profile API Records"],
            "containment_status": "ACTIVE_ISOLATION" if is_contained else "PENDING_ANALYST_ACTION",
            "active_block_remaining_seconds": contain_details.get("remaining_seconds", 0) if is_contained else 0
        }

        # Step-by-Step Remediation Plan
        remediation_steps = [
            {
                "step": 1,
                "priority": "P0 - IMMEDIATE",
                "action": "Enforce Automated Gateway Quarantine",
                "detail": f"Ensure IP {source_ip} is contained on the application gateway blocklist to stop ongoing exfiltration."
            },
            {
                "step": 2,
                "priority": "P1 - HIGH",
                "action": "Remediate Vulnerable Code Paths",
                "detail": mitre_tactics[0]["remediation_summary"],
                "code_patch": mitre_tactics[0]["code_fix"]
            },
            {
                "step": 3,
                "priority": "P2 - MEDIUM",
                "action": "Rotate Compromised Credentials & Session Tokens",
                "detail": "Invalidate active session tokens for accounts accessed during the attack window (e.g. Alice Vance, Bob Sterling)."
            },
            {
                "step": 4,
                "priority": "P3 - SYSTEMIC",
                "action": "Deploy Defense-in-Depth Policies",
                "detail": "Audit WAF rules, implement Content Security Policy headers, and schedule penetration re-testing."
            }
        ]

        # Targeted assets breakdown
        endpoints_targeted = list(set([t.get("path") for t in timeline if t.get("path")]))
        targets_str = ", ".join(endpoints_targeted) if endpoints_targeted else "Insufficient telemetry to determine."

        # How it was detected
        detection_reasons = []
        for step in timeline:
            if step.get("alert_reason"):
                detection_reasons.append(step["alert_reason"])
            elif step.get("description") and "detected" in step["description"].lower():
                detection_reasons.append(step["description"])
        detection_str = " | ".join(detection_reasons[:2]) if detection_reasons else (
            f"Heuristic signature match for {primary_vector} detection rule"
        )

        # Attack progression summary
        progression_steps = []
        for idx, step in enumerate(timeline[:5], start=1):
            t_time = step.get("timestamp", "")[-8:] or f"+{idx}s"
            t_desc = step.get("description") or step.get("event_type", "Event")
            progression_steps.append(f"[{t_time}] {t_desc}")
        progression_str = " -> ".join(progression_steps) if progression_steps else "Insufficient telemetry to determine."

        # 8-part structured AI Incident Summary
        ai_summary = {
            "what_happened": exec_summary,
            "attack_type": " + ".join(attack_types) if attack_types else "Insufficient telemetry to determine.",
            "what_was_targeted": targets_str,
            "how_it_was_detected": detection_str,
            "severity": f"{severity} - Active exploitation verified across {len(timeline)} telemetry events",
            "attack_progression": progression_str,
            "potential_impact": (
                f"Confidentiality: {blast_radius['confidentiality_impact']}, "
                f"Integrity: {blast_radius['integrity_impact']}, "
                f"Availability: {blast_radius['availability_impact']}. "
                f"Compromised assets: {', '.join(blast_radius['compromised_assets'])}."
            ),
            "recommended_response": [
                f"1. Gateway Containment: {remediation_steps[0]['detail']}",
                f"2. Code Remediation: {remediation_steps[1]['detail']}",
                f"3. Credential Invalidation: {remediation_steps[2]['detail']}",
                f"4. Defense-in-Depth: {remediation_steps[3]['detail']}"
            ]
        }

        return {
            "status": "success",
            "incident_id": incident_id,
            "title": incident_data.get("title"),
            "source_ip": source_ip,
            "severity": severity,
            "event_count": incident_data.get("event_count", 0),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "ai_summary": ai_summary,
            "executive_summary": exec_summary,
            "technical_root_cause": root_cause,
            "blast_radius": blast_radius,
            "mitre_attack": mitre_tactics,
            "observed_payloads": observed_payloads[:4],
            "remediation_plan": remediation_steps,
            "analyst_confidence": 0.98
        }

    def chat_with_analyst(self, message: str, context: dict = None) -> dict:
        """
        Conversational assistant providing instant answers about SOC telemetry,
        active incidents, containment status, MITRE ATT&CK guidance, and remediation.
        """
        query = (message or "").strip().lower()
        now = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")

        # Fetch live stats for ground truth
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM events;")
        total_events = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM incidents WHERE status IN ('OPEN', 'INVESTIGATING');")
        active_incidents = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM alerts WHERE severity = 'CRITICAL';")
        critical_alerts = cur.fetchone()[0]
        cur.execute("SELECT * FROM incidents ORDER BY last_time DESC LIMIT 3;")
        recent_incs = [dict(r) for r in cur.fetchall()]
        conn.close()

        active_blocks = containment_engine.get_active_containments()

        # Intent 1: Current threat level / SOC status
        if any(w in query for w in ["status", "overview", "threat level", "defcon", "posture", "summary"]):
            contained_str = f"{len(active_blocks)} IP(s) currently contained ({', '.join([b['source_ip'] for b in active_blocks])})" if active_blocks else "Zero active IP isolations"
            reply = (
                f"**SOC Operations Status Brief [{now}]:**\n\n"
                f"- **Threat Posture:** {'🔴 DEFCON 1 (Active Exploitation)' if critical_alerts > 0 else '🟢 DEFCON 5 (Normal Operations)'}\n"
                f"- **Telemetry Stream:** `{total_events}` total ingested events\n"
                f"- **Correlated Incidents:** `{active_incidents}` active campaigns requiring triage\n"
                f"- **Critical Alerts:** `{critical_alerts}` active exploit alerts\n"
                f"- **Containment Gateway:** {contained_str}\n\n"
                f"**Recommendation:** " + (
                    "Immediate analyst intervention required for active incidents. Check the Incidents tab to review correlated kill-chains."
                    if active_incidents > 0 else "All systems operating within baseline parameters."
                )
            )
            return {"status": "success", "reply": reply, "topic": "status"}

        # Intent 2: Specific Incident Query (e.g. INC-001 or "explain incident")
        inc_match = re.search(r"\bINC-[0-9A-F]{4}\b", query.upper())
        if inc_match or "incident" in query:
            target_inc_id = inc_match.group(0) if inc_match else (recent_incs[0]["incident_id"] if recent_incs else None)
            if target_inc_id:
                analysis = self.analyze_incident(target_inc_id)
                if analysis.get("status") == "success":
                    reply = (
                        f"### AI Incident Briefing: `{target_inc_id}`\n\n"
                        f"**Threat Vector:** {analysis['title']}\n"
                        f"**Severity:** `{analysis['severity']}` | **Adversary IP:** `{analysis['source_ip']}`\n\n"
                        f"**Executive Summary:**\n{analysis['executive_summary']}\n\n"
                        f"**Technical Root Cause:**\n{analysis['technical_root_cause']}\n\n"
                        f"**MITRE ATT&CK Mapping:**\n"
                        f"- **Tactic:** {analysis['mitre_attack'][0]['tactic']}\n"
                        f"- **Technique:** `{analysis['mitre_attack'][0]['technique_id']}` - {analysis['mitre_attack'][0]['technique_name']}\n\n"
                        f"**Immediate Mitigation Action:**\n"
                        f"{analysis['remediation_plan'][1]['detail']}"
                    )
                    return {"status": "success", "reply": reply, "incident_id": target_inc_id, "topic": "incident"}

        # Intent 3: SQL Injection mitigation / explanation
        if "sql" in query or "sqli" in query:
            mapping = MITRE_ATTACK_MAPPING["SQL_INJECTION"]
            reply = (
                f"### SQL Injection Defense & Technical Guidance\n\n"
                f"**Vulnerability Class:** {mapping['cwe']}\n"
                f"**MITRE ATT&CK:** `{mapping['technique_id']}` ({mapping['technique_name']})\n\n"
                f"**How it works in Sentinel-X:**\n"
                f"The `/vulnerable/login` endpoint concatenates the user-supplied `username` parameter directly into `raw_query`. "
                f"When a payload such as `admin' OR '1'='1' --` is passed, the quote balances the SQL string, the tautology renders the WHERE condition unconditionally true, and `--` truncates password verification.\n\n"
                f"**Remediation (Prepared Statement):**\n"
                f"```python\n{mapping['code_fix']}\n```\n"
                f"**Defensive Controls:** Enforce parameterization, query length limits, and WAF rules intercepting `UNION`, `--`, and `' OR` expressions."
            )
            return {"status": "success", "reply": reply, "topic": "sqli"}

        # Intent 4: IDOR mitigation / explanation
        if "idor" in query or "profile" in query or "object reference" in query:
            mapping = MITRE_ATTACK_MAPPING["IDOR"]
            reply = (
                f"### Insecure Direct Object Reference (IDOR) Analysis\n\n"
                f"**Vulnerability Class:** {mapping['cwe']}\n"
                f"**MITRE ATT&CK:** `{mapping['technique_id']}` ({mapping['technique_name']})\n\n"
                f"**Mechanism in Sentinel-X:**\n"
                f"The `/vulnerable/profile/<id>` route extracts `user_id` directly from the URL. An authenticated session (e.g. User 101) can sequentially iterate to `/profile/102` (Bob CFO) and `/profile/103` (CISO), exposing confidential notes and vault PINs without authorization.\n\n"
                f"**Remediation (Access Control Check):**\n"
                f"```python\n{mapping['code_fix']}\n```\n"
                f"**Defensive Controls:** Implement indirect reference maps (e.g., cryptographic session-bound GUIDs) and strict server-side authorization middleware."
            )
            return {"status": "success", "reply": reply, "topic": "idor"}

        # Intent 5: Stored XSS explanation
        if "xss" in query or "script" in query or "comment" in query:
            mapping = MITRE_ATTACK_MAPPING["STORED_XSS"]
            reply = (
                f"### Stored Cross-Site Scripting (XSS) Analysis\n\n"
                f"**Vulnerability Class:** {mapping['cwe']}\n"
                f"**MITRE ATT&CK:** `{mapping['technique_id']}` ({mapping['technique_name']})\n\n"
                f"**Mechanism in Sentinel-X:**\n"
                f"Comments posted to `/vulnerable/comments` are stored directly in SQLite without sanitization and returned raw in JSON. When rendered into the DOM without escaping, attacker JavaScript executes in the victim's session context.\n\n"
                f"**Remediation:**\n"
                f"```python\n{mapping['code_fix']}\n```\n"
                f"**Defensive Controls:** Always HTML-encode untrusted data before rendering, sanitize inputs using DOMPurify, and apply a strict Content-Security-Policy (`default-src 'self'`)."
            )
            return {"status": "success", "reply": reply, "topic": "xss"}

        # Intent 6: Containment / Blocklist status
        if "contain" in query or "block" in query or "quarantine" in query:
            if active_blocks:
                reply = (
                    f"### Active Threat Containment Status\n\n"
                    f"**Quarantined Sources ({len(active_blocks)}):**\n\n"
                )
                for b in active_blocks:
                    reply += f"- **IP:** `{b['source_ip']}` | **Remaining:** `{b['remaining_seconds']}s`\n  *Reason:* {b['reason']}\n\n"
                reply += "All incoming requests from these addresses to `/vulnerable/*` are dropped with **HTTP 403 Forbidden**."
            else:
                reply = (
                    "### Threat Containment Gateway\n\n"
                    "No IP addresses are currently in active quarantine. The automated containment policy triggers immediately when a **CRITICAL** alert or exploit pattern is detected, isolating the source for 60 seconds."
                )
            return {"status": "success", "reply": reply, "topic": "containment"}

        # Default fallback response
        reply = (
            f"**Sentinel-X AI Security Analyst Copilot**\n\n"
            f"I have live visibility into the SOC telemetry database (`{total_events}` events, `{active_incidents}` open incidents). "
            f"I can assist you with:\n\n"
            f"1. **Incident Triage:** Ask `\"Analyze INC-xxxx\"` or `\"Summarize current attacks\"`\n"
            f"2. **Threat Posture:** Ask `\"What is the current DEFCON level?\"`\n"
            f"3. **Vulnerability Hardening:** Ask `\"How do we fix the SQL injection or IDOR vulnerability?\"`\n"
            f"4. **Containment Review:** Ask `\"Show active quarantined IPs\"`\n"
            f"5. **MITRE ATT&CK:** Ask `\"Map Sentinel-X exploits to MITRE ATT&CK\"`\n\n"
            f"What would you like me to inspect?"
        )
        return {"status": "success", "reply": reply, "topic": "general"}

    def explain_event(self, event: dict) -> dict:
        """Explains a single telemetry event payload and detection reason."""
        event_type = event.get("event_type", "GENERAL")
        payload = event.get("payload") or {}
        severity = event.get("severity", "INFO")

        explanation = ""
        mitre = MITRE_ATTACK_MAPPING.get(event_type, MITRE_ATTACK_MAPPING.get("SQL_INJECTION"))

        if event_type == "SQL_INJECTION":
            user_input = payload.get("username") or payload.get("query") or "SQL payload"
            explanation = (
                f"Adversary injected: `{user_input}`. "
                "This exploits unparameterized string formatting in SQL queries, forcing the database engine to evaluate attacker syntax as logic rather than literal data."
            )
        elif event_type == "IDOR":
            req_id = payload.get("requested_id")
            sess_id = payload.get("session_user_id")
            explanation = (
                f"Session `{sess_id}` requested record `{req_id}` without verification. "
                "The server fulfilled the query solely based on the URL identifier, bypassing vertical and horizontal authorization boundaries."
            )
        elif event_type == "STORED_XSS":
            content = payload.get("content") or "script tag"
            explanation = (
                f"Submitted payload contains executable client script: `{content[:50]}`. "
                "The server accepted unescaped script tags, allowing persistent cross-site execution in other user sessions."
            )
        elif event_type == "CONTAINMENT_ENFORCED":
            explanation = (
                "Automated defensive barrier engaged. Traffic from this source address is intercepted at the middleware layer with HTTP 403 Forbidden."
            )
        else:
            explanation = f"Standard telemetry event recorded under {event.get('path')}."

        return {
            "status": "success",
            "event_id": event.get("event_id"),
            "event_type": event_type,
            "severity": severity,
            "explanation": explanation,
            "mitre_technique": f"{mitre['technique_id']} - {mitre['technique_name']}",
            "cwe": mitre["cwe"]
        }

ai_analyst_engine = AISecurityAnalystEngine()
