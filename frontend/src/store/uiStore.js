import { create } from 'zustand';

export const useUIStore = create((set) => ({
  showSearch: false,
  showNotifications: false,
  openSearch: () => set({ showSearch: true }),
  closeSearch: () => set({ showSearch: false }),
  toggleNotifications: () => set((state) => ({ showNotifications: !state.showNotifications })),
  setNotificationsOpen: (isOpen) => set({ showNotifications: isOpen }),
  wsConnected: false,
  setWsConnected: (value) => set({ wsConnected: value }),
}));
