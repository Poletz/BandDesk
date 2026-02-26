'use client';

import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { IconDots } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Divider,
  Grid,
  GridCol,
  Group,
  Modal,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  BookingWidget,
  CalendarWidget,
  LiveWidget,
  QuickActionsWidget,
} from '@/components/widgets';
import { useLiveData } from '@/hooks/use-live-data';
import { CalendarItem } from '@/interfaces';
import { bookingStatusLabel, getBookingStatusColor, getTypeName } from '@/utils/misc';

export const HomeComponent = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [date, setDate] = useState<Date>(new Date());
  const [items, setSelectedItems] = useState<CalendarItem[]>([]);
  const { venueNameById } = useLiveData();

  const setDateAndItems = useCallback(
    (d: Date, nextItems: CalendarItem[]) => {
      setDate(d);
      setSelectedItems(nextItems);

      if (nextItems.length) {
        open();
      }
    },
    [open]
  );

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={`Event${items.length > 1 ? 's' : ''} on ${dayjs(date).format('DD/MM/YYYY')}`}
      >
        {items.map((item, i) => (
          <Group key={i.toString().concat('-modal-item')}>
            <Stack>
              <Text fw={600} fz={18}>
                {item.title}
              </Text>
              <Text fw={300} fz={12}>
                {getTypeName(item.type)}
              </Text>
              {item.venueId ? (
                <>
                  <Divider />
                  <Text>{venueNameById[item.venueId]}</Text>
                </>
              ) : undefined}
            </Stack>
            {item.status ? (
              <Badge
                mx={12}
                variant="light"
                autoContrast
                color={getBookingStatusColor(item.status)}
              >
                {bookingStatusLabel[item.status]}
              </Badge>
            ) : undefined}
            <Tooltip label="More actions">
              <ActionIcon ml="auto">
                <IconDots />
              </ActionIcon>
            </Tooltip>
          </Group>
        ))}
      </Modal>
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
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CalendarWidget handleChange={setDateAndItems} />
          </div>
        </GridCol>
        <GridCol span={3}>
          <BookingWidget />
        </GridCol>
      </Grid>
    </>
  );
};
