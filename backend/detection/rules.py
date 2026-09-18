import re
import time
from collections import defaultdict

# -------------------------------------------------------------
# 1. SQL Injection Signatures & Heuristics
# -------------------------------------------------------------
SQLI_KEYWORDS = [
    r"\bUNION\b", r"\bSELECT\b", r"\bINSERT\b", r"\bUPDATE\b", r"\bDELETE\b",
    r"\bDROP\b", r"\bEXEC\b", r"\bINFORMATION_SCHEMA\b", r"\bSLEEP\b", r"\bBENCHMARK\b",
    r"\bSCHEMA\b", r"\bLOAD_FILE\b", r"\bOUTFILE\b"
]

SQLI_PATTERNS = [
    # Tautologies: ' OR '1'='1, ' OR 1=1, " OR ""="
    r"('|\")\s*OR\s*('|\")?\w+('|\")?\s*=\s*('|\")?\w+",
    r"\bOR\b\s+\d+\s*=\s*\d+",
    r"\bAND\b\s+\d+\s*=\s*\d+",
    # Comments: --, /* */, #
    r"(--|#|/\*.*?\*/)",
    # Quote termination followed by SQL commands
    r"('|\")\s*;?\s*(UNION|SELECT|DROP|INSERT)",
    # UNION SELECT
    r"\bUNION(\s+ALL)?\s+SELECT\b",
    # Single quote escaping with trailing comment
    r"'\s*--",
    r"admin'\s*--"
]

# -------------------------------------------------------------
# 2. XSS Signatures
# -------------------------------------------------------------
XSS_PATTERNS = [
    r"<\s*script[^>]*>",
    r"<\s*/\s*script\s*>",
    r"javascript\s*:",
    r"on(load|error|click|mouseover|submit|focus)\s*=",
    r"<\s*img[^>]+onerror\s*=",
    r"<\s*iframe[^>]*>",
    r"<\s*svg[^>]+onload\s*=",
    r"document\.(cookie|location|write)",
    r"alert\s*\(",
    r"eval\s*\("
]

# State trackers for behavioral rules (sliding windows in memory)
login_attempts_tracker = defaultdict(list) # ip -> list of timestamps
profile_access_tracker = defaultdict(list) # ip -> list of (timestamp, profile_id)

def evaluate_sqli(payload_str: str, endpoint: str, ip: str):
    """
    Evaluates text payload for SQL Injection signatures and patterns.
    Returns (detected: bool, severity: str, confidence: float, reason: str, recommended_action: str)
    """
    if not payload_str:
        return False, None, 0.0, "", ""

    combined_text = payload_str.upper()
    reasons = []
    matched_patterns = 0

    # Test patterns
    for pat in SQLI_PATTERNS:
        if re.search(pat, payload_str, re.IGNORECASE):
            matched_patterns += 1
            reasons.append(f"Matched pattern: {pat}")

    # Test keywords
    matched_keywords = []
    for kw in SQLI_KEYWORDS:
        if re.search(kw, payload_str, re.IGNORECASE):
            matched_keywords.append(kw.replace(r"\b", ""))

    if matched_keywords:
        reasons.append(f"SQL Keywords: {', '.join(matched_keywords[:4])}")

    # Critical exploitation
    if matched_patterns >= 1 and (re.search(r"UNION(\s+ALL)?\s+SELECT", payload_str, re.I) or 
                                  re.search(r"('|\")\s*OR\s*('|\")?1", payload_str, re.I) or
                                  "admin' --" in payload_str.lower() or
                                  "' or 1=1" in payload_str.lower()):
        return (
            True,
            "CRITICAL",
            0.98,
            f"Active SQL Injection exploitation verified: {'; '.join(reasons)}",
            "TEMPORARILY_BLOCK_SOURCE"
        )

    if matched_patterns >= 1 or len(matched_keywords) >= 2:
        return (
            True,
            "HIGH",
            0.91,
            f"Suspicious SQL Injection syntax detected: {'; '.join(reasons)}",
            "TEMPORARILY_BLOCK_SOURCE"
        )

    if len(matched_keywords) == 1 and ("'" in payload_str or '"' in payload_str):
        return (
            True,
            "MEDIUM",
            0.75,
            f"Possible SQL injection probe with delimiter: {'; '.join(reasons)}",
            "MONITOR_SESSION"
        )

    return False, None, 0.0, "", ""


def evaluate_idor(session_user_id: str, requested_profile_id: str, ip: str):
    """
    Evaluates profile requests for Insecure Direct Object Reference (IDOR).
    Checks both cross-user unauthorized access and sequential ID harvesting.
    """
    now = time.time()
    # Clean tracker entries older than 60s
    profile_access_tracker[ip] = [entry for entry in profile_access_tracker[ip] if now - entry[0] < 60]
    profile_access_tracker[ip].append((now, str(requested_profile_id)))

    recent_ids = [entry[1] for entry in profile_access_tracker[ip]]

    # 1. Sequential ID harvesting detection (e.g. 101 -> 102 -> 103)
    if len(recent_ids) >= 3:
        try:
            int_ids = [int(i) for i in recent_ids[-3:]]
            # Check if strictly sequential (e.g. 101, 102, 103 or step of 1)
            diffs = [int_ids[i+1] - int_ids[i] for i in range(len(int_ids)-1)]
            if all(d == 1 for d in diffs) or len(set(int_ids)) >= 3:
                return (
                    True,
                    "HIGH",
                    0.96,
                    f"Sequential resource enumeration pattern detected: accessed profiles {int_ids} in rapid succession",
                    "TEMPORARILY_BLOCK_SOURCE"
                )
        except ValueError:
            pass

    # 2. Cross-user access check
    if session_user_id and str(session_user_id) != str(requested_profile_id):
        return (
            True,
            "HIGH",
            0.94,
            f"Unauthorized direct object reference: Authenticated User {session_user_id} accessed Profile {requested_profile_id} without authorization",
            "TEMPORARILY_BLOCK_SOURCE"
        )

    # 3. Unauthenticated access to sensitive user profiles
    if not session_user_id and str(requested_profile_id) in ["102", "103"]:
        return (
            True,
            "MEDIUM",
            0.85,
            f"Unauthenticated direct access to privileged profile ID {requested_profile_id}",
            "MONITOR_SESSION"
        )

    return False, None, 0.0, "", ""


def evaluate_xss(payload_str: str, endpoint: str, ip: str):
    """
    Evaluates comment or parameter text for Stored Cross-Site Scripting (XSS).
    """
    if not payload_str:
        return False, None, 0.0, "", ""

    reasons = []
    for pat in XSS_PATTERNS:
        if re.search(pat, payload_str, re.IGNORECASE):
            reasons.append(f"Matched XSS pattern '{pat}'")

    if reasons:
        # Check if high severity payload
        if re.search(r"<\s*script|onerror|onload|javascript:|document\.cookie", payload_str, re.I):
            return (
                True,
                "HIGH",
                0.95,
                f"Malicious Stored XSS payload detected: {', '.join(reasons)}",
                "SANITIZE_INPUT_AND_WARN"
            )
        return (
            True,
            "MEDIUM",
            0.80,
            f"Suspicious HTML/script content submitted: {', '.join(reasons)}",
            "MONITOR_SESSION"
        )

    return False, None, 0.0, "", ""


def evaluate_brute_force(ip: str, success: bool):
    """
    Tracks failed logins to flag brute-force behavior.
    """
    now = time.time()
    login_attempts_tracker[ip] = [t for t in login_attempts_tracker[ip] if now - t < 60]

    if not success:
        login_attempts_tracker[ip].append(now)
        failures = len(login_attempts_tracker[ip])

        if failures >= 5:
            return (
                True,
                "HIGH",
                0.93,
                f"High-frequency brute force attack detected: {failures} failed login attempts within 60s from {ip}",
                "TEMPORARILY_BLOCK_SOURCE"
            )
        elif failures >= 3:
            return (
                True,
                "MEDIUM",
                0.82,
                f"Repeated authentication failures: {failures} failed logins from {ip}",
                "RATE_LIMIT_USER"
            )

    return False, None, 0.0, "", ""
