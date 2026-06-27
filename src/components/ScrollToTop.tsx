import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Ensure all potential scrolling elements are reset to top
    if (typeof document !== 'undefined') {
      document.documentElement.scrollTo({ top: 0 });
      document.body.scrollTo({ top: 0 });
      
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollTo({ top: 0 });
      }
    }
  }, [pathname]);

  return null;
}
