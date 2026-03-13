import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { liveRepository } from '@/features';
import { getEventDaysSet, getItemsForDate, toCalendarItems } from '@/features/calendar';
import { getBookingStatusColor, getVenueNameMap } from '@/utils/misc';

export const useCalendarData = (selectedDate: Date) => {
  const query = useQuery({
    queryKey: ['calendar-data'],
    queryFn: liveRepository.list,
  });

  const computed = useMemo(() => {
    const sourceData = query.data ?? { bookings: [], gigs: [], venues: [] };

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
  }, [selectedDate, query.data]);

  return {
    ...computed,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
