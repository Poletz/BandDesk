'use client';

import { IconArrowRight } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Badge, Card, Divider, Group, NavLink, Stack, Text, Title } from '@mantine/core';
import { useTeamData } from '@/hooks/use-team-data';

export const UsersWidget = () => {
  const { userCountByStatus, users } = useTeamData();
  const t = useTranslations('Widgets');

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>{t('users.title')}</Title>
          <Badge variant="light">{users.length}</Badge>
        </Group>

        <Divider />

        <Group gap="xs">
          <Badge color="green" variant="light">
            {t('users.active')}: {userCountByStatus.active}
          </Badge>
          <Badge color="blue" variant="light">
            {t('users.invited')}: {userCountByStatus.invited}
          </Badge>
          <Badge color="gray" variant="light">
            {t('users.disabled')}: {userCountByStatus.disabled}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed">
          {t('users.description')}
        </Text>

        <NavLink
          label={t('users.goTo')}
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
