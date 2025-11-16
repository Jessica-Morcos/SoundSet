// src/context/SidebarContext.jsx
import { createContext, useState } from "react";

export const SidebarContext = createContext();

export default function SidebarProvider({ children }) {
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isStatsOpen, setIsStatsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}
