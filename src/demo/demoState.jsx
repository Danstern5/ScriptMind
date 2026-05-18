import { createContext, useContext, useState, useMemo } from 'react';
import { screenplayInvest, screenplayPass } from './screenplays';

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [branch, setBranch] = useState('invest'); // 'invest' | 'pass'

  const screenplay = useMemo(
    () => (branch === 'invest' ? screenplayInvest : screenplayPass),
    [branch]
  );

  return (
    <DemoContext.Provider value={{ branch, setBranch, screenplay }}>
      {children}
    </DemoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDemo = () => useContext(DemoContext);
