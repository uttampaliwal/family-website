import React from "react";

interface CalendarHeaderProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  view: "month" | "week" | "day";
  setView: (view: "month" | "week" | "day") => void;
  onNewEvent: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  selectedDate,
  setSelectedDate,
  view,
  setView,
  onNewEvent,
}) => {
  const handlePrevMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1),
    );
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-4">
        <h3 className="text-xl font-semibold text-on-surface">
          {selectedDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-surface text-on-surface"
            aria-label="Previous month"
          >
            &larr;
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-surface text-on-surface"
            aria-label="Next month"
          >
            &rarr;
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {(["month", "week", "day"] as const).map((viewType) => (
          <button
            key={viewType}
            onClick={() => setView(viewType)}
            className={`px-3 py-1 rounded-lg ${
              view === viewType
                ? "bg-primary text-on-primary"
                : "hover:bg-surface text-on-surface"
            }`}
          >
            {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
          </button>
        ))}
        <button
          onClick={onNewEvent}
          className="px-3 py-1 rounded-lg bg-primary text-on-primary hover:bg-primary/80"
        >
          + New Event
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
