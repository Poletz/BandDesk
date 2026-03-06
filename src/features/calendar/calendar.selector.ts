import dayjs from 'dayjs';
import { CalendarItem } from '@/interfaces/calendar';
import { BookingRequest, GigEvent } from '@/interfaces/live';

const mapBookingToCalendarItem = (
  booking: BookingRequest,
  venueNameById: Record<string, string>
): CalendarItem => {
  return {
    id: booking.id,
    type: 'booking',
    date: booking.requestedDate ?? booking.updatedAt,
    title: `Booking · ${venueNameById[booking.venueId] ?? 'Unknown venue'}`,
    status: booking.status,
    venueId: booking.venueId,
  };
};

const mapGigToCalendarItem = (
  gig: GigEvent,
  venueNameById: Record<string, string>
): CalendarItem => {
  return {
    id: gig.id,
    type: 'gig',
    date: gig.date,
    title: `${gig.title} · ${venueNameById[gig.venueId] ?? 'Unknown venue'}`,
    status: gig.status,
    venueId: gig.venueId,
  };
};

export const toCalendarItems = ({
  bookings,
  gigs,
  venueNameById,
}: {
  bookings: BookingRequest[];
  gigs: GigEvent[];
  venueNameById: Record<string, string>;
}) => {
  return [
    ...bookings.map((booking) => mapBookingToCalendarItem(booking, venueNameById)),
    ...gigs.map((gig) => mapGigToCalendarItem(gig, venueNameById)),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getItemsForDate = (items: CalendarItem[], date: Date) => {
  return items.filter((item) => dayjs(item.date).isSame(date, 'date'));
};

export const getEventDaysSet = (items: CalendarItem[]) => {
  return new Set(items.map((item) => dayjs(item.date).format('YYYY-MM-DD')));
};
