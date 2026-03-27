import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/schedule/styles.css';
import '@mantine/notifications/styles.css';
import '@gfazioli/mantine-border-animate/styles.css';
import 'react-phone-number-input/style.css';

import { getLocale, getMessages } from 'next-intl/server';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { defaultLocale, locales, type Locale } from '@/i18n/config';
import { Providers } from './providers';

export const metadata = {
  title: 'BandDesk - BDX',
  description: 'BandDesk — Organize your band, your sets, your gigs!',
};

const toSupportedLocale = (value: string): Locale =>
  (locales.includes(value as Locale) ? value : defaultLocale) as Locale;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = toSupportedLocale(await getLocale());
  const messages = await getMessages();

  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.png" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
