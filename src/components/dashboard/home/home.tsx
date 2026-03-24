'use client';

import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { IconDots, IconEdit, IconEyeSearch, IconTrash } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
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
import { showNotification } from '@mantine/notifications';
import { BookingModal, VenueModal } from '@/components/modals';
import {
  BookingWidget,
  CalendarWidget,
  DocumentsWidget,
  LiveWidget,
  QuickActionsWidget,
  UsersWidget,
} from '@/components/widgets';
import { useLiveData } from '@/hooks/use-live-data';
import { Actions, BookingRequest, CalendarItem, QuickAction } from '@/interfaces';
import { useAuthStore } from '@/store/auth';
import { http } from '@/utils/http';
import { bookingStatusLabel, confirmModal, getBookingStatusColor, getTypeName } from '@/utils/misc';

export const HomeComponent = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [venueOpened, { open: venueOpen, close: venueClose }] = useDisclosure(false);
  const [bookingOpened, { open: bookingOpen, close: bookingClose }] = useDisclosure(false);
  const [date, setDate] = useState<Date>(new Date());
  const [items, setSelectedItems] = useState<CalendarItem[]>([]);
  const [bookingModalType, setBookingModalType] = useState<Actions>(Actions.VIEW);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const queryClient = useQueryClient();
  const { venueNameById, venues } = useLiveData();

  const user = useAuthStore((s) => s.user);

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

  const handleClose = useCallback(venueClose, [venueClose]);

  const refreshLiveAndCalendarData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['live-data'] }),
      queryClient.invalidateQueries({ queryKey: ['calendar-data'] }),
    ]);
  }, [queryClient]);

  const handleOpenBookingModal = useCallback(
    async (item: CalendarItem, modalType: Actions) => {
      if (item.type !== 'booking') {
        showNotification({
          color: 'yellow',
          message: 'This event type cannot be edited here yet.',
        });
        return;
      }

      try {
        const { data } = await http.get<{ booking: BookingRequest }>(`/api/bookings/${item.id}`);
        setSelectedBooking(data.booking);
        setBookingModalType(modalType);
        bookingOpen();
      } catch (error) {
        showNotification({
          color: 'red',
          message: isAxiosError(error)
            ? (error.response?.data?.message ?? 'Unable to load booking details.')
            : 'Unable to load booking details.',
        });
      }
    },
    [bookingOpen]
  );

  const handleBookingSubmit = useCallback(
    async (values?: Omit<BookingRequest, 'id' | 'createdAt' | 'updatedAt'>, type?: Actions) => {
      if (!values || !selectedBooking || type !== Actions.UPDATE) {
        setSelectedBooking(null);
        bookingClose();
        return;
      }

      setIsSavingBooking(true);
      try {
        await http.patch(`/api/bookings/${selectedBooking.id}`, values);
        showNotification({ message: 'Booking updated successfully.', color: 'green' });
        setSelectedBooking(null);
        bookingClose();
        await refreshLiveAndCalendarData();
      } catch (error) {
        showNotification({
          color: 'red',
          message: isAxiosError(error)
            ? (error.response?.data?.message ?? 'Unable to update booking.')
            : 'Unable to update booking.',
        });
      } finally {
        setIsSavingBooking(false);
      }
    },
    [bookingClose, refreshLiveAndCalendarData, selectedBooking]
  );

  const handleDeleteEvent = useCallback(
    (item: CalendarItem) =>
      confirmModal(
        'Delete event?',
        'This action cannot be undone.',
        { confirm: 'Delete', cancel: 'Cancel' },
        async () => {
          const endpoint =
            item.type === 'booking' ? `/api/bookings/${item.id}` : `/api/gigs/${item.id}`;

          try {
            await http.delete(endpoint);
            setSelectedItems((prev) => prev.filter((prevItem) => prevItem.id !== item.id));
            showNotification({ message: 'Event deleted.', color: 'green' });
            await refreshLiveAndCalendarData();
          } catch (error) {
            showNotification({
              color: 'red',
              message: isAxiosError(error)
                ? (error.response?.data?.message ?? 'Unable to delete event.')
                : 'Unable to delete event.',
            });
          }
        }
      ),
    [refreshLiveAndCalendarData]
  );

  const handleClick = useCallback(
    (type: QuickAction) => {
      switch (type) {
        case QuickAction.LIVE:
        case QuickAction.DOC:
          break;
        case QuickAction.VENUE:
          venueOpen();
          break;
      }
    },
    [venueOpen]
  );

  return (
    <>
      <VenueModal opened={venueOpened} close={handleClose} type={Actions.CREATE} />
      <BookingModal
        opened={bookingOpened}
        close={() => {
          if (isSavingBooking) {
            return;
          }

          setSelectedBooking(null);
          bookingClose();
        }}
        type={bookingModalType}
        booking={selectedBooking ?? undefined}
        venues={venues}
        onSubmit={handleBookingSubmit}
      />
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
                  <Text fz="14">Venue: {venueNameById?.[item.venueId]}</Text>
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
                    // component="a"
                    // href="/dashboard/settings?tab=live"
                    onClick={() => handleOpenBookingModal(item, Actions.VIEW)}
                  >
                    Show details
                  </MenuItem>
                  <MenuItem
                    leftSection={<IconEdit size={16} />}
                    onClick={() => handleOpenBookingModal(item, Actions.UPDATE)}
                  >
                    Edit event
                  </MenuItem>
                  <MenuDivider my={8} />
                  <MenuItem
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={handleDeleteEvent(item)}
                  >
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
          <Title order={2}>Welcome, {user?.name ?? 'User'}!</Title>
          <Text c="dimmed">Keep the rock on</Text>
        </div>

        <QuickActionsWidget onAction={handleClick} />
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
