'use client';

import { useRouter } from 'next/navigation';
import { IconLogout, IconSettings, IconUser, IconUserCircle } from '@tabler/icons-react';
import { User } from 'better-auth';
import { ActionIcon, Group, Menu, Stack, Text, Tooltip } from '@mantine/core';
import { confirmModal } from '@/utils/misc';

export const LoggedUserMenu = ({ user }: { user: User }) => {
  const router = useRouter();

  const component: React.ReactNode = (
    <Text>
      You'll be redirected to the Login page. Are you sure to logout from{' '}
      {process.env.NEXT_PUBLIC_APP_NAME}?
    </Text>
  );
  const doLogout = () => router.replace('/sign-out');
  const confirmLogout = confirmModal(
    `Logout from ${process.env.NEXT_PUBLIC_APP_NAME}?`,
    component,
    { confirm: 'Logout' },
    doLogout
  );

  return (
    <Tooltip label="User menu">
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
            onClick={() => router.push('/settings')}
          >
            Settings
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            leftSection={<IconLogout size={16} />}
            c="red"
            fw="bold"
            onClick={confirmLogout}
          >
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Tooltip>
  );
};
