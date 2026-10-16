from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Moneda
from app.schemas.ops import MonedaOut, MonedaUpdate

router = APIRouter(prefix="/api/monedas", tags=["monedas"])


class ActualizacionVivaOut(BaseModel):
    actualizadas: list[str]
    cotizaciones_bs: dict[str, float]
    mensaje: str


async def _binance_usdt_ves(client: httpx.AsyncClient) -> Decimal:
    """Promedio de los 5 mejores precios BUY USDT/VES en Binance P2P."""
    payload = {
        "page": 1,
        "rows": 10,
        "payTypes": [],
        "asset": "USDT",
        "tradeType": "BUY",
        "fiat": "VES",
        "publisherType": None,
    }
    r = await client.post(
        "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
        json=payload,
    )
    r.raise_for_status()
    prices: list[float] = []
    for row in r.json().get("data") or []:
        try:
            prices.append(float(row["adv"]["price"]))
        except (KeyError, TypeError, ValueError):
            continue
    if not prices:
        raise HTTPException(502, "Binance P2P no devolvió precios USDT/VES")
    top = sorted(prices)[:5]
    avg = sum(top) / len(top)
    return Decimal(str(avg)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@router.get("", response_model=list[MonedaOut])
def listar(db: Session = Depends(get_db)):
    return list(db.scalars(select(Moneda).order_by(Moneda.id)).all())


@router.post("/actualizar-vivas", response_model=ActualizacionVivaOut)
async def actualizar_vivas(db: Session = Depends(get_db)):
    """USD/EUR = BCV oficial · USDT = mediana Binance P2P."""
    avisos: list[str] = []
    try:
        async with httpx.AsyncClient(timeout=25, follow_redirects=True) as client:
            usd_r = await client.get("https://ve.dolarapi.com/v1/dolares/oficial")
            usd_r.raise_for_status()
            usd_bs = Decimal(str(usd_r.json()["promedio"]))

            eur_r = await client.get("https://ve.dolarapi.com/v1/euros/oficial")
            eur_r.raise_for_status()
            eur_bs = Decimal(str(eur_r.json()["promedio"]))

            try:
                usdt_bs: Decimal | None = await _binance_usdt_ves(client)
            except (httpx.HTTPError, HTTPException, KeyError, ValueError) as exc:
                usdt_bs = None
                avisos.append(f"Binance no disponible ({exc})")
    except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(502, f"Error al consultar tasas BCV: {exc}") from exc

    if usd_bs <= 0 or eur_bs <= 0:
        raise HTTPException(502, "Cotización BCV inválida")

    # Contabilidad: VES = Bs por 1 USD BCV; EUR = EUR por 1 USD BCV; BIN guarda Bs/USDT (display)
    eur_per_usd = (usd_bs / eur_bs).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

    now = datetime.utcnow()
    actualizadas: list[str] = []
    cotizaciones_bs: dict[str, float] = {
        "USD": float(usd_bs),
        "EUR": float(eur_bs),
    }

    usd = db.get(Moneda, "USD")
    if usd:
        usd.tasa_referencia = Decimal("1")
        usd.actualizado_el = now

    ves = db.get(Moneda, "VES")
    if ves:
        ves.tasa_referencia = usd_bs
        ves.actualizado_el = now
        actualizadas.append("VES")

    eur = db.get(Moneda, "EUR")
    if eur:
        eur.tasa_referencia = eur_per_usd
        eur.actualizado_el = now
        actualizadas.append("EUR")

    bin_row = db.get(Moneda, "BIN")
    if usdt_bs is not None:
        cotizaciones_bs["USDT"] = float(usdt_bs)
        if bin_row:
            # Guardamos Bs por 1 USDT para poder mostrarlos al recargar
            bin_row.tasa_referencia = usdt_bs
            bin_row.actualizado_el = now
            actualizadas.append("BIN")
    elif bin_row and Decimal(bin_row.tasa_referencia) > 10:
        cotizaciones_bs["USDT"] = float(bin_row.tasa_referencia)

    db.commit()
    mensaje = "BCV (USD/EUR) + USDT Binance P2P actualizados"
    if avisos:
        mensaje = f"{mensaje}. {'; '.join(avisos)}"
    return ActualizacionVivaOut(
        actualizadas=actualizadas,
        cotizaciones_bs=cotizaciones_bs,
        mensaje=mensaje,
    )


@router.patch("/{moneda_id}", response_model=MonedaOut)
def actualizar_tasa(moneda_id: str, payload: MonedaUpdate, db: Session = Depends(get_db)):
    row = db.get(Moneda, moneda_id.upper())
    if not row:
        raise HTTPException(404, "Moneda no encontrada")
    row.tasa_referencia = payload.tasa_referencia
    row.actualizado_el = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row
