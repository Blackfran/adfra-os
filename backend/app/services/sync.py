from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BitacoraNota, Transaccion
from app.schemas.finance import SyncMutation, SyncResponse


def sincronizar_cola_offline(db: Session, mutaciones: list[SyncMutation]) -> SyncResponse:
    procesados = 0
    fallidos = 0
    conflictos: list[dict[str, Any]] = []

    for mut in mutaciones:
        try:
            if mut.entity == "transaccion":
                result = _sync_transaccion(db, mut.payload)
                if result.get("conflicto"):
                    conflictos.append(result)
                else:
                    procesados += 1
            elif mut.entity == "nota":
                result = _sync_nota(db, mut.payload)
                if result.get("conflicto"):
                    conflictos.append(result)
                else:
                    procesados += 1
            else:
                fallidos += 1
                conflictos.append({"entity": mut.entity, "error": "entity_unknown"})
        except Exception as exc:  # noqa: BLE001 — batch sync must continue
            fallidos += 1
            conflictos.append({"entity": mut.entity, "error": str(exc), "payload": mut.payload})

    db.commit()
    return SyncResponse(procesados=procesados, fallidos=fallidos, conflictos=conflictos)


def _sync_transaccion(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    uuid_sync = payload.get("uuid_sync")
    if uuid_sync:
        existing = db.scalar(select(Transaccion).where(Transaccion.uuid_sync == uuid_sync))
        if existing:
            return {"conflicto": True, "uuid_sync": uuid_sync, "id": existing.id}

    tx = Transaccion(
        uuid_sync=uuid_sync,
        tipo=payload["tipo"],
        categoria_id=payload.get("categoria_id"),
        proyecto_id=payload.get("proyecto_id"),
        hito_id=payload.get("hito_id"),
        monto=Decimal(str(payload["monto"])),
        moneda_id=payload.get("moneda_id", "USD"),
        tasa_cambio=Decimal(str(payload.get("tasa_cambio", "1"))),
        metodo_pago=payload.get("metodo_pago"),
        comprobante_ref=payload.get("comprobante_ref") or payload.get("referencia"),
        nota=payload.get("nota"),
        fecha_transaccion=date.fromisoformat(payload["fecha_transaccion"])
        if isinstance(payload.get("fecha_transaccion"), str)
        else payload.get("fecha") or date.today(),
    )
    db.add(tx)
    db.flush()
    return {"id": tx.id, "uuid_sync": uuid_sync}


def _sync_nota(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    uuid_sync = payload.get("uuid_sync")
    if uuid_sync:
        existing = db.scalar(select(BitacoraNota).where(BitacoraNota.uuid_sync == uuid_sync))
        if existing:
            return {"conflicto": True, "uuid_sync": uuid_sync, "id": existing.id}

    nota = BitacoraNota(
        uuid_sync=uuid_sync,
        titulo=payload.get("titulo"),
        contenido=payload["contenido"],
        etiquetas=payload.get("etiquetas"),
        fijado=bool(payload.get("fijado", False)),
    )
    db.add(nota)
    db.flush()
    return {"id": nota.id, "uuid_sync": uuid_sync}
