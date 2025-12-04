"""
Load Testing Script for DermAI API using Locust
Tests system behavior under concurrent load (100-1000 users)
"""

from locust import HttpUser, task, between, events
import time
from datetime import datetime
import json

# Global statistics collection
load_test_results = {
    "start_time": None,
    "end_time": None,
    "total_requests": 0,
    "failed_requests": 0,
    "response_times": [],
    "error_types": {}
}

class DermAIUser(HttpUser):
    """Simulates a DermAI user making API requests"""

    wait_time = between(1, 3)  # Wait 1-3 seconds between requests

    def on_start(self):
        """Called when a simulated user starts"""
        self.auth_token = None

    @task(3)  # Weight: 3 (executed 3x more often than other tasks)
    def health_check(self):
        """Lightweight health check endpoint"""
        with self.client.get(
            "/health",
            catch_response=True,
            timeout=10
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @task(2)  # Weight: 2
    def get_api_docs(self):
        """Fetch API documentation"""
        with self.client.get(
            "/docs",
            catch_response=True,
            timeout=10
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to load docs: {response.status_code}")

    @task(1)  # Weight: 1
    def get_openapi_schema(self):
        """Fetch OpenAPI schema"""
        with self.client.get(
            "/openapi.json",
            catch_response=True,
            timeout=10
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to load schema: {response.status_code}")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when load test starts"""
    load_test_results["start_time"] = datetime.now().isoformat()
    print("\n" + "=" * 80)
    print("🚀 DermAI Load Testing Started")
    print(f"Timestamp: {load_test_results['start_time']}")
    print("=" * 80)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when load test stops"""
    load_test_results["end_time"] = datetime.now().isoformat()

    # Collect statistics
    stats = environment.stats

    print("\n" + "=" * 80)
    print("📈 LOAD TEST RESULTS")
    print("=" * 80)

    print(f"\nTest Duration: {load_test_results['start_time']} to {load_test_results['end_time']}")

    print(f"\n📊 Request Statistics:")
    print(f"   Total Requests: {stats.total.num_requests}")
    print(f"   Total Failures: {stats.total.num_failures}")
    print(f"   Success Rate: {100 * (stats.total.num_requests - stats.total.num_failures) / stats.total.num_requests:.1f}%")

    print(f"\n⏱️  Response Times:")
    print(f"   Min: {stats.total.min_response_time:.0f}ms")
    print(f"   Max: {stats.total.max_response_time:.0f}ms")
    print(f"   Mean: {stats.total.avg_response_time:.0f}ms")
    print(f"   Median: {stats.total.median_response_time:.0f}ms")

    # Success criteria
    success_p95 = stats.total.get_response_time_percentile(0.95)
    success_p99 = stats.total.get_response_time_percentile(0.99)

    print(f"\n📍 Percentiles:")
    print(f"   P95: {success_p95:.0f}ms (target: < 1000ms)")
    print(f"   P99: {success_p99:.0f}ms (target: < 2000ms)")

    # Assess pass/fail
    p95_pass = success_p95 < 1000
    p99_pass = success_p99 < 2000
    error_rate = 100 * stats.total.num_failures / stats.total.num_requests if stats.total.num_requests > 0 else 0
    error_rate_pass = error_rate < 1.0

    print(f"\n   Error Rate: {error_rate:.2f}% (target: < 1%)")

    # Endpoint breakdown
    print(f"\n📋 Endpoint Breakdown:")
    for endpoint in stats.entries:
        entry = stats.entries[endpoint]
        if entry.num_requests > 0:
            success_rate = 100 * (entry.num_requests - entry.num_failures) / entry.num_requests
            print(f"\n   {endpoint}")
            print(f"      Requests: {entry.num_requests}")
            print(f"      Failures: {entry.num_failures}")
            print(f"      Success Rate: {success_rate:.1f}%")
            print(f"      Avg Response: {entry.avg_response_time:.0f}ms")
            print(f"      P95: {entry.get_response_time_percentile(0.95):.0f}ms")

    # Overall assessment
    print("\n" + "=" * 80)
    if p95_pass and p99_pass and error_rate_pass:
        print("✅ LOAD TEST PASSED - System handles concurrent load well!")
    else:
        print("⚠️  LOAD TEST RESULTS - Some targets not met")
        if not p95_pass:
            print(f"   • P95 exceeded: {success_p95:.0f}ms > 1000ms")
        if not p99_pass:
            print(f"   • P99 exceeded: {success_p99:.0f}ms > 2000ms")
        if not error_rate_pass:
            print(f"   • Error rate high: {error_rate:.2f}% > 1%")

    print("=" * 80)

    # Save results to JSON
    results = {
        "start_time": load_test_results["start_time"],
        "end_time": load_test_results["end_time"],
        "total_requests": stats.total.num_requests,
        "total_failures": stats.total.num_failures,
        "success_rate": 100 * (stats.total.num_requests - stats.total.num_failures) / stats.total.num_requests if stats.total.num_requests > 0 else 0,
        "response_times": {
            "min": stats.total.min_response_time,
            "max": stats.total.max_response_time,
            "mean": stats.total.avg_response_time,
            "median": stats.total.median_response_time,
            "p95": success_p95,
            "p99": success_p99
        },
        "endpoints": {}
    }

    for endpoint in stats.entries:
        entry = stats.entries[endpoint]
        results["endpoints"][endpoint] = {
            "requests": entry.num_requests,
            "failures": entry.num_failures,
            "success_rate": 100 * (entry.num_requests - entry.num_failures) / entry.num_requests if entry.num_requests > 0 else 0,
            "avg_response": entry.avg_response_time,
            "p95": entry.get_response_time_percentile(0.95),
            "p99": entry.get_response_time_percentile(0.99)
        }

    with open("load_test_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print("\n💾 Detailed results saved to: load_test_results.json")


# Load test scenarios can be run with:
# locust -f load_test.py --host=http://localhost:8000 -u 100 -r 10 -t 1m
#
# Parameters:
#   -u 100      : 100 concurrent users (start with this)
#   -r 10       : Spawn 10 users per second
#   -t 1m       : Run for 1 minute
#   --headless  : Run without web UI
#
# For different load scenarios:
# Normal Load (100 users):
#   locust -f load_test.py --host=http://localhost:8000 -u 100 -r 5 -t 5m
#
# Peak Load (500 users):
#   locust -f load_test.py --host=http://localhost:8000 -u 500 -r 20 -t 10m
#
# Stress Test (1000+ users):
#   locust -f load_test.py --host=http://localhost:8000 -u 1000 -r 50 -t 15m
#
# Sustained Endurance (100 users, 24 hours):
#   locust -f load_test.py --host=http://localhost:8000 -u 100 -r 5 -t 86400s
