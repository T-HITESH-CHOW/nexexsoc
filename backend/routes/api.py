import json
from flask import Blueprint, request, jsonify
from database.db import get_db_connection, init_db
from telemetry.logger import telemetry_engine
from correlation.engine import correlation_engine
from containment.engine import containment_engine
from simulator.attack_scenarios import attack_simulator
from simulator.stress_test import execute_stress_test
from ai.analyst import ai_analyst_engine

api_bp = Blueprint("api", __name__, url_prefix="/api")

# -------------------------------------------------------------
# 1. Telemetry Events APIs
# -------------------------------------------------------------
@api_bp.route("/events", methods=["GET"])
def get_events():
    limit = int(request.args.get("limit", 100))
    event_type = request.args.get("event_type")
    severity = request.args.get("severity")
    events = telemetry_engine.get_events(limit=limit, event_type=event_type, severity=severity)
    return jsonify({"status": "success", "count": len(events), "events": events})

@api_bp.route("/events/<event_id>", methods=["GET"])
def get_event(event_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events WHERE event_id = ?;", (event_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"status": "error", "message": "Event not found"}), 404

    event = dict(row)
    if event.get("payload"):
        try:
            event["payload"] = json.loads(event["payload"])
        except Exception:
            pass
    return jsonify({"status": "success", "event": event})

# -------------------------------------------------------------
# 2. Incidents & Incident Timeline APIs
# -------------------------------------------------------------
@api_bp.route("/incidents", methods=["GET"])
def get_incidents():
    limit = int(request.args.get("limit", 50))
    incidents = correlation_engine.get_all_incidents(limit=limit)
    return jsonify({"status": "success", "count": len(incidents), "incidents": incidents})

@api_bp.route("/incidents/<incident_id>", methods=["GET"])
def get_incident(incident_id):
    incident_with_timeline = correlation_engine.get_incident_timeline(incident_id)
    if not incident_with_timeline:
        return jsonify({"status": "error", "message": "Incident not found"}), 404
    return jsonify({"status": "success", "incident": incident_with_timeline})

@api_bp.route("/incidents/<incident_id>/status", methods=["POST"])
def update_incident_status(incident_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "INVESTIGATING")
    updated = correlation_engine.update_incident_status(incident_id, new_status)
    if not updated:
        return jsonify({"status": "error", "message": "Incident not found"}), 404
    return jsonify({"status": "success", "incident": updated})

# -------------------------------------------------------------
# 3. Security Alerts APIs
# -------------------------------------------------------------
@api_bp.route("/alerts", methods=["GET"])
def get_alerts():
    limit = int(request.args.get("limit", 50))
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?;", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return jsonify({"status": "success", "count": len(rows), "alerts": [dict(r) for r in rows]})

# -------------------------------------------------------------
# 4. Statistics & Analytics APIs
# -------------------------------------------------------------
@api_bp.route("/statistics", methods=["GET"])
def get_statistics():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Metrics
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

    # Alerts by severity breakdown
    cursor.execute("SELECT severity, COUNT(*) FROM alerts GROUP BY severity;")
    alerts_by_severity = {row[0]: row[1] for row in cursor.fetchall()}

    # Attacks by type
    cursor.execute("SELECT type, COUNT(*) FROM alerts GROUP BY type;")
    attacks_by_type = {row[0]: row[1] for row in cursor.fetchall()}

    # Recent events time series (last 10 events grouped by 10-second or chronological order)
    cursor.execute("SELECT strftime('%H:%M:%S', timestamp) as time_label, COUNT(*) as count FROM events GROUP BY time_label ORDER BY timestamp DESC LIMIT 15;")
    time_series = [dict(r) for r in cursor.fetchall()]
    time_series.reverse()

    conn.close()

    return jsonify({
        "status": "success",
        "metrics": {
            "total_events": total_events,
            "active_incidents": active_incidents,
            "critical_alerts": critical_alerts,
            "high_alerts": high_alerts,
            "contained_threats": contained_threats
        },
        "alerts_by_severity": alerts_by_severity,
        "attacks_by_type": attacks_by_type,
        "events_over_time": time_series
    })

# -------------------------------------------------------------
# 5. Containment APIs
# -------------------------------------------------------------
@api_bp.route("/containment", methods=["GET"])
def get_containment_status():
    active = containment_engine.get_active_containments()
    history = containment_engine.get_all_actions(limit=20)
    return jsonify({"status": "success", "active_blocks": active, "history": history})

@api_bp.route("/containment/block", methods=["POST"])
def manual_block():
    data = request.get_json(silent=True) or {}
    ip = data.get("source_ip")
    reason = data.get("reason", "Manual containment action initiated by SOC analyst")
    duration = int(data.get("duration_seconds", 60))

    if not ip:
        return jsonify({"status": "error", "message": "source_ip is required"}), 400

    result = containment_engine.contain_source(ip, reason, duration)
    return jsonify({"status": "success", "action": result})

@api_bp.route("/containment/unblock", methods=["POST"])
def manual_unblock():
    data = request.get_json(silent=True) or {}
    ip = data.get("source_ip")
    reason = data.get("reason", "Manual unblock approved by SOC analyst")

    if not ip:
        return jsonify({"status": "error", "message": "source_ip is required"}), 400

    result = containment_engine.unblock_source(ip, reason)
    return jsonify({"status": "success", "action": result})

# -------------------------------------------------------------
# 6. Simulator APIs
# -------------------------------------------------------------
@api_bp.route("/simulator/sql-injection", methods=["POST"])
def simulate_sqli():
    data = request.get_json(silent=True) or {}
    source_ip = data.get("source_ip", "192.168.1.105")
    res = attack_simulator.simulate_sqli(source_ip)
    return jsonify(res)

@api_bp.route("/simulator/idor", methods=["POST"])
def simulate_idor():
    data = request.get_json(silent=True) or {}
    source_ip = data.get("source_ip", "192.168.1.108")
    res = attack_simulator.simulate_idor(source_ip)
    return jsonify(res)

@api_bp.route("/simulator/xss", methods=["POST"])
def simulate_xss():
    data = request.get_json(silent=True) or {}
    source_ip = data.get("source_ip", "192.168.1.112")
    res = attack_simulator.simulate_xss(source_ip)
    return jsonify(res)

@api_bp.route("/simulator/multi-step", methods=["POST"])
def simulate_multistep():
    data = request.get_json(silent=True) or {}
    source_ip = data.get("source_ip", "10.0.0.99")
    res = attack_simulator.simulate_multistep_attack(source_ip)
    return jsonify(res)

@api_bp.route("/simulator/demo", methods=["POST"])
def simulate_demo():
    res = attack_simulator.trigger_demo_mode()
    return jsonify(res)

# -------------------------------------------------------------
# 7. Telemetry Stress Testing API
# -------------------------------------------------------------
@api_bp.route("/stress-test", methods=["POST"])
def trigger_stress_test():
    data = request.get_json(silent=True) or {}
    requests_count = int(data.get("requests", 100))
    concurrency = int(data.get("concurrency", 5))

    results = execute_stress_test(total_requests=requests_count, concurrency=concurrency)
    return jsonify({"status": "success", "results": results})

# -------------------------------------------------------------
# 8. System Status API
# -------------------------------------------------------------
@api_bp.route("/system-status", methods=["GET"])
def system_status():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1;")
    db_ok = cursor.fetchone()[0] == 1
    conn.close()

    return jsonify({
        "status": "success",
        "system": {
            "vulnerable_app": "ONLINE",
            "ingestion_engine": "ONLINE",
            "detection_engine": "ONLINE",
            "websocket": "CONNECTED",
            "incident_correlation": "ACTIVE",
            "containment_engine": "ACTIVE",
            "database": "ONLINE" if db_ok else "ERROR"
        },
        "active_containments": len(containment_engine.get_active_containments())
    })

# -------------------------------------------------------------
# 9. Reset Demo Data API
# -------------------------------------------------------------
@api_bp.route("/reset-demo", methods=["POST"])
def reset_demo():
    init_db(force_reseed=True)
    containment_engine.blocked_sources.clear()
    telemetry_engine.broadcast_stats()
    return jsonify({"status": "success", "message": "Demo data reseeded and blocklist cleared"})

# -------------------------------------------------------------
# 10. AI Security Analyst APIs
# -------------------------------------------------------------
@api_bp.route("/ai/analyze-incident", methods=["POST"])
def ai_analyze_incident():
    data = request.get_json(silent=True) or {}
    incident_id = data.get("incident_id")
    if not incident_id:
        return jsonify({"status": "error", "message": "incident_id is required"}), 400
    analysis = ai_analyst_engine.analyze_incident(incident_id)
    return jsonify(analysis)

@api_bp.route("/ai/chat", methods=["POST"])
def ai_chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")
    context = data.get("context", {})
    response = ai_analyst_engine.chat_with_analyst(message=message, context=context)
    return jsonify(response)

@api_bp.route("/ai/explain-event", methods=["POST"])
def ai_explain_event():
    data = request.get_json(silent=True) or {}
    event = data.get("event") or {}
    response = ai_analyst_engine.explain_event(event)
    return jsonify(response)

