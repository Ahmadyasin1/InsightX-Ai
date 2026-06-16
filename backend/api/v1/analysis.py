import asyncio
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_current_active_user, resolve_user_from_bearer_token
from core.exceptions import NotFoundError
from db.session import get_db, AsyncSessionLocal
from db.models.user import User
from repositories.investigation_repository import (
    AnalysisJobRepository, AnalysisResultRepository, InvestigationRepository,
)
from schemas.investigation import AnalysisJobResponse, AnalysisResultResponse

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.get("/jobs/{job_id}", response_model=AnalysisJobResponse)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    job = await AnalysisJobRepository(db).get_by_id(job_id)
    if not job or job.user_id != user.id:
        raise NotFoundError("Analysis job", job_id)
    return job


@router.get("/jobs/{job_id}/progress")
async def get_job_progress(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """HTTP fallback for live progress (mirrors WebSocket payload)."""
    job = await AnalysisJobRepository(db).get_by_id(job_id)
    if not job or job.user_id != user.id:
        raise NotFoundError("Analysis job", job_id)

    from workers.analysis_worker import job_progress_store
    live = job_progress_store.get(job_id)
    if live:
        return live

    return {
        "job_id": job_id,
        "status": job.status,
        "progress": job.progress or 0,
        "stage": job.current_stage or "initializing",
    }


@router.get("/jobs/{job_id}/result", response_model=AnalysisResultResponse)
async def get_result(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    job = await AnalysisJobRepository(db).get_by_id(job_id)
    if not job or job.user_id != user.id:
        raise NotFoundError("Analysis job", job_id)
    result = await AnalysisResultRepository(db).get_by_job_id(job_id)
    if not result:
        raise NotFoundError("Analysis result", job_id)
    return result


@router.get("/investigations/{investigation_id}/results", response_model=list[AnalysisResultResponse])
async def get_investigation_results(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    inv = await InvestigationRepository(db).get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)
    return await AnalysisResultRepository(db).get_by_investigation(investigation_id)


@router.websocket("/ws/{job_id}")
async def analysis_progress_ws(
    websocket: WebSocket,
    job_id: str,
    token: str = Query(default=""),
):
    """Authenticated WebSocket for real-time analysis progress."""
    if not token:
        await websocket.close(code=4401)
        return

    async with AsyncSessionLocal() as db:
        user = await resolve_user_from_bearer_token(token, db)
        if not user:
            await websocket.close(code=4401)
            return

        job = await AnalysisJobRepository(db).get_by_id(job_id)
        if not job or job.user_id != user.id:
            await websocket.close(code=4403)
            return

    await websocket.accept()
    from workers.analysis_worker import job_progress_store
    try:
        while True:
            progress = job_progress_store.get(job_id, {})
            if not progress:
                async with AsyncSessionLocal() as db:
                    job = await AnalysisJobRepository(db).get_by_id(job_id)
                    if job:
                        progress = {
                            "job_id": job_id,
                            "status": job.status,
                            "progress": job.progress or 0,
                            "stage": job.current_stage or "initializing",
                        }
            await websocket.send_json(progress or {"job_id": job_id, "status": "running", "progress": 0, "stage": "initializing"})
            if progress.get("status") in ("completed", "failed", "cancelled"):
                break
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
