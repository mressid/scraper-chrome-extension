import { create } from "zustand";

const useTheme = create<{
    theme: 'light' | 'dark',
    setTheme: (theme: 'light' | 'dark') => void
}>((set) => ({
  theme: 'dark' as 'light' | 'dark',
  setTheme: (theme: 'light' | 'dark') => set({ theme })
}))

export default useTheme; 