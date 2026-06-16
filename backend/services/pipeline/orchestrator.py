"""
Analysis Pipeline Orchestrator — coordinates all AI modalities for InsightX AI.
Core engine migrated from Detectra AI v5.0 Ultra Accuracy Edition.
"""
import logging
import time
from pathlib import Path
from typing import Callable, Optional, Dict, Any

try:
    import cv2
except ImportError:
    cv2 = None  # type: ignore

logger = logging.getLogger(__name__)


class AnalysisPipelineOrchestrator:
    """
    Orchestrates the full multimodal video analysis pipeline:
    1. Object Detection & Tracking (YOLOv8s-seg + ByteTrack)
    2. Pose Estimation & Action Recognition (YOLOv8n-pose + cadence FFT)
    3. Audio Transcription (faster-whisper + Silero VAD)
    4. Audio Event Classification (YAMNet)
    5. Scene Understanding (CLIP)
    6. Anomaly Detection (12-class rule-based)
    7. Multimodal Fusion (CrossModalTransformer)
    8. AI Reasoning & Evidence Graph Generation
    """

    def __init__(self, progress_callback: Optional[Callable[[int, str], None]] = None):
        self.progress_callback = progress_callback or (lambda p, s: None)
        self._models_loaded = False

    def _update(self, progress: int, stage: str):
        logger.info(f"Pipeline [{progress}%] {stage}")
        self.progress_callback(progress, stage)

    def _load_models(self):
        if self._models_loaded:
            return
        try:
            from ultralytics import YOLO
            self._yolo = YOLO("yolov8s-seg.pt")
            self._yolo_pose = YOLO("yolov8n-pose.pt")
            self._models_loaded = True
        except ImportError:
            logger.warning("ultralytics not available — detection will be skipped")
            self._yolo = None
            self._yolo_pose = None
            self._models_loaded = True

    def analyze(self, video_path: str) -> Dict[str, Any]:
        """Run the full pipeline synchronously (called from executor)."""
        path = Path(video_path)
        if not path.exists():
            raise FileNotFoundError(f"Video not found: {video_path}")

        self._update(10, "loading_models")

        # Primary: full Detectra AI v7 engine
        try:
            from services.detectra_bridge import run_detectra_analysis
            logger.info("Running Detectra AI v7 full analysis pipeline")
            return run_detectra_analysis(
                video_path,
                progress_callback=lambda p, s: self._update(p, s),
            )
        except Exception as e:
            logger.warning(f"Detectra engine unavailable ({e}) — using built-in pipeline")

        self._load_models()
        return self._run_builtin_pipeline(video_path)

    def _run_detectra_engine(self, video_path: str) -> Dict[str, Any]:
        """Deprecated — use detectra_bridge.run_detectra_analysis."""
        from services.detectra_bridge import run_detectra_analysis
        return run_detectra_analysis(
            video_path,
            progress_callback=lambda p, s: self._update(p, s),
        )

    def _run_builtin_pipeline(self, video_path: str) -> Dict[str, Any]:
        """Built-in pipeline when Detectra engine is not available."""
        if cv2 is None:
            raise RuntimeError("OpenCV (cv2) is required for video analysis")
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = total_frames / fps if fps > 0 else 0
        cap.release()

        self._update(30, "object_detection")
        detections = self._run_detection(video_path, fps)

        self._update(50, "audio_transcription")
        transcription = self._run_transcription(video_path)

        self._update(65, "anomaly_detection")
        anomalies = self._detect_anomalies(detections)

        self._update(75, "timeline_generation")
        timeline = self._build_timeline(detections, anomalies, fps)

        self._update(85, "risk_scoring")
        incident_score, risk_level = self._score_incident(anomalies, detections)

        return {
            "duration": duration,
            "fps": fps,
            "width": width,
            "height": height,
            "person_count": detections.get("unique_persons", 0),
            "vehicle_count": detections.get("unique_vehicles", 0),
            "object_count": detections.get("total_objects", 0),
            "incident_score": incident_score,
            "risk_level": risk_level,
            "detections": detections,
            "tracking": detections.get("tracks", {}),
            "timeline": timeline,
            "transcription": transcription,
            "audio_events": transcription.get("events", []),
            "anomalies": anomalies,
            "reasoning": {"summary": "Analysis completed by InsightX AI built-in pipeline."},
            "evidence_graph": self._build_evidence_graph(detections, anomalies),
            "executive_brief": self._generate_brief(incident_score, risk_level, anomalies),
        }

    def _run_detection(self, video_path: str, fps: float) -> Dict[str, Any]:
        if not self._yolo:
            return {"unique_persons": 0, "unique_vehicles": 0, "total_objects": 0, "tracks": {}}
        try:
            cap = cv2.VideoCapture(video_path)
            tracks: Dict[int, list] = {}
            frame_idx = 0
            sample_rate = max(1, int(fps / 5))  # sample 5 frames/sec

            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_idx % sample_rate == 0:
                    results = self._yolo.track(frame, persist=True, verbose=False)
                    if results and results[0].boxes is not None:
                        for box in results[0].boxes:
                            track_id = int(box.id) if box.id is not None else -1
                            cls = int(box.cls)
                            label = self._yolo.names[cls]
                            if track_id not in tracks:
                                tracks[track_id] = {"label": label, "frames": []}
                            tracks[track_id]["frames"].append(frame_idx)
                frame_idx += 1
            cap.release()

            persons = {k: v for k, v in tracks.items() if v["label"] == "person"}
            vehicles = {k: v for k, v in tracks.items() if v["label"] in ("car", "truck", "bus", "motorcycle")}
            return {
                "unique_persons": len(persons),
                "unique_vehicles": len(vehicles),
                "total_objects": len(tracks),
                "tracks": {str(k): v for k, v in tracks.items()},
            }
        except Exception as e:
            logger.warning(f"Detection failed: {e}")
            return {"unique_persons": 0, "unique_vehicles": 0, "total_objects": 0, "tracks": {}}

    def _run_transcription(self, video_path: str) -> Dict[str, Any]:
        try:
            from faster_whisper import WhisperModel
            model = WhisperModel("base", device="cpu", compute_type="int8")
            segments, info = model.transcribe(video_path, vad_filter=True)
            text = " ".join(s.text for s in segments)
            return {"text": text, "language": info.language, "events": []}
        except Exception as e:
            logger.warning(f"Transcription failed: {e}")
            return {"text": "", "language": "unknown", "events": []}

    def _detect_anomalies(self, detections: Dict) -> list:
        anomalies = []
        if detections.get("unique_persons", 0) > 10:
            anomalies.append({
                "type": "crowd_formation", "severity": "medium",
                "description": f"Large crowd detected: {detections['unique_persons']} persons",
                "timestamp": 0, "confidence": 0.85,
            })
        return anomalies

    def _build_timeline(self, detections: Dict, anomalies: list, fps: float) -> list:
        events = []
        for a in anomalies:
            events.append({"timestamp": a.get("timestamp", 0), "type": a["type"],
                           "description": a["description"], "severity": a["severity"]})
        return sorted(events, key=lambda e: e["timestamp"])

    def _score_incident(self, anomalies: list, detections: Dict):
        score = min(100.0, len(anomalies) * 15 + detections.get("unique_persons", 0) * 0.5)
        if score >= 75:
            risk = "critical"
        elif score >= 50:
            risk = "high"
        elif score >= 25:
            risk = "medium"
        else:
            risk = "low"
        return round(score, 1), risk

    def _build_evidence_graph(self, detections: Dict, anomalies: list) -> Dict:
        nodes = []
        edges = []
        for i, a in enumerate(anomalies):
            nodes.append({"id": f"anomaly_{i}", "type": "anomaly", "label": a["type"], "severity": a["severity"]})
        return {"nodes": nodes, "edges": edges}

    def _generate_brief(self, score: float, risk: str, anomalies: list) -> str:
        return (
            f"InsightX AI analysis complete. Incident Score: {score}/100 ({risk.upper()} risk). "
            f"{len(anomalies)} anomalies detected. "
            f"{'Immediate attention required.' if risk in ('high', 'critical') else 'Situation appears stable.'}"
        )

    def _normalize_results(self, raw: Dict) -> Dict:
        return {
            "duration": raw.get("duration", 0),
            "fps": raw.get("fps", 25.0),
            "width": raw.get("width", 1920),
            "height": raw.get("height", 1080),
            "person_count": raw.get("person_count", 0),
            "vehicle_count": raw.get("vehicle_count", 0),
            "object_count": raw.get("object_count", 0),
            "incident_score": raw.get("incident_score"),
            "risk_level": raw.get("risk_level"),
            "detections": raw.get("detections"),
            "tracking": raw.get("tracking"),
            "timeline": raw.get("timeline", []),
            "transcription": raw.get("transcription"),
            "audio_events": raw.get("audio_events", []),
            "anomalies": raw.get("anomalies", []),
            "reasoning": raw.get("reasoning"),
            "evidence_graph": raw.get("evidence_graph"),
            "executive_brief": raw.get("executive_brief") or raw.get("reasoning", {}).get("summary"),
        }
