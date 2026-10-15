from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.finance import SyncMutation, SyncResponse
from app.services.sync import sincronizar_cola_offline

router = APIRouter(prefix="/api", tags=["pwa"])


@router.post("/sync", response_model=SyncResponse)
def sync_offline_queue(
    mutaciones: list[SyncMutation],
    db: Session = Depends(get_db),
) -> SyncResponse:
    return sincronizar_cola_offline(db, mutaciones)
