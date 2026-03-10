'use client';

import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { IconDots, IconEdit, IconEyeSearch, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Divider,
  Grid,
  GridCol,
  Group,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  Modal,
  Space,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  BookingWidget,
  CalendarWidget,
  DocumentsWidget,
  LiveWidget,
  QuickActionsWidget,
  UsersWidget,
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
        size="lg"
      >
        {items.map((item, i) => (
          <Group key={i.toString().concat('-modal-item')} bg="dark.4" p={12} bdrs="lg">
            <Stack gap={4}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Text fw={600} fz={16}>
                  {item.title}
                </Text>
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
              </div>
              <Text fw={300} fz={12}>
                Type: {getTypeName(item.type)}
              </Text>
              {item.venueId ? (
                <>
                  <Divider color="dark.0" />
                  <Text fz="14">Venue: {venueNameById[item.venueId]}</Text>
                </>
              ) : undefined}
            </Stack>
            <Tooltip label="More actions">
              <Menu trigger="click-hover">
                <MenuTarget>
                  <ActionIcon ml="auto" variant="subtle" color="white" bdrs="xl">
                    <IconDots />
                  </ActionIcon>
                </MenuTarget>
                <MenuDropdown w={200} p={8}>
                  {/* <MenuLabel>Pippo</MenuLabel> */}
                  <MenuItem
                    leftSection={<IconEyeSearch size={16} />}
                    component="a"
                    href="/dashboard/settings?tab=live"
                  >
                    Show details
                  </MenuItem>
                  <MenuItem leftSection={<IconEdit size={16} />}>Edit event</MenuItem>
                  <MenuDivider my={8} />
                  <MenuItem color="red" leftSection={<IconTrash size={16} />}>
                    Delete event
                  </MenuItem>
                </MenuDropdown>
              </Menu>
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

      <Grid mt={20} gap="lg">
        <GridCol span={{ base: 12, md: 6 }}>
          <LiveWidget />
          <Space h="lg" />
          <BookingWidget />
        </GridCol>
        <GridCol span={{ base: 12, md: 6 }}>
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
        <GridCol span={{ base: 12, md: 6 }}>
          <DocumentsWidget />
        </GridCol>
        <GridCol span={{ base: 12, md: 6 }}>
          <UsersWidget />
        </GridCol>
      </Grid>
    </>
  );
};
