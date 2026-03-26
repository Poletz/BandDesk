import { BookingStatus } from './live';

export type CalendarItemType = 'booking' | 'gig' | 'reminder';

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  date: string; // ISO
  title: string;
  status?: BookingStatus;
  venueId?: string;
  bookingId?: string; // Reference ID for booking events
  gigId?: string; // Reference ID for gig events
}

export type ReminderEvent = {
  id: string;
  date: string;
  title?: string;
  venueId?: string;
};
