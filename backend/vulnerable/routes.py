import sqlite3
from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from telemetry.logger import telemetry_engine
from containment.engine import containment_engine

vulnerable_bp = Blueprint("vulnerable", __name__, url_prefix="/vulnerable")

@vulnerable_bp.before_request
def check_containment():
    """
    Simulated Threat Containment Middleware.
    Enforces application-level blocklist before serving vulnerable endpoints.
    """
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()
    is_blocked, details = containment_engine.is_source_blocked(client_ip)

    if is_blocked:
        # Record containment enforcement in telemetry
        telemetry_engine.record_event(
            source_ip=client_ip,
            method=request.method,
            path=request.path,
            event_type="CONTAINMENT_ENFORCED",
            severity="HIGH",
            status="BLOCKED",
            description=f"Traffic halted by application containment blocklist. Reason: {details.get('reason')}",
            payload={"containment_details": details}
        )

        return jsonify({
            "error": "THREAT_CONTAINED",
            "message": "Access blocked: This IP address is currently isolated under NEXES SOC automated threat containment policy.",
            "containment_details": details
        }), 403

# -------------------------------------------------------------
# Vulnerability 1 — SQL Injection (Login & Search)
# -------------------------------------------------------------
@vulnerable_bp.route("/login", methods=["POST"])
def vulnerable_login():
    """
    Deliberately vulnerable login endpoint constructing unsafe SQL strings.
    WARNING: For local cybersecurity education & exercise use only.
    """
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    username = data.get("username", "")
    password = data.get("password", "")
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()

    # Intentionally vulnerable raw string concatenation
    raw_query = f"SELECT id, username, full_name, role, balance, secret_note FROM users WHERE username = '{username}' AND password = '{password}';"

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(raw_query)
        user_row = cursor.fetchone()
        conn.close()

        if user_row:
            user_data = dict(user_row)
            # Check if this was an SQL injection bypass or legitimate credentials
            is_bypass = ("'" in username or "--" in username or "OR" in username.upper() or "1=1" in username)

            if is_bypass:
                event, alert = telemetry_engine.record_event(
                    source_ip=client_ip,
                    method="POST",
                    path="/vulnerable/login",
                    event_type="SQL_INJECTION",
                    severity="CRITICAL",
                    status="DETECTED",
                    user=user_data["username"],
                    description=f"SQL Injection authentication bypass successful as '{user_data['username']}' using query: {raw_query}",
                    payload={"username": username, "password": password, "raw_query": raw_query, "compromised_user": user_data["username"]}
                )
                return jsonify({
                    "status": "success",
                    "flag": "SQLI_BYPASS_SUCCESS",
                    "message": f"Authentication bypassed! Logged in as {user_data['full_name']} ({user_data['role']})",
                    "user": user_data,
                    "telemetry_event_id": event["event_id"]
                }), 200
            else:
                event, _ = telemetry_engine.record_event(
                    source_ip=client_ip,
                    method="POST",
                    path="/vulnerable/login",
                    event_type="AUTH_SUCCESS",
                    severity="INFO",
                    status="NORMAL",
                    user=user_data["username"],
                    description=f"Legitimate login for user '{user_data['username']}'",
                    payload={"username": username}
                )
                return jsonify({
                    "status": "success",
                    "message": f"Welcome back, {user_data['full_name']}",
                    "user": user_data
                }), 200
        else:
            # Failed login
            is_suspicious = ("'" in username or "--" in username or "UNION" in username.upper() or "OR" in username.upper())
            event_type = "SQL_INJECTION" if is_suspicious else "AUTH_FAILED"
            severity = "HIGH" if is_suspicious else "LOW"
            status = "DETECTED" if is_suspicious else "FAILED"
            desc = "SQL Injection pattern detected in failed login" if is_suspicious else f"Failed login attempt for '{username}'"

            event, alert = telemetry_engine.record_event(
                source_ip=client_ip,
                method="POST",
                path="/vulnerable/login",
                event_type=event_type,
                severity=severity,
                status=status,
                user=username or "unknown",
                description=desc,
                payload={"username": username, "raw_query": raw_query}
            )

            return jsonify({
                "status": "failed",
                "error": "Invalid username or password",
                "telemetry_event_id": event["event_id"]
            }), 401

    except sqlite3.OperationalError as sql_err:
        # SQL Syntax Error caused by raw quote injection!
        event, alert = telemetry_engine.record_event(
            source_ip=client_ip,
            method="POST",
            path="/vulnerable/login",
            event_type="SQL_INJECTION",
            severity="HIGH",
            status="DETECTED",
            user=username or "unknown",
            description=f"Database SQL syntax error triggered by malformed input: {str(sql_err)}",
            payload={"username": username, "raw_query": raw_query, "sql_error": str(sql_err)}
        )
        return jsonify({
            "status": "failed",
            "error": f"Database syntax error: {str(sql_err)}",
            "telemetry_event_id": event["event_id"]
        }), 500

@vulnerable_bp.route("/search", methods=["GET"])
def vulnerable_search():
    """
    Deliberately vulnerable search endpoint vulnerable to UNION SELECT injection.
    """
    query = request.args.get("q", "")
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()

    raw_query = f"SELECT id, username, full_name, role FROM users WHERE username LIKE '%{query}%';"

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(raw_query)
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()

        is_sqli = any(kw in query.upper() for kw in ["UNION", "SELECT", "'", "--"])
        severity = "CRITICAL" if "UNION" in query.upper() else ("HIGH" if is_sqli else "INFO")
        event_type = "SQL_INJECTION" if is_sqli else "USER_SEARCH"

        event, alert = telemetry_engine.record_event(
            source_ip=client_ip,
            method="GET",
            path="/vulnerable/search",
            event_type=event_type,
            severity=severity,
            status="DETECTED" if is_sqli else "NORMAL",
            user="anonymous",
            description=f"Search performed with query parameter: q='{query}'",
            payload={"query": query, "raw_query": raw_query, "result_count": len(results)}
        )

        return jsonify({"status": "success", "results": results, "query": query}), 200

    except sqlite3.OperationalError as sql_err:
        event, alert = telemetry_engine.record_event(
            source_ip=client_ip,
            method="GET",
            path="/vulnerable/search",
            event_type="SQL_INJECTION",
            severity="HIGH",
            status="DETECTED",
            user="anonymous",
            description=f"SQL error in search query: {str(sql_err)}",
            payload={"query": query, "raw_query": raw_query, "sql_error": str(sql_err)}
        )
        return jsonify({"status": "error", "message": str(sql_err)}), 500

# -------------------------------------------------------------
# Vulnerability 2 — IDOR (Insecure Direct Object Reference)
# -------------------------------------------------------------
@vulnerable_bp.route("/profile/<int:user_id>", methods=["GET"])
def vulnerable_profile(user_id):
    """
    Deliberately vulnerable profile endpoint.
    Fails to verify whether the requesting session is authorized to view target user_id.
    """
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()
    session_user_id = request.headers.get("X-Session-User-Id") or request.args.get("session_user_id") or "101"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, full_name, role, email, balance, secret_note FROM users WHERE id = ?;", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        profile_data = dict(row)
        is_cross_user = (str(session_user_id) != str(user_id))

        event_type = "IDOR" if is_cross_user else "PROFILE_VIEW"
        severity = "HIGH" if is_cross_user else "INFO"
        status = "DETECTED" if is_cross_user else "NORMAL"
        desc = (
            f"Unauthorized direct object access: User {session_user_id} accessed confidential profile of User {user_id} ({profile_data['full_name']})"
            if is_cross_user
            else f"User {user_id} accessed own profile"
        )

        event, alert = telemetry_engine.record_event(
            source_ip=client_ip,
            method="GET",
            path=f"/vulnerable/profile/{user_id}",
            event_type=event_type,
            severity=severity,
            status=status,
            user=f"user_{session_user_id}",
            description=desc,
            payload={
                "requested_id": user_id,
                "session_user_id": session_user_id,
                "accessed_target": profile_data["username"],
                "confidential_data_exposed": bool(profile_data.get("secret_note"))
            }
        )

        return jsonify({
            "status": "success",
            "warning": "TRAINING ENVIRONMENT: IDOR Vulnerability Active - Authorization check was omitted",
            "profile": profile_data,
            "telemetry_event_id": event["event_id"]
        }), 200
    else:
        event, _ = telemetry_engine.record_event(
            source_ip=client_ip,
            method="GET",
            path=f"/vulnerable/profile/{user_id}",
            event_type="PROFILE_PROBE",
            severity="LOW",
            status="NORMAL",
            user=f"user_{session_user_id}",
            description=f"Attempted profile lookup for non-existent ID {user_id}",
            payload={"requested_id": user_id, "session_user_id": session_user_id}
        )
        return jsonify({"status": "not_found", "error": f"Profile ID {user_id} not found"}), 404

# -------------------------------------------------------------
# Vulnerability 3 — Stored XSS (Public Comments)
# -------------------------------------------------------------
@vulnerable_bp.route("/comments", methods=["GET", "POST"])
def vulnerable_comments():
    """
    Deliberately vulnerable Stored XSS training endpoint.
    Accepts raw unescaped comments and serves them without sanitization.
    """
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()

    if request.method == "POST":
        data = request.get_json(silent=True) or request.form.to_dict() or {}
        author = data.get("author", "Anonymous")
        content = data.get("content", "")

        conn = get_db_connection()
        cursor = conn.cursor()
        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute("INSERT INTO comments (author, content, created_at) VALUES (?, ?, ?);", (author, content, now_iso))
        conn.commit()
        comment_id = cursor.lastrowid
        conn.close()

        is_script = any(s in content.lower() for s in ["<script", "onerror", "onload", "javascript:", "alert(", "<img"])
        event_type = "STORED_XSS" if is_script else "COMMENT_POSTED"
        severity = "HIGH" if is_script else "INFO"
        status = "DETECTED" if is_script else "NORMAL"
        desc = f"Stored XSS injection detected in public comment: {content[:60]}..." if is_script else f"New comment submitted by {author}"

        event, alert = telemetry_engine.record_event(
            source_ip=client_ip,
            method="POST",
            path="/vulnerable/comments",
            event_type=event_type,
            severity=severity,
            status=status,
            user=author,
            description=desc,
            payload={"comment_id": comment_id, "author": author, "content": content}
        )

        return jsonify({
            "status": "success",
            "message": "Comment posted successfully",
            "comment": {"id": comment_id, "author": author, "content": content, "created_at": now_iso},
            "telemetry_event_id": event["event_id"]
        }), 201

    # GET comments
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM comments ORDER BY id DESC LIMIT 50;")
    rows = cursor.fetchall()
    conn.close()

    return jsonify({"status": "success", "comments": [dict(r) for r in rows]}), 200
