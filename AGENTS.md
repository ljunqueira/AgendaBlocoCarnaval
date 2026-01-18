# Instruções do projeto

- Monorepo com `apps/web` (Next.js + TypeScript + Tailwind + Leaflet) e `apps/api` (FastAPI + Postgres + Redis).
- MVP sem login: agenda salva no navegador.
- Fonte de dados: endpoint `https://www.carnavalderua.rio/api/carnaval-rio-2026/batch.json`.
- Regras:
  - timezone `America/Sao_Paulo`
  - normalização `start_at`/`end_at`
  - lat/lng para float
- Sempre rodar checks antes de finalizar PR:
  - web: `npm run lint && npm run build`
  - api: checar start do uvicorn e imports
