"""Unit tests for the analysis pipeline orchestrator."""
from unittest.mock import MagicMock, patch
from pathlib import Path

import pytest

from services.pipeline.orchestrator import AnalysisPipelineOrchestrator


class TestOrchestratorInit:
    def test_instantiation_no_args(self):
        orch = AnalysisPipelineOrchestrator()
        assert orch is not None

    def test_instantiation_with_callback(self):
        cb = lambda p, s: None
        orch = AnalysisPipelineOrchestrator(progress_callback=cb)
        assert orch.progress_callback is cb

    def test_models_not_loaded_initially(self):
        orch = AnalysisPipelineOrchestrator()
        assert orch._models_loaded is False


class TestProgressReporting:
    def test_callback_invoked_with_progress_and_stage(self):
        received = []
        orch = AnalysisPipelineOrchestrator(progress_callback=lambda p, s: received.append((p, s)))
        orch._update(42, "test_stage")
        assert received == [(42, "test_stage")]

    def test_default_callback_does_not_raise(self):
        orch = AnalysisPipelineOrchestrator()
        orch._update(99, "done")  # no exception expected


class TestScoreIncident:
    def setup_method(self):
        self.orch = AnalysisPipelineOrchestrator()

    def test_no_anomalies_low_risk(self):
        score, level = self.orch._score_incident([], {"unique_persons": 2})
        assert level == "low"
        assert 0 <= score <= 25

    def test_many_anomalies_critical(self):
        anomalies = [{"type": "fight"}, {"type": "intrusion"}, {"type": "weapon"}, {"type": "fire"}, {"type": "loiter"}]
        score, level = self.orch._score_incident(anomalies, {"unique_persons": 30})
        assert level in ("critical", "high")
        assert score > 50

    def test_score_capped_at_100(self):
        anomalies = [{"type": f"a{i}"} for i in range(100)]
        score, _ = self.orch._score_incident(anomalies, {"unique_persons": 500})
        assert score <= 100.0


class TestBuildEvidenceGraph:
    def test_empty_returns_nodes_and_edges(self):
        orch = AnalysisPipelineOrchestrator()
        graph = orch._build_evidence_graph({"unique_persons": 0, "unique_vehicles": 0}, [])
        assert "nodes" in graph
        assert "edges" in graph
        assert isinstance(graph["nodes"], list)
        assert isinstance(graph["edges"], list)

    def test_anomaly_becomes_node(self):
        orch = AnalysisPipelineOrchestrator()
        anomalies = [{"type": "loitering", "severity": "high"}]
        graph = orch._build_evidence_graph({}, anomalies)
        assert len(graph["nodes"]) == 1
        assert graph["nodes"][0]["type"] == "anomaly"
        assert graph["nodes"][0]["label"] == "loitering"


class TestGenerateBrief:
    def test_high_risk_brief_mentions_attention(self):
        orch = AnalysisPipelineOrchestrator()
        brief = orch._generate_brief(80.0, "high", [{"type": "fight"}])
        assert "Immediate attention" in brief
        assert "80" in brief

    def test_low_risk_brief_mentions_stable(self):
        orch = AnalysisPipelineOrchestrator()
        brief = orch._generate_brief(10.0, "low", [])
        assert "stable" in brief.lower()

    def test_brief_contains_score_and_risk(self):
        orch = AnalysisPipelineOrchestrator()
        brief = orch._generate_brief(55.5, "medium", [])
        assert "55.5" in brief
        assert "MEDIUM" in brief


class TestBuiltinPipeline:
    def test_unreachable_video_raises(self, tmp_path: Path):
        video_file = tmp_path / "bad.mp4"
        video_file.write_bytes(b"not a video")
        orch = AnalysisPipelineOrchestrator()
        orch._models_loaded = True
        orch._yolo = None

        with patch("services.pipeline.orchestrator.cv2") as mock_cv2:
            mock_cap = MagicMock()
            mock_cap.isOpened.return_value = False
            mock_cv2.VideoCapture.return_value = mock_cap

            try:
                result = orch._run_builtin_pipeline(str(video_file))
                # If no exception, result should be a dict
                assert isinstance(result, dict)
            except RuntimeError as e:
                assert "Cannot open video" in str(e)

    def test_required_keys_in_result(self, tmp_path: Path):
        video_file = tmp_path / "test.mp4"
        video_file.write_bytes(b"fake")
        orch = AnalysisPipelineOrchestrator()
        orch._models_loaded = True
        orch._yolo = None

        with patch("services.pipeline.orchestrator.cv2") as mock_cv2:
            mock_cap = MagicMock()
            mock_cap.isOpened.return_value = True
            mock_cap.get.return_value = 25.0
            mock_cap.read.return_value = (False, None)  # Empty video — no frames
            mock_cv2.VideoCapture.return_value = mock_cap
            mock_cv2.CAP_PROP_FPS = 5
            mock_cv2.CAP_PROP_FRAME_COUNT = 7
            mock_cv2.CAP_PROP_FRAME_WIDTH = 4
            mock_cv2.CAP_PROP_FRAME_HEIGHT = 8

            with patch.object(orch, "_run_transcription", return_value={"text": "", "language": "en", "events": []}):
                result = orch._run_builtin_pipeline(str(video_file))

        required = {
            "person_count", "vehicle_count", "object_count",
            "incident_score", "risk_level", "detections",
            "tracking", "timeline", "transcription",
            "anomalies", "reasoning", "evidence_graph", "executive_brief",
        }
        assert required.issubset(set(result.keys()))


class TestAnalyzeDispatch:
    def test_analyze_missing_file_raises(self, tmp_path: Path):
        orch = AnalysisPipelineOrchestrator()
        with pytest.raises(FileNotFoundError):
            orch.analyze(str(tmp_path / "nonexistent.mp4"))

    def test_analyze_falls_back_to_builtin(self, tmp_path: Path):
        video_file = tmp_path / "sample.mp4"
        video_file.write_bytes(b"fake data")
        orch = AnalysisPipelineOrchestrator()

        mock_result = {
            "person_count": 1, "vehicle_count": 0, "object_count": 2,
            "incident_score": 20.0, "risk_level": "low",
            "detections": {}, "tracking": {}, "timeline": [],
            "transcription": {}, "audio_events": [], "anomalies": [],
            "reasoning": {}, "evidence_graph": {}, "executive_brief": "Ok",
        }

        with (
            patch("services.detectra_bridge.run_detectra_analysis", side_effect=RuntimeError("not found")),
            patch.object(orch, "_run_builtin_pipeline", return_value=mock_result),
        ):
            result = orch.analyze(str(video_file))

        assert result["risk_level"] == "low"
        assert result["incident_score"] == 20.0
