"""
Performance Testing Script for DermAI API with SQLite
Measures baseline performance metrics for critical endpoints
"""

import asyncio
import time
from typing import Dict, List
import statistics
import httpx
from datetime import datetime
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_VERSION = "/api/v1"

class PerformanceTest:
    def __init__(self):
        self.results: Dict[str, List[float]] = {}
        self.auth_token: str = ""

    async def measure_endpoint(self, method: str, endpoint: str,
                              headers: Dict = None, data: dict = None,
                              iterations: int = 10) -> List[float]:
        """Measure response times for an endpoint"""
        times = []

        async with httpx.AsyncClient() as client:
            for i in range(iterations):
                try:
                    start = time.time()

                    if method == "GET":
                        response = await client.get(
                            f"{BASE_URL}{API_VERSION}{endpoint}",
                            headers=headers,
                            timeout=10.0
                        )
                    elif method == "POST":
                        response = await client.post(
                            f"{BASE_URL}{API_VERSION}{endpoint}",
                            headers=headers,
                            json=data,
                            timeout=10.0
                        )

                    elapsed = (time.time() - start) * 1000  # Convert to ms
                    times.append(elapsed)

                    status = "✅" if response.status_code < 400 else "❌"
                    print(f"  {status} Iteration {i+1}: {elapsed:.2f}ms (Status: {response.status_code})")

                except Exception as e:
                    print(f"  ❌ Error in iteration {i+1}: {str(e)}")

        return [t for t in times if t is not None]

    def calculate_stats(self, endpoint: str, times: List[float]) -> Dict:
        """Calculate performance statistics"""
        if not times:
            return {}

        sorted_times = sorted(times)
        return {
            "endpoint": endpoint,
            "samples": len(times),
            "min": min(times),
            "max": max(times),
            "mean": statistics.mean(times),
            "median": statistics.median(times),
            "p95": sorted_times[int(len(sorted_times) * 0.95)] if len(sorted_times) > 1 else sorted_times[0],
            "p99": sorted_times[int(len(sorted_times) * 0.99)] if len(sorted_times) > 1 else sorted_times[0],
            "stdev": statistics.stdev(times) if len(times) > 1 else 0
        }

    async def test_health_check(self):
        """Test health check endpoint (no auth required)"""
        print("\n📊 Testing: GET /health")
        async with httpx.AsyncClient() as client:
            times = []
            for i in range(10):
                start = time.time()
                response = await client.get(f"{BASE_URL}/health", timeout=10.0)
                elapsed = (time.time() - start) * 1000
                times.append(elapsed)
                print(f"  ✅ Iteration {i+1}: {elapsed:.2f}ms")

            self.results["GET /health"] = times

    async def test_public_endpoints(self):
        """Test publicly available endpoints"""
        print("\n📊 Testing: GET /docs (API documentation)")
        async with httpx.AsyncClient() as client:
            times = []
            for i in range(5):
                start = time.time()
                response = await client.get(f"{BASE_URL}/docs", timeout=10.0)
                elapsed = (time.time() - start) * 1000
                times.append(elapsed)
                status = "✅" if response.status_code < 400 else "❌"
                print(f"  {status} Iteration {i+1}: {elapsed:.2f}ms")

            self.results["GET /docs"] = times

    async def run_all_tests(self):
        """Run all performance tests"""
        print("=" * 80)
        print("🚀 DermAI Performance Testing (SQLite Mode)")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print(f"Base URL: {BASE_URL}")
        print("=" * 80)

        # Health check (public endpoint)
        await self.test_health_check()

        # API docs endpoint
        await self.test_public_endpoints()

        # Generate report
        self.generate_report()

    def generate_report(self):
        """Generate performance report"""
        print("\n" + "=" * 80)
        print("📈 PERFORMANCE TEST REPORT")
        print("=" * 80)

        report = {
            "timestamp": datetime.now().isoformat(),
            "base_url": BASE_URL,
            "database_type": "SQLite",
            "endpoints": {}
        }

        success_criteria = {
            "p95_target": 500,  # ms
            "p99_target": 2000,  # ms
            "mean_target": 300  # ms
        }

        print(f"\n✅ Success Criteria:")
        print(f"   • P95 Response Time: < {success_criteria['p95_target']}ms")
        print(f"   • P99 Response Time: < {success_criteria['p99_target']}ms")
        print(f"   • Mean Response Time: < {success_criteria['mean_target']}ms")

        for endpoint, times in self.results.items():
            if not times:
                continue

            stats = self.calculate_stats(endpoint, times)
            report["endpoints"][endpoint] = stats

            # Color-coded results
            p95_status = "✅" if stats["p95"] < success_criteria["p95_target"] else "⚠️"
            p99_status = "✅" if stats["p99"] < success_criteria["p99_target"] else "⚠️"
            mean_status = "✅" if stats["mean"] < success_criteria["mean_target"] else "⚠️"

            print(f"\n📍 {endpoint}")
            print(f"   Samples: {stats['samples']}")
            print(f"   Min:     {stats['min']:.2f}ms")
            print(f"   Max:     {stats['max']:.2f}ms")
            print(f"   Mean:    {stats['mean']:.2f}ms {mean_status}")
            print(f"   Median:  {stats['median']:.2f}ms")
            print(f"   P95:     {stats['p95']:.2f}ms {p95_status}")
            print(f"   P99:     {stats['p99']:.2f}ms {p99_status}")
            print(f"   StdDev:  {stats['stdev']:.2f}ms")

        # Overall assessment
        print("\n" + "=" * 80)
        all_p95 = [stats["p95"] for stats in report["endpoints"].values() if "p95" in stats]
        all_p99 = [stats["p99"] for stats in report["endpoints"].values() if "p99" in stats]

        if all_p95 and all_p99:
            max_p95 = max(all_p95)
            max_p99 = max(all_p99)

            p95_pass = max_p95 < success_criteria["p95_target"]
            p99_pass = max_p99 < success_criteria["p99_target"]

            print("📊 OVERALL ASSESSMENT")
            print(f"   Max P95 across all endpoints: {max_p95:.2f}ms {'✅' if p95_pass else '⚠️'}")
            print(f"   Max P99 across all endpoints: {max_p99:.2f}ms {'✅' if p99_pass else '⚠️'}")

            if p95_pass and p99_pass:
                print("\n   ✅ PERFORMANCE BASELINE ESTABLISHED - System meets targets!")
            else:
                print("\n   ⚠️ Performance needs optimization - Some endpoints exceed targets")

        print("=" * 80)

        print("\n📝 NOTES:")
        print("   • Testing with SQLite (development mode)")
        print("   • Public endpoints only (no authentication required)")
        print("   • Production database will have different characteristics")
        print("   • Load testing needed with production-scale concurrent users")

        print("=" * 80)

        # Save report to JSON
        with open("performance_baseline.json", "w") as f:
            json.dump(report, f, indent=2)
        print("\n💾 Report saved to: performance_baseline.json")

async def main():
    """Run performance tests"""
    tester = PerformanceTest()
    try:
        await tester.run_all_tests()
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
