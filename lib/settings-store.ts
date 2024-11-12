import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  runnableGradient: number;
  setRunnableGradient: (value: number) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      runnableGradient: 15,
      setRunnableGradient: (value) => set({ runnableGradient: value }),
    }),
    {
      name: "user-settings",
    }
  )
);