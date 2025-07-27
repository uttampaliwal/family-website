import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  participants: string[];
  category: string;
  color: string;
}

const FamilyCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/calendar/events?month=${
            selectedDate.getMonth() + 1
          }&year=${selectedDate.getFullYear()}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load calendar events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedDate]);

  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Add days from next month to fill the last week
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, []);

  const getEventsForDate = useCallback((date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  }, [events]);

  const days = useMemo(() => getDaysInMonth(selectedDate), [getDaysInMonth, selectedDate]);
  const weekDays = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);

  if (loading) {
    return (
      <div className="h-96 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {selectedDate.toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() - 1
                  )
                )
              }
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ←
            </button>
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() + 1
                  )
                )
              }
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              →
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          {(['month', 'week', 'day'] as const).map((viewType) => (
            <button
              key={viewType}
              onClick={() => setView(viewType)}
              className={`px-3 py-1 rounded-lg ${
                view === viewType
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {/* Week days header */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map(({ date, isCurrentMonth }, index) => {
          const dayEvents = getEventsForDate(date);
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 ${
                isCurrentMonth
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-gray-50 dark:bg-gray-900'
              }`}
            >
              <div
                className={`text-sm ${
                  isCurrentMonth
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {date.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate`}
                    style={{ backgroundColor: event.color + '20' }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default FamilyCalendar;