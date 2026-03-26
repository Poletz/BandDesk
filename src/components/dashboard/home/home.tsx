'use client';

import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
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
import { Actions, BookingRequest, CalendarItem, GigEvent, QuickAction } from '@/interfaces';
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
  const [gigDetailsOpened, { open: openGigDetails, close: closeGigDetails }] = useDisclosure(false);
  const [selectedGig, setSelectedGig] = useState<GigEvent | null>(null);
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

  const handleShowEventDetails = useCallback(
    async (item: CalendarItem) => {
      if (item.type === 'reminder') {
        showNotification({
          color: 'blue',
          message: 'Reminder details are available directly in this list.',
        });
        return;
      }

      if (item.type === 'booking') {
        try {
          const { data } = await http.get<{ booking: BookingRequest }>(`/api/bookings/${item.id}`);
          setSelectedBooking(data.booking);
          setBookingModalType(Actions.VIEW);
          bookingOpen();
        } catch (error) {
          showNotification({
            color: 'red',
            message: isAxiosError(error)
              ? (error.response?.data?.message ?? 'Unable to load booking details.')
              : 'Unable to load booking details.',
          });
        }
        return;
      }

      try {
        const { data } = await http.get<{ gig: GigEvent }>(`/api/gigs/${item.id}`);
        setSelectedGig(data.gig);
        openGigDetails();
      } catch (error) {
        showNotification({
          color: 'red',
          message: isAxiosError(error)
            ? (error.response?.data?.message ?? 'Unable to load gig details.')
            : 'Unable to load gig details.',
        });
      }
    },
    [bookingOpen, openGigDetails]
  );

  const handleOpenBookingModal = useCallback(
    async (item: CalendarItem, modalType: Actions) => {
      if (item.type === 'reminder') {
        showNotification({
          color: 'yellow',
          message: 'Reminder events are not editable from this modal.',
        });
        return;
      }

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
          if (item.type === 'reminder') {
            showNotification({
              color: 'yellow',
              message: 'Reminder events are read-only in this view.',
            });
            return;
          }

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

  const dateItemsByType = useMemo(() => {
    const bookingAndGigItems = items.filter((item) => item.type !== 'reminder');
    const reminderItems = items.filter((item) => item.type === 'reminder');

    return { bookingAndGigItems, reminderItems };
  }, [items]);

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
        {dateItemsByType.bookingAndGigItems.map((item, i) => (
          <Group key={i.toString().concat(`${item.type}-${item.id}`)} bg="dark.4" p={12} bdrs="lg">
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
                    onClick={() => handleShowEventDetails(item)}
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
        {dateItemsByType.reminderItems.length ? (
          <Stack mt="md" gap="xs">
            <Text fw={600} c="dimmed">
              Reminders
            </Text>
            {dateItemsByType.reminderItems.map((item) => (
              <Group key={`reminder-${item.id}`} bg="dark.6" p={12} bdrs="lg">
                <Stack gap={4}>
                  <Group gap={8}>
                    <Text fw={600} fz={16}>
                      {item.title}
                    </Text>
                    <Badge color="gray" variant="light">
                      Reminder
                    </Badge>
                  </Group>
                  <Text fw={300} fz={12}>
                    Type: {getTypeName(item.type)}
                  </Text>
                  {item.venueId ? (
                    <>
                      <Divider color="dark.0" />
                      <Text fz="14">Venue: {venueNameById?.[item.venueId] ?? '-'}</Text>
                    </>
                  ) : null}
                </Stack>
              </Group>
            ))}
          </Stack>
        ) : null}
      </Modal>
      <Modal
        opened={gigDetailsOpened}
        onClose={() => {
          setSelectedGig(null);
          closeGigDetails();
        }}
        title="Gig details"
      >
        <Stack gap="xs">
          <Text fw={600}>{selectedGig?.title ?? '-'}</Text>
          <Text size="sm" c="dimmed">
            Date: {selectedGig?.date ? dayjs(selectedGig.date).format('DD MMM YYYY HH:mm') : '-'}
          </Text>
          <Text size="sm" c="dimmed">
            Venue: {selectedGig?.venueId ? (venueNameById?.[selectedGig.venueId] ?? '-') : '-'}
          </Text>
          <Badge w="fit-content" color={getBookingStatusColor(selectedGig?.status)} variant="light">
            {selectedGig?.status ? bookingStatusLabel[selectedGig.status] : 'n/a'}
          </Badge>
          {selectedGig?.setlistName ? (
            <Text size="sm">Setlist: {selectedGig.setlistName}</Text>
          ) : null}
          {selectedGig?.notes ? <Text size="sm">Notes: {selectedGig.notes}</Text> : null}
        </Stack>
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
