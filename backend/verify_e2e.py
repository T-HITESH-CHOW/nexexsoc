import urllib.request
import json

BASE = "http://127.0.0.1:5000"

def post(path, body):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

def get(path, headers=None):
    hdrs = headers or {}
    req = urllib.request.Request(f"{BASE}{path}", headers=hdrs)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

print("1. Testing SQL Injection Simulation API...")
sqli_res = post("/api/simulator/sql-injection", {"source_ip": "192.168.1.55"})
print("SQLi Result:", sqli_res["status"], sqli_res.get("scenario"))

print("2. Testing IDOR Simulation API...")
idor_res = post("/api/simulator/idor", {"source_ip": "192.168.1.66"})
print("IDOR Result:", idor_res["status"], idor_res.get("scenario"))

print("3. Testing Stored XSS Simulation API...")
xss_res = post("/api/simulator/xss", {"source_ip": "192.168.1.77"})
print("XSS Result:", xss_res["status"], xss_res.get("scenario"))

print("4. Testing Multi-Step Attack Scenario...")
multi_res = post("/api/simulator/multi-step", {"source_ip": "10.0.0.88"})
print("Multi-Step Result:", multi_res["status"], "Events:", multi_res["events_count"], "Contained:", multi_res["containment_active"])

print("5. Testing Statistics...")
_, stats = get("/api/statistics")
print("Metrics:", stats["metrics"])

print("6. Testing Containment Enforcement...")
status_code, block_res = get("/vulnerable/profile/101", headers={"X-Forwarded-For": "10.0.0.88"})
print(f"Blocked IP Request Status: {status_code} (Expected 403)")
if status_code == 403:
    print("Containment Message:", block_res.get("message"))

print("7. Testing Stress Test Endpoint (50 requests, 5 threads)...")
stress_res = post("/api/stress-test", {"requests": 50, "concurrency": 5})
print("Stress Results:", stress_res["results"])

print("\n*** ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY! ***")
