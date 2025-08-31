import type { CalendarDay } from "./types";

export const getDaysInMonth = (date: Date): CalendarDay[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const calendarDaysArray: CalendarDay[] = [];

  // Add days from previous month
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const previousMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDaysArray.push({
      date: new Date(year, month - 1, previousMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Add days of current month
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    calendarDaysArray.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Add days from next month
  const lastDayOfWeek = lastDayOfMonth.getDay();
  for (let i = 1; i < 7 - lastDayOfWeek; i++) {
    calendarDaysArray.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  return calendarDaysArray;
};

export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
