from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.expenses import router as expenses_router
from app.api.v1.endpoints.participants import router as participants_router
from app.api.v1.endpoints.receipts import router as receipts_router
from app.api.v1.endpoints.reports import router as reports_router
from app.db.session import get_session

router = APIRouter()
router.include_router(participants_router)
router.include_router(expenses_router)
router.include_router(receipts_router)
router.include_router(reports_router)


@router.get("/health", tags=["health"])
async def health(session: AsyncSession = Depends(get_session)) -> dict[str, str]:
    await session.execute(text("SELECT 1"))
    return {"status": "ok"}
