#!/usr/bin/env python3
"""End-to-end API smoke test against running InsightX backend."""
from __future__ import annotations

import asyncio
import sys

import httpx

BASE = "http://127.0.0.1:8000"


async def _request(client: httpx.AsyncClient, method: str, url: str, **kwargs) -> httpx.Response:
    """Retry once on transient connection errors (e.g. uvicorn reload)."""
    last_err: Exception | None = None
    for _ in range(3):
        try:
            return await client.request(method, url, **kwargs)
        except (httpx.ReadError, httpx.ConnectError) as exc:
            last_err = exc
            await asyncio.sleep(1.5)
    raise last_err or RuntimeError("request failed")


async def main() -> int:
    errors: list[str] = []

    def check(name: str, ok: bool, detail: str = "") -> None:
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))
        if not ok:
            errors.append(f"{name}: {detail}")

    async with httpx.AsyncClient(base_url=BASE, timeout=60) as client:
        try:
            r = await client.get("/health")
            check("Backend reachable", r.status_code == 200 and r.json().get("status") == "healthy")
        except Exception as exc:
            check("Backend reachable", False, str(exc))
            return 1

        creds = {
            "email": "e2e_test@insightx.ai",
            "password": "SecurePass123!",
            "full_name": "E2E Tester",
        }
        r = await _request(client, "POST", "/api/v1/auth/register", json=creds)
        if r.status_code == 201:
            token = r.json()["access_token"]
            check("Auth", True, "registered")
        else:
            r = await _request(client, "POST", "/api/v1/auth/login", json={
                "email": creds["email"],
                "password": creds["password"],
            })
            check("Auth", r.status_code == 200, "login ok" if r.status_code == 200 else r.text[:120])
            if r.status_code != 200:
                return 1
            token = r.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}

        r = await _request(client, "GET", "/api/v1/dashboard/stats", headers=headers)
        check("Dashboard stats", r.status_code == 200 and "total_investigations" in r.json())

        r = await _request(client, "GET", "/api/v1/alerts/dashboard", headers=headers)
        check("Dashboard alerts", r.status_code == 200 and "alerts" in r.json())

        r = await _request(
            client, "POST", "/api/v1/investigations",
            json={"title": "E2E Integration Test", "priority": "medium"},
            headers=headers,
        )
        check("Create investigation", r.status_code == 201)
        inv_id = r.json().get("id") if r.status_code == 201 else None

        if inv_id:
            r = await _request(client, "GET", f"/api/v1/investigations/{inv_id}", headers=headers)
            check("Get investigation", r.status_code == 200)

            r = await _request(client, "GET", f"/api/v1/analysis/investigations/{inv_id}/results", headers=headers)
            check("Analysis results", r.status_code == 200, f"count={len(r.json())}")

            r = await _request(client, "GET", f"/api/v1/timeline/investigations/{inv_id}", headers=headers)
            check("Timeline", r.status_code == 200)

            r = await _request(client, "GET", f"/api/v1/reports/investigations/{inv_id}/pdf", headers=headers)
            check("PDF guard (no results)", r.status_code == 400)

            r = await _request(
                client, "POST", "/api/v1/chat",
                json={"message": "Summarize this case briefly.", "investigation_id": inv_id},
                headers=headers,
            )
            body = r.json() if r.status_code == 200 else {}
            check(
                "Chat API",
                r.status_code == 200 and bool(body.get("content")),
                body.get("provider", r.text[:80]),
            )

        r = await _request(client, "GET", "/api/v1/investigations?page_size=10", headers=headers)
        if r.status_code == 200:
            for inv in r.json().get("items", []):
                inv_key = inv["id"]
                rr = await _request(client, "GET", f"/api/v1/analysis/investigations/{inv_key}/results", headers=headers)
                if rr.status_code == 200 and rr.json():
                    rp = await _request(client, "GET", f"/api/v1/reports/investigations/{inv_key}/pdf", headers=headers)
                    case = inv.get("case_number", inv_key[:8])
                    check(
                        f"PDF export ({case})",
                        rp.status_code == 200 and rp.content[:4] == b"%PDF",
                        f"{len(rp.content)} bytes",
                    )
                    break

    print()
    if errors:
        print(f"FAILED: {len(errors)}")
        for err in errors:
            print(f"  - {err}")
        return 1

    print("All integration checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
