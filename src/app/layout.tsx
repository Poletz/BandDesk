import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/schedule/styles.css';
import '@mantine/notifications/styles.css';
import '@gfazioli/mantine-border-animate/styles.css';
import 'react-phone-number-input/style.css';

import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { Providers } from './providers';

export const metadata = {
  title: 'Mantine Next.js template',
  description: 'I am using Mantine with Next.js!',
};

export default function RootLayout({ children }: { children: any }) {
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
