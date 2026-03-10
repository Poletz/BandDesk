import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MonthView, ScheduleEventData } from '@mantine/schedule';
import { useCalendarData } from '@/hooks/use-calendar-data';
import { CalendarItem } from '@/interfaces';

export interface ScheduleProps {
  handleChange: (date: Date, items: CalendarItem[]) => void;
}

export const ScheduleComponent = ({ handleChange }: ScheduleProps) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const { items, selectedDateItems } = useCalendarData(dayjs(selectedDate).toDate());

  const handleRef = useRef(handleChange);

  useEffect(() => {
    handleRef.current = handleChange;
  }, [handleChange]);

  const scheduleEvents = useMemo<ScheduleEventData[]>(() => {
    return items.map((item) => {
      const startDate = dayjs(item.date).subtract(dayjs(item.date).utcOffset(), 'minute');
      const endDate = dayjs(item.date)
        .subtract(dayjs(item.date).utcOffset(), 'minute')
        .add(2, 'hour');

      return {
        id: item.id,
        title: item.title,
        start: startDate.format('YYYY-MM-DD HH:mm:ss'),
        end: endDate.format('YYYY-MM-DD HH:mm:ss'),
        color: item.type === 'booking' ? 'indigo' : item.type === 'gig' ? 'orange' : 'gray',
      };
    });
  }, [items]);

  useEffect(() => {
    if (selectedDate) {
      handleRef.current(dayjs(selectedDate).toDate(), selectedDateItems);
    }
  }, [selectedDate]);

  return (
    <MonthView
      date={selectedDate ?? new Date()}
      onDateChange={setSelectedDate}
      events={scheduleEvents}
      onDayClick={setSelectedDate}
      getDayProps={(date) => {
        const sameDate = dayjs(date, 'YYYY-MM-DD').isSame(selectedDate);

        return sameDate
          ? {
              style: {
                border: '2px solid var(--mantine-color-indigo-8)',
              },
            }
          : {};
      }}
    />
  );
};
