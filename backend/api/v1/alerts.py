from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from core.dependencies import get_current_active_user
from core.exceptions import NotFoundError
from db.session import get_db
from db.models.user import User
from repositories.investigation_repository import InvestigationRepository, AnalysisResultRepository

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/investigations/{investigation_id}")
async def get_alerts(
    investigation_id: str,
    severity: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    inv = await InvestigationRepository(db).get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)

    results = await AnalysisResultRepository(db).get_by_investigation(investigation_id)
    alerts = []
    for result in results:
        if result.anomalies:
            for a in result.anomalies:
                if severity and a.get("severity") != severity:
                    continue
                if a.get("severity") in ("high", "critical"):
                    alerts.append({
                        "id": f"{result.evidence_id}_{a.get('timestamp', 0)}",
                        "type": a.get("type"),
                        "severity": a.get("severity"),
                        "description": a.get("description"),
                        "timestamp": a.get("timestamp"),
                        "evidence_id": result.evidence_id,
                        "confidence": a.get("confidence"),
                    })

    alerts.sort(key=lambda a: a.get("timestamp", 0), reverse=True)
    return {"investigation_id": investigation_id, "total": len(alerts), "alerts": alerts[:limit]}


@router.get("/dashboard")
async def get_dashboard_alerts(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    inv_repo = InvestigationRepository(db)
    investigations, _total = await inv_repo.list_by_user(user.id, page=1, page_size=100)
    result_repo = AnalysisResultRepository(db)

    alerts = []
    for inv in investigations:
        results = await result_repo.get_by_investigation(inv.id)
        for result in results:
            if not result.anomalies:
                continue
            for a in result.anomalies:
                if a.get("severity") in ("high", "critical"):
                    alerts.append({
                        "id": f"{result.evidence_id}_{a.get('timestamp', 0)}",
                        "type": a.get("type"),
                        "severity": a.get("severity"),
                        "description": a.get("description"),
                        "timestamp": a.get("timestamp"),
                        "evidence_id": result.evidence_id,
                        "investigation_id": inv.id,
                        "investigation_title": inv.title,
                        "confidence": a.get("confidence"),
                    })

    alerts.sort(key=lambda a: a.get("timestamp", 0), reverse=True)
    return {"alerts": alerts[:limit], "total": len(alerts)}
