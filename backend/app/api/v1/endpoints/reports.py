from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/monthly-export")
async def create_monthly_export() -> None:
    """TODO(REPORT-01): create a per-participant workbook from an approved template.

    The app prepares data for staff copy/paste; it does not submit to PassportONE.
    """
    raise HTTPException(status_code=501, detail="REPORT-01: workbook export is not implemented")


@router.post("/receipt-archive")
async def create_receipt_archive() -> None:
    """TODO(AUDIT-ARCHIVE-01): create an authorized participant/date archive."""
    raise HTTPException(
        status_code=501,
        detail="AUDIT-ARCHIVE-01: receipt archive is not implemented",
    )
