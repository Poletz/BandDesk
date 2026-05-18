'use client';

import 'dayjs/locale/it';
import 'dayjs/locale/en';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import type { Locale } from '@/i18n/config';
import { theme } from '@/store/theme';

interface ProvidersProps {
  children: React.ReactNode;
  locale: Locale;
  messages: Record<string, unknown>;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      })
  );

  useEffect(() => {
    dayjs.locale(locale);
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Rome">
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <DatesProvider
          settings={{
            locale,
            firstDayOfWeek: 1,
            weekendDays: [0, 6],
          }}
        >
          <QueryClientProvider client={queryClient}>
            <ModalsProvider>
              <Notifications position="top-right" />
              {children}
            </ModalsProvider>
          </QueryClientProvider>
        </DatesProvider>
      </MantineProvider>
    </NextIntlClientProvider>
  );
}
