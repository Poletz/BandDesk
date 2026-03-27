import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, localeCookieName, locales, type Locale } from './config';

const toSupportedLocale = (value?: string | null): Locale | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase().split('-')[0];

  return locales.find((locale) => locale === normalized) as Locale | undefined;
};

const resolveLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const cookieLocale = toSupportedLocale(cookieStore.get(localeCookieName)?.value);

  if (cookieLocale) {
    return cookieLocale;
  }

  const headersList = await headers();
  const acceptedLanguages = headersList.get('accept-language')?.split(',') ?? [];

  for (const language of acceptedLanguages) {
    const locale = toSupportedLocale(language.trim());
    if (locale) {
      return locale;
    }
  }

  return defaultLocale;
};

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: (await import(`../../locale/${locale}.json`)).default,
  };
});
