'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Stack, Tabs, Title } from '@mantine/core';
import { UserManagementPage } from '@/components/settings';
import { CalendarComponent } from '@/components/settings/calendar';
import { DocumentsComponent } from '@/components/settings/documents';
import { LiveAndBookingComponent } from '@/components/settings/live';
import ProfileSettingsPage from '@/components/settings/profile/profile';
import SecuritySettingsPage from '@/components/settings/security/security';
import { Provider, Tab } from '@/interfaces';

const validTabs = new Set(Object.values(Tab));

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = useMemo(() => {
    const value = searchParams.get('tab');
    return value && validTabs.has(value as Tab) ? (value as Tab) : Tab.PROFILE;
  }, [searchParams]);

  useEffect(() => {
    const getProvider = async () => {
      const { data } = await axios.get<{ providers: Provider[] }>('/api/auth/provider');
      if (data && data.providers) {
        setProvider(data.providers[0]);
      }
    };

    getProvider();
  }, [setProvider]);

  return (
    <Stack>
      <Title order={2}>Settings</Title>

      <Tabs
        value={tab}
        onChange={(value) => {
          const nextTab = value && validTabs.has(value as Tab) ? value : Tab.PROFILE;
          if (nextTab !== tab) {
            router.replace(`?tab=${nextTab}`);
          }
        }}
      >
        <Tabs.List mb={20}>
          <Tabs.Tab value={Tab.PROFILE}>Profile</Tabs.Tab>
          <Tabs.Tab value={Tab.SECURITY}>Account security</Tabs.Tab>
          <Tabs.Tab value={Tab.LIVE}>Live & Booking</Tabs.Tab>
          <Tabs.Tab value={Tab.DOCS}>Documents</Tabs.Tab>
          <Tabs.Tab value={Tab.CALENDAR}>Calendar</Tabs.Tab>
          <Tabs.Tab value={Tab.USERS}>Manage Users</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profile" style={{ display: 'flex', justifyContent: 'center' }}>
          <ProfileSettingsPage />
        </Tabs.Panel>
        <Tabs.Panel value="security" style={{ display: 'flex', justifyContent: 'center' }}>
          <SecuritySettingsPage provider={provider} />
        </Tabs.Panel>
        <Tabs.Panel value="live" style={{ display: 'flex', justifyContent: 'center' }}>
          <LiveAndBookingComponent />
        </Tabs.Panel>
        <Tabs.Panel value="docs" style={{ display: 'flex', justifyContent: 'center' }}>
          <DocumentsComponent />
        </Tabs.Panel>
        <Tabs.Panel value="calendar" style={{ display: 'flex', justifyContent: 'center' }}>
          <CalendarComponent />
        </Tabs.Panel>
        <Tabs.Panel value="users" style={{ display: 'flex', justifyContent: 'center' }}>
          <UserManagementPage />
        </Tabs.Panel>
      </Tabs>

      {children}
    </Stack>
  );
}
