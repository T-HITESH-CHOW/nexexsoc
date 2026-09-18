import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from config import DATABASE_PATH, PORT, HOST, SECRET_KEY
from database.db import init_db
from telemetry.logger import telemetry_engine
from detection.engine import detection_engine
from correlation.engine import correlation_engine
from containment.engine import containment_engine
from simulator.attack_scenarios import attack_simulator

from routes.api import api_bp
from vulnerable.routes import vulnerable_bp

# Frontend static directory
frontend_dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"

def create_app():
    app = Flask(__name__, static_folder=str(frontend_dist_dir) if frontend_dist_dir.exists() else None)
    app.config["SECRET_KEY"] = SECRET_KEY

    # Enable CORS for all routes and origins
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Setup SocketIO
    socketio = SocketIO(
        app,
        cors_allowed_origins="*",
        async_mode="threading",
        ping_timeout=30,
        ping_interval=15
    )

    # Wire up engines with SocketIO & dependencies
    telemetry_engine.set_socketio(socketio)
    containment_engine.set_socketio(socketio)
    correlation_engine.set_socketio(socketio)
    detection_engine.set_dependencies(socketio, correlation_engine)
    attack_simulator.set_socketio(socketio)

    # Register blueprints
    app.register_blueprint(api_bp)
    app.register_blueprint(vulnerable_bp)

    # Initialize Database on startup
    init_db(force_reseed=False)

    # SocketIO Event Handlers
    @socketio.on("connect")
    def handle_connect():
        emit("connection_ack", {"status": "connected", "server": "NEXES SOC Engine v2.5"})
        # Push initial metrics to new client
        telemetry_engine.broadcast_stats()

    @socketio.on("disconnect")
    def handle_disconnect():
        pass

    @socketio.on("ping_check")
    def handle_ping(data):
        emit("pong_response", {"received": data, "server_time": data.get("client_time")})

    # Frontend serving
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if frontend_dist_dir.exists() and (frontend_dist_dir / path).exists() and path != "":
            return send_from_directory(str(frontend_dist_dir), path)
        elif frontend_dist_dir.exists() and (frontend_dist_dir / "index.html").exists():
            return send_from_directory(str(frontend_dist_dir), "index.html")
        else:
            return jsonify({
                "platform": "NEXES SOC Monitoring & Attack Simulation Engine",
                "status": "RUNNING",
                "backend_api": "/api",
                "vulnerable_app": "/vulnerable",
                "endpoints": {
                    "events": "/api/events",
                    "incidents": "/api/incidents",
                    "alerts": "/api/alerts",
                    "statistics": "/api/statistics",
                    "system_status": "/api/system-status"
                },
                "instructions": "Frontend development server or build output will be served here."
            }), 200

    return app, socketio

app, socketio = create_app()

if __name__ == "__main__":
    print(f"""
    ===============================================================
    [+] NEXES SOC: Next-Gen Live SOC Monitoring & Training Cyber Range
    ===============================================================
    Server listening on http://{HOST}:{PORT}
    Vulnerable App: http://{HOST}:{PORT}/vulnerable
    SOC API:        http://{HOST}:{PORT}/api
    WebSockets:     Enabled (Flask-SocketIO)
    ===============================================================
    """)
    socketio.run(app, host=HOST, port=PORT, debug=False, allow_unsafe_werkzeug=True)
