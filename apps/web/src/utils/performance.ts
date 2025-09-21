// Performance monitoring and optimization utilities

// Lazy loading wrapper for components
export const lazy = <T extends React.ComponentType<Record<string, unknown>>>(
  importFunc: () => Promise<{ default: T }>,
) => {
  return React.lazy(importFunc);
};

// Image lazy loading utility
export const createImageLoader = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove("lazy");
            observer.unobserve(img);
          }
        }
      });
    },
    { threshold: 0.1 },
  );

  return observer;
};

// Debounce function for performance optimization
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function for performance optimization
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), delay);
    }
  };
};

// Performance observer for Core Web Vitals
export const observeWebVitals = () => {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    return;
  }

  // Observe Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];

        if (import.meta.env.DEV) {
          console.log("LCP:", lastEntry.startTime);
        }

        // Send to analytics if needed
        if (lastEntry.startTime > 2500) {
          console.warn("Poor LCP performance:", lastEntry.startTime);
        }
      }
    });

    lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
  } catch {
    // Ignore if not supported
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (typeof window === "undefined" || !("performance" in window)) {
    return;
  }

  const checkMemory = () => {
    const memory = (
      performance as {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;
    if (memory) {
      const used = memory.usedJSHeapSize / 1048576; // Convert to MB
      const total = memory.totalJSHeapSize / 1048576;
      const limit = memory.jsHeapSizeLimit / 1048576;

      if (import.meta.env.DEV) {
        console.log(
          `Memory usage: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB (limit: ${limit.toFixed(2)}MB)`,
        );
      }

      // Warn if memory usage is high
      if (used / limit > 0.9) {
        console.warn("High memory usage detected:", used, "MB");
      }
    }
  };

  // Check memory every 30 seconds in development
  if (import.meta.env.DEV) {
    setInterval(checkMemory, 30000);
  }
};

// Bundle analyzer helper
export const logBundleInfo = () => {
  if (import.meta.env.DEV) {
    console.log("Bundle info:", {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      baseUrl: import.meta.env.BASE_URL,
    });
  }
};

// Service Worker registration for caching
export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.warn("Service Worker registration failed:", error);
    }
  }
};

// Resource preloading helper
export const preloadResource = (href: string, as: string) => {
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// Critical CSS inlining helper
export const inlineCriticalCSS = (css: string) => {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
};

import React from "react";
