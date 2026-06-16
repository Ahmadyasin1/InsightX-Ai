"""Unit tests for the ReportService (JSON, CSV, PDF generation)."""
import json
from datetime import datetime
from unittest.mock import MagicMock

import pytest

from services.report_service import ReportService


pytestmark = pytest.mark.asyncio


def _make_investigation(title="Test Case", case_number="IX-00000001"):
    inv = MagicMock()
    inv.id = "inv-001"
    inv.title = title
    inv.case_number = case_number
    inv.status = "active"
    inv.priority = "high"
    inv.description = "Test investigation description"
    inv.created_at = datetime(2024, 1, 15, 10, 30, 0)
    inv.updated_at = datetime(2024, 1, 15, 14, 0, 0)
    return inv


def _make_result(
    score=72.5,
    risk="high",
    persons=4,
    vehicles=1,
    objects=8,
    anomaly_count=2,
    brief="High-risk incident detected.",
):
    r = MagicMock()
    r.evidence_id = "ev-001"
    r.incident_score = score
    r.risk_level = risk
    r.person_count = persons
    r.vehicle_count = vehicles
    r.object_count = objects
    r.anomaly_count = anomaly_count
    r.executive_brief = brief
    r.anomalies = [
        {"type": "Loitering", "severity": "high", "description": "Stationary 5+ min", "timestamp": 434.0, "confidence": 0.9},
        {"type": "Fight", "severity": "critical", "description": "Altercation x3", "timestamp": 710.0, "confidence": 0.87},
    ]
    r.timeline = {"events": [{"timestamp": "00:00:15", "type": "Person", "description": "Enters frame"}]}
    r.transcription = {"text": "Unknown voices detected", "language": "en"}
    r.reasoning = {"summary": "Coordinated activity suspected."}
    r.created_at = datetime(2024, 1, 15, 14, 5, 0)
    return r


class TestGenerateJson:
    async def test_returns_dict(self):
        svc = ReportService()
        output = await svc.generate_json(_make_investigation(), [_make_result()])
        assert isinstance(output, dict)

    async def test_contains_report_metadata(self):
        svc = ReportService()
        output = await svc.generate_json(_make_investigation(), [_make_result()])
        assert "report_metadata" in output
        assert "generated_at" in output["report_metadata"]
        assert output["report_metadata"]["platform"] == "InsightX AI"

    async def test_contains_investigation_fields(self):
        svc = ReportService()
        inv = _make_investigation(title="Lobby Incident", case_number="IX-TEST001")
        output = await svc.generate_json(inv, [_make_result()])
        assert output["investigation"]["case_number"] == "IX-TEST001"
        assert output["investigation"]["title"] == "Lobby Incident"

    async def test_contains_analysis_results(self):
        svc = ReportService()
        result = _make_result(score=88.0, risk="critical")
        output = await svc.generate_json(_make_investigation(), [result])
        results = output["analysis_results"]
        assert len(results) == 1
        assert results[0]["incident_score"] == 88.0
        assert results[0]["risk_level"] == "critical"
        assert results[0]["person_count"] == 4

    async def test_empty_results_list(self):
        svc = ReportService()
        output = await svc.generate_json(_make_investigation(), [])
        assert output["analysis_results"] == []

    async def test_multiple_results(self):
        svc = ReportService()
        results = [_make_result(score=50.0), _make_result(score=75.0)]
        output = await svc.generate_json(_make_investigation(), results)
        assert len(output["analysis_results"]) == 2

    async def test_output_is_json_serializable(self):
        svc = ReportService()
        output = await svc.generate_json(_make_investigation(), [_make_result()])
        # Should not raise
        json.dumps(output, default=str)


class TestGenerateCsv:
    async def test_returns_string(self):
        svc = ReportService()
        output = await svc.generate_csv(_make_investigation(), [_make_result()])
        assert isinstance(output, str)

    async def test_has_header_row(self):
        svc = ReportService()
        output = await svc.generate_csv(_make_investigation(), [_make_result()])
        lines = output.strip().split("\n")
        assert len(lines) >= 1
        header_lower = lines[0].lower()
        assert "case number" in header_lower or "title" in header_lower or "status" in header_lower

    async def test_contains_case_number(self):
        svc = ReportService()
        inv = _make_investigation(case_number="IX-CSVTEST")
        output = await svc.generate_csv(inv, [_make_result()])
        assert "IX-CSVTEST" in output

    async def test_contains_result_data(self):
        svc = ReportService()
        result = _make_result(score=62.5, risk="medium")
        output = await svc.generate_csv(_make_investigation(), [result])
        assert "62.5" in output
        assert "medium" in output

    async def test_empty_results_no_error(self):
        svc = ReportService()
        output = await svc.generate_csv(_make_investigation(), [])
        assert isinstance(output, str)
        assert len(output) > 0


class TestBuildHtmlReport:
    def test_returns_valid_html(self):
        svc = ReportService()
        inv = _make_investigation()
        html = svc._build_html_report(inv, [_make_result()])
        assert isinstance(html, str)
        assert "<!DOCTYPE html>" in html
        assert "<html" in html
        assert "</html>" in html

    def test_html_contains_case_number(self):
        svc = ReportService()
        inv = _make_investigation(case_number="IX-HTML001")
        html = svc._build_html_report(inv, [_make_result()])
        assert "IX-HTML001" in html

    def test_html_contains_executive_brief(self):
        svc = ReportService()
        inv = _make_investigation()
        result = _make_result(brief="Critical situation confirmed by AI.")
        html = svc._build_html_report(inv, [result])
        assert "Critical situation confirmed by AI." in html

    def test_html_contains_anomaly_rows(self):
        svc = ReportService()
        inv = _make_investigation()
        html = svc._build_html_report(inv, [_make_result()])
        assert "Loitering" in html
        assert "Fight" in html

    def test_html_empty_results(self):
        svc = ReportService()
        inv = _make_investigation()
        html = svc._build_html_report(inv, [])
        assert "No anomalies detected" in html
