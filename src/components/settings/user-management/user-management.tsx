'use client';

import dayjs from 'dayjs';
import { Badge, Button, Card, Group, Stack, Table, Text, Title } from '@mantine/core';
import { useTeamData } from '@/hooks/use-team-data';
import { roleLabel, statusColor } from '@/utils/misc';

export const UserManagementPage = () => {
  const { users, userCountByStatus } = useTeamData();

  return (
    <Stack w="100%" maw={1000}>
      <Title order={3}>Manage Users</Title>

      <Card withBorder>
        <Group gap="xs">
          <Badge variant="light" color="green" size="lg">
            Active: {userCountByStatus.active}
          </Badge>
          <Badge variant="light" color="blue" size="lg">
            Invited: {userCountByStatus.invited}
          </Badge>
          <Badge variant="light" color="gray" size="lg">
            Disabled: {userCountByStatus.disabled}
          </Badge>
        </Group>
      </Card>

      <Card withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Last access</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.name}</Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>{roleLabel[user.role]}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color={statusColor[user.status]}>
                    {user.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {user.lastAccessAt ? dayjs(user.lastAccessAt).format('DD MMM YYYY HH:mm') : '-'}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button size="xs" variant="light">
                      Edit
                    </Button>
                    <Button size="xs" variant="subtle" color="gray">
                      Disable
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Text mt="md" c="dimmed" size="sm">
          Mock management actions will be connected to Firebase user records in the next step.
        </Text>
      </Card>
    </Stack>
  );
};
