# Agenda Bloco API

## Setup local

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Rodar API

```bash
uvicorn src.main:app --reload --port 8000
```

## Migrations (Alembic)

Configure a variável `DATABASE_URL` (ou `.env`) apontando para seu Postgres:

```bash
export DATABASE_URL=postgresql://agenda:agenda@localhost:5432/agenda
```

Rodar migrations do zero (a partir da pasta `apps/api`):

```bash
alembic -c alembic.ini upgrade head
```

Para recriar do zero, apague o banco ou rode `dropdb` e execute novamente:

```bash
dropdb agenda
createdb agenda
alembic -c alembic.ini upgrade head
```

## Endpoint de health

- `GET /health`
