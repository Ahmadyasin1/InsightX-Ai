from typing import Optional, List, Tuple
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.investigation import Investigation, Evidence, AnalysisJob, AnalysisResult


class InvestigationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: str, title: str, description: Optional[str], priority: str, tags: Optional[List[str]]) -> Investigation:
        import random, string
        case_number = "IX-" + "".join(random.choices(string.digits, k=8))
        inv = Investigation(
            user_id=user_id, title=title, description=description,
            priority=priority, tags=tags, case_number=case_number
        )
        self.db.add(inv)
        await self.db.flush()
        await self.db.refresh(inv)
        return inv

    async def get_by_id(self, investigation_id: str, user_id: str) -> Optional[Investigation]:
        result = await self.db.execute(
            select(Investigation).where(and_(Investigation.id == investigation_id, Investigation.user_id == user_id))
        )
        return result.scalar_one_or_none()

    async def get_by_id_internal(self, investigation_id: str) -> Optional[Investigation]:
        result = await self.db.execute(
            select(Investigation).where(Investigation.id == investigation_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: str, page: int = 1, page_size: int = 20) -> Tuple[List[Investigation], int]:
        offset = (page - 1) * page_size
        count_q = select(func.count()).select_from(Investigation).where(Investigation.user_id == user_id)
        total = (await self.db.execute(count_q)).scalar()
        items_q = (
            select(Investigation)
            .where(Investigation.user_id == user_id)
            .order_by(Investigation.updated_at.desc())
            .offset(offset).limit(page_size)
        )
        items = (await self.db.execute(items_q)).scalars().all()
        return list(items), total

    async def update(self, investigation: Investigation, **kwargs) -> Investigation:
        for k, v in kwargs.items():
            setattr(investigation, k, v)
        await self.db.flush()
        await self.db.refresh(investigation)
        return investigation

    async def delete(self, investigation: Investigation):
        await self.db.delete(investigation)
        await self.db.flush()


class EvidenceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, investigation_id: str, user_id: str, filename: str, original_filename: str,
                     file_size: int, mime_type: str, storage_path: str) -> Evidence:
        ev = Evidence(
            investigation_id=investigation_id, user_id=user_id, filename=filename,
            original_filename=original_filename, file_size=file_size,
            mime_type=mime_type, storage_path=storage_path
        )
        self.db.add(ev)
        await self.db.flush()
        await self.db.refresh(ev)
        return ev

    async def get_by_id(self, evidence_id: str) -> Optional[Evidence]:
        result = await self.db.execute(select(Evidence).where(Evidence.id == evidence_id))
        return result.scalar_one_or_none()

    async def list_by_investigation(self, investigation_id: str) -> List[Evidence]:
        result = await self.db.execute(
            select(Evidence).where(Evidence.investigation_id == investigation_id).order_by(Evidence.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, evidence: Evidence, **kwargs) -> Evidence:
        for k, v in kwargs.items():
            setattr(evidence, k, v)
        await self.db.flush()
        await self.db.refresh(evidence)
        return evidence


class AnalysisJobRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, evidence_id: str, investigation_id: str, user_id: str) -> AnalysisJob:
        job = AnalysisJob(evidence_id=evidence_id, investigation_id=investigation_id, user_id=user_id)
        self.db.add(job)
        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def get_by_id(self, job_id: str) -> Optional[AnalysisJob]:
        result = await self.db.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
        return result.scalar_one_or_none()

    async def update(self, job: AnalysisJob, **kwargs) -> AnalysisJob:
        for k, v in kwargs.items():
            setattr(job, k, v)
        await self.db.flush()
        await self.db.refresh(job)
        return job


class AnalysisResultRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, job_id: str, evidence_id: str, investigation_id: str, data: dict) -> AnalysisResult:
        result_obj = AnalysisResult(job_id=job_id, evidence_id=evidence_id, investigation_id=investigation_id, **data)
        self.db.add(result_obj)
        await self.db.flush()
        await self.db.refresh(result_obj)
        return result_obj

    async def get_by_job_id(self, job_id: str) -> Optional[AnalysisResult]:
        result = await self.db.execute(select(AnalysisResult).where(AnalysisResult.job_id == job_id))
        return result.scalar_one_or_none()

    async def get_by_investigation(self, investigation_id: str) -> List[AnalysisResult]:
        result = await self.db.execute(
            select(AnalysisResult).where(AnalysisResult.investigation_id == investigation_id)
            .order_by(AnalysisResult.created_at.desc())
        )
        return list(result.scalars().all())
