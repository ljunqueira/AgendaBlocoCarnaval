"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAgendaStore } from "../store/agenda-store";

type Parade = {
  id: number | string;
  name: string;
  location?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  neighborhood?: {
    name: string;
    region?: string | null;
  } | null;
  neighborhood_name?: string | null;
  region?: string | null;
  attraction_type?: string | null;
};

type GroupedParades = {
  key: string;
  label: string;
  items: Parade[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const formatDisplayDateTime = (value?: string | null) => {
  if (!value) return "Horário a confirmar";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "Horário a confirmar";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return "Data a confirmar";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "Data a confirmar";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full"
  }).format(parsed);
};

const getDateKey = (value?: string | null) => {
  if (!value) return "unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "unknown";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTimestamp = (value?: string | null) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return Number.POSITIVE_INFINITY;
  return parsed.getTime();
};

const detectConflicts = (items: Parade[]) => {
  const conflicts = new Set<string>();
  const intervals = items
    .map((item) => ({
      id: String(item.id),
      start: getTimestamp(item.start_at),
      end: getTimestamp(item.end_at)
    }))
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end));

  for (let i = 0; i < intervals.length; i += 1) {
    const current = intervals[i];
    for (let j = i + 1; j < intervals.length; j += 1) {
      const next = intervals[j];
      const overlaps = current.start < next.end && next.start < current.end;
      if (overlaps) {
        conflicts.add(current.id);
        conflicts.add(next.id);
      }
    }
  }

  return conflicts;
};

const MinhaAgendaPage = () => {
  const paradeIds = useAgendaStore((state) => state.paradeIds);
  const clearAgenda = useAgendaStore((state) => state.clearAgenda);
  const removeParade = useAgendaStore((state) => state.removeParade);
  const [parades, setParades] = useState<Parade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchParade = async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/v1/parades/${id}`);
      if (!response.ok) throw new Error("Falha ao carregar desfile.");
      return (await response.json()) as Parade;
    };

    const loadParades = async () => {
      if (paradeIds.length === 0) {
        setParades([]);
        setLoading(false);
        setError(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const results = await Promise.allSettled(
          paradeIds.map((id) => fetchParade(id))
        );
        const resolved = results
          .filter((result): result is PromiseFulfilledResult<Parade> =>
            result.status === "fulfilled"
          )
          .map((result) => result.value);
        if (isMounted) {
          setParades(resolved);
        }
        if (results.some((result) => result.status === "rejected")) {
          setError("Alguns desfiles não puderam ser carregados.");
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Não foi possível carregar sua agenda.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadParades();

    return () => {
      isMounted = false;
    };
  }, [paradeIds]);

  const groupedParades = useMemo<GroupedParades[]>(() => {
    const groups = new Map<string, Parade[]>();
    parades.forEach((parade) => {
      const key = getDateKey(parade.start_at);
      const current = groups.get(key) ?? [];
      groups.set(key, [...current, parade]);
    });

    const entries = Array.from(groups.entries()).map(([key, items]) => {
      const sorted = [...items].sort((a, b) => {
        return getTimestamp(a.start_at) - getTimestamp(b.start_at);
      });
      const label = key === "unknown" ? "Data a confirmar" : formatDisplayDate(items[0].start_at);
      return { key, label, items: sorted };
    });

    return entries.sort((a, b) => {
      if (a.key === "unknown") return 1;
      if (b.key === "unknown") return -1;
      return a.key.localeCompare(b.key);
    });
  }, [parades]);

  const conflictIds = useMemo(() => {
    const conflicts = new Set<string>();
    groupedParades.forEach((group) => {
      if (group.key === "unknown") return;
      detectConflicts(group.items).forEach((id) => conflicts.add(id));
    });
    return conflicts;
  }, [groupedParades]);

  const hasConflicts = conflictIds.size > 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Minha Agenda</h1>
          <p className="text-sm text-slate-300">
            {paradeIds.length === 0
              ? "Nenhum desfile salvo ainda."
              : `${paradeIds.length} desfile(s) salvo(s) na sua agenda.`}
          </p>
        </div>
        <button
          type="button"
          onClick={clearAgenda}
          disabled={paradeIds.length === 0}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpar agenda
        </button>
      </header>

      {hasConflicts && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          Conflitos detectados: alguns desfiles se sobrepõem no horário.
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-200">
          Carregando sua agenda...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      )}

      {!loading && paradeIds.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-200">
          Salve seus desfiles favoritos para montar sua programação pessoal.
        </div>
      )}

      <section className="flex flex-col gap-6">
        {groupedParades.map((group) => (
          <div
            key={group.key}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <h2 className="text-lg font-semibold text-slate-100">{group.label}</h2>
            <div className="mt-4 grid gap-4">
              {group.items.map((parade) => {
                const paradeId = String(parade.id);
                const hasConflict = conflictIds.has(paradeId);
                return (
                  <div
                    key={parade.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <Link
                        href={`/desfile/${parade.id}`}
                        className="text-lg font-semibold text-slate-100 hover:text-rose-200"
                      >
                        {parade.name}
                      </Link>
                      <p className="text-sm text-slate-300">
                        {parade.neighborhood?.name ?? parade.neighborhood_name ?? ""}
                        {parade.neighborhood?.region || parade.region
                          ? ` • ${parade.neighborhood?.region ?? parade.region}`
                          : ""}
                      </p>
                      <p className="text-sm text-slate-300">
                        {formatDisplayDateTime(parade.start_at)}
                        {parade.end_at
                          ? ` até ${formatDisplayDateTime(parade.end_at)}`
                          : ""}
                      </p>
                      {parade.location && (
                        <p className="text-xs text-slate-400">{parade.location}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      {hasConflict && (
                        <span className="rounded-full border border-amber-500/60 bg-amber-500/20 px-3 py-1 text-xs text-amber-100">
                          Conflito de horário
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeParade(paradeId)}
                        className="rounded-full border border-rose-400 px-3 py-1 text-xs text-rose-100 transition hover:bg-rose-500/20"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
};

export default MinhaAgendaPage;
