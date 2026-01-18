# Agenda Bloco API

## Setup local

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Rodar API

```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoint de health

- `GET /health`
