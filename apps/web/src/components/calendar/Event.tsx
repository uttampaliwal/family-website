import React from "react";
import type { CalendarEvent as CalendarEventType } from "./types";

interface EventProps {
  event: CalendarEventType;
}

const Event: React.FC<EventProps> = ({ event }) => {
  // Mapping event colors to Tailwind CSS classes
  const colorClasses: { [key: string]: string } = {
    blue: "bg-blue-100 border-blue-400 text-blue-800",
    green: "bg-green-100 border-green-400 text-green-800",
    red: "bg-red-100 border-red-400 text-red-800",
    purple: "bg-purple-100 border-purple-400 text-purple-800",
    yellow: "bg-yellow-100 border-yellow-400 text-yellow-800",
    default: "bg-gray-100 border-gray-400 text-gray-800",
  };

  const eventColorClass = colorClasses[event.color] || colorClasses["default"];

  return (
    <div
      className={`calendar-event truncate text-xs p-1 rounded border ${eventColorClass}`}
    >
      {event.title}
    </div>
  );
};

export default Event;
