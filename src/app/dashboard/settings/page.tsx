'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Stack, Tabs, Title } from '@mantine/core';
import { UserManagementPage } from '@/components/settings';
import ProfileSettingsPage from '@/components/settings/profile/profile';
import SecuritySettingsPage from '@/components/settings/security/security';
import { Provider } from '@/interfaces';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<string>('profile');
  const [provider, setProvider] = useState<Provider | null>(null);

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

      <Tabs value={tab} onChange={(val) => setTab(val ?? 'profile')}>
        <Tabs.List>
          <Tabs.Tab value="profile">Profile</Tabs.Tab>
          <Tabs.Tab value="security">Account security</Tabs.Tab>
          <Tabs.Tab value="users">Manage Users</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profile" style={{ display: 'flex', justifyContent: 'center' }}>
          <ProfileSettingsPage />
        </Tabs.Panel>
        <Tabs.Panel value="security" style={{ display: 'flex', justifyContent: 'center' }}>
          <SecuritySettingsPage provider={provider} />
        </Tabs.Panel>
        <Tabs.Panel value="users" style={{ display: 'flex', justifyContent: 'center' }}>
          <UserManagementPage />
        </Tabs.Panel>
      </Tabs>

      {children}
    </Stack>
  );
}
