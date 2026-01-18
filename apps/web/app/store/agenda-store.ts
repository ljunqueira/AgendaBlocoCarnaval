import { create } from "zustand";
import { createJSONStorage, persist, type PersistStorage } from "zustand/middleware";

type AgendaState = {
  paradeIds: string[];
  addParade: (id: string) => void;
  removeParade: (id: string) => void;
  clearAgenda: () => void;
  hasParade: (id: string) => boolean;
};

const STORAGE_KEY = "agenda.parades";

const fallbackStorage: PersistStorage<AgendaState> = {
  getItem: (_name) => null,
  setItem: (_name, _value) => {},
  removeItem: (_name) => {}
};

export const useAgendaStore = create<AgendaState>()(
  persist(
    (set, get) => ({
      paradeIds: [],
      addParade: (id) => {
        const normalized = String(id);
        const current = get().paradeIds;
        if (current.includes(normalized)) return;
        set({ paradeIds: [...current, normalized] });
      },
      removeParade: (id) => {
        const normalized = String(id);
        set({ paradeIds: get().paradeIds.filter((item) => item !== normalized) });
      },
      clearAgenda: () => set({ paradeIds: [] }),
      hasParade: (id) => {
        const normalized = String(id);
        return get().paradeIds.includes(normalized);
      }
    }),
    {
      name: STORAGE_KEY,
      storage:
        typeof window !== "undefined"
          ? createJSONStorage<AgendaState>(() => window.localStorage)
          : fallbackStorage
    }
  )
);
