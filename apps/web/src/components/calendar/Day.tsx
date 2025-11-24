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
    isCurrentMonth ? "bg-surface" : "bg-surface/30"
  }`;

  const dateClasses = `text-sm font-medium ${
    isCurrentMonth ? "text-text-base" : "text-muted"
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
