import { createContext, useContext, useEffect, useState } from "react";

type Mode = "dark" | "light";
const Ctx = createContext<{ mode: Mode; toggle: () => void }>({ mode: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("dark");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme-mode") as Mode | null;
      if (saved) setMode(saved);
    } catch {}
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = mode;
    try { localStorage.setItem("theme-mode", mode); } catch {}
  }, [mode]);
  return <Ctx.Provider value={{ mode, toggle: () => setMode(m => m === "dark" ? "light" : "dark") }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
