import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

export type PageId = 'dashboard' | 'study' | 'browse' | 'import' | 'settings' | 'stats' | 'app-settings';

export interface NavState {
  page: PageId;
  params?: Record<string, string>;
}

interface NavigationContextValue {
  currentNav: NavState;
  navigate: (page: PageId, params?: Record<string, string>) => void;
  goBack: () => void;
  direction: number; // 1 = forward, -1 = back
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<NavState[]>([{ page: 'dashboard' }]);
  const [direction, setDirection] = useState(1);

  const currentNav = history[history.length - 1];

  const navigate = useCallback((page: PageId, params?: Record<string, string>) => {
    setDirection(1);
    setHistory(prev => [...prev, { page, params }]);
    window.history.pushState({ page, params }, '', '');
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  // Predictive back gesture support via popstate
  useEffect(() => {
    const onPopState = () => {
      setDirection(-1);
      setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <NavigationContext.Provider value={{ currentNav, navigate, goBack, direction }}>
      {children}
    </NavigationContext.Provider>
  );
}
