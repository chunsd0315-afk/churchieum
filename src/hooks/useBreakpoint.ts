import { useState, useEffect } from 'react';

/** Breakpoints: Mobile <768 · Tablet 768–1023 · PC ≥1024 */
export function useBreakpoint() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    handler();
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isPc = width >= 1024;

  return {
    width,
    isMobile,
    isTablet,
    isPc,
    /** Tablet + PC — sidebar / wide layout shell */
    isDesktop: width >= 768,
    isNotMobile: width >= 768,
  };
}
