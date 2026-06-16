#!/usr/bin/env python3
"""Run Detectra pipeline against all test videos in insightx-ai/test videos/."""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
TEST_DIR = ROOT / "test videos"
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)


def main() -> int:
    videos = sorted(
        p for p in TEST_DIR.glob("*")
        if p.suffix.lower() in {".mp4", ".avi", ".mov", ".mkv", ".webm"}
    )
    if not videos:
        print(f"No test videos found in {TEST_DIR}")
        return 1

    from services.pipeline.orchestrator import AnalysisPipelineOrchestrator

    results = []
    for video in videos:
        print(f"\n{'=' * 60}\nTesting: {video.name}\n{'=' * 60}")
        t0 = time.perf_counter()
        stages: list[tuple[int, str]] = []

        def cb(p: int, s: str) -> None:
            stages.append((p, s))
            print(f"  [{p:3d}%] {s}")

        try:
            out = AnalysisPipelineOrchestrator(progress_callback=cb).analyze(str(video))
            elapsed = time.perf_counter() - t0
            summary = {
                "file": video.name,
                "ok": True,
                "elapsed_s": round(elapsed, 1),
                "incident_score": out.get("incident_score"),
                "risk_level": out.get("risk_level"),
                "person_count": out.get("person_count"),
                "vehicle_count": out.get("vehicle_count"),
                "anomaly_count": len(out.get("anomalies") or []),
                "duration_s": out.get("duration"),
                "max_progress": max((p for p, _ in stages), default=0),
                "stages_seen": len(stages),
            }
            print(f"  OK in {elapsed:.1f}s — score={summary['incident_score']} risk={summary['risk_level']}")
        except Exception as exc:
            elapsed = time.perf_counter() - t0
            summary = {
                "file": video.name,
                "ok": False,
                "elapsed_s": round(elapsed, 1),
                "error": str(exc)[:500],
                "max_progress": max((p for p, _ in stages), default=0),
            }
            print(f"  FAILED in {elapsed:.1f}s: {exc}")

        results.append(summary)

    report_path = ROOT / "backend" / "test_videos_report.json"
    report_path.write_text(json.dumps(results, indent=2), encoding="utf-8")

    passed = sum(1 for r in results if r["ok"])
    print(f"\n{'=' * 60}\nResults: {passed}/{len(results)} passed")
    print(f"Report: {report_path}")
    for r in results:
        status = "PASS" if r["ok"] else "FAIL"
        print(f"  [{status}] {r['file']} ({r['elapsed_s']}s, max progress {r.get('max_progress', 0)}%)")

    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
