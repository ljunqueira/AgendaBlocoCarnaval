from __future__ import annotations

import json
from datetime import datetime, time, timedelta
from typing import Any
from urllib.request import urlopen
from zoneinfo import ZoneInfo

from fastapi import FastAPI, Header, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from src.db.models import FeedState, Neighborhood, Parade, Service, ServiceType
from src.db.session import SessionLocal, engine
from src.settings.env import get_settings

app = FastAPI(title="Agenda Bloco API", version="0.1.0")
settings = get_settings()
SOURCE_URL = "https://www.carnavalderua.rio/api/carnaval-rio-2026/batch.json"
LOCAL_TZ = ZoneInfo("America/Sao_Paulo")


@app.on_event("startup")
def startup_check() -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


@app.get("/health")
def health_check() -> dict[str, bool]:
    return {"ok": True}


def fetch_feed() -> dict[str, Any]:
    with urlopen(SOURCE_URL) as response:
        return json.load(response)


def parse_float(value: Any) -> float | None:
    if value in ("", None):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_int(value: Any) -> int | None:
    if value in ("", None):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=LOCAL_TZ)
    return parsed.astimezone(LOCAL_TZ)


def combine_date_time(date_value: str | None, time_value: str | None) -> datetime | None:
    if not date_value:
        return None
    base = parse_datetime(date_value)
    if not base:
        return None
    if not time_value:
        return base
    try:
        parsed_time = time.fromisoformat(time_value)
    except ValueError:
        return base
    return datetime.combine(base.date(), parsed_time, tzinfo=LOCAL_TZ)


def normalize_address(address: str | None, description: str | None) -> str | None:
    if address and address.strip():
        return address.strip()
    if description and description.strip():
        return description.strip()
    return None


def get_session() -> Session:
    return SessionLocal()


@app.post("/admin/sync")
def sync_feed(x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")) -> dict[str, Any]:
    if x_admin_token != settings.admin_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token.")

    payload = fetch_feed()
    last_update = payload.get("last_update")

    with get_session() as session:
        feed_state = session.scalar(select(FeedState).where(FeedState.source_url == SOURCE_URL))
        if last_update and feed_state and feed_state.etag == last_update:
            return {"status": "skipped", "last_update": last_update}

        if not feed_state:
            feed_state = FeedState(source_url=SOURCE_URL)
            session.add(feed_state)

        neighborhoods = payload.get("neighborhoods", [])
        for item in neighborhoods:
            if not item.get("id") or not item.get("name"):
                continue
            session.merge(Neighborhood(id=item["id"], name=item["name"]))

        service_types = payload.get("service_types", [])
        service_type_lookup: dict[str, int] = {}
        for item in service_types:
            name = item.get("name") or item.get("title")
            service_type_key = item.get("name") or name
            if not item.get("id") or not name or not service_type_key:
                continue
            service_type_lookup[service_type_key] = item["id"]
            session.merge(ServiceType(id=item["id"], name=name))

        services = payload.get("services", [])
        for item in services:
            if not item.get("id"):
                continue
            name = item.get("title") or item.get("name") or "Sem nome"
            service_type_id = service_type_lookup.get(item.get("service_type_name", ""))
            session.merge(
                Service(
                    id=item["id"],
                    name=name,
                    description=item.get("description"),
                    address=normalize_address(item.get("address"), item.get("description")),
                    latitude=parse_float(item.get("lat")),
                    longitude=parse_float(item.get("lng")),
                    neighborhood_id=item.get("neighborhood_id"),
                    service_type_id=service_type_id,
                )
            )

        parade_items = payload.get("parades") or payload.get("street_attractions", [])
        for item in parade_items:
            if not item.get("id"):
                continue
            start_at = combine_date_time(item.get("date"), item.get("parade_time"))
            end_at = combine_date_time(item.get("date"), item.get("end_time"))
            if start_at and end_at and end_at <= start_at:
                end_at = end_at + timedelta(days=1)

            session.merge(
                Parade(
                    id=item["id"],
                    name=item.get("title") or item.get("name") or "Sem nome",
                    description=item.get("description"),
                    location=normalize_address(item.get("address"), item.get("description")),
                    start_at=start_at,
                    end_at=end_at,
                    latitude=parse_float(item.get("lat")),
                    longitude=parse_float(item.get("lng")),
                    foundation_year=parse_int(item.get("foundation_year")),
                    neighborhood_id=item.get("neighborhood_id"),
                )
            )

        feed_state.etag = last_update
        feed_state.last_synced_at = datetime.now(tz=LOCAL_TZ)
        session.commit()

    return {"status": "synced", "last_update": last_update}
