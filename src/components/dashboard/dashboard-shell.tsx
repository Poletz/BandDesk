'use client';

import React from 'react';
import { IconHome, IconSettings } from '@tabler/icons-react';
import { User } from 'better-auth';
import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ColorSchemeToggle, LoggedUserMenu } from '../header';
import { NavbarLink } from '../navbar';

export const DashboardShell = ({ children, user }: { children: React.ReactNode; user: User }) => {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />

          <Text fw={700}>Dash Template</Text>
          <Group ml="auto">
            <ColorSchemeToggle />
            <LoggedUserMenu user={user} />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavbarLink href="/dashboard" label="Home" icon={<IconHome size={18} />} />
        <NavbarLink
          href="/dashboard/settings?tab=profile"
          label="Settings"
          icon={<IconSettings size={18} />}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
