'use client';

import dayjs from 'dayjs';
import { useState } from 'react';
import { Badge, Card, Group, ScrollArea, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useCalendarData } from '@/hooks/use-calendar-data';
import { CalendarItem } from '@/interfaces';
import { ScheduleComponent } from './_internal/schedule';

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
    <Stack
      w="100%"
      style={{
        height: '100%',
      }}
    >
      <Title order={3}>Calendar</Title>
      <ScrollArea style={{ height: 'calc(100dvh-30px-56px-35px-80px)' }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" verticalSpacing="lg">
          <ScheduleComponent
            handleChange={(d: Date, items) => {
              setDate(d);
              setSelectedItems(items);
            }}
          />

          <Card withBorder h="fit-content">
            <Group justify="space-between" mb="sm">
              <Title order={4}>Events on {dayjs(date).format('DD MMMM YYYY')}</Title>
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
                      {/* <Text fw={600}>{item.title}</Text> */}
                    </div>
                    <Badge color={getBookingStatusColor(item.status)} variant="light">
                      {item.status ?? 'n/a'}
                    </Badge>
                  </Group>
                ))
              )}
            </Stack>
          </Card>
        </SimpleGrid>
      </ScrollArea>
    </Stack>
  );
};
