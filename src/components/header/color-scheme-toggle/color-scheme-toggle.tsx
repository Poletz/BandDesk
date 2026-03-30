'use client';

import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const t = useTranslations('Common');

  return (
    <Tooltip label={computedColorScheme === 'dark' ? t('theme.light') : t('theme.dark')}>
      <ActionIcon
        onClick={() => {
          setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
        }}
        variant="outline"
        c={computedColorScheme === 'light' ? 'dark' : 'white'}
        color={computedColorScheme === 'light' ? 'dark' : 'white'}
      >
        {computedColorScheme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
      </ActionIcon>
    </Tooltip>
  );
}
