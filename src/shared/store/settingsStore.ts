import { create } from 'zustand';

interface SettingsState {
  confirmDeleteTransactions: boolean;
  setConfirmDeleteTransactions: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  confirmDeleteTransactions: true,
  setConfirmDeleteTransactions: (value) => set({ confirmDeleteTransactions: value }),
})); 