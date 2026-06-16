"""
Investigation Chat Agent — multi-provider AI with automatic fallback.

Chain: Groq → Gemini → HuggingFace → Anthropic
"""
import json
import logging
from typing import Any, AsyncIterator, Dict, List, Optional

logger = logging.getLogger(__name__)


class InvestigationChatAgent:
    SYSTEM_PROMPT = """You are InsightX AI Investigator, an elite AI forensic analyst embedded in the InsightX AI platform.

Your role is to help investigators understand video evidence, identify patterns, reconstruct timelines, and derive actionable intelligence from AI-analyzed footage.

You have access to structured analysis data including:
- Detected persons, vehicles, and objects with tracking IDs
- Anomaly alerts (fight detection, loitering, falls, crowd formation)
- Audio transcriptions and detected sounds
- Event timelines with timestamps
- Risk scores and incident classifications
- Evidence graphs showing relationships between entities

When answering:
1. Be precise and evidence-based — cite specific timestamps, track IDs, or detected events
2. Use professional investigative language
3. Highlight the most critical findings first
4. Suggest follow-up investigation steps when appropriate
5. Format responses clearly with sections when the answer is complex

Always ground your answers in the provided analysis data. If something is unclear or not in the data, say so explicitly."""

    def _filter_results(self, results: List[Any], evidence_ids: Optional[List[str]]) -> List[Any]:
        if not evidence_ids:
            return results
        allowed = set(evidence_ids)
        return [r for r in results if getattr(r, "evidence_id", None) in allowed]

    def _build_context(self, investigation: Any, results: List[Any]) -> str:
        parts = [
            f"INVESTIGATION: {investigation.title}",
            f"Case Number: {investigation.case_number}",
            f"Status: {investigation.status} | Priority: {investigation.priority}",
            f"Description: {investigation.description or 'Not provided'}",
            "",
            "ANALYSIS RESULTS SUMMARY:",
        ]
        if not results:
            parts.append("  No analysis results yet — evidence may still be processing.")
        for i, r in enumerate(results, 1):
            parts.append(f"\n[Evidence {i} — Job {r.job_id[:8]}]")
            parts.append(f"  Incident Score: {r.incident_score}/100 ({r.risk_level or 'unknown'} risk)")
            parts.append(f"  Persons: {r.person_count} | Vehicles: {r.vehicle_count} | Objects: {r.object_count}")
            parts.append(f"  Anomalies: {r.anomaly_count}")
            if r.executive_brief:
                parts.append(f"  Brief: {r.executive_brief}")
            if r.anomalies:
                parts.append(f"  Key Anomalies: {json.dumps(r.anomalies[:5], indent=2)}")
            if r.timeline:
                parts.append(f"  Timeline Events (first 10): {json.dumps(r.timeline[:10], indent=2)}")
            if r.transcription and r.transcription.get("text"):
                parts.append(f"  Audio Transcript: {r.transcription['text'][:500]}...")
        return "\n".join(parts)

    def _user_message(self, message: str, context: str) -> str:
        return f"Context:\n{context[:12000]}\n\nQuestion: {message}"

    async def stream_response(
        self,
        message: str,
        investigation: Any,
        analysis_results: List[Any],
        evidence_ids: Optional[List[str]] = None,
    ) -> AsyncIterator[str]:
        from services.llm_service import get_llm_service
        filtered = self._filter_results(analysis_results, evidence_ids)
        context = self._build_context(investigation, filtered)
        llm = get_llm_service()

        try:
            async for chunk in llm.stream_chat(
                self.SYSTEM_PROMPT,
                self._user_message(message, context),
            ):
                yield json.dumps({"type": "text", "text": chunk})
        except Exception as e:
            logger.error(f"Chat stream failed: {e}")
            yield json.dumps({"type": "error", "text": _friendly_error(e)})

    async def get_response(
        self,
        message: str,
        investigation: Any,
        analysis_results: List[Any],
        evidence_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        from services.llm_service import get_llm_service
        filtered = self._filter_results(analysis_results, evidence_ids)
        context = self._build_context(investigation, filtered)
        llm = get_llm_service()

        try:
            content, provider = await llm.chat(
                self.SYSTEM_PROMPT,
                self._user_message(message, context),
            )
            return {"content": content, "citations": None, "provider": provider}
        except Exception as e:
            logger.error(f"Chat get_response failed: {e}")
            return {
                "content": _friendly_error(e),
                "citations": None,
                "provider": None,
            }


def _friendly_error(exc: Exception) -> str:
    raw = str(exc)
    if "credit balance" in raw.lower() or "invalid_request_error" in raw.lower():
        return (
            "I couldn't reach the primary AI service, and all backup providers failed. "
            "Please verify your API keys in the backend `.env` file and try again."
        )
    if "All AI providers failed" in raw:
        return (
            "**AI services unavailable.** Please ensure at least one provider is configured "
            "(Groq, Gemini, or HuggingFace) in your backend environment."
        )
    # Never expose raw JSON error blobs to users
    if raw.startswith("Analysis failed:") or "Error code:" in raw or raw.startswith("{"):
        return (
            "I encountered an issue generating a response. The system is retrying with backup AI providers — "
            "please send your question again."
        )
    return f"I encountered an issue: {raw[:200]}"
