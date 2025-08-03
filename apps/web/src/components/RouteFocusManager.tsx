import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function RouteFocusManager() {
  const location = useLocation();
  const mainContentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the main content area using multiple selectors for better reliability
    mainContentRef.current = document.querySelector('main') || 
                             document.querySelector('[role="main"]') || 
                             document.querySelector('#main-content');

    // On route change, focus the main content area
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
  }, [location]);

  return null;
}

export default RouteFocusManager;
