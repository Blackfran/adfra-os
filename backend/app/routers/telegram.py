"""Telegram bot webhook + helpers.

Commands:
  /hoy  /saldo  /gasto <monto> <descripcion>  /ingreso <monto> <descripcion>
"""

from datetime import date
from decimal import Decimal
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import select

from app.config import get_settings
from app.database import SessionLocal
from app.models import Cuenta
from app.schemas.finance import TransaccionCreate
from app.services.finance import registrar_transaccion
from app.services.ops import to_usd
from app.services.vista_hoy import obtener_vista_hoy

router = APIRouter(prefix="/api/telegram", tags=["telegram"])


class SendAlert(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class SetWebhookBody(BaseModel):
    url: HttpUrl


def _verify_webhook_secret(request: Request) -> None:
    settings = get_settings()
    expected = settings.telegram_webhook_secret
    if not expected:
        raise HTTPException(503, "Telegram webhook no configurado de forma segura")
    got = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if not got or got != expected:
        raise HTTPException(403, "Webhook no autorizado")


async def _tg_send(chat_id: str, text: str) -> None:
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise HTTPException(400, "TELEGRAM_BOT_TOKEN no configurado")
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(url, json={"chat_id": chat_id, "text": text[:4000]})
        if r.status_code >= 400:
            raise HTTPException(502, "Error al contactar Telegram")


@router.post("/webhook")
async def webhook(request: Request):
    _verify_webhook_secret(request)
    settings = get_settings()

    if not settings.telegram_chat_id:
        # Fail closed: sin chat autorizado no se ejecuta nada
        return {"ok": True, "ignored": True}

    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(400, "JSON inválido") from exc

    message = body.get("message") or body.get("edited_message") or {}
    chat = message.get("chat") or {}
    chat_id = str(chat.get("id", ""))
    text = (message.get("text") or "").strip()[:500]

    if not chat_id or chat_id != str(settings.telegram_chat_id):
        return {"ok": True, "ignored": True}

    if not text:
        return {"ok": True}

    reply = _handle_command(text)
    await _tg_send(chat_id, reply)
    return {"ok": True}


@router.post("/alert")
async def alert(payload: SendAlert):
    settings = get_settings()
    if not settings.telegram_chat_id:
        raise HTTPException(400, "TELEGRAM_CHAT_ID no configurado")
    await _tg_send(settings.telegram_chat_id, payload.text)
    return {"sent": True}


@router.post("/set-webhook")
async def set_webhook(payload: SetWebhookBody):
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise HTTPException(400, "TELEGRAM_BOT_TOKEN no configurado")
    if not settings.telegram_webhook_secret:
        raise HTTPException(400, "TELEGRAM_WEBHOOK_SECRET no configurado")

    base = str(payload.url).rstrip("/")
    parsed = urlparse(base)
    if parsed.scheme != "https":
        raise HTTPException(400, "El webhook debe usar HTTPS")

    webhook_url = f"{base}/api/telegram/webhook"
    api = f"https://api.telegram.org/bot{settings.telegram_bot_token}/setWebhook"
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            api,
            json={
                "url": webhook_url,
                "secret_token": settings.telegram_webhook_secret,
                "drop_pending_updates": True,
            },
        )
        data = r.json()
    return data


def _handle_command(text: str) -> str:
    parts = text.split(maxsplit=2)
    cmd = parts[0].lower().split("@")[0]

    db = SessionLocal()
    try:
        if cmd == "/hoy":
            vista = obtener_vista_hoy(db)
            lines = [
                f"AdFra Ges · Hoy {vista.fecha}",
                f"Neto día: {vista.balance_dia.neto} USD",
                f"Mes: {vista.balance_mes.neto} USD",
                f"Liquidez: {vista.liquidez.total_usd} USD",
                f"Por cobrar: {vista.por_cobrar_total}",
            ]
            for i in vista.insights[:3]:
                lines.append(f"• {i.titulo}")
            return "\n".join(lines)

        if cmd == "/saldo":
            cuentas = db.scalars(select(Cuenta).where(Cuenta.activa.is_(True))).all()
            total = sum(to_usd(db, Decimal(c.saldo), c.moneda_id) for c in cuentas)
            lines = [f"Liquidez total: {total:.2f} USD", ""]
            for c in cuentas:
                lines.append(f"· {c.nombre}: {c.saldo} {c.moneda_id}")
            return "\n".join(lines) if cuentas else "Sin cuentas registradas"

        if cmd in ("/gasto", "/ingreso") and len(parts) >= 2:
            try:
                monto = Decimal(parts[1].replace(",", "."))
            except Exception:
                return "Uso: /gasto 12.50 almuerzo"
            if monto <= 0 or monto > Decimal("1000000"):
                return "Monto fuera de rango"
            desc = (parts[2] if len(parts) > 2 else cmd.removeprefix("/"))[:200]
            tipo = "gasto" if cmd == "/gasto" else "ingreso"
            tx = registrar_transaccion(
                db,
                TransaccionCreate(
                    tipo=tipo,
                    monto=monto,
                    moneda_id="USD",
                    nota=desc,
                    fecha_transaccion=date.today(),
                    metodo_pago="Telegram",
                ),
            )
            return f"OK {tipo}: {monto} USD — {desc} (#{tx.id})"

        return (
            "AdFra Ges bot\n"
            "/hoy — resumen del día\n"
            "/saldo — liquidez\n"
            "/gasto 12.5 cafe\n"
            "/ingreso 100 cliente"
        )
    except Exception:
        return "Error interno al procesar el comando"
    finally:
        db.close()
