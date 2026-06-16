from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
import json

from core.dependencies import get_current_active_user
from core.exceptions import NotFoundError
from db.session import get_db
from db.models.user import User
from repositories.investigation_repository import InvestigationRepository, AnalysisResultRepository
from services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


def _require_results(results: list) -> None:
    if not results:
        raise HTTPException(
            status_code=400,
            detail="No analysis results available. Upload and analyze evidence first.",
        )


@router.get("/investigations/{investigation_id}/pdf")
async def export_pdf(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    inv = await InvestigationRepository(db).get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)
    results = await AnalysisResultRepository(db).get_by_investigation(investigation_id)
    _require_results(results)
    try:
        pdf_bytes = await ReportService().generate_pdf(inv, results)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}") from e
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="insightx-{inv.case_number}.pdf"'},
    )


@router.get("/investigations/{investigation_id}/json")
async def export_json(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    inv = await InvestigationRepository(db).get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)
    results = await AnalysisResultRepository(db).get_by_investigation(investigation_id)
    _require_results(results)
    data = await ReportService().generate_json(inv, results)
    return JSONResponse(content=data, headers={
        "Content-Disposition": f'attachment; filename="insightx-{inv.case_number}.json"'
    })


@router.get("/investigations/{investigation_id}/csv")
async def export_csv(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    inv = await InvestigationRepository(db).get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)
    results = await AnalysisResultRepository(db).get_by_investigation(investigation_id)
    _require_results(results)
    csv_content = await ReportService().generate_csv(inv, results)
    return StreamingResponse(
        iter([csv_content.encode()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="insightx-{inv.case_number}.csv"'},
    )
