from fastapi.testclient import TestClient

from src.main import app


def test_health_check() -> None:
    app.router.on_startup.clear()
    app.router.on_shutdown.clear()

    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True}
