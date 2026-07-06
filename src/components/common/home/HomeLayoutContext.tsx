import { createContext, useContext } from 'react';

type HomeLayoutActions = {
  openSettings?: () => void;
};

const HomeLayoutContext = createContext<HomeLayoutActions>({});

export function HomeLayoutProvider({
  children,
  openSettings,
}: {
  children: React.ReactNode;
  openSettings?: () => void;
}) {
  return (
    <HomeLayoutContext.Provider value={{ openSettings }}>
      {children}
    </HomeLayoutContext.Provider>
  );
}

export function useHomeLayoutActions() {
  return useContext(HomeLayoutContext);
}
