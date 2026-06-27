import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface TourContextValue {
  isOpen: boolean;
  startTour: () => void;
  closeTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const startTour = useCallback(() => setIsOpen(true), []);
  const closeTour = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, startTour, closeTour }), [isOpen, startTour, closeTour]);
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside <TourProvider>");
  return ctx;
}