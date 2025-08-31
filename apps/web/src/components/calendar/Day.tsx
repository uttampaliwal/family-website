import React from "react";
import type { CalendarDay as CalendarDayType, CalendarEvent } from "./types";
import Event from "./Event";

interface DayProps {
  day: CalendarDayType;
  events: CalendarEvent[];
}

const Day: React.FC<DayProps> = ({ day, events }) => {
  const { date, isCurrentMonth } = day;

  const dayClasses = `min-h-[120px] p-2 ${
    isCurrentMonth ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"
  }`;

  const dateClasses = `text-sm ${
    isCurrentMonth
      ? "text-gray-900 dark:text-white"
      : "text-gray-400 dark:text-gray-600"
  }`;

  return (
    <td className={dayClasses}>
      <div className={dateClasses}>{date.getDate()}</div>
      <div className="mt-1 space-y-1">
        {events.map((event) => (
          <Event key={event.id} event={event} />
        ))}
      </div>
    </td>
  );
};

export default Day;
