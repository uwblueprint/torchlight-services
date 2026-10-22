import asyncio
import logging

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.expenses import router as expenses_router
from app.api.v1.endpoints.participants import router as participants_router
from app.api.v1.endpoints.receipts import router as receipts_router
from app.api.v1.endpoints.reports import router as reports_router
from app.db.session import get_session

logger = logging.getLogger(__name__)

HEALTH_CHECK_TIMEOUT_SECONDS = 5

router = APIRouter()
router.include_router(participants_router)
router.include_router(expenses_router)
router.include_router(receipts_router)
router.include_router(reports_router)


@router.get("/health", tags=["health"], response_model=None)
async def health(session: AsyncSession = Depends(get_session)) -> dict[str, str] | JSONResponse:
    try:
        # Bounds the pool pre-ping and query too, not just opening a new connection.
        async with asyncio.timeout(HEALTH_CHECK_TIMEOUT_SECONDS):
            await session.execute(text("SELECT 1"))
    # asyncpg can raise raw OSError (e.g. DNS failure) that SQLAlchemy does not wrap.
    except (SQLAlchemyError, OSError, TimeoutError):
        logger.exception("Health check database query failed")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "database": "unavailable"},
        )
    return {"status": "ok"}
