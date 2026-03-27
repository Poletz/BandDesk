'use client';

import { useRouter } from 'next/navigation';
import { IconLogout, IconSettings, IconUser, IconUserCircle } from '@tabler/icons-react';
import { User } from 'better-auth';
import { useTranslations } from 'next-intl';
import { ActionIcon, Group, Menu, Stack, Text, Tooltip } from '@mantine/core';
import { confirmModal } from '@/utils/misc';

export const LoggedUserMenu = ({ user }: { user: User }) => {
  const router = useRouter();
  const t = useTranslations('UserMenu');
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'BandDesk';

  const component: React.ReactNode = <Text>{t('confirmBody', { appName })}</Text>;

  const doLogout = () => router.replace('/sign-out');
  const confirmLogout = confirmModal(
    t('confirmTitle', { appName }),
    component,
    { confirm: t('logout') },
    doLogout
  );

  return (
    <Tooltip label={t('tooltip')}>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon bdrs="xl" color="violet" autoContrast size={36}>
            <IconUser />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>
            <Group>
              <IconUserCircle />
              <Stack gap={2}>
                <Text fw="bold">{user.name}</Text>
                <Text size="xs">{user.email}</Text>
              </Stack>
            </Group>
          </Menu.Label>

          <Menu.Divider />

          <Menu.Item
            leftSection={<IconSettings size={16} />}
            onClick={() => router.push('/dashboard/settings?tab=profile')}
          >
            {t('settings')}
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            leftSection={<IconLogout size={16} />}
            c="red"
            fw="bold"
            onClick={confirmLogout}
          >
            {t('logout')}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Tooltip>
  );
};
