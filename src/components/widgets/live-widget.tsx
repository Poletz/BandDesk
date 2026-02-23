'use client';

import dayjs from 'dayjs';
import { IconNotes } from '@tabler/icons-react';
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
import { getStatusColor } from '@/features';
import { useLiveData } from '@/hooks/use-live-data';

export const LiveWidget = () => {
  const [opened, { close, open }] = useDisclosure(false);

  const { upcomingGigs, venueNameById } = useLiveData();

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={4}>Upcoming live</Title>
          <Badge variant="light">{upcomingGigs.length}</Badge>
        </Group>

        <Divider />

        <ScrollAreaAutosize>
          {upcomingGigs.map((gig) => (
            <Group key={gig.id} justify="space-between" align="flex-start">
              <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text fw={600}>{gig.title}</Text>
                  <Badge mx={12} variant="light" autoContrast color={getStatusColor(gig.status)}>
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
                  {venueNameById[gig.venueId]}
                </Text>
              </div>
              <Text size="sm">{dayjs(gig.date).format('DD MMM')}</Text>
            </Group>
          ))}
        </ScrollAreaAutosize>
      </Stack>
    </Card>
  );
};
