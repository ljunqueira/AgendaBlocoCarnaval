from fastapi import FastAPI

app = FastAPI(title="Agenda Bloco API", version="0.1.0")


@app.get("/health")
def health_check() -> dict[str, bool]:
    return {"ok": True}
