# Stack recomendada (pragmática, rápida e escalável)

## Frontend (site)

- **Next.js (TypeScript):** SEO bom, rotas fáceis, deploy simples.
- **TailwindCSS:** UI rápida sem ficar brigando com CSS.
- **Mapas:** Leaflet + OpenStreetMap (custo zero; suficiente pro MVP).
- **State/local:** Zustand (leve) + localStorage/IndexedDB (agenda sem login).
- **UI:** shadcn/ui (componentes rápidos e bonitos) ou Mantine/Chakra se preferir.

## Backend (API e sync do feed)

Escolha 1:

- **FastAPI (Python):** ótimo pra ETL/sync, rápido de escrever, fácil de validar schema.
- **Node/NestJS:** ótimo se você preferir TypeScript fullstack.

Eu escolheria FastAPI para o “data layer” (sync + normalização) e API.

## Banco e cache

- **Postgres** (com PostGIS opcional mais pra frente).
- **Redis** (cache de `/parades` e `/services` e rate limit).

## Infra/Deploy

- **Frontend:** Vercel
- **Backend:** Render / Fly.io / Railway
- **DB:** Neon / Supabase / Railway Postgres

## Jobs (sync periódico)

- Cron do Render/Fly/Railway **ou**
- GitHub Actions agendado (simples) chamando endpoint `/admin/sync`

## Qualidade (desde o dia 1)

- Sentry (erros)
- PostHog (analytics) ou Plausible (mais simples)
- OpenAPI gerado pelo FastAPI (documenta sua API “de graça”)

## Estrutura de repositório recomendada

- `apps/web` (Next.js)
- `apps/api` (FastAPI ou Nest)
- `packages/shared` (tipos/validações compartilhadas, opcional)

Se quiser mais simples: dois repositórios separados. Monorepo ajuda quando tiver v2.

# Backlog em Markdown (MVP → Sprint 0, 1, 2, 3)

Convenção: **[P0]** obrigatório / **[P1]** importante / **[P2]** “nice”.

## Sprint 0 — Fundação de dados + API

- **[P0] Criar projeto API**
  - Setup (FastAPI/Nest), env vars, CORS, healthcheck `/health`
  - **Aceite:** API sobe local e em ambiente remoto

- **[P0] Job de sync do batch.json**
  - Baixar feed, ler `last_update`
  - Se `last_update` não mudou, não reprocessar
  - **Aceite:** log “no changes” quando não muda

- **[P0] Modelar e salvar tabelas principais**
  - `neighborhoods`, `service_types`, `services`, `parades`
  - **Aceite:** consegue consultar contagem de registros por tabela

- **[P0] Normalização de Parades (street_attractions)**
  - Converter lat/lng pra float
  - Derivar `start_at` e `end_at` com regras
  - **Aceite:** `start_at`/`end_at` sempre válidos quando houver horas

- **[P0] Endpoints públicos**
  - `GET /v1/neighborhoods`
  - `GET /v1/service-types`
  - `GET /v1/services?type=...`
  - `GET /v1/parades?...` (filtros + paginação)
  - `GET /v1/parades/{id}`
  - **Aceite:** documentação OpenAPI mostra todos e retornam JSON consistente

- **[P1] Cache**
  - Cache de listagens (parades/services) por querystring
  - **Aceite:** segunda chamada responde mais rápido e sem bater no DB (log/metric)

## Sprint 1 — Front MVP (programação + detalhe + agenda local)

- **[P0] Setup do Web**
  - Next.js + Tailwind + layout mobile-first
  - **Aceite:** deploy na Vercel com página inicial

- **[P0] Página Programação (lista + filtros completos)**
  - Filtros: data, região, bairro, tipo, busca
  - Ordenação padrão: horário
  - **Aceite:** filtros combináveis e lista atualiza

- **[P0] Página Detalhe do desfile**
  - Dados completos + mapa (pin)
  - **Aceite:** abre a partir da lista e renderiza sem quebrar

- **[P0] Minha Agenda (sem login)**
  - Add/remove
  - Timeline por dia
  - Persistência local
  - **Aceite:** recarrega página e agenda permanece

- **[P1] Aviso de conflito**
  - **Aceite:** se overlap de horários, mostra warning no card

- **[P1] Autocomplete**
  - Usar `grouped_street_attractions` (ou índice derivado)
  - **Aceite:** sugere nomes ao digitar

## Sprint 2 — Mapa + export + compartilhar read-only

- **[P0] Página Mapa**
  - Camadas: Desfiles e Serviços
  - Filtro de serviços por tipo
  - **Aceite:** toggles funcionam e pins aparecem

- **[P0] Exportar ICS**
  - Gera arquivo com eventos da agenda
  - **Aceite:** importar no Google Calendar funciona

- **[P0] Compartilhar link read-only**
  - Gerar URL com payload (IDs) comprimido
  - Modo leitura desabilita edição
  - **Aceite:** abrir link em outro navegador mostra mesma agenda

## Sprint 3 — Performance e polimento

- **[P0] Paginação/infinite scroll**
  - **Aceite:** lista não trava com muitos resultados

- **[P1] Melhorias de UX**
  - “Hoje / Amanhã / Este fim de semana”
  - Skeleton loading
  - **Aceite:** uso confortável no celular

- **[P1] Observabilidade**
  - Sentry no web + api
  - **Aceite:** erro forçado aparece no dashboard

- **[P2] Geo “perto de mim”**
  - Filtrar por raio usando lat/lng
  - **Aceite:** retorna itens próximos

# Decisões de ferramenta (minhas 2 recomendações finais)

Se você quer velocidade máxima e menos atrito:

- **Web:** Next.js + TS + Tailwind + Leaflet
- **API:** FastAPI + Postgres + Redis
- **Deploy:** Vercel (web) + Render/Fly (api) + Neon/Supabase (db)
