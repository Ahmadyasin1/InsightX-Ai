"""
Bridge to Detectra AI v7 full analysis pipeline.

Wires InsightX AI to DetectraAnalyzer in detectra-ai/backend/analyze_videos.py
for production-grade multimodal video intelligence.
"""
from __future__ import annotations

import logging
import os
import sys
import threading
import time
from pathlib import Path
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger(__name__)

DEFAULT_DETECTRA_BACKEND = (
    Path(__file__).resolve().parents[3]
    / "New FYP Ahmad Using Antigravity and Claude"
    / "detectra-ai"
    / "backend"
)


def _resolve_detectra_paths() -> tuple[Path, Path]:
    from config import settings
    raw = os.environ.get("DETECTRA_ENGINE_PATH") or getattr(settings, "DETECTRA_ENGINE_PATH", "") or ""
    if raw:
        p = Path(raw)
        backend = p if (p / "analyze_videos.py").exists() else p / "detectra-ai" / "backend"
        parent = backend.parent.parent if backend.name == "backend" else p
    else:
        backend = DEFAULT_DETECTRA_BACKEND
        parent = backend.parent.parent
    return backend.resolve(), parent.resolve()


def _ensure_detectra_imports() -> None:
    backend_dir, parent_dir = _resolve_detectra_paths()
    for path in (str(backend_dir), str(parent_dir)):
        if path not in sys.path:
            sys.path.insert(0, path)
    # Parent folder holds detectra_cv2.py shim used by analyze_videos
    os.environ.setdefault("DETECTRA_ENGINE_PATH", str(backend_dir))


def run_detectra_analysis(
    video_path: str,
    progress_callback: Optional[Callable[[int, str], None]] = None,
) -> Dict[str, Any]:
    """Run full Detectra pipeline and return InsightX-normalized results."""
    _ensure_detectra_imports()
    progress_callback = progress_callback or (lambda _p, _s: None)

    progress_callback(15, "loading_detectra_engine")
    from analyze_videos import DetectraAnalyzer  # noqa: WPS433 — dynamic import

    progress_callback(20, "object_detection")
    analyzer = DetectraAnalyzer()
    progress_callback(25, "loading_video")

    result = _analyze_with_live_progress(analyzer, video_path, progress_callback)

    progress_callback(75, "vlm_enhancement")
    converted = _convert_video_analysis(result)
    converted = _enhance_with_hf_vlm(video_path, converted)

    progress_callback(80, "reasoning")
    progress_callback(88, "graph_generation")
    progress_callback(92, "saving_results")

    return converted


# Detectra analyze() can run several minutes with no internal callbacks — keep UI alive.
_PROGRESS_TICKS: list[tuple[int, str, float]] = [
    (28, "loading_video", 4),
    (32, "object_detection", 6),
    (38, "tracking", 8),
    (44, "transcription", 10),
    (50, "anomaly_detection", 12),
    (56, "reasoning", 14),
    (62, "graph_generation", 16),
    (68, "reasoning", 18),
]


def _analyze_with_live_progress(analyzer: Any, video_path: str, progress_callback: Callable[[int, str], None]) -> Any:
    """Run Detectra analyze while emitting incremental progress updates."""
    stop = threading.Event()

    def _ticker() -> None:
        for pct, stage, wait_s in _PROGRESS_TICKS:
            if stop.is_set():
                return
            progress_callback(pct, stage)
            if stop.wait(wait_s):
                return
        pct = 70
        while not stop.is_set():
            progress_callback(min(pct, 74), "reasoning")
            pct += 1
            if stop.wait(20):
                return

    ticker = threading.Thread(target=_ticker, daemon=True)
    ticker.start()
    try:
        return analyzer.analyze(Path(video_path))
    finally:
        stop.set()
        ticker.join(timeout=1)


def _extract_frame_jpeg(video_path: str, timestamp_s: float) -> bytes | None:
    """Grab a single frame at timestamp_s as JPEG bytes."""
    try:
        from detectra_cv2 import cv2
    except ImportError:
        try:
            import cv2  # type: ignore
        except ImportError:
            return None

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, int(timestamp_s * fps)))
    ok, frame = cap.read()
    cap.release()
    if not ok or frame is None:
        return None
    ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    return buf.tobytes() if ok else None


def _enhance_with_hf_vlm(video_path: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Enrich analysis with free HuggingFace VLM/BLIP scene descriptions."""
    from services.huggingface_service import get_hf_service

    hf = get_hf_service()
    if not hf.available:
        return data

    duration = float(data.get("duration") or 0)
    timestamps: list[float] = [0.0]
    if duration > 2:
        timestamps.append(round(duration / 2, 2))
    for a in (data.get("anomalies") or [])[:2]:
        ts = float(a.get("timestamp", 0))
        if ts not in timestamps:
            timestamps.append(ts)

    captions: list[dict] = []
    for ts in timestamps[:4]:
        jpeg = _extract_frame_jpeg(video_path, ts)
        if not jpeg:
            continue
        desc = hf.analyze_frame_vlm_sync(
            jpeg,
            prompt=(
                "You are a forensic video analyst. Describe persons, vehicles, actions, "
                "and any safety incidents visible in this surveillance frame."
            ),
        )
        if desc:
            captions.append({"timestamp": ts, "description": desc})

    if not captions:
        return data

    data.setdefault("detections", {})["vlm_scene_captions"] = captions
    meta = data.setdefault("detectra_meta", {})
    meta["vlm_enhanced"] = True
    meta["vlm_model"] = "HuggingFace VLM + BLIP"

    vlm_summary = " ".join(c["description"] for c in captions[:3])
    brief = (data.get("executive_brief") or "").strip()
    if brief:
        data["executive_brief"] = f"{brief}\n\nVisual Intelligence (HF VLM): {vlm_summary[:800]}"
    else:
        data["executive_brief"] = f"Visual Intelligence Summary: {vlm_summary[:1000]}"

    reasoning = data.setdefault("reasoning", {})
    if isinstance(reasoning, dict):
        reasoning["vlm_captions"] = captions

    return data


def _convert_video_analysis(analysis: Any) -> Dict[str, Any]:
    """Map Detectra VideoAnalysis → InsightX analysis result dict."""
    sev_weights = {"critical": 100, "high": 75, "medium": 50, "low": 25}
    events = list(getattr(analysis, "surveillance_events", []) or [])

    if events:
        top_sev = max((getattr(e, "severity", "low") for e in events),
                      key=lambda s: sev_weights.get(s, 0))
        risk_level = top_sev.lower()
        incident_score = min(100.0, max(
            sev_weights.get(getattr(e, "severity", "low"), 10) * getattr(e, "confidence", 0.5)
            for e in events
        ))
    else:
        risk_level = "low"
        incident_score = 10.0

    reasoning = getattr(analysis, "reasoning", None) or {}
    if isinstance(reasoning, dict):
        if reasoning.get("threat_score"):
            incident_score = max(incident_score, float(reasoning["threat_score"]) * 100)
        if reasoning.get("risk_level"):
            risk_level = str(reasoning["risk_level"]).lower()

    class_freq = getattr(analysis, "class_frequencies", {}) or {}
    persons = int(getattr(analysis, "distinct_individuals", 0) or len(getattr(analysis, "unique_track_ids", set()) or []))
    vehicles = sum(int(class_freq.get(k, 0)) for k in ("car", "truck", "bus", "motorcycle", "vehicle"))

    anomalies = []
    timeline = []
    for e in events:
        entry = {
            "type": getattr(e, "event_type", "event"),
            "severity": getattr(e, "severity", "medium"),
            "description": getattr(e, "description", ""),
            "timestamp": round(float(getattr(e, "timestamp_s", 0)), 2),
            "confidence": round(float(getattr(e, "confidence", 0.5)), 3),
        }
        anomalies.append(entry)
        timeline.append({**entry, "type": entry["type"]})

    for ins in getattr(analysis, "fusion_insights", []) or []:
        if getattr(ins, "alert_flag", False):
            timeline.append({
                "timestamp": round(float(getattr(ins, "window_start_s", 0)), 2),
                "type": "fusion_alert",
                "description": f"Multimodal anomaly score {getattr(ins, 'anomaly_score', 0):.2f}",
                "severity": "medium",
            })

    timeline.sort(key=lambda x: x.get("timestamp", 0))

    audio_events = []
    for ae in getattr(analysis, "audio_events", []) or []:
        audio_events.append({
            "type": getattr(ae, "event_type", getattr(ae, "label", "sound")),
            "timestamp": round(float(getattr(ae, "timestamp_s", 0)), 2),
            "confidence": round(float(getattr(ae, "confidence", 0.5)), 3),
        })

    transcript = getattr(analysis, "full_transcript", "") or ""
    if not transcript and getattr(analysis, "speech_segments", None):
        transcript = " ".join(
            getattr(s, "text", "") for s in analysis.speech_segments
            if getattr(s, "text", "") and not getattr(s, "is_noise", False)
        )

    executive_brief = (
        getattr(analysis, "summary", "")
        or (reasoning.get("executive_brief") if isinstance(reasoning, dict) else "")
        or (getattr(analysis, "narrative_report", "") or "")[:2000]
    )

    graph_nodes = []
    graph_edges = []
    for i, e in enumerate(events[:20]):
        nid = f"event_{i}"
        graph_nodes.append({
            "id": nid, "type": "anomaly", "label": getattr(e, "event_type", "event"),
            "severity": getattr(e, "severity", "medium"),
        })
    for ident in getattr(analysis, "identities", []) or []:
        iid = f"person_{ident.get('identity_id', len(graph_nodes))}"
        graph_nodes.append({"id": iid, "type": "person", "label": f"Person {ident.get('identity_id', '?')}"})

    return {
        "duration": float(getattr(analysis, "duration_s", 0)),
        "fps": float(getattr(analysis, "fps", 25)),
        "width": int(getattr(analysis, "width", 0)),
        "height": int(getattr(analysis, "height", 0)),
        "person_count": persons,
        "vehicle_count": vehicles,
        "object_count": int(getattr(analysis, "total_object_count", 0) or sum(class_freq.values())),
        "incident_score": round(float(incident_score), 1),
        "risk_level": risk_level,
        "detections": {
            "class_frequencies": dict(class_freq),
            "action_frequencies": dict(getattr(analysis, "action_frequencies", {}) or {}),
            "max_persons_in_frame": getattr(analysis, "max_persons_in_frame", 0),
            "scene_type": getattr(analysis, "scene_type", "unknown"),
        },
        "tracking": {
            "unique_track_ids": sorted(list(getattr(analysis, "unique_track_ids", set()) or [])),
            "identities": getattr(analysis, "identities", []) or [],
        },
        "timeline": timeline,
        "transcription": {
            "text": transcript,
            "language": getattr(analysis, "detected_language", "en"),
            "events": audio_events,
        },
        "audio_events": audio_events,
        "anomalies": anomalies,
        "reasoning": reasoning if isinstance(reasoning, dict) else {"summary": str(reasoning)},
        "evidence_graph": {"nodes": graph_nodes, "edges": graph_edges},
        "executive_brief": executive_brief,
        "detectra_meta": {
            "engine": "Detectra AI v7",
            "processing_time_s": getattr(analysis, "processing_time_s", 0),
            "accuracy_engine_version": getattr(analysis, "accuracy_engine_version", ""),
            "narrative_report": getattr(analysis, "narrative_report", ""),
            "severity_counts": {
                "critical": sum(1 for e in events if getattr(e, "severity", "") == "critical"),
                "high": sum(1 for e in events if getattr(e, "severity", "") == "high"),
                "medium": sum(1 for e in events if getattr(e, "severity", "") == "medium"),
                "low": sum(1 for e in events if getattr(e, "severity", "") == "low"),
            },
        },
    }
