"""
Background analysis worker — runs the full multimodal pipeline on uploaded evidence.
Integrates the existing Detectra intelligence engine under the InsightX AI brand.
"""
import logging
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any

logger = logging.getLogger(__name__)

RISK_RANK = {"critical": 4, "high": 3, "medium": 2, "low": 1, "informational": 0}


async def _rollup_investigation_scores(
    db,
    investigation_id: str,
    inv_repo,
    result_repo,
) -> None:
    """Update investigation incident_score and priority from all analysis results."""
    inv = await inv_repo.get_by_id_internal(investigation_id)
    if not inv:
        return

    all_results = await result_repo.get_by_investigation(investigation_id)
    if not all_results:
        return

    max_score = max((r.incident_score or 0 for r in all_results), default=0)
    risks = [str(r.risk_level).lower() for r in all_results if r.risk_level]
    top_risk = max(risks, key=lambda r: RISK_RANK.get(r, 0)) if risks else "low"

    priority = inv.priority
    if RISK_RANK.get(top_risk, 0) > RISK_RANK.get(str(inv.priority).lower(), 0):
        priority = top_risk if top_risk in RISK_RANK else inv.priority

    await inv_repo.update(
        inv,
        incident_score=round(float(max_score), 1),
        priority=priority,
        status="active" if inv.status == "open" else inv.status,
    )


# In-memory progress store (replace with Redis for multi-worker deployments)
job_progress_store: Dict[str, Dict[str, Any]] = {}


def _update_progress(job_id: str, progress: int, stage: str, status: str = "running"):
    job_progress_store[job_id] = {
        "job_id": job_id,
        "status": status,
        "progress": progress,
        "stage": stage,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


async def _persist_job_progress(job_id: str, progress: int, stage: str):
    """Write live progress to DB so HTTP polling stays in sync with WebSocket."""
    from db.session import AsyncSessionLocal
    from repositories.investigation_repository import AnalysisJobRepository

    try:
        async with AsyncSessionLocal() as db:
            job_repo = AnalysisJobRepository(db)
            job = await job_repo.get_by_id(job_id)
            if job and job.status == "running":
                await job_repo.update(job, progress=progress, current_stage=stage)
                await db.commit()
    except Exception as exc:
        logger.debug("Progress persist skipped for %s: %s", job_id, exc)


async def run_analysis_task(job_id: str, evidence_id: str, video_path: str):
    """
    Orchestrates the full analysis pipeline for a video evidence file.
    Wraps the existing Detectra AI engine under InsightX AI.
    """
    from db.session import AsyncSessionLocal
    from repositories.investigation_repository import (
        AnalysisJobRepository, AnalysisResultRepository, EvidenceRepository, InvestigationRepository,
    )
    from services.pipeline.orchestrator import AnalysisPipelineOrchestrator

    loop = asyncio.get_running_loop()

    def progress_cb(progress: int, stage: str):
        _update_progress(job_id, progress, stage)
        asyncio.run_coroutine_threadsafe(
            _persist_job_progress(job_id, progress, stage), loop
        )

    _update_progress(job_id, 0, "initializing")

    async with AsyncSessionLocal() as db:
        job_repo = AnalysisJobRepository(db)
        result_repo = AnalysisResultRepository(db)
        evidence_repo = EvidenceRepository(db)
        inv_repo = InvestigationRepository(db)

        job = await job_repo.get_by_id(job_id)
        if not job:
            logger.error(f"Job {job_id} not found")
            return

        await job_repo.update(job, status="running", started_at=datetime.now(timezone.utc), progress=0, current_stage="initializing")
        await db.commit()
        progress_cb(0, "initializing")

        try:
            orchestrator = AnalysisPipelineOrchestrator(progress_callback=progress_cb)

            progress_cb(5, "loading_video")
            results = await loop.run_in_executor(None, orchestrator.analyze, video_path)

            progress_cb(95, "saving_results")

            evidence = await evidence_repo.get_by_id(evidence_id)
            if evidence:
                await evidence_repo.update(evidence,
                    duration_seconds=results.get("duration"),
                    fps=results.get("fps"),
                    width=results.get("width"),
                    height=results.get("height"),
                    status="analyzed",
                )

            reasoning = results.get("reasoning") or {}
            if results.get("detectra_meta") and isinstance(reasoning, dict):
                reasoning = {**reasoning, "detectra_meta": results["detectra_meta"]}

            result_data = {
                "incident_score": results.get("incident_score"),
                "risk_level": results.get("risk_level"),
                "person_count": results.get("person_count", 0),
                "vehicle_count": results.get("vehicle_count", 0),
                "object_count": results.get("object_count", 0),
                "anomaly_count": len(results.get("anomalies", [])),
                "detections": results.get("detections"),
                "tracking": results.get("tracking"),
                "timeline": results.get("timeline"),
                "transcription": results.get("transcription"),
                "audio_events": results.get("audio_events"),
                "anomalies": results.get("anomalies"),
                "reasoning": reasoning,
                "evidence_graph": results.get("evidence_graph"),
                "executive_brief": results.get("executive_brief"),
            }

            await result_repo.create(
                job_id=job_id,
                evidence_id=evidence_id,
                investigation_id=job.investigation_id,
                data=result_data,
            )

            await _rollup_investigation_scores(db, job.investigation_id, inv_repo, result_repo)

            await job_repo.update(
                job, status="completed", progress=100,
                current_stage="completed", completed_at=datetime.now(timezone.utc),
            )
            await db.commit()
            _update_progress(job_id, 100, "completed", "completed")
            logger.info(f"Analysis job {job_id} completed successfully")

        except Exception as e:
            logger.exception(f"Analysis job {job_id} failed: {e}")
            await job_repo.update(job, status="failed", error_message=str(e), current_stage="failed")
            evidence = await evidence_repo.get_by_id(evidence_id)
            if evidence:
                await evidence_repo.update(evidence, status="failed")
            await db.commit()
            _update_progress(job_id, 0, "failed", "failed")
