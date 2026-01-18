# Agenda Bloco Carnaval

Monorepo inicial com frontend e API para o MVP do Agenda de Blocos de Carnaval.

## Estrutura

- `apps/web`: Next.js + Tailwind (frontend)
- `apps/api`: FastAPI (backend)
- `docs`: documentação de backlog e contrato de API
- `BACKLOG.md`: backlog e decisões de stack

## Variáveis de ambiente

### Web (`apps/web`)

- `NEXT_PUBLIC_API_URL` (ex: `http://localhost:8000`)

### API (`apps/api`)

- `APP_ENV` (ex: `local`)
- `DATABASE_URL` (ex: `postgresql://agenda:agenda@localhost:5432/agenda`)
- `REDIS_URL` (ex: `redis://localhost:6379/0`)

## Como começar

### Infra local (Postgres + Redis)

```bash
docker compose up -d
```

### Web

```bash
cd apps/web
npm install
npm run dev
```

Para build de produção:

```bash
npm run build
```

### API

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

## Healthcheck

- API: `GET /health`
