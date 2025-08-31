export interface CalendarEvent {
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

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}
