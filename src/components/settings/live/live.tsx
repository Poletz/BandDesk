import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
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
import { VenueModal } from '@/components/modals';
import { BOOKING_STATUSES } from '@/features';
import { useLiveData } from '@/hooks/use-live-data';
import { Actions, Venue } from '@/interfaces';
import { bookingStatusLabel } from '@/utils/misc';

export const LiveAndBookingComponent = () => {
  const { venues, bookings, upcomingGigs, venueNameById, bookingCountByStatus, isLoading } =
    useLiveData();
  const [openedView, { open: openView, close: closeView }] = useDisclosure(false);

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const handleSubmit = useCallback(() => {
    setSelectedVenue(null);
  }, [selectedVenue]);

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
          close={closeView}
          opened={openedView}
          type={Actions.VIEW}
          venue={selectedVenue}
          onSubmit={handleSubmit}
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

        <Title mt={20} order={4}>
          Booking requests
        </Title>
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
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {bookings.map((booking) => (
                  <Table.Tr key={booking.id}>
                    <Table.Td>{venueNameById?.[booking.venueId]}</Table.Td>
                    <Table.Td>
                      {booking.requestedDate
                        ? dayjs(booking.requestedDate).format('DD MMM YYYY')
                        : 'TBD'}
                    </Table.Td>
                    <Table.Td>{bookingStatusLabel[booking.status]}</Table.Td>
                    <Table.Td>{booking.feeProposal ? `€ ${booking.feeProposal}` : '-'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Skeleton>
        </Card>

        <Title mt={20} order={4}>
          Venues
        </Title>
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
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedVenue(venue);
                      openView();
                    }}
                  >
                    <Table.Td>{venue.name}</Table.Td>
                    <Table.Td>{venue.address ?? 'N/A'}</Table.Td>
                    <Table.Td>{venue.city ?? 'N/A'}</Table.Td>
                    <Table.Td>{venue.contactName ?? 'N/A'}</Table.Td>
                    <Table.Td>{venue.contactPhone ?? 'N/A'}</Table.Td>
                    <Table.Td>
                      <Group>
                        <ActionIcon variant="subtle" size="md" p={4} bdrs="xl">
                          <IconEdit />
                        </ActionIcon>
                        <ActionIcon variant="subtle" c="red" size="md" p={4} bdrs="xl">
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
