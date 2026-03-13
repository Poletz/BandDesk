'use client';

import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { MantineSize } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useCalendarData } from '@/hooks/use-calendar-data';
import { CalendarItem } from '@/interfaces';

export const CalendarWidget = ({
  handleChange,
  size = 'md',
  numberOfColumn = 1,
}: {
  handleChange: (date: Date, items: CalendarItem[]) => void;
  size?: MantineSize;
  numberOfColumn?: number;
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { hasEventsOnDate, selectedDateItems } = useCalendarData(selectedDate ?? new Date());
  const today = dayjs().toDate();
  const handleRef = useRef(handleChange);

  useEffect(() => {
    handleRef.current = handleChange;
  }, [handleChange]);

  useEffect(() => {
    if (selectedDate) {
      handleRef.current(selectedDate, selectedDateItems);
    }
  }, [selectedDate]);

  return (
    <DatePicker
      numberOfColumns={numberOfColumn}
      size={size}
      value={selectedDate}
      styles={{
        day: {
          borderRadius: '50%',
        },
      }}
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
              }
            : undefined,
        };
      }}
    />
  );
};
