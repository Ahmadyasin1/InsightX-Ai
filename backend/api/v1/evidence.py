import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from core.dependencies import get_current_active_user
from core.exceptions import NotFoundError, ValidationError
from db.session import get_db
from db.models.user import User
from repositories.investigation_repository import (
    InvestigationRepository, EvidenceRepository, AnalysisJobRepository
)
from schemas.investigation import EvidenceResponse, AnalysisJobResponse
from workers.analysis_worker import run_analysis_task

router = APIRouter(prefix="/evidence", tags=["Evidence"])

ALLOWED_MIME_TYPES = {
    "video/mp4", "video/avi", "video/mov", "video/mkv",
    "video/quicktime", "video/x-msvideo", "video/x-matroska",
    "video/webm", "video/3gpp", "application/octet-stream",
}
ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".3gp", ".3gpp"}
MAX_UPLOAD_SIZE = 4 * 1024 * 1024 * 1024  # 4GB


@router.post("/upload", response_model=EvidenceResponse, status_code=201)
async def upload_evidence(
    background_tasks: BackgroundTasks,
    investigation_id: str = Form(...),
    auto_analyze: bool = Form(default=True),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        ext = Path(file.filename or "").suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError(
                f"Unsupported file type: {file.content_type or 'unknown'}. "
                f"Supported formats: MP4, AVI, MOV, MKV, WebM"
            )

    inv_repo = InvestigationRepository(db)
    inv = await inv_repo.get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)

    upload_dir = Path(settings.LOCAL_UPLOAD_DIR) / investigation_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_filename = f"{uuid.uuid4()}{Path(file.filename).suffix.lower()}"
    storage_path = str(upload_dir / safe_filename)

    total_size = 0
    async with aiofiles.open(storage_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            total_size += len(chunk)
            if total_size > MAX_UPLOAD_SIZE:
                os.remove(storage_path)
                raise ValidationError("File too large (max 4GB)")
            await f.write(chunk)

    ev_repo = EvidenceRepository(db)
    evidence = await ev_repo.create(
        investigation_id=investigation_id,
        user_id=user.id,
        filename=safe_filename,
        original_filename=file.filename,
        file_size=total_size,
        mime_type=file.content_type,
        storage_path=storage_path,
    )

    if auto_analyze:
        job_repo = AnalysisJobRepository(db)
        job = await job_repo.create(evidence.id, investigation_id, user.id)
        await ev_repo.update(evidence, analysis_job_id=job.id, status="processing")
        background_tasks.add_task(run_analysis_task, job.id, evidence.id, storage_path)

    return evidence


@router.get("/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(
    evidence_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    ev = await EvidenceRepository(db).get_by_id(evidence_id)
    if not ev or ev.user_id != user.id:
        raise NotFoundError("Evidence", evidence_id)
    return ev


@router.get("/investigation/{investigation_id}", response_model=list[EvidenceResponse])
async def list_evidence(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    inv = await InvestigationRepository(db).get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)
    return await EvidenceRepository(db).list_by_investigation(investigation_id)


@router.get("/{evidence_id}/stream")
async def stream_evidence(
    evidence_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    ev = await EvidenceRepository(db).get_by_id(evidence_id)
    if not ev or ev.user_id != user.id:
        raise NotFoundError("Evidence", evidence_id)
    return FileResponse(ev.storage_path, media_type=ev.mime_type)
