import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  calendarRepository,
  getEventDaysSet,
  getItemsForDate,
  toCalendarItems,
} from '@/features/calendar';
import { getBookingStatusColor, getVenueNameMap } from '@/utils/misc';

export const useCalendarData = (selectedDate: Date) => {
  const sourceData = useMemo(() => calendarRepository.listSourceData(), []);

  return useMemo(() => {
    const venueNameById = getVenueNameMap(sourceData.venues);
    const items = toCalendarItems({
      bookings: sourceData.bookings,
      gigs: sourceData.gigs,
      venueNameById,
    });

    const eventDaysSet = getEventDaysSet(items);

    return {
      items,
      venueNameById,
      selectedDateItems: getItemsForDate(items, selectedDate),
      hasEventsOnDate: (date: Date) => eventDaysSet.has(dayjs(date).format('YYYY-MM-DD')),
      getBookingStatusColor,
    };
  }, [selectedDate, sourceData]);
};
