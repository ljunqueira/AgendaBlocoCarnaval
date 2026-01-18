from fastapi import FastAPI
from sqlalchemy import text

from src.db.session import engine

app = FastAPI(title="Agenda Bloco API", version="0.1.0")


@app.on_event("startup")
def startup_check() -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


@app.get("/health")
def health_check() -> dict[str, bool]:
    return {"ok": True}
