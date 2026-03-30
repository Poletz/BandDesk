import { IconArrowRight } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Badge, Card, Divider, Group, NavLink, Stack, Title } from '@mantine/core';
import { BOOKING_STATUSES } from '@/features';
import { useLiveData } from '@/hooks/use-live-data';
import { bookingStatusLabel } from '@/utils/misc';

export const BookingWidget = () => {
  const { bookingCountByStatus } = useLiveData();
  const t = useTranslations('Widgets');

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Title order={4}>{t('booking.title')}</Title>

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
            label={t('booking.goTo')}
            href="/dashboard/settings?tab=live"
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
