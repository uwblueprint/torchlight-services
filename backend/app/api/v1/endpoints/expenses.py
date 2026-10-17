from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("")
async def create_expense() -> None:
    """TODO(API-02): validate participant scope and create a draft expense.

    Use BE-01 for coverage calculations, apply the approved ledger timing rules,
    preserve expense source/ownership, and write an audit event. Do not approve or
    submit expenses to PassportONE from this endpoint.
    """
    raise HTTPException(status_code=501, detail="API-02: expense creation is not implemented")
