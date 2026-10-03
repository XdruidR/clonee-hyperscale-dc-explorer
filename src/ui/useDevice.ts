import { useEffect, useState } from 'react';

/**
 * Device detection for the layout, not for capability.
 *
 * The phone layout is a genuinely different arrangement - one bottom sheet at a
 * time with a tab bar, instead of two fixed side panels - rather than the
 * desktop layout squeezed until it fits. Anything below MOBILE_BREAKPOINT gets
 * the sheet layout.
 */
export const MOBILE_BREAKPOINT = 820;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth <= MOBILE_BREAKPOINT,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    window.addEventListener('orientationchange', onChange);
    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('orientationchange', onChange);
    };
  }, []);
  return isMobile;
}

/** True when the primary input is touch, so hover-only affordances can be avoided. */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(pointer: coarse)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = () => setCoarse(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return coarse;
}