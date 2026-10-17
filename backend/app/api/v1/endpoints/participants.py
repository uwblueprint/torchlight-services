from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/participants", tags=["participants"])


@router.get("")
async def list_participants() -> None:
    """TODO(API-01): return admin roster or only current worker assignments.

    Add authentication and server-side assignment scoping before returning any
    participant records. No participant data model or authentication exists yet.
    """
    raise HTTPException(status_code=501, detail="API-01: participant listing is not implemented")
