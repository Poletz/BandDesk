'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconChevronDown } from '@tabler/icons-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Group, Menu, Text } from '@mantine/core';
import { locales, type Locale } from '@/i18n/config';

const localeMeta: Record<Locale, { flag: string; label: string }> = {
  en: { flag: '🇬🇧', label: 'English' },
  it: { flag: '🇮🇹', label: 'Italiano' },
};

export const LocaleSelect = () => {
  const t = useTranslations('Common');
  const currentLocale = useLocale() as Locale;
  const [value, setValue] = useState<Locale>(currentLocale);
  const router = useRouter();

  const onChange = async (nextLocale: Locale) => {
    if (!locales.includes(nextLocale) || nextLocale === currentLocale) {
      return;
    }

    setValue(nextLocale);

    await fetch('/api/i18n/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: nextLocale }),
    });

    router.refresh();
  };

  return (
    <Menu position="bottom-end" shadow="md" width={180} withinPortal>
      <Menu.Target>
        <Button
          aria-label={t('language')}
          variant="subtle"
          px={10}
          size="compact-sm"
          rightSection={<IconChevronDown size={14} stroke={1.8} />}
        >
          <Text component="span" fz="lg" lh={1} aria-hidden>
            {localeMeta[value].flag}
          </Text>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {locales.map((locale) => (
          <Menu.Item
            key={locale}
            onClick={() => onChange(locale)}
            disabled={locale === value}
            leftSection={
              <Text component="span" fz="lg" lh={1} aria-hidden>
                {localeMeta[locale].flag}
              </Text>
            }
          >
            <Group gap={6}>
              <Text>{localeMeta[locale].label}</Text>
              <Text c="dimmed" size="xs">
                ({locale.toUpperCase()})
              </Text>
            </Group>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
