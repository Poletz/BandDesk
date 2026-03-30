'use client';

import dayjs from 'dayjs';
import { useMemo } from 'react';
import { IconNotes } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import {
  Badge,
  Card,
  Divider,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  ScrollAreaAutosize,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useLiveData } from '@/hooks/use-live-data';
import { getBookingStatusColor } from '@/utils/misc';

export const LiveWidget = () => {
  const [opened, { close, open }] = useDisclosure(false);
  const t = useTranslations('Widgets');
  const { upcomingGigs, venueNameById } = useLiveData();

  const uniqueUpcomingGigs = useMemo(() => {
    const uniqueByKey = new Map<string, (typeof upcomingGigs)[number]>();

    for (const gig of upcomingGigs) {
      const key = gig.bookingId ? `booking:${gig.bookingId}` : `gig:${gig.id}`;

      if (!uniqueByKey.has(key)) {
        uniqueByKey.set(key, gig);
      }
    }

    return Array.from(uniqueByKey.values());
  }, [upcomingGigs]);

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={4}>{t('live.title')}</Title>
          <Badge variant="light">{uniqueUpcomingGigs.length}</Badge>
        </Group>

        <Divider />

        <ScrollAreaAutosize>
          {uniqueUpcomingGigs.length ? (
            uniqueUpcomingGigs.map((gig) => (
              <Group key={gig.id} justify="space-between" align="flex-start">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Text fw={600}>{gig.title}</Text>
                    <Badge
                      mx={12}
                      variant="light"
                      autoContrast
                      color={getBookingStatusColor(gig.status)}
                    >
                      {gig.status.toUpperCase()}
                    </Badge>
                    {gig.notes ? (
                      <Popover opened={opened}>
                        <PopoverTarget>
                          <IconNotes onMouseEnter={open} onMouseLeave={close} />
                        </PopoverTarget>
                        <PopoverDropdown>{gig.notes}</PopoverDropdown>
                      </Popover>
                    ) : null}
                  </div>
                  <Text size="sm" c="dimmed">
                    {venueNameById?.[gig.venueId]}
                  </Text>
                </div>
                <Text size="sm">{dayjs(gig.date).format('DD MMM')}</Text>
              </Group>
            ))
          ) : (
            <Text fz="md" style={{ textAlign: 'center' }}>
              {t('live.empty')}
            </Text>
          )}
        </ScrollAreaAutosize>
      </Stack>
    </Card>
  );
};
