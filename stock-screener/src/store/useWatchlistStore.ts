import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchlistState {
  /** Map of list name → ticker symbols */
  lists: Record<string, string[]>;
  /** Currently active list name */
  activeList: string;
}

interface WatchlistActions {
  createList: (name: string) => void;
  deleteList: (name: string) => void;
  renameList: (oldName: string, newName: string) => void;
  setActiveList: (name: string) => void;
  addTicker: (listName: string, symbol: string) => void;
  removeTicker: (listName: string, symbol: string) => void;
  toggleTicker: (listName: string, symbol: string) => void;
  isInWatchlist: (listName: string, symbol: string) => boolean;
  clearList: (name: string) => void;
}

const DEFAULT_LIST = "My Watchlist";

export const useWatchlistStore = create<WatchlistState & WatchlistActions>()(
  persist(
    (set, get) => ({
      lists: { [DEFAULT_LIST]: [] },
      activeList: DEFAULT_LIST,

      createList: (name) =>
        set((s) => ({
          lists: { ...s.lists, [name]: [] },
          activeList: name,
        })),

      deleteList: (name) =>
        set((s) => {
          const next = { ...s.lists };
          delete next[name];
          const remaining = Object.keys(next);
          // If deleted list was active, switch to first available
          const activeList =
            s.activeList === name
              ? remaining[0] ?? DEFAULT_LIST
              : s.activeList;
          // Ensure default always exists
          if (!next[DEFAULT_LIST]) next[DEFAULT_LIST] = [];
          return { lists: next, activeList };
        }),

      renameList: (oldName, newName) =>
        set((s) => {
          if (oldName === DEFAULT_LIST) return s; // cannot rename default
          const next = { ...s.lists };
          next[newName] = next[oldName] ?? [];
          delete next[oldName];
          return {
            lists: next,
            activeList: s.activeList === oldName ? newName : s.activeList,
          };
        }),

      setActiveList: (name) => set({ activeList: name }),

      addTicker: (listName, symbol) =>
        set((s) => {
          const current = s.lists[listName] ?? [];
          if (current.includes(symbol)) return s;
          return { lists: { ...s.lists, [listName]: [...current, symbol] } };
        }),

      removeTicker: (listName, symbol) =>
        set((s) => ({
          lists: {
            ...s.lists,
            [listName]: (s.lists[listName] ?? []).filter((t) => t !== symbol),
          },
        })),

      toggleTicker: (listName, symbol) => {
        const { lists, addTicker, removeTicker } = get();
        const inList = (lists[listName] ?? []).includes(symbol);
        inList ? removeTicker(listName, symbol) : addTicker(listName, symbol);
      },

      isInWatchlist: (listName, symbol) =>
        (get().lists[listName] ?? []).includes(symbol),

      clearList: (name) =>
        set((s) => ({ lists: { ...s.lists, [name]: [] } })),
    }),
    {
      name: "stock-screener-watchlists",
    }
  )
);

export const selectActiveListTickers = (s: WatchlistState & WatchlistActions) => {
  if (!s || !s.lists || !s.activeList) return [];
  return s.lists[s.activeList] ?? [];
};
export const selectAllLists = (s: WatchlistState & WatchlistActions) => {
  if (!s || !s.lists) return [];
  return Object.keys(s.lists);
};
export const selectActiveListName = (s: WatchlistState & WatchlistActions) =>
  s.activeList;
