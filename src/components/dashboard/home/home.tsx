import { Grid, GridCol, Text, Title } from '@mantine/core';
import { BookingWidget, LiveWidget, QuickActionsWidget } from '@/components/widgets';

export const HomeComponent = () => {
  return (
    <>
      <Title order={2}>Welcome, User</Title>
      <Text c="dimmed">Keep the rock on</Text>

      <QuickActionsWidget />

      <Grid>
        <GridCol>
          <LiveWidget />
        </GridCol>
        <GridCol>
          <BookingWidget />
        </GridCol>
      </Grid>
    </>
  );
};
