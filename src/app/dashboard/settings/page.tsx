'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Stack, Tabs, Title } from '@mantine/core';
import { UserManagementPage } from '@/components/settings';
import { CalendarComponent } from '@/components/settings/calendar';
import { DocumentsComponent } from '@/components/settings/documents';
import { LiveAndBookingComponent } from '@/components/settings/live';
import ProfileSettingsPage from '@/components/settings/profile/profile';
import SecuritySettingsPage from '@/components/settings/security/security';
import { Provider, Tab } from '@/interfaces';
import { http } from '@/utils/http';

const validTabs = new Set(Object.values(Tab));

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('Settings');

  const tab = useMemo(() => {
    const value = searchParams.get('tab');
    return value && validTabs.has(value as Tab) ? (value as Tab) : Tab.PROFILE;
  }, [searchParams]);

  useEffect(() => {
    const getProvider = async () => {
      const { data } = await http.get<{ providers: Provider[] }>('/api/auth/provider');
      if (data && data.providers) {
        setProvider(data.providers[0]);
      }
    };

    void getProvider();
  }, [setProvider]);

  return (
    <Stack>
      <Title order={2}>{t('title')}</Title>

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
          <Tabs.Tab value={Tab.PROFILE}>{t('profile')}</Tabs.Tab>
          <Tabs.Tab value={Tab.SECURITY}>{t('security')}</Tabs.Tab>
          <Tabs.Tab value={Tab.LIVE}>{t('live')}</Tabs.Tab>
          <Tabs.Tab value={Tab.DOCS}>{t('documents')}</Tabs.Tab>
          <Tabs.Tab value={Tab.CALENDAR}>{t('calendar')}</Tabs.Tab>
          <Tabs.Tab value={Tab.USERS}>{t('users')}</Tabs.Tab>
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
