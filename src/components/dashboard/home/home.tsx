'use client';

import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { IconDots, IconEdit, IconEyeSearch, IconTrash } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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
import { BookingModal, GigModal, VenueModal } from '@/components/modals';
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
import { getApiErrorMessage, http } from '@/utils/http';
import { bookingStatusLabel, confirmModal, getBookingStatusColor, getTypeName } from '@/utils/misc';

export const HomeComponent = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [venueOpened, { open: venueOpen, close: venueClose }] = useDisclosure(false);
  const [gigOpened, { open: gigOpen, close: gigClose }] = useDisclosure(false);
  const [bookingOpened, { open: bookingOpen, close: bookingClose }] = useDisclosure(false);
  const [date, setDate] = useState<Date>(new Date());
  const [items, setSelectedItems] = useState<CalendarItem[]>([]);
  const [bookingModalType, setBookingModalType] = useState<Actions>(Actions.VIEW);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [gigDetailsOpened, { open: openGigDetails, close: closeGigDetails }] = useDisclosure(false);
  const [selectedGig, setSelectedGig] = useState<GigEvent | null>(null);
  const queryClient = useQueryClient();
  const { venueNameById, venues, bookings } = useLiveData();
  const user = useAuthStore((s) => s.user);
  const t = useTranslations('Home');
  const tCom = useTranslations('Common');
  const tStatus = useTranslations('Statuses');

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

  const refreshLiveAndCalendarData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['live-data'] }),
      queryClient.invalidateQueries({ queryKey: ['calendar-data'] }),
    ]);
  }, [queryClient]);

  const handleShowEventDetails = useCallback(
    async (item: CalendarItem) => {
      if (item.type === 'reminder') {
        showNotification({ color: 'blue', message: t('notifications.reminderDetails') });
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
            message: getApiErrorMessage(error, t('notifications.unableLoadBooking')),
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
          message: getApiErrorMessage(error, t('notifications.unableLoadGig')),
        });
      }
    },
    [bookingOpen, openGigDetails, t]
  );

  const handleOpenBookingModal = useCallback(
    async (item: CalendarItem, modalType: Actions) => {
      if (item.type === 'reminder') {
        showNotification({ color: 'yellow', message: t('notifications.reminderNotEditable') });
        return;
      }

      if (item.type !== 'booking') {
        showNotification({ color: 'yellow', message: t('notifications.eventNotEditable') });
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
          message: getApiErrorMessage(error, t('notifications.unableLoadBooking')),
        });
      }
    },
    [bookingOpen, t]
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
        showNotification({ message: t('notifications.bookingUpdated'), color: 'green' });
        setSelectedBooking(null);
        bookingClose();
        await refreshLiveAndCalendarData();
      } catch (error) {
        showNotification({
          color: 'red',
          message: getApiErrorMessage(error, t('notifications.unableUpdateBooking')),
        });
      } finally {
        setIsSavingBooking(false);
      }
    },
    [bookingClose, refreshLiveAndCalendarData, selectedBooking, t]
  );

  const handleDeleteEvent = useCallback(
    (item: CalendarItem) =>
      confirmModal(
        t('confirm.deleteEventTitle'),
        tCom('confirm.cannotUndo'),
        { confirm: tCom('actions.delete'), cancel: tCom('actions.cancel') },
        async () => {
          if (item.type === 'reminder') {
            showNotification({ color: 'yellow', message: t('notifications.reminderReadOnly') });
            return;
          }

          const endpoint =
            item.type === 'booking' ? `/api/bookings/${item.id}` : `/api/gigs/${item.id}`;

          try {
            await http.delete(endpoint);
            setSelectedItems((prev) => prev.filter((prevItem) => prevItem.id !== item.id));
            showNotification({ message: t('notifications.eventDeleted'), color: 'green' });
            await refreshLiveAndCalendarData();
          } catch (error) {
            showNotification({
              color: 'red',
              message: getApiErrorMessage(error, t('notifications.unableDeleteEvent')),
            });
          }
        }
      ),
    [refreshLiveAndCalendarData, t, tCom]
  );

  const handleClick = useCallback(
    (type: QuickAction) => {
      switch (type) {
        case QuickAction.LIVE:
          gigOpen();
          break;
        case QuickAction.VENUE:
          venueOpen();
          break;
        case QuickAction.DOC:
          // docOpen();
          break;

        default:
          break;
      }
    },
    [venueOpen, gigOpen]
  );

  const dateItemsByType = useMemo(() => {
    const bookingAndGigItems = items.filter((item) => item.type !== 'reminder');
    const reminderItems = items.filter((item) => item.type === 'reminder');

    return { bookingAndGigItems, reminderItems };
  }, [items]);

  return (
    <>
      <GigModal
        opened={gigOpened}
        close={gigClose}
        type={Actions.CREATE}
        venues={venues}
        bookings={bookings}
      />
      <VenueModal opened={venueOpened} close={venueClose} type={Actions.CREATE} />
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
        title={t('eventsModal.title', {
          count: items.length,
          date: dayjs(date).format('DD/MM/YYYY'),
        })}
        size="lg"
      >
        {dateItemsByType.bookingAndGigItems.map((item, i) => (
          <Group key={i.toString().concat(`${item.type}-${item.id}`)} bg="dark.4" p={12} bdrs="lg">
            <Stack gap={4}>
              <Group>
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
                    {tStatus(`booking.${bookingStatusLabel[item.status]}`)}
                  </Badge>
                ) : null}
              </Group>
              <Text fw={300} fz={12}>
                {t('eventsModal.type')}: {getTypeName(item.type)}
              </Text>
              {item.venueId ? (
                <>
                  <Divider color="dark.0" />
                  <Text fz="14">
                    {t('eventsModal.venue')}: {venueNameById?.[item.venueId]}
                  </Text>
                </>
              ) : null}
            </Stack>
            <Tooltip label={t('eventsModal.moreActions')}>
              <Menu trigger="click-hover">
                <MenuTarget>
                  <ActionIcon ml="auto" variant="subtle" color="white" bdrs="xl">
                    <IconDots />
                  </ActionIcon>
                </MenuTarget>
                <MenuDropdown w={200} p={8}>
                  <MenuItem
                    leftSection={<IconEyeSearch size={16} />}
                    onClick={() => handleShowEventDetails(item)}
                  >
                    {t('eventsModal.showDetails')}
                  </MenuItem>
                  <MenuItem
                    leftSection={<IconEdit size={16} />}
                    onClick={() => handleOpenBookingModal(item, Actions.UPDATE)}
                  >
                    {t('eventsModal.editEvent')}
                  </MenuItem>
                  <MenuDivider my={8} />
                  <MenuItem
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={handleDeleteEvent(item)}
                  >
                    {t('eventsModal.deleteEvent')}
                  </MenuItem>
                </MenuDropdown>
              </Menu>
            </Tooltip>
          </Group>
        ))}

        {dateItemsByType.reminderItems.length ? (
          <Stack mt="md" gap="xs">
            <Text fw={600} c="dimmed">
              {t('eventsModal.reminders')}
            </Text>
            {dateItemsByType.reminderItems.map((item) => (
              <Group key={`reminder-${item.id}`} bg="dark.6" p={12} bdrs="lg">
                <Stack gap={4}>
                  <Group gap={8}>
                    <Text fw={600} fz={16}>
                      {item.title}
                    </Text>
                    <Badge color="gray" variant="light">
                      {t('eventsModal.reminder')}
                    </Badge>
                  </Group>
                  <Text fw={300} fz={12}>
                    {t('eventsModal.type')}: {getTypeName(item.type)}
                  </Text>
                  {item.venueId ? (
                    <>
                      <Divider color="dark.0" />
                      <Text fz="14">
                        {t('eventsModal.venue')}: {venueNameById?.[item.venueId] ?? '-'}
                      </Text>
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
        title={t('gigModal.title')}
      >
        <Stack gap="xs">
          <Text fw={600}>{selectedGig?.title ?? '-'}</Text>
          <Text size="sm" c="dimmed">
            {t('gigModal.date')}:{' '}
            {selectedGig?.date ? dayjs(selectedGig.date).format('DD MMM YYYY HH:mm') : '-'}
          </Text>
          <Text size="sm" c="dimmed">
            {t('eventsModal.venue')}:{' '}
            {selectedGig?.venueId ? (venueNameById?.[selectedGig.venueId] ?? '-') : '-'}
          </Text>
          <Badge w="fit-content" color={getBookingStatusColor(selectedGig?.status)} variant="light">
            {selectedGig?.status ? bookingStatusLabel[selectedGig.status] : tCom('na')}
          </Badge>
          {selectedGig?.setlistName ? (
            <Text size="sm">
              {t('gigModal.setlist')}: {selectedGig.setlistName}
            </Text>
          ) : null}
          {selectedGig?.notes ? (
            <Text size="sm">
              {t('gigModal.notes')}: {selectedGig.notes}
            </Text>
          ) : null}
        </Stack>
      </Modal>

      <Group>
        <div style={{ marginRight: 'auto' }}>
          <Title order={2}>{t('welcome', { name: user?.name ?? t('userFallback') })}</Title>
          <Text c="dimmed">{t('subtitle')}</Text>
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
