'use client';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { Badge, Button, Card, Group, Stack, Table, Title } from '@mantine/core';
import { useTeamData } from '@/hooks/use-team-data';
import { roleLabel, statusColor } from '@/utils/misc';

export const UserManagementPage = () => {
  const { users, userCountByStatus } = useTeamData();

  const t = useTranslations('Settings');
  const tWidget = useTranslations('Widgets');
  const tCommon = useTranslations('Common');

  return (
    <Stack w="100%" maw={1000}>
      <Title order={3}>{t('users.title')}</Title>

      <Card withBorder>
        <Group gap="xs">
          <Badge variant="light" color="green" size="lg">
            {tWidget('users.active')}: {userCountByStatus.active}
          </Badge>
          <Badge variant="light" color="blue" size="lg">
            {tWidget('users.invited')}: {userCountByStatus.invited}
          </Badge>
          <Badge variant="light" color="gray" size="lg">
            {tWidget('users.disabled')}: {userCountByStatus.disabled}
          </Badge>
        </Group>
      </Card>

      <Card withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('users.name')}</Table.Th>
              <Table.Th>{t('users.email')}</Table.Th>
              <Table.Th>{t('users.role')}</Table.Th>
              <Table.Th>{t('users.status')}</Table.Th>
              <Table.Th>{t('users.lastAccess')}</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.name}</Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>{t(`users.${roleLabel[user.role]}`)}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color={statusColor[user.status]}>
                    {tWidget(`users.${user.status}`)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {user.lastAccessAt ? dayjs(user.lastAccessAt).format('DD MMM YYYY HH:mm') : '-'}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button size="xs" variant="light">
                      {tCommon('actions.edit')}
                    </Button>
                    <Button size="xs" variant="subtle" color="gray">
                      {tCommon('actions.disable')}
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
};
