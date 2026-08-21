import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToTop } from '@/lib/scroll';

/**
 * ScrollToTop component automatically resets the scroll position to top
 * on every route change, preventing background page carryover.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop(true);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
