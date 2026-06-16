from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from core.dependencies import get_current_active_user
from core.exceptions import NotFoundError
from db.session import get_db
from db.models.user import User
from repositories.investigation_repository import InvestigationRepository, AnalysisResultRepository

router = APIRouter(prefix="/timeline", tags=["Timeline"])


@router.get("/investigations/{investigation_id}")
async def get_investigation_timeline(
    investigation_id: str,
    start_time: Optional[float] = Query(None, description="Filter events after this timestamp (seconds)"),
    end_time: Optional[float] = Query(None, description="Filter events before this timestamp (seconds)"),
    event_types: Optional[str] = Query(None, description="Comma-separated event types to filter"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    inv = await InvestigationRepository(db).get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)

    results = await AnalysisResultRepository(db).get_by_investigation(investigation_id)
    allowed_types = set(event_types.split(",")) if event_types else None

    timeline_events = []
    for result in results:
        if not result.timeline:
            continue
        for event in result.timeline:
            ts = event.get("timestamp", 0)
            if start_time is not None and ts < start_time:
                continue
            if end_time is not None and ts > end_time:
                continue
            if allowed_types and event.get("type") not in allowed_types:
                continue
            timeline_events.append({**event, "evidence_id": result.evidence_id})

    timeline_events.sort(key=lambda e: e.get("timestamp", 0))
    return {
        "investigation_id": investigation_id,
        "case_number": inv.case_number,
        "total_events": len(timeline_events),
        "events": timeline_events,
    }


@router.get("/investigations/{investigation_id}/anomalies")
async def get_anomaly_timeline(
    investigation_id: str,
    severity: Optional[str] = Query(None, description="Filter by severity: low|medium|high|critical"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    inv = await InvestigationRepository(db).get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)

    results = await AnalysisResultRepository(db).get_by_investigation(investigation_id)
    anomalies = []
    for result in results:
        if not result.anomalies:
            continue
        for a in result.anomalies:
            if severity and a.get("severity") != severity:
                continue
            anomalies.append({**a, "evidence_id": result.evidence_id})

    anomalies.sort(key=lambda a: a.get("timestamp", 0))
    return {
        "investigation_id": investigation_id,
        "total_anomalies": len(anomalies),
        "anomalies": anomalies,
    }
