"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Parade = {
  id: number | string;
  name: string;
  description?: string | null;
  location?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  neighborhood?: {
    id: number;
    name: string;
    region?: string | null;
  } | null;
  neighborhood_name?: string | null;
  region?: string | null;
  attraction_type?: string | null;
};

type Neighborhood = {
  id: number;
  name: string;
  region?: string | null;
};

type ParadesResponse = {
  items?: Parade[];
  data?: Parade[];
  page?: number;
  per_page?: number;
  total?: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const PER_PAGE = 20;

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDateTime = (value?: string | null) => {
  if (!value) return "Horário a confirmar";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "Horário a confirmar";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
};

const getWeekendRange = (base: Date) => {
  const day = base.getDay();
  const saturdayOffset = (6 - day + 7) % 7;
  const saturday = new Date(base);
  saturday.setDate(base.getDate() + saturdayOffset);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return { saturday, sunday };
};

const ProgramacaoPage = () => {
  const [parades, setParades] = useState<Parade[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [region, setRegion] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [attractionType, setAttractionType] = useState("");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [preset, setPreset] = useState("hoje");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredNeighborhoods = useMemo(() => {
    if (!region) return neighborhoods;
    return neighborhoods.filter((item) => (item.region ?? "") === region);
  }, [neighborhoods, region]);

  const availableRegions = useMemo(() => {
    const unique = new Set(
      neighborhoods
        .map((item) => item.region)
        .filter((value): value is string => Boolean(value))
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [neighborhoods]);

  const availableTypes = useMemo(() => {
    const unique = new Set(
      parades
        .map((item) => item.attraction_type)
        .filter((value): value is string => Boolean(value))
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [parades]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", String(PER_PAGE));
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (region) params.set("region", region);
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (attractionType) params.set("attraction_type", attractionType);
    if (query.trim()) params.set("q", query.trim());
    return params;
  }, [page, dateFrom, dateTo, region, neighborhood, attractionType, query]);

  const fetchNeighborhoods = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/neighborhoods`);
      if (!response.ok) throw new Error("Falha ao carregar bairros.");
      const payload = (await response.json()) as Neighborhood[];
      setNeighborhoods(payload);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchParades = useCallback(
    async (mode: "initial" | "more") => {
      try {
        if (mode === "initial") {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);
        const response = await fetch(
          `${API_BASE_URL}/v1/parades?${queryParams.toString()}`
        );
        if (!response.ok) throw new Error("Falha ao carregar programação.");
        const payload = (await response.json()) as ParadesResponse | Parade[];
        const items = Array.isArray(payload)
          ? payload
          : payload.items ?? payload.data ?? [];
        const ordered = [...items].sort((a, b) => {
          const left = a.start_at ? new Date(a.start_at).getTime() : 0;
          const right = b.start_at ? new Date(b.start_at).getTime() : 0;
          return left - right;
        });
        setParades((prev) =>
          mode === "more" ? [...prev, ...ordered] : ordered
        );
        if (!Array.isArray(payload) && payload.total !== undefined) {
          const total = payload.total ?? 0;
          const current = (payload.page ?? page) * (payload.per_page ?? PER_PAGE);
          setHasMore(current < total);
        } else {
          setHasMore(items.length === PER_PAGE);
        }
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar os desfiles. Tente novamente.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page, queryParams]
  );

  useEffect(() => {
    fetchNeighborhoods();
  }, [fetchNeighborhoods]);

  useEffect(() => {
    const today = new Date();
    if (preset === "hoje") {
      const formatted = formatInputDate(today);
      setDateFrom(formatted);
      setDateTo(formatted);
    }
    if (preset === "amanha") {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const formatted = formatInputDate(tomorrow);
      setDateFrom(formatted);
      setDateTo(formatted);
    }
    if (preset === "fim-de-semana") {
      const { saturday, sunday } = getWeekendRange(today);
      setDateFrom(formatInputDate(saturday));
      setDateTo(formatInputDate(sunday));
    }
    if (preset === "intervalo") {
      setDateFrom("");
      setDateTo("");
    }
  }, [preset]);

  useEffect(() => {
    setPage(1);
    setParades([]);
    setHasMore(true);
  }, [dateFrom, dateTo, region, neighborhood, attractionType, query]);

  useEffect(() => {
    fetchParades(page === 1 ? "initial" : "more");
  }, [fetchParades, page]);

  useEffect(() => {
    if (region) {
      if (!filteredNeighborhoods.find((item) => item.name === neighborhood)) {
        setNeighborhood("");
      }
    }
  }, [filteredNeighborhoods, neighborhood, region]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    setPage((prev) => prev + 1);
  };

  const handleRetry = () => {
    setPage(1);
    fetchParades("initial");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">
          Programação
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Encontre o desfile ideal para você
        </h1>
        <p className="max-w-2xl text-slate-300">
          Combine filtros por data, região, bairro, tipo e nome para explorar todos
          os desfiles disponíveis.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "hoje", label: "Hoje" },
            { value: "amanha", label: "Amanhã" },
            { value: "fim-de-semana", label: "Fim de semana" },
            { value: "intervalo", label: "Intervalo" }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPreset(item.value)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                preset === item.value
                  ? "border-rose-400 bg-rose-500/20 text-rose-100"
                  : "border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Data inicial
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setPreset("intervalo");
                setDateFrom(event.target.value);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Data final
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setPreset("intervalo");
                setDateTo(event.target.value);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Região
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            >
              <option value="">Todas</option>
              {availableRegions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Bairro
            <select
              value={neighborhood}
              onChange={(event) => setNeighborhood(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            >
              <option value="">Todos</option>
              {filteredNeighborhoods.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Tipo
            <select
              value={attractionType}
              onChange={(event) => setAttractionType(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            >
              <option value="">Todos</option>
              {availableTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Buscar por nome
            <input
              type="search"
              placeholder="Ex: Cordão da Bola Preta"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-200">
            Carregando programação...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-100">
            <p>{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-lg border border-rose-400 px-4 py-2 text-sm"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && parades.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-200">
            Nenhum desfile encontrado. Ajuste os filtros para ver mais opções.
          </div>
        )}

        <div className="grid gap-4">
          {parades.map((parade) => (
            <Link
              key={parade.id}
              href={`/desfile/${parade.id}`}
              className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-600"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{parade.name}</h2>
                  <p className="text-sm text-slate-300">
                    {parade.neighborhood?.name ?? parade.neighborhood_name ?? ""}
                    {parade.neighborhood?.region || parade.region
                      ? ` • ${parade.neighborhood?.region ?? parade.region}`
                      : ""}
                  </p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                  {parade.attraction_type ?? "Bloco"}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-300">
                {formatDisplayDateTime(parade.start_at)}
              </p>
              {parade.location && (
                <p className="mt-2 text-sm text-slate-400">{parade.location}</p>
              )}
            </Link>
          ))}
        </div>

        {!loading && !error && hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-3 text-sm text-slate-200 transition hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "Carregando..." : "Carregar mais"}
          </button>
        )}
      </section>
    </main>
  );
};

export default ProgramacaoPage;
