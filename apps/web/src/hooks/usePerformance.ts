import { useState, useEffect, useCallback } from "react";

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface PerformanceHookReturn {
  metrics: PerformanceMetric[];
  startMeasurement: (
    name: string,
    metadata?: Record<string, unknown>,
  ) => () => void;
  clearMetrics: () => void;
  getAverageDuration: (name: string) => number;
  getSlowOperations: (threshold?: number) => PerformanceMetric[];
}

/**
 * React hook for client-side performance monitoring
 * Particularly useful for admin components and complex operations
 */
export const usePerformance = (): PerformanceHookReturn => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  // Clean up old metrics periodically
  useEffect(() => {
    const cleanup = setInterval(
      () => {
        setMetrics((prev) => {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return prev.filter((metric) => metric.timestamp > oneHourAgo);
        });
      },
      5 * 60 * 1000,
    ); // Clean up every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  const startMeasurement = useCallback(
    (name: string, metadata?: Record<string, unknown>) => {
      const startTime = performance.now();
      const startTimestamp = new Date();

      return () => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const metric: PerformanceMetric = {
          name,
          duration,
          timestamp: startTimestamp,
          metadata,
        };

        setMetrics((prev) => [...prev, metric]);

        // Log slow operations
        if (duration > 1000) {
          console.warn(
            `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`,
            {
              metadata,
              duration,
            },
          );
        }
      };
    },
    [],
  );

  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  const getAverageDuration = useCallback(
    (name: string): number => {
      const relevantMetrics = metrics.filter((m) => m.name === name);
      if (relevantMetrics.length === 0) return 0;

      const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
      return total / relevantMetrics.length;
    },
    [metrics],
  );

  const getSlowOperations = useCallback(
    (threshold: number = 1000): PerformanceMetric[] => {
      return metrics
        .filter((m) => m.duration > threshold)
        .sort((a, b) => b.duration - a.duration);
    },
    [metrics],
  );

  return {
    metrics,
    startMeasurement,
    clearMetrics,
    getAverageDuration,
    getSlowOperations,
  };
};

/**
 * HOC for automatically measuring component render performance
 */
export function withPerformanceMonitoring<T extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<T>,
  componentName?: string,
) {
  const displayName =
    componentName ||
    WrappedComponent.displayName ||
    WrappedComponent.name ||
    "Component";

  const MeasuredComponent = (props: T): JSX.Element => {
    const { startMeasurement } = usePerformance();

    useEffect(() => {
      const stopMeasurement = startMeasurement(`${displayName}_render`, {
        componentName: displayName,
        propsCount: Object.keys(props).length,
      });

      return stopMeasurement;
    });

    return React.createElement(WrappedComponent, props);
  };

  MeasuredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  return MeasuredComponent;
}

export default usePerformance;
