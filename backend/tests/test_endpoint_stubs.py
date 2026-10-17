from httpx import ASGITransport, AsyncClient

from app.main import app


async def test_unimplemented_backend_endpoints_are_mounted_as_501() -> None:
    paths = (
        "/api/v1/participants",
        "/api/v1/expenses",
        "/api/v1/receipts",
        "/api/v1/reports/monthly-export",
        "/api/v1/reports/receipt-archive",
    )
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for path in paths:
            if path == "/api/v1/participants":
                response = await client.get(path)
            else:
                response = await client.post(path)
            assert response.status_code == 501, path
            assert "not implemented" in response.json()["detail"].lower(), path
