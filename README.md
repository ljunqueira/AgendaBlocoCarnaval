# Agenda Bloco Carnaval

Monorepo inicial com frontend e API para o MVP do Agenda de Blocos de Carnaval.

## Estrutura

- `apps/web`: Next.js + Tailwind (frontend)
- `apps/api`: FastAPI (backend)
- `BACKLOG.md`: backlog e decisões de stack

## Como começar

### Web

```bash
cd apps/web
npm install
npm run dev
```

### API

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Healthcheck

- API: `GET /health`
