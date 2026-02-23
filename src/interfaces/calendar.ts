import { BookingStatus } from './live';

export type CalendarItemType = 'booking' | 'gig' | 'reminder';

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  date: string; // ISO
  title: string;
  status?: BookingStatus;
  venueId?: string;
}
