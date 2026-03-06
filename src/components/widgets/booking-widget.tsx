import { IconArrowRight } from '@tabler/icons-react';
import { Badge, Card, Divider, Group, NavLink, Stack, Title } from '@mantine/core';
import { BOOKING_STATUSES } from '@/features';
import { useLiveData } from '@/hooks/use-live-data';
import { bookingStatusLabel } from '@/utils/misc';

export const BookingWidget = () => {
  const { bookingCountByStatus } = useLiveData();

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Title order={4}>Bookings</Title>

        <Divider />

        <Stack>
          <Group mt="sm" gap="xs">
            {BOOKING_STATUSES.map((status) => (
              <Badge key={status} variant="light" size="lg">
                {bookingStatusLabel[status]}: {bookingCountByStatus[status]}
              </Badge>
            ))}
          </Group>
          <NavLink
            label="Go to Live & Booking"
            href="dashboard/settings?tab=live"
            rightSection={<IconArrowRight size={12} />}
            variant="subtle"
            bdrs="md"
            active
          />
        </Stack>
      </Stack>
    </Card>
  );
};
