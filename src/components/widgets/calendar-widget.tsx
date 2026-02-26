'use client';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { DatePicker } from '@mantine/dates';
import { useCalendarData } from '@/hooks/use-calendar-data';
import { CalendarItem } from '@/interfaces';

export const CalendarWidget = ({
  handleChange,
}: {
  handleChange: (date: Date, items: CalendarItem[]) => void;
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { hasEventsOnDate, selectedDateItems } = useCalendarData(selectedDate ?? new Date());
  const today = dayjs().toDate();

  useEffect(() => {
    if (selectedDate) {
      handleChange(selectedDate, selectedDateItems);
    }
  }, [selectedDate, selectedDateItems]);

  return (
    <DatePicker
      value={selectedDate}
      onChange={(date) => {
        if (!date) {
          return;
        }
        setSelectedDate(dayjs(date).toDate());
      }}
      getDayProps={(date) => {
        const hasEvents = hasEventsOnDate(dayjs(date).toDate());
        return {
          selected: dayjs(date).isSame(today, 'date'),
          style: hasEvents
            ? {
                border: '1px solid var(--mantine-color-blue-5)',
                borderRadius: '50%',
              }
            : undefined,
        };
      }}
    />
  );
};
