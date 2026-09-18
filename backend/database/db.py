import sqlite3
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from config import DATABASE_PATH

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH, timeout=60.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=60000;")
    return conn

def init_db(force_reseed=False):
    """Initializes SQLite database and tables, inserting seed data if empty or requested."""
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Users table (for vulnerable login and IDOR targets)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0.0,
        secret_note TEXT
    );
    """)

    # 2. Events table (all telemetry events)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        event_id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        source_ip TEXT NOT NULL,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        user TEXT,
        description TEXT NOT NULL,
        request_id TEXT NOT NULL,
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Alerts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        alert_id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        confidence REAL NOT NULL,
        reason TEXT NOT NULL,
        event_id TEXT NOT NULL,
        recommended_action TEXT NOT NULL,
        source_ip TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events (event_id)
    );
    """)

    # 4. Incidents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        incident_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        attack_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        source_ip TEXT NOT NULL,
        start_time TEXT NOT NULL,
        last_time TEXT NOT NULL,
        event_count INTEGER NOT NULL DEFAULT 1
    );
    """)

    # 5. Incident-Events join table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incident_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        attack_phase TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (incident_id),
        FOREIGN KEY (event_id) REFERENCES events (event_id)
    );
    """)

    # 6. Comments table (for Stored XSS training)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # 7. Containment actions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS containment_actions (
        action_id TEXT PRIMARY KEY,
        source_ip TEXT NOT NULL,
        reason TEXT NOT NULL,
        action_type TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        expires_at TEXT NOT NULL
    );
    """)

    conn.commit()

    # Check if seed users exist
    cursor.execute("SELECT COUNT(*) FROM users;")
    user_count = cursor.fetchone()[0]

    if user_count == 0 or force_reseed:
        if force_reseed:
            cursor.execute("DELETE FROM incident_events;")
            cursor.execute("DELETE FROM alerts;")
            cursor.execute("DELETE FROM events;")
            cursor.execute("DELETE FROM incidents;")
            cursor.execute("DELETE FROM containment_actions;")
            cursor.execute("DELETE FROM comments;")
            cursor.execute("DELETE FROM users;")

        # Seed dummy users (Required for IDOR and SQLi exercises)
        seed_users = [
            (101, "alice", "password123", "Alice Vance", "Security Analyst", "alice@sentinel.local", 4500.00, "Routine analyst clearance. Assigned to Tier-1 triage."),
            (102, "bob", "cfoSecure2026!", "Bob Sterling", "Chief Financial Officer", "bsterling@sentinel.local", 1250000.00, "CONFIDENTIAL: Q4 M&A evaluation with CyberCorp pending. Escrow account wire token: #8491-X."),
            (103, "admin", "SuperRootSecOps99!", "Sarah Connor", "CISO / SOC Director", "sconnor@sentinel.local", 98400.00, "CONFIDENTIAL: Primary datacenter root bypass token: SEC-KEY-9941. Emergency access only.")
        ]
        cursor.executemany("INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?);", seed_users)

        # Seed baseline comments
        seed_comments = [
            ("Alice Vance", "System operational. All scheduled health checks passed at 08:00 UTC.", (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()),
            ("System Admin", "Reminder: Security awareness review scheduled for Friday. Please review incident response runbooks.", (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat())
        ]
        cursor.executemany("INSERT INTO comments (author, content, created_at) VALUES (?, ?, ?);", seed_comments)

        conn.commit()

    conn.close()

if __name__ == "__main__":
    init_db(force_reseed=True)
    print("Database initialized successfully.")
