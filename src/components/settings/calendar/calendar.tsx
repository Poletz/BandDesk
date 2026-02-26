'use client';

import dayjs from 'dayjs';
import { useState } from 'react';
import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { CalendarWidget } from '@/components/widgets';
import { useCalendarData } from '@/hooks/use-calendar-data';
import { CalendarItem } from '@/interfaces';

const itemTypeLabel: Record<'booking' | 'gig' | 'reminder', string> = {
  booking: 'Booking',
  gig: 'Gig',
  reminder: 'Reminder',
};

export const CalendarComponent = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [items, setSelectedItems] = useState<CalendarItem[] | []>([]);
  const { getBookingStatusColor } = useCalendarData(date);

  return (
    <Stack w="100%" maw={1000}>
      <Title order={3}>Calendar</Title>

      <Card withBorder>
        <CalendarWidget
          handleChange={(d: Date, items) => {
            setDate(d);
            setSelectedItems(items);
          }}
        />
      </Card>

      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={4}>Events on {dayjs(date).format('DD MMM YYYY')}</Title>
          <Badge variant="light">{items.length}</Badge>
        </Group>

        <Stack gap="xs">
          {items.length === 0 ? (
            <Text c="dimmed" size="sm">
              No events for this day.
            </Text>
          ) : (
            items.map((item) => (
              <Group key={item.id} justify="space-between" wrap="nowrap">
                <div>
                  <Text fw={600}>{item.title}</Text>
                  <Text size="sm" c="dimmed">
                    {itemTypeLabel[item.type]}
                  </Text>
                </div>
                <Badge color={getBookingStatusColor(item.status)} variant="light">
                  {item.status ?? 'n/a'}
                </Badge>
              </Group>
            ))
          )}
        </Stack>
      </Card>
    </Stack>
  );
};
