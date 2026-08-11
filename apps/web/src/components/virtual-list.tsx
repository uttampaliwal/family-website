import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type UIEvent } from "react";
import { cn } from "@family/ui";
import { computeWindow } from "../lib/virtual-window.js";

export interface VirtualListProps<T> {
  items: T[];
  itemKey: (item: T) => string;
  renderRow: (item: T, index: number) => ReactNode;
  /** Fallback height used until a row has been measured. */
  estimateHeight?: number;
  overscan?: number;
  /** Stay pinned to the bottom (chat-style) while the user is near it. */
  alignToBottom?: boolean;
  className?: string;
  role?: string;
  "aria-label"?: string;
}

/**
 * Dependency-free windowed list. Only the rows near the viewport are in the
 * DOM; row heights are measured once mounted and the offsets stay exact, so
 * it degrades gracefully as a room grows over the years.
 */
export function VirtualList<T>({
  items,
  itemKey,
  renderRow,
  estimateHeight = 48,
  overscan = 6,
  alignToBottom = false,
  className,
  role,
  "aria-label": ariaLabel,
}: VirtualListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [heights, setHeights] = useState<Map<string, number>>(() => new Map());
  const hasScrolled = useRef(false);
  const heightsRef = useRef(heights);
  heightsRef.current = heights;

  const keys = useMemo(() => items.map((item) => itemKey(item)), [items, itemKey]);

  // Track viewport height so the window tracks the container's resizing.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sync = () => setViewport(el.clientHeight);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const offsets = useMemo(() => {
    const result = new Array<number>(keys.length + 1).fill(0);
    for (let i = 0; i < keys.length; i++) {
      result[i + 1] = result[i]! + (heights.get(keys[i]!) ?? estimateHeight);
    }
    return result.map((value) => Math.round(value));
  }, [keys, heights, estimateHeight]);

  const total = offsets[keys.length] ?? 0;

  const measure = useCallback((key: string, height: number) => {
    const rounded = Math.round(height);
    if (heightsRef.current.get(key) === rounded) return;
    setHeights((previous) => {
      if (previous.get(key) === rounded) return previous;
      const next = new Map(previous);
      next.set(key, rounded);
      return next;
    });
  }, []);

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    hasScrolled.current = true;
    setScrollTop(event.currentTarget.scrollTop);
  };

  // Chat-style: follow the newest content when the reader is near the end.
  useEffect(() => {
    if (!alignToBottom) return;
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (!hasScrolled.current || nearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [alignToBottom, total, items]);

  const { start, end } = useMemo(
    () => computeWindow(offsets, scrollTop, viewport, overscan),
    [offsets, scrollTop, viewport, overscan],
  );

  const rows: ReactNode[] = [];
  for (let index = start; index < end; index++) {
    const item = items[index]!;
    const key = keys[index]!;
    rows.push(
      <VirtualRow
        key={key}
        top={offsets[index]!}
        onMeasure={measure}
        rowKey={key}
      >
        {renderRow(item, index)}
      </VirtualRow>,
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      role={role}
      aria-label={ariaLabel}
      className={cn("relative overflow-y-auto overscroll-contain", className)}
    >
      <div className="relative w-full" style={{ height: total }}>
        {rows}
      </div>
    </div>
  );
}

function VirtualRow({
  top,
  onMeasure,
  rowKey,
  children,
}: {
  top: number;
  onMeasure: (key: string, height: number) => void;
  rowKey: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => onMeasure(rowKey, el.getBoundingClientRect().height);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onMeasure, rowKey]);

  return (
    <div ref={ref} className="absolute left-0 right-0" style={{ top }}>
      {children}
    </div>
  );
}