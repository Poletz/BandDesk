'use client';

import { IconArrowRight } from '@tabler/icons-react';
import { Badge, Card, Divider, Group, NavLink, Stack, Text, Title } from '@mantine/core';
import { useTeamData } from '@/hooks/use-team-data';

export const UsersWidget = () => {
  const { userCountByStatus, users } = useTeamData();

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>Users</Title>
          <Badge variant="light">{users.length}</Badge>
        </Group>

        <Divider />

        <Group gap="xs">
          <Badge color="green" variant="light">
            Active: {userCountByStatus.active}
          </Badge>
          <Badge color="blue" variant="light">
            Invited: {userCountByStatus.invited}
          </Badge>
          <Badge color="gray" variant="light">
            Disabled: {userCountByStatus.disabled}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed">
          Manage team roles and account statuses from the Settings area.
        </Text>

        <NavLink
          label="Go to Manage Users"
          href="/dashboard/settings?tab=users"
          rightSection={<IconArrowRight size={12} />}
          variant="subtle"
          bdrs="md"
          active
        />
      </Stack>
    </Card>
  );
};
