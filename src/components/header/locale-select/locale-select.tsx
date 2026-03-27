'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Select } from '@mantine/core';
import { locales, type Locale } from '@/i18n/config';

export const LocaleSelect = () => {
  const t = useTranslations('Common');
  const currentLocale = useLocale() as Locale;
  const [value, setValue] = useState<Locale>(currentLocale);
  const router = useRouter();

  const onChange = async (nextLocale: string | null) => {
    if (!nextLocale || !locales.includes(nextLocale as Locale) || nextLocale === currentLocale) {
      return;
    }

    setValue(nextLocale as Locale);

    await fetch('/api/i18n/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: nextLocale }),
    });

    router.refresh();
  };

  return (
    <Select
      aria-label={t('language')}
      label={t('language')}
      size="xs"
      w={112}
      data={locales.map((locale) => ({ value: locale, label: locale.toUpperCase() }))}
      value={value}
      onChange={onChange}
      allowDeselect={false}
    />
  );
};
