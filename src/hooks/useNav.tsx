import { createContext, useContext } from 'react';

export type Screen = 'home' | 'setup' | 'game' | 'history' | 'stats' | 'custom';

export interface NavApi {
  screen: Screen;
  go: (s: Screen) => void;
  openRules: () => void;
}

export const NavContext = createContext<NavApi | null>(null);

export function useNav(): NavApi {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav doit être utilisé dans <NavContext.Provider>');
  return ctx;
}
