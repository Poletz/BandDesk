'use client';

import dayjs from 'dayjs';
import { Divider, Grid, GridCol, Group, Stack, Text, Title } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { BookingWidget, LiveWidget, QuickActionsWidget } from '@/components/widgets';

export const HomeComponent = () => {
  const today = dayjs().toDate();
  return (
    <>
      <Group>
        <div style={{ marginRight: 'auto' }}>
          <Title order={2}>Welcome, User</Title>
          <Text c="dimmed">Keep the rock on</Text>
        </div>

        <QuickActionsWidget />
      </Group>

      <Grid mt={20} gutter="xl">
        <GridCol span={4}>
          <LiveWidget />
        </GridCol>
        <GridCol span={4}>
          <Stack align="center" justify="center">
            <Title size={20}>Live Calendar</Title>
            <Divider h={2} />
            <Calendar
              getDayProps={(date) => {
                return {
                  selected: dayjs(date).isSame(today, 'date'),
                };
              }}
            />
          </Stack>
        </GridCol>
        <GridCol span={3}>
          <BookingWidget />
        </GridCol>
      </Grid>
    </>
  );
};
