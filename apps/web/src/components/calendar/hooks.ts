import { useState, useEffect, useMemo, useCallback } from "react";
import type { CalendarEvent } from "./types";
import { getDaysInMonth } from "./utils";
import api from "../../services/axios"; // Import the configured axios instance

export const useCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(
        // Use api.get instead of fetch
        `/api/calendar/events?month=${
          selectedDate.getMonth() + 1
        }&year=${selectedDate.getFullYear()}`,
      );
      setEvents(response.data); // Axios wraps the response in a data property
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const calendarDays = useMemo(
    () => getDaysInMonth(selectedDate),
    [selectedDate],
  );

  const getEventsForDate = useCallback(
    (date: Date) => {
      return events.filter((event) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return date >= eventStart && date <= eventEnd;
      });
    },
    [events],
  );

  return {
    events,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendarDays,
    getEventsForDate,
    refetchEvents: fetchEvents,
  };
};
