import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function RouteFocusManager() {
  const location = useLocation();
  const mainContentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      // Find the main content area
      mainContentRef.current = document.querySelector('main');

      // On route change, focus the main content area
      if (mainContentRef.current) {
        mainContentRef.current.focus();
      }
    } catch (error) {
      console.error('Error managing route focus:', error);
    }
  }, [location]);

  return null;
}

export default RouteFocusManager;
