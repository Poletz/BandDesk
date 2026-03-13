import dayjs from 'dayjs';
import {
  Badge,
  Card,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { BOOKING_STATUSES } from '@/features';
import { useLiveData } from '@/hooks/use-live-data';
import { bookingStatusLabel } from '@/utils/misc';

export const LiveAndBookingComponent = () => {
  const { venues, bookings, upcomingGigs, venueNameById, bookingCountByStatus, isLoading } =
    useLiveData();

  console.log(isLoading);
  return (
    <ScrollArea
      w="100%"
      maw={1000}
      style={{
        height: 'calc(100dvh - 55px - 55px - 100px)',
      }}
    >
      <Stack w="100%">
        <Title order={3}>Live & Booking</Title>

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

        <Card withBorder>
          <Title order={4}>Booking pipeline</Title>
          <Group mt="sm" gap="xs">
            {BOOKING_STATUSES.map((status) => (
              <Badge key={status} variant="light" size="lg">
                {bookingStatusLabel[status]}: {bookingCountByStatus[status]}
              </Badge>
            ))}
          </Group>
        </Card>

        <Title mt={20} order={4}>
          Booking requests
        </Title>
        {/* <Divider my="sm" /> */}
        <Card withBorder>
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
        </Card>

        <Title mt={20} order={4}>
          Venues
        </Title>
        <Card withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Venue Name</Table.Th>
                <Table.Th>Address</Table.Th>
                <Table.Th>City</Table.Th>
                <Table.Th>Contact Name</Table.Th>
                <Table.Th>Phone</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {venues.map((venue) => (
                <Table.Tr key={venue.id}>
                  <Table.Td>{venue.name}</Table.Td>
                  <Table.Td>{venue.address ?? 'N/A'}</Table.Td>
                  <Table.Td>{venue.city ?? 'N/A'}</Table.Td>
                  <Table.Td>{venue.contactName ?? 'N/A'}</Table.Td>
                  <Table.Td>{venue.contactPhone ?? 'N/A'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </ScrollArea>
  );
};
