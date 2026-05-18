import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DateStringValue, MonthView, ScheduleEventData, ScheduleHeader } from '@mantine/schedule';
import { useCalendarData } from '@/hooks/use-calendar-data';
import { CalendarItem } from '@/interfaces';

export interface ScheduleProps {
  handleChange: (date: Date, items: CalendarItem[]) => void;
}

export const ScheduleComponent = ({ handleChange }: ScheduleProps) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const { items, selectedDateItems } = useCalendarData(dayjs(selectedDate).toDate());

  const t = useTranslations('Settings');

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
    <div>
      <ScheduleHeader>
        <ScheduleHeader.Previous
          onClick={() =>
            setSelectedDate(
              dayjs(selectedDate)
                .subtract(1, 'month')
                .startOf('month')
                .format('YYYY-MM-DD') as DateStringValue
            )
          }
        />
        <ScheduleHeader.MonthYearSelect
          labels={{
            year: t('calendar.year'),
            month: t('calendar.month'),
          }}
          yearValue={dayjs(selectedDate).year()}
          monthValue={dayjs(selectedDate).month()}
          onYearChange={(year) =>
            setSelectedDate(
              dayjs(selectedDate)
                .year(year)
                .startOf('month')
                .format('YYYY-MM-DD') as DateStringValue
            )
          }
          onMonthChange={(month) =>
            setSelectedDate(
              dayjs(selectedDate)
                .month(month)
                .startOf('month')
                .format('YYYY-MM-DD') as DateStringValue
            )
          }
        />
        <ScheduleHeader.Next
          onClick={() =>
            setSelectedDate(
              dayjs(selectedDate)
                .add(1, 'month')
                .startOf('month')
                .format('YYYY-MM-DD') as DateStringValue
            )
          }
        />
        <ScheduleHeader.Today
          labels={{ today: t('calendar.today') }}
          onClick={() => {
            setSelectedDate(dayjs().startOf('day').format('YYYY-MM-DD') as DateStringValue);
          }}
        />
      </ScheduleHeader>
      <MonthView
        withHeader={false}
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
    </div>
  );
};
