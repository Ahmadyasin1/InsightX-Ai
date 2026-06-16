from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_current_active_user
from db.session import get_db
from db.models.user import User
from db.models.investigation import Investigation, Evidence, AnalysisResult

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    inv_count = (
        await db.execute(
            select(func.count()).select_from(Investigation).where(Investigation.user_id == user.id)
        )
    ).scalar() or 0

    ev_count = (
        await db.execute(
            select(func.count()).select_from(Evidence).where(Evidence.user_id == user.id)
        )
    ).scalar() or 0

    result_count = (
        await db.execute(
            select(func.count())
            .select_from(AnalysisResult)
            .where(
                AnalysisResult.investigation_id.in_(
                    select(Investigation.id).where(Investigation.user_id == user.id)
                )
            )
        )
    ).scalar() or 0

    # Count high/critical anomalies across all user investigations
    alert_count = 0
    results = (
        await db.execute(
            select(AnalysisResult.anomalies).where(
                AnalysisResult.investigation_id.in_(
                    select(Investigation.id).where(Investigation.user_id == user.id)
                )
            )
        )
    ).scalars().all()
    for anomalies in results:
        if anomalies:
            alert_count += sum(
                1 for a in anomalies
                if a.get("severity") in ("high", "critical")
            )

    return {
        "total_investigations": inv_count,
        "total_evidence": ev_count,
        "total_alerts": alert_count,
        "total_reports": result_count,
        "total_analyses": result_count,
    }
