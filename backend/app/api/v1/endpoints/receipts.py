from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/receipts", tags=["receipts"])


@router.post("")
async def upload_receipt() -> None:
    """TODO(FILE-01): validate, authorize, and privately store PDF/JPEG/Word receipts.

    Enforce configured upload size/type limits, associate with an assigned
    participant and expense, and record metadata. Do not expose public file URLs.
    OCR and manual review are separate follow-on tickets.
    """
    raise HTTPException(status_code=501, detail="FILE-01: receipt upload is not implemented")
