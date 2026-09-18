import time
import random
import concurrent.futures
from telemetry.logger import telemetry_engine
from detection.engine import detection_engine
from config import MAX_STRESS_REQUESTS, MAX_STRESS_CONCURRENCY

SYNTHETIC_ATTACK_PAYLOADS = [
    # Normal events
    {"type": "NORMAL", "method": "GET", "path": "/vulnerable/search?q=reports", "payload": {"query": "reports"}, "desc": "Legitimate keyword search"},
    {"type": "NORMAL", "method": "GET", "path": "/vulnerable/profile/101", "payload": {"requested_id": 101, "session_user_id": "101"}, "desc": "Self profile query"},
    {"type": "NORMAL", "method": "POST", "path": "/vulnerable/comments", "payload": {"author": "Auditor", "content": "Routine system audit complete."}, "desc": "Normal comment"},
    
    # SQLi events
    {"type": "SQLI", "method": "POST", "path": "/vulnerable/login", "payload": {"username": "admin' OR '1'='1' --", "password": "x"}, "desc": "SQLi tautology probe"},
    {"type": "SQLI", "method": "GET", "path": "/vulnerable/search?q=1' UNION SELECT 1,2,3,4--", "payload": {"query": "1' UNION SELECT 1,2,3,4--"}, "desc": "UNION SELECT injection"},
    
    # IDOR events
    {"type": "IDOR", "method": "GET", "path": "/vulnerable/profile/102", "payload": {"requested_id": 102, "session_user_id": "101"}, "desc": "IDOR probe on executive profile"},
    {"type": "IDOR", "method": "GET", "path": "/vulnerable/profile/103", "payload": {"requested_id": 103, "session_user_id": "101"}, "desc": "IDOR probe on CISO profile"},
    
    # XSS events
    {"type": "XSS", "method": "POST", "path": "/vulnerable/comments", "payload": {"author": "Tester", "content": "<script>alert('test')</script>"}, "desc": "Stored XSS injection"},
    {"type": "XSS", "method": "POST", "path": "/vulnerable/comments", "payload": {"author": "Tester", "content": "<img src=x onerror=console.log(1)>"}, "desc": "Event-handler XSS probe"}
]

def run_single_event(index: int, thread_id: int):
    """Processes a single synthetic security telemetry event through the pipeline."""
    sample = random.choice(SYNTHETIC_ATTACK_PAYLOADS)
    ip = f"10.20.{thread_id}.{random.randint(10, 250)}"
    
    t_start = time.perf_counter()
    
    is_attack = sample["type"] != "NORMAL"
    sev = "CRITICAL" if sample["type"] == "SQLI" else ("HIGH" if is_attack else "INFO")
    event_type = sample["type"] if is_attack else "HTTP_REQUEST"
    
    event, alert = telemetry_engine.record_event(
        source_ip=ip,
        method=sample["method"],
        path=sample["path"],
        event_type=event_type,
        severity=sev,
        status="DETECTED" if is_attack else "NORMAL",
        description=f"[Stress #{index}] {sample['desc']}",
        payload=sample["payload"]
    )
    
    t_end = time.perf_counter()
    latency_ms = (t_end - t_start) * 1000.0

    return {
        "success": True,
        "detected": alert is not None,
        "latency_ms": latency_ms
    }

def execute_stress_test(total_requests: int = 100, concurrency: int = 5):
    """
    Executes a controlled multi-threaded load simulation measuring
    actual ingestion throughput and detection latency.
    """
    # Enforce safe bounds
    total_requests = min(max(10, total_requests), MAX_STRESS_REQUESTS)
    concurrency = min(max(1, concurrency), MAX_STRESS_CONCURRENCY)

    events_generated = total_requests
    events_ingested = 0
    events_detected = 0
    events_dropped = 0
    latencies = []

    wall_start = time.perf_counter()

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = []
        for i in range(total_requests):
            thread_id = (i % concurrency) + 1
            futures.append(executor.submit(run_single_event, i + 1, thread_id))

        for future in concurrent.futures.as_completed(futures):
            try:
                result = future.result()
                if result["success"]:
                    events_ingested += 1
                    latencies.append(result["latency_ms"])
                    if result["detected"]:
                        events_detected += 1
                else:
                    events_dropped += 1
            except Exception as e:
                events_dropped += 1

    wall_end = time.perf_counter()
    total_duration_seconds = max(0.001, wall_end - wall_start)
    throughput = round(events_ingested / total_duration_seconds, 2)
    avg_latency = round(sum(latencies) / len(latencies), 2) if latencies else 0.0

    return {
        "events_generated": events_generated,
        "events_ingested": events_ingested,
        "events_detected": events_detected,
        "events_dropped": events_dropped,
        "concurrency": concurrency,
        "processing_time_seconds": round(total_duration_seconds, 3),
        "throughput_events_per_second": throughput,
        "avg_detection_latency_ms": avg_latency,
        "min_latency_ms": round(min(latencies), 2) if latencies else 0.0,
        "max_latency_ms": round(max(latencies), 2) if latencies else 0.0
    }
