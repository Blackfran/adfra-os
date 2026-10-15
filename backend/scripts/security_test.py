"""Smoke tests de seguridad para AdFra OS API."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
PASS = 0
FAIL = 0


def req(method: str, path: str, body: dict | None = None, headers: dict | None = None):
    data = None if body is None else json.dumps(body).encode()
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as resp:
            raw = resp.read().decode(errors="replace")
            payload = None
            if raw and "application/json" in (resp.headers.get("Content-Type") or ""):
                payload = json.loads(raw)
            elif raw.startswith("{") or raw.startswith("["):
                try:
                    payload = json.loads(raw)
                except json.JSONDecodeError:
                    payload = raw
            else:
                payload = raw
            return resp.status, payload, {k.lower(): v for k, v in resp.headers.items()}
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors="replace")
        try:
            payload = json.loads(raw) if raw.startswith("{") else raw
        except json.JSONDecodeError:
            payload = raw
        return e.code, payload, {k.lower(): v for k, v in e.headers.items()}


def check(name: str, cond: bool, detail: str = "") -> None:
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  OK  {name}")
    else:
        FAIL += 1
        print(f" FAIL {name} {detail}")


def main() -> int:
    print("== Security tests ==")

    status, _, headers = req("GET", "/api/hoy")
    check("API protegida sin token", status == 401)
    check("Header nosniff", headers.get("x-content-type-options") == "nosniff", str(headers))
    check("Header frame deny", headers.get("x-frame-options") == "DENY", str(headers))

    status, _, _ = req("GET", "/api/health")
    check("Health público", status == 200)

    status, _, _ = req("GET", "/docs")
    check("Docs deshabilitadas", status in (404, 405))

    status, _, _ = req("POST", "/api/auth/login", {"username": "Franckeell", "password": "wrong"})
    check("Login incorrecto", status == 401)

    status, data, _ = req("POST", "/api/auth/login", {"username": "Franckeell", "password": "Noatak"})
    token = ""
    if status == 200 and isinstance(data, dict):
        token = data.get("access_token", "")
    check("Login correcto", bool(token), f"status={status} data={data}")

    status, hoy, _ = req("GET", "/api/hoy", headers={"Authorization": f"Bearer {token}"})
    check("API con token", status == 200 and isinstance(hoy, dict))

    status, me, _ = req("GET", "/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    check("Usuario en /me", status == 200 and isinstance(me, dict) and me.get("user") == "Franckeell")

    status, _, _ = req("POST", "/api/telegram/webhook", {"message": {"text": "/hoy", "chat": {"id": 1}}})
    check("Webhook sin secret bloqueado", status == 403)

    status, _, _ = req(
        "POST",
        "/api/telegram/webhook",
        {"message": {"text": "/hoy", "chat": {"id": 1}}},
        headers={"X-Telegram-Bot-Api-Secret-Token": "token-falso"},
    )
    check("Webhook secret falso bloqueado", status == 403)

    status, body, _ = req("GET", "/..%2f..%2f..%2fetc/passwd")
    leaked = isinstance(body, str) and ("root:" in body or "daemon:" in body)
    check("Path traversal no filtra /etc/passwd", not leaked and status in (200, 404))

    limited = False
    for _ in range(12):
        code, _, _ = req("POST", "/api/auth/login", {"username": "x", "password": "y"})
        if code == 429:
            limited = True
            break
    check("Rate limit login", limited)

    print(f"\nResultado: {PASS} ok, {FAIL} fallos")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
