import { BookingRequest, BookingStatus, GigEvent, Venue } from '@/interfaces/live';

export const BOOKING_STATUSES: BookingStatus[] = [
  'draft',
  'requested',
  'negotiating',
  'confirmed',
  'rejected',
  'cancelled',
];

export const getVenueNameMap = (venues: Venue[]) => {
  return venues.reduce<Record<string, string>>((acc, venue) => {
    acc[venue.id] = venue.name;
    return acc;
  }, {});
};

export const getBookingsCountByStatus = (bookings: BookingRequest[]) => {
  return BOOKING_STATUSES.reduce<Record<BookingStatus, number>>(
    (acc, status) => {
      acc[status] = bookings.filter((booking) => booking.status === status).length;
      return acc;
    },
    {
      draft: 0,
      requested: 0,
      negotiating: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
    }
  );
};

export const getUpcomingGigs = (gigs: GigEvent[], limit = 3) => {
  return gigs
    .filter((gig) => gig.status !== 'cancelled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
};
