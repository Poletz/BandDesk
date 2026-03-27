'use client';

import React, { useEffect } from 'react';
import { IconHome, IconSettings } from '@tabler/icons-react';
import { User } from 'better-auth';
import { useTranslations } from 'next-intl';
import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuthStore } from '@/store/auth';
import { ColorSchemeToggle, LocaleSelect, LoggedUserMenu } from '../header';
import { NavbarLink } from '../navbar';

export const DashboardShell = ({ children, user }: { children: React.ReactNode; user: User }) => {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const tNav = useTranslations('Navigation');
  const tCom = useTranslations('Common');

  const { setUser } = useAuthStore();

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

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

          <Text fw={700}>{tCom('appName')}</Text>
          <Group ml="auto">
            <LocaleSelect />
            <ColorSchemeToggle />
            <LoggedUserMenu user={user} />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavbarLink href="/dashboard" label={tNav('home')} icon={<IconHome size={18} />} />
        <NavbarLink
          href="/dashboard/settings?tab=profile"
          label={tNav('settings')}
          icon={<IconSettings size={18} />}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
