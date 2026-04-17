import dayjs from 'dayjs';
import { StateCreator } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { modals } from '@mantine/modals';
import { BOOKING_STATUSES } from '@/features';
import { BookingRequest, BookingStatus, CalendarItemType, GigEvent, Venue } from '@/interfaces';
import { UserRole, UserStatus } from '@/interfaces/users';

export const createStore = <T>(state: StateCreator<T>) =>
  createWithEqualityFn<T>()(
    subscribeWithSelector<T>((...args) => state(...args)),
    shallow
  );

export const confirmModal = (
  title: string,
  children: React.ReactNode,
  labels: { confirm?: string; cancel?: string },
  cb: () => void | Promise<void>,
  withCloseButton = false
) => {
  return () =>
    modals.openConfirmModal({
      title,
      children,
      labels: { confirm: labels?.confirm ?? 'Confirm', cancel: labels?.cancel ?? 'Cancel' },
      onConfirm: () => {
        void cb();
      },
      withCloseButton,
    });
};

const DEFAULT_STATUS_COLOR = 'gray';
const bookingStatusColorMap: Record<BookingStatus, string> = {
  draft: 'gray',
  requested: 'blue',
  negotiating: 'orange',
  confirmed: 'green',
  rejected: 'red',
  cancelled: 'dark',
};

export const getBookingStatusColor = (status?: BookingStatus) => {
  if (!status) {
    return DEFAULT_STATUS_COLOR;
  }

  return bookingStatusColorMap[status] ?? DEFAULT_STATUS_COLOR;
};

const calendarItemTypeMap: Record<CalendarItemType, string> = {
  booking: 'Booking',
  gig: 'Gig',
  reminder: 'Reminder',
};

export const getTypeName = (type: CalendarItemType) => {
  return calendarItemTypeMap[type];
};

export const bookingStatusLabel: Record<(typeof BOOKING_STATUSES)[number], string> = {
  draft: 'Draft',
  requested: 'Requested',
  negotiating: 'Negotiating',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const roleLabel: Record<UserRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  member: 'Member',
};

export const statusColor: Record<UserStatus, string> = {
  active: 'green',
  invited: 'blue',
  disabled: 'gray',
};

export const getVenueNameMap = (venues: Venue[]) => {
  if (!venues?.length) {
    return null;
  }
  return venues.reduce<Record<string, string>>((acc, venue) => {
    acc[venue.id] = venue.name;
    return acc;
  }, {});
};

export const getDefaultGigTitle = ({
  venueName,
  requestedDate,
}: {
  venueName?: string | null;
  requestedDate?: string | null;
}) => {
  const name = venueName?.trim() || 'Venue';
  const dateLabel = requestedDate ? dayjs(requestedDate).format('DD MMM YYYY') : 'TBD';

  return `Live @ ${name} · ${dateLabel}`;
};

export const getDefaultGigFromBooking = (
  booking: BookingRequest,
  venueNameById: Record<string, string> | null
): Omit<GigEvent, 'id'> => ({
  venueId: booking.venueId,
  date: booking.requestedDate ?? dayjs().toISOString(),
  status: booking.status,
  title: getDefaultGigTitle({
    venueName: venueNameById?.[booking.venueId],
    requestedDate: booking.requestedDate,
  }),
  setlistName: undefined,
  notes: booking.notes,
  bookingId: booking.id,
});
