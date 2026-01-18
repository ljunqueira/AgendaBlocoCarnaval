"use client";

/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ParadeDetail = {
  id: number | string;
  name: string;
  description?: string | null;
  location?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  neighborhood?: {
    id: number;
    name: string;
    region?: string | null;
  } | null;
  neighborhood_name?: string | null;
  region?: string | null;
  attraction_type?: string | null;
  estimated_public?: number | string | null;
  estimated_audience?: number | string | null;
  expected_public?: number | string | null;
  expected_audience?: number | string | null;
  image_url?: string | null;
  image?: string | null;
  photo_url?: string | null;
  photo?: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const STORAGE_KEY = "agenda.parades";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false
});

const formatDisplayDateTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(parsed);
};

const formatDateRange = (start?: string | null, end?: string | null) => {
  const formattedStart = formatDisplayDateTime(start);
  const formattedEnd = formatDisplayDateTime(end);
  if (formattedStart && formattedEnd) {
    return `${formattedStart} até ${formattedEnd}`;
  }
  return formattedStart ?? formattedEnd ?? "Horário a confirmar";
};

const readAgenda = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String);
  } catch (error) {
    console.warn("Falha ao ler agenda local.", error);
    return [];
  }
};

const writeAgenda = (items: string[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const DesfileDetalhePage = () => {
  const params = useParams<{ id: string }>();
  const paradeId = params?.id ? String(params.id) : null;
  const [parade, setParade] = useState<ParadeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInAgenda, setIsInAgenda] = useState(false);

  useEffect(() => {
    if (!paradeId) return;
    const agenda = readAgenda();
    setIsInAgenda(agenda.includes(String(paradeId)));
  }, [paradeId]);

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
      });
    });
  }, []);

  useEffect(() => {
    if (!paradeId) {
      setLoading(false);
      setError("Desfile não encontrado.");
      return;
    }
    let isMounted = true;
    const fetchParade = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/v1/parades/${paradeId}`);
        if (!response.ok) throw new Error("Falha ao carregar desfile.");
        const payload = (await response.json()) as ParadeDetail;
        if (isMounted) {
          setParade(payload);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Não foi possível carregar o desfile.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchParade();
    return () => {
      isMounted = false;
    };
  }, [paradeId]);

  const { latitude, longitude, hasCoordinates } = useMemo(() => {
    const rawLatitude = parade?.latitude ?? parade?.lat;
    const rawLongitude = parade?.longitude ?? parade?.lng;
    const latValue =
      typeof rawLatitude === "string" ? Number(rawLatitude) : rawLatitude;
    const lngValue =
      typeof rawLongitude === "string" ? Number(rawLongitude) : rawLongitude;
    const isValid =
      typeof latValue === "number" &&
      Number.isFinite(latValue) &&
      typeof lngValue === "number" &&
      Number.isFinite(lngValue);
    return {
      latitude: latValue,
      longitude: lngValue,
      hasCoordinates: isValid
    };
  }, [parade?.latitude, parade?.longitude, parade?.lat, parade?.lng]);

  const estimatedPublic =
    parade?.estimated_public ??
    parade?.estimated_audience ??
    parade?.expected_public ??
    parade?.expected_audience;

  const photoUrl =
    parade?.image_url ?? parade?.image ?? parade?.photo_url ?? parade?.photo;

  const handleToggleAgenda = () => {
    if (!paradeId) return;
    const current = readAgenda();
    const idValue = String(paradeId);
    if (current.includes(idValue)) {
      const next = current.filter((item) => item !== idValue);
      writeAgenda(next);
      setIsInAgenda(false);
      return;
    }
    const next = [...current, idValue];
    writeAgenda(next);
    setIsInAgenda(true);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-3">
        <Link href="/programacao" className="text-sm text-rose-200">
          ← Voltar para programação
        </Link>
        <h1 className="text-3xl font-semibold sm:text-4xl">Detalhes do desfile</h1>
      </header>

      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-200">
          Carregando desfile...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      )}

      {!loading && !error && parade && (
        <section className="grid gap-6">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold">{parade.name}</h2>
                <p className="text-sm text-slate-300">
                  {parade.attraction_type ?? "Bloco"}
                </p>
                <p className="text-sm text-slate-200">
                  {formatDateRange(parade.start_at, parade.end_at)}
                </p>
                <p className="text-sm text-slate-300">
                  {parade.location ?? "Endereço a confirmar"}
                </p>
                {(parade.neighborhood?.name ||
                  parade.neighborhood_name ||
                  parade.neighborhood?.region ||
                  parade.region) && (
                  <p className="text-sm text-slate-400">
                    {parade.neighborhood?.name ?? parade.neighborhood_name ?? ""}
                    {parade.neighborhood?.region || parade.region
                      ? ` • ${parade.neighborhood?.region ?? parade.region}`
                      : ""}
                  </p>
                )}
                {estimatedPublic && (
                  <p className="text-sm text-slate-300">
                    Público estimado: {estimatedPublic}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleToggleAgenda}
                className="rounded-full border border-rose-400 px-5 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
              >
                {isInAgenda ? "Remover da agenda" : "Adicionar à agenda"}
              </button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Descrição</h3>
                <p className="text-sm text-slate-300">
                  {parade.description ?? "Sem descrição disponível."}
                </p>
              </div>
              {photoUrl && (
                <div className="overflow-hidden rounded-2xl border border-slate-800">
                  <img
                    src={photoUrl}
                    alt={`Foto do desfile ${parade.name}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-lg font-semibold">Mapa</h3>
            {hasCoordinates ? (
              <div className="mt-4 h-80 overflow-hidden rounded-2xl">
                <MapContainer
                  center={[latitude as number, longitude as number]}
                  zoom={15}
                  className="h-full w-full"
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[latitude as number, longitude as number]} />
                </MapContainer>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Localização a confirmar. O mapa será exibido quando o ponto do
                desfile estiver disponível.
              </p>
            )}
          </article>
        </section>
      )}
    </main>
  );
};

export default DesfileDetalhePage;
