
import { useState, useEffect } from 'react';

interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const breakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;
  const isLargeDesktop = windowSize.width >= breakpoints.xl;

  const isBreakpoint = (breakpoint: keyof BreakpointConfig) => {
    return windowSize.width >= breakpoints[breakpoint];
  };

  const getResponsiveValue = <T>(values: {
    default: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    '2xl'?: T;
  }): T => {
    if (windowSize.width >= breakpoints['2xl'] && values['2xl'] !== undefined) return values['2xl'];
    if (windowSize.width >= breakpoints.xl && values.xl !== undefined) return values.xl;
    if (windowSize.width >= breakpoints.lg && values.lg !== undefined) return values.lg;
    if (windowSize.width >= breakpoints.md && values.md !== undefined) return values.md;
    if (windowSize.width >= breakpoints.sm && values.sm !== undefined) return values.sm;
    return values.default;
  };

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isBreakpoint,
    getResponsiveValue,
    breakpoints,
  };
}
