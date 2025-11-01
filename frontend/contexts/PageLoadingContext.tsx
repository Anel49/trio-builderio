import React, { createContext, useContext, useState, useCallback } from "react";

interface PageLoadingContextType {
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
}

const PageLoadingContext = createContext<PageLoadingContextType | undefined>(
  undefined,
);

export function PageLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isPageLoading, setPageLoading] = useState(true);

  return (
    <PageLoadingContext.Provider value={{ isPageLoading, setPageLoading }}>
      {children}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading() {
  const context = useContext(PageLoadingContext);
  if (!context) {
    throw new Error("usePageLoading must be used within PageLoadingProvider");
  }
  return context;
}
