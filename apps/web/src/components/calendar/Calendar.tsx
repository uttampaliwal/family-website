import React, { useState } from "react";
import { motion } from "framer-motion";
import { useCalendar } from "./hooks";
import CalendarHeader from "./CalendarHeader";
import CalendarGrid from "./CalendarGrid";
import ComponentSkeleton from "../ComponentSkeleton";
import CreateEventModal from "./CreateEventModal"; // Assuming you will create this component

const Calendar: React.FC = () => {
  const {
    loading,
    error,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendarDays,
    getEventsForDate,
    refetchEvents, // Assuming useCalendar hook will expose this
  } = useCalendar();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNewEvent = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleEventCreated = () => {
    setIsModalOpen(false);
    refetchEvents(); // Refetch events after a new one is created
  };

  if (loading) {
    return <ComponentSkeleton className="h-96" />;
  }

  if (error) {
    return (
      <div className="h-96 card">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <CalendarHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        view={view}
        setView={setView}
        onNewEvent={handleNewEvent}
      />
      <CalendarGrid days={calendarDays} getEventsForDate={getEventsForDate} />
      {isModalOpen && (
        <CreateEventModal
          onClose={handleCloseModal}
          onEventCreated={handleEventCreated}
        />
      )}
    </motion.div>
  );
};

export default Calendar;
