'use client';

import dayjs from 'dayjs';
import { Grid, GridCol, Text, Title } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { BookingWidget, LiveWidget, QuickActionsWidget } from '@/components/widgets';

export const HomeComponent = () => {
  const today = dayjs().toDate();
  return (
    <>
      <Title order={2}>Welcome, User</Title>
      <Text c="dimmed">Keep the rock on</Text>

      <QuickActionsWidget />

      <Grid>
        <GridCol span={4}>
          <LiveWidget />
        </GridCol>
        <GridCol span={4}>
          <Calendar
            getDayProps={(date) => {
              return {
                selected: dayjs(date).isSame(today, 'date'),
              };
            }}
          />
        </GridCol>
        <GridCol span={4}>
          <BookingWidget />
        </GridCol>
      </Grid>
    </>
  );
};
