import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { IconEdit, IconEye, IconPlus, IconTrash } from '@tabler/icons-react';
import { isAxiosError } from 'axios';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { BookingModal, VenueModal } from '@/components/modals';
import { BOOKING_STATUSES } from '@/features';
import { useLiveData } from '@/hooks/use-live-data';
import { Actions, BookingRequest, Venue } from '@/interfaces';
import { http } from '@/utils/http';
import { bookingStatusLabel, confirmModal } from '@/utils/misc';

export const LiveAndBookingComponent = () => {
  const {
    venues,
    bookings,
    upcomingGigs,
    venueNameById,
    bookingCountByStatus,
    isLoading,
    refetch,
  } = useLiveData();
  const [openedVenueModal, { open: openVenueModal, close: closeVenueModal }] = useDisclosure(false);
  const [openedBookingModal, { open: openBookingModal, close: closeBookingModal }] =
    useDisclosure(false);

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [venueModalType, setVenueModalType] = useState<Actions>(Actions.VIEW);
  const [bookingModalType, setBookingModalType] = useState<Actions>(Actions.VIEW);

  const handleVenueSubmit = useCallback(
    async (values?: Omit<Venue, 'id'>, type?: Actions) => {
      if (!values) {
        setSelectedVenue(null);
        closeVenueModal();
        return;
      }

      try {
        if (type === Actions.CREATE) {
          await http.post('/api/venues', values);
        }

        if (type === Actions.UPDATE && selectedVenue?.id) {
          await http.patch(`/api/venues/${selectedVenue.id}`, values);
        }

        showNotification({ message: 'Venue saved successfully.', color: 'green' });
        setSelectedVenue(null);
        closeVenueModal();
        await refetch();
      } catch (err) {
        if (isAxiosError(err)) {
          showNotification({ message: 'Unable to save venue.', color: 'red' });
        }
      }
    },
    [selectedVenue, refetch, closeVenueModal]
  );

  const handleBookingSubmit = useCallback(
    async (values?: Omit<BookingRequest, 'id' | 'createdAt' | 'updatedAt'>, type?: Actions) => {
      if (!values) {
        setSelectedBooking(null);
        closeBookingModal();
        return;
      }

      try {
        if (type === Actions.CREATE) {
          await http.post('/api/bookings', values);
        }

        if (type === Actions.UPDATE && selectedBooking?.id) {
          await http.patch(`/api/bookings/${selectedBooking.id}`, values);
        }

        showNotification({ message: 'Booking saved successfully.', color: 'green' });
        setSelectedBooking(null);
        closeBookingModal();
        await refetch();
      } catch (err) {
        if (isAxiosError(err)) {
          showNotification({ message: 'Unable to save booking.', color: 'red' });
        }
      }
    },
    [selectedBooking, refetch, closeBookingModal]
  );

  return (
    <ScrollArea
      w="100%"
      maw={1000}
      style={{
        height: 'calc(100dvh - 55px - 55px - 100px)',
      }}
    >
      {selectedVenue && (
        <VenueModal
          close={closeVenueModal}
          opened={openedVenueModal}
          type={venueModalType}
          venue={selectedVenue ?? undefined}
          onSubmit={handleVenueSubmit}
        />
      )}
      {selectedBooking && (
        <BookingModal
          close={closeBookingModal}
          opened={openedBookingModal}
          type={bookingModalType}
          booking={selectedBooking ?? undefined}
          venues={venues}
          onSubmit={handleBookingSubmit}
        />
      )}
      <Stack w="100%">
        <Title order={3}>Live & Booking</Title>

        <Skeleton visible={isLoading}>
          <SimpleGrid cols={{ base: 1, md: 3 }}>
            <Card withBorder>
              <Text size="sm" c="dimmed">
                Venues
              </Text>
              <Title order={2}>{venues.length}</Title>
            </Card>
            <Card withBorder>
              <Text size="sm" c="dimmed">
                Open bookings
              </Text>
              <Title order={2}>
                {bookingCountByStatus.requested + bookingCountByStatus.negotiating}
              </Title>
            </Card>
            <Card withBorder>
              <Text size="sm" c="dimmed">
                Upcoming gigs
              </Text>
              <Title order={2}>{upcomingGigs.length}</Title>
            </Card>
          </SimpleGrid>
        </Skeleton>

        <Card withBorder>
          <Title order={4}>Booking pipeline</Title>
          <Skeleton visible={isLoading}>
            <Group mt="sm" gap="xs">
              {BOOKING_STATUSES.map((status) => (
                <Badge key={status} variant="light" size="lg">
                  {bookingStatusLabel[status]}: {bookingCountByStatus[status]}
                </Badge>
              ))}
            </Group>
          </Skeleton>
        </Card>

        <Group mt={20} justify="space-between">
          <Title order={4}>Booking requests</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setSelectedBooking(null);
              setBookingModalType(Actions.CREATE);
              openBookingModal();
            }}
          >
            New booking
          </Button>
        </Group>
        {/* <Divider my="sm" /> */}
        <Card withBorder>
          <Skeleton visible={isLoading}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Venue</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Fee proposal</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {bookings.length ? (
                  bookings.map((booking) => (
                    <Table.Tr key={booking.id}>
                      <Table.Td>{venueNameById?.[booking.venueId] ?? 'N/A'}</Table.Td>{' '}
                      <Table.Td>
                        {booking.requestedDate
                          ? dayjs(booking.requestedDate).format('DD MMM YYYY')
                          : 'TBD'}
                      </Table.Td>
                      <Table.Td>{bookingStatusLabel[booking.status]}</Table.Td>
                      <Table.Td>{booking.feeProposal ? `€ ${booking.feeProposal}` : '-'}</Table.Td>
                      <Table.Td>
                        <Group gap={6} justify="flex-end" wrap="nowrap">
                          <ActionIcon
                            variant="subtle"
                            size="md"
                            p={4}
                            bdrs="xl"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setBookingModalType(Actions.VIEW);
                              openBookingModal();
                            }}
                          >
                            <IconEye />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            size="md"
                            p={4}
                            bdrs="xl"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setBookingModalType(Actions.UPDATE);
                              openBookingModal();
                            }}
                          >
                            <IconEdit />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            c="red"
                            size="md"
                            p={4}
                            bdrs="xl"
                            onClick={confirmModal(
                              'Delete booking?',
                              'This action cannot be undone.',
                              { confirm: 'Delete', cancel: 'Cancel' },
                              async () => {
                                try {
                                  await http.delete(`/api/bookings/${booking.id}`);
                                  showNotification({ message: 'Booking deleted.', color: 'green' });
                                  await refetch();
                                } catch {
                                  showNotification({
                                    message: 'Unable to delete booking.',
                                    color: 'red',
                                  });
                                }
                              }
                            )}
                          >
                            <IconTrash />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr flex={1}>
                    <Table.Td colSpan={5}>No bookings found...</Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Skeleton>
        </Card>
        <Group mt={20} justify="space-between">
          <Title order={4}>Venues</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setSelectedVenue(null);
              setVenueModalType(Actions.CREATE);
              openVenueModal();
            }}
          >
            New venue
          </Button>
        </Group>
        <Card withBorder>
          <Skeleton visible={isLoading}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Venue Name</Table.Th>
                  <Table.Th>Address</Table.Th>
                  <Table.Th>City</Table.Th>
                  <Table.Th>Contact Name</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {venues.map((venue) => (
                  <Table.Tr
                    key={venue.id}
                    // style={{ cursor: 'pointer' }}
                    // onClick={() => {
                    //   setSelectedVenue(venue);
                    //   openVenueModal();
                    // }}
                  >
                    <Table.Td>{venue.name}</Table.Td>
                    <Table.Td>{venue.address ?? 'N/A'}</Table.Td>
                    <Table.Td>{venue.city ?? 'N/A'}</Table.Td>
                    <Table.Td>{venue.contactName ?? 'N/A'}</Table.Td>
                    <Table.Td>{venue.contactPhone ?? 'N/A'}</Table.Td>
                    <Table.Td>
                      <Group gap={6} justify="flex-end" wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          size="md"
                          p={4}
                          bdrs="xl"
                          onClick={() => {
                            setSelectedVenue(venue);
                            setVenueModalType(Actions.VIEW);
                            openVenueModal();
                          }}
                        >
                          <IconEye />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          size="md"
                          p={4}
                          bdrs="xl"
                          onClick={() => {
                            setSelectedVenue(venue);
                            setVenueModalType(Actions.UPDATE);
                            openVenueModal();
                          }}
                        >
                          <IconEdit />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          c="red"
                          size="md"
                          p={4}
                          bdrs="xl"
                          onClick={confirmModal(
                            'Delete venue?',
                            'This action cannot be undone.',
                            { confirm: 'Delete', cancel: 'Cancel' },
                            async () => {
                              try {
                                await http.delete(`/api/venues/${venue.id}`);
                                showNotification({ message: 'Venue deleted.', color: 'green' });
                                await refetch();
                              } catch {
                                showNotification({
                                  message: 'Unable to delete venue.',
                                  color: 'red',
                                });
                              }
                            }
                          )}
                        >
                          <IconTrash />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Skeleton>
        </Card>
      </Stack>
    </ScrollArea>
  );
};
