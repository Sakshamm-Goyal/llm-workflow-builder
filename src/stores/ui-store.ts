import { create } from 'zustand';

interface UIState {
    isHistoryOpen: boolean;
    toggleHistory: () => void;
    setHistoryOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isHistoryOpen: false,
    toggleHistory: () => set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),
    setHistoryOpen: (isOpen) => set({ isHistoryOpen: isOpen }),
}));
