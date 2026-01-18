# AGENTS.md — Organize seu bloco (MVP)

## Objetivo
Implementar MVP com:
- apps/web: Next.js + TypeScript + Tailwind + Leaflet
- apps/api: FastAPI + Postgres + Redis (cache)
- Persistência de agenda no browser (sem login)
- Fonte de dados: batch.json do Carnaval de Rua (https://www.carnavalderua.rio/api/carnaval-rio-2026/batch.json)

## Convenções
- Monorepo em apps/web e apps/api
- Sempre rodar checagens antes de finalizar:
  - web: npm run lint && npm run build
  - api: pytest (se existir) e checar import/start do servidor
- Preferir soluções simples; evitar novas dependências sem necessidade.

## Backend (apps/api)
- Implementar:
  - POST /admin/sync (com token via header)
  - GET /v1/parades (+ filtros e paginação)
  - GET /v1/parades/{id}
  - GET /v1/neighborhoods
  - GET /v1/services, /v1/service-types
- Normalizar start_at/end_at no timezone America/Sao_Paulo.
- Cache de listagens com Redis (TTL 5–15 min).

## Frontend (apps/web)
- Páginas:
  - /programacao (filtros completos + lista)
  - /desfile/[id]
  - /minha-agenda (localStorage)
  - /mapa (camadas: desfiles + serviços)
- Share: link somente leitura no MVP (/share).
