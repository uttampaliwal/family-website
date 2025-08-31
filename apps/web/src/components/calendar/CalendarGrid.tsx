import React from "react";
import type { CalendarDay as CalendarDayType, CalendarEvent } from "./types";
import { weekdayLabels } from "./utils";
import Day from "./Day";

interface CalendarGridProps {
  days: CalendarDayType[];
  getEventsForDate: (date: Date) => CalendarEvent[];
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  getEventsForDate,
}) => {
  return (
    <table className="w-full border-collapse bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
      <thead>
        <tr>
          {weekdayLabels.map((day) => (
            <th
              key={day}
              className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800"
            >
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: days.length / 7 }).map((_, weekIndex) => (
          <tr key={weekIndex}>
            {days
              .slice(weekIndex * 7, weekIndex * 7 + 7)
              .map((day, dayIndex) => (
                <Day
                  key={dayIndex}
                  day={day}
                  events={getEventsForDate(day.date)}
                />
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CalendarGrid;
