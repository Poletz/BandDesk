import dayjs from 'dayjs';
import { CalendarItem, ReminderEvent } from '@/interfaces/calendar';
import { BookingRequest, GigEvent } from '@/interfaces/live';

const mapBookingToCalendarItem = (
  booking: BookingRequest,
  venueNameById: Record<string, string> | null
): CalendarItem => {
  return {
    id: booking.id,
    type: 'booking',
    date: booking.requestedDate ?? booking.updatedAt,
    title: `Booking · ${venueNameById?.[booking.venueId] ?? 'Unknown venue'}`,
    status: booking.status,
    venueId: booking.venueId,
    gigId: booking.gigId,
  };
};

const mapGigToCalendarItem = (
  gig: GigEvent,
  venueNameById: Record<string, string> | null
): CalendarItem => {
  return {
    id: gig.id,
    type: 'gig',
    date: gig.date,
    title: `${gig.title} · ${venueNameById?.[gig.venueId] ?? 'Unknown venue'}`,
    status: gig.status,
    venueId: gig.venueId,
    bookingId: gig.bookingId,
  };
};

const mapReminderToCalendarItem = (
  reminder: ReminderEvent,
  venueNameById: Record<string, string> | null
): CalendarItem => {
  return {
    id: reminder.id,
    type: 'reminder',
    date: reminder.date,
    title: reminder.title || `Reminder · ${venueNameById?.[reminder.venueId ?? ''] ?? 'Untitled'}`,
    venueId: reminder.venueId,
  };
};

const isBookingAlreadyConvertedToGig = (
  booking: BookingRequest,
  gigIds: Set<string>,
  bookingIdsLinkedToGig: Set<string>
) => {
  if (booking.gigId && gigIds.has(booking.gigId)) {
    return true;
  }

  return bookingIdsLinkedToGig.has(booking.id);
};

export const toCalendarItems = ({
  bookings,
  gigs,
  reminders = [],
  venueNameById,
}: {
  bookings: BookingRequest[];
  gigs: GigEvent[];
  reminders?: ReminderEvent[];
  venueNameById: Record<string, string> | null;
}) => {
  const gigIds = new Set(gigs.map((gig) => gig.id));
  const bookingIdsLinkedToGig = new Set(
    gigs.map((gig) => gig.bookingId).filter(Boolean) as string[]
  );

  const calendarItems = [
    ...bookings
      .filter((booking) => !isBookingAlreadyConvertedToGig(booking, gigIds, bookingIdsLinkedToGig))
      .map((booking) => mapBookingToCalendarItem(booking, venueNameById)),
    ...gigs.map((gig) => mapGigToCalendarItem(gig, venueNameById)),
    ...reminders.map((reminder) => mapReminderToCalendarItem(reminder, venueNameById)),
  ];

  return calendarItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getItemsForDate = (items: CalendarItem[], date: Date) => {
  return items.filter((item) => dayjs(item.date).isSame(date, 'date'));
};

export const getEventDaysSet = (items: CalendarItem[]) => {
  return new Set(items.map((item) => dayjs(item.date).format('YYYY-MM-DD')));
};
