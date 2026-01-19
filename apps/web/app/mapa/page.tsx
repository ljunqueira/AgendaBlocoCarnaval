"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

type Parade = {
  id: number | string;
  name: string;
  location?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
};

type ParadesResponse = {
  items?: Parade[];
  data?: Parade[];
};

type ServiceType = {
  id: number | string;
  name: string;
  menu_order?: number | null;
};

type Service = {
  id: number | string;
  name: string;
  description?: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  service_type_id?: number | string | null;
};

type ServicesResponse = {
  items?: Service[];
  data?: Service[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const DEFAULT_CENTER: [number, number] = [-22.9068, -43.1729];

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
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false
});

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseNumber = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

const getCoordinates = (item: {
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
}) => {
  const latitude = parseNumber(item.latitude ?? item.lat);
  const longitude = parseNumber(item.longitude ?? item.lng);
  if (latitude === null || longitude === null) return null;
  return { latitude, longitude };
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

const MapaPage = () => {
  const [parades, setParades] = useState<Parade[]>([]);
  const [paradeLoading, setParadeLoading] = useState(false);
  const [paradeError, setParadeError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(() => formatInputDate(new Date()));
  const [dateTo, setDateTo] = useState(() => formatInputDate(new Date()));

  const [servicesEnabled, setServicesEnabled] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

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

  const paradeMarkers = useMemo(() => {
    return parades
      .map((parade) => {
        const coords = getCoordinates(parade);
        if (!coords) return null;
        return {
          ...parade,
          latitude: coords.latitude,
          longitude: coords.longitude
        };
      })
      .filter((item): item is Parade & { latitude: number; longitude: number } =>
        Boolean(item)
      );
  }, [parades]);

  const serviceMarkers = useMemo(() => {
    return services
      .map((service) => {
        const coords = getCoordinates(service);
        if (!coords) return null;
        return {
          ...service,
          latitude: coords.latitude,
          longitude: coords.longitude
        };
      })
      .filter(
        (item): item is Service & { latitude: number; longitude: number } =>
          Boolean(item)
      );
  }, [services]);

  const fetchParades = useCallback(async () => {
    try {
      setParadeLoading(true);
      setParadeError(null);
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("per_page", "500");
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const response = await fetch(
        `${API_BASE_URL}/v1/parades?${params.toString()}`
      );
      if (!response.ok) throw new Error("Falha ao carregar desfiles.");
      const payload = (await response.json()) as ParadesResponse | Parade[];
      const items = Array.isArray(payload)
        ? payload
        : payload.items ?? payload.data ?? [];
      setParades(items);
    } catch (err) {
      console.error(err);
      setParadeError("Não foi possível carregar os desfiles no mapa.");
    } finally {
      setParadeLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchServiceTypes = useCallback(async () => {
    try {
      setServiceLoading(true);
      setServiceError(null);
      const response = await fetch(`${API_BASE_URL}/v1/service-types`);
      if (!response.ok) throw new Error("Falha ao carregar tipos de serviço.");
      const payload = (await response.json()) as ServiceType[];
      const ordered = [...payload].sort((a, b) => {
        const left = a.menu_order ?? 0;
        const right = b.menu_order ?? 0;
        if (left !== right) return left - right;
        return a.name.localeCompare(b.name);
      });
      setServiceTypes(ordered);
      if (!selectedServiceType && ordered[0]) {
        setSelectedServiceType(String(ordered[0].id));
      }
    } catch (err) {
      console.error(err);
      setServiceError("Não foi possível carregar os tipos de serviço.");
    } finally {
      setServiceLoading(false);
    }
  }, [selectedServiceType]);

  const fetchServices = useCallback(
    async (serviceTypeId: string) => {
      try {
        setServiceLoading(true);
        setServiceError(null);
        const params = new URLSearchParams();
        if (serviceTypeId) params.set("type", serviceTypeId);
        const response = await fetch(
          `${API_BASE_URL}/v1/services?${params.toString()}`
        );
        if (!response.ok) throw new Error("Falha ao carregar serviços.");
        const payload = (await response.json()) as ServicesResponse | Service[];
        const items = Array.isArray(payload)
          ? payload
          : payload.items ?? payload.data ?? [];
        setServices(items);
      } catch (err) {
        console.error(err);
        setServiceError("Não foi possível carregar os serviços no mapa.");
      } finally {
        setServiceLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchParades();
  }, [fetchParades]);

  useEffect(() => {
    if (!servicesEnabled) {
      setServices([]);
      setServiceError(null);
      return;
    }
    fetchServiceTypes();
  }, [fetchServiceTypes, servicesEnabled]);

  useEffect(() => {
    if (!servicesEnabled) return;
    if (!selectedServiceType) return;
    fetchServices(selectedServiceType);
  }, [fetchServices, selectedServiceType, servicesEnabled]);

  const serviceTypeOptions = useMemo(
    () =>
      serviceTypes.map((type) => ({
        value: String(type.id),
        label: type.name
      })),
    [serviceTypes]
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Mapa</h1>
        <p className="text-slate-300">
          Explore a programação por mapa e combine com serviços úteis.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Data inicial
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Data final
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <button
            type="button"
            onClick={fetchParades}
            className="rounded-full border border-rose-400 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
          >
            Atualizar desfiles
          </button>
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={servicesEnabled}
                onChange={(event) => setServicesEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-rose-400"
              />
              Mostrar serviços
            </label>
            <select
              value={selectedServiceType}
              onChange={(event) => setSelectedServiceType(event.target.value)}
              disabled={!servicesEnabled || serviceTypeOptions.length === 0}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
            >
              {serviceTypeOptions.length === 0 ? (
                <option value="">Carregando tipos...</option>
              ) : (
                serviceTypeOptions.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
          <span>
            {paradeLoading
              ? "Carregando desfiles..."
              : `${paradeMarkers.length} desfiles com localização`}
          </span>
          {paradeError && <span className="text-rose-200">{paradeError}</span>}
          {servicesEnabled && (
            <span>
              {serviceLoading
                ? "Carregando serviços..."
                : `${serviceMarkers.length} serviços no mapa`}
            </span>
          )}
          {serviceError && <span className="text-rose-200">{serviceError}</span>}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-800">
        <div className="h-[70vh] min-h-[420px]">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            className="h-full w-full"
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {paradeMarkers.map((parade) => (
              <Marker
                key={`parade-${parade.id}`}
                position={[parade.latitude, parade.longitude]}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {parade.name}
                    </p>
                    <p className="text-xs text-slate-700">
                      {parade.location ?? "Local a confirmar"}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {formatDisplayDateTime(parade.start_at)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {servicesEnabled &&
              serviceMarkers.map((service) => (
                <Marker
                  key={`service-${service.id}`}
                  position={[service.latitude, service.longitude]}
                >
                  <Popup>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {service.name}
                      </p>
                      <p className="text-xs text-slate-700">
                        {service.address ?? "Endereço não informado"}
                      </p>
                      {service.description && (
                        <p className="text-[11px] text-slate-600">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </section>
    </main>
  );
};

export default MapaPage;
