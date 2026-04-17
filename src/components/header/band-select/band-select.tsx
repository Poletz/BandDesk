'use client';

import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { Button, Group, Loader, Menu, Text, Tooltip } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useBandContext } from '@/hooks/use-band-context';
import type { BandRole } from '@/interfaces';
import { getApiErrorMessage } from '@/utils/http';

const roleLabelKeyByRole: Record<BandRole, string> = {
  admin: 'admin',
  member: 'member',
  guest: 'guest',
};

export const BandSelect = () => {
  const { bands, activeBand, activeBandId, isLoading, isSwitchingBand, switchActiveBand } =
    useBandContext();
  const t = useTranslations('BandContext');

  const onSelectBand = async (bandId: string) => {
    if (bandId === activeBandId) {
      return;
    }

    const selectedBand = bands.find((band) => band.id === bandId);

    if (!selectedBand) {
      return;
    }

    try {
      await switchActiveBand(bandId);
      showNotification({
        color: 'green',
        message: t('notifications.switchSuccess', { name: selectedBand.name }),
      });
    } catch (error) {
      showNotification({
        color: 'red',
        message: isAxiosError(error)
          ? getApiErrorMessage(error, t('notifications.switchError'))
          : t('notifications.switchError'),
      });
    }
  };

  if (isLoading) {
    return (
      <Button
        variant="default"
        size="compact-sm"
        leftSection={<Loader size={14} />}
        disabled
        maw={170}
      >
        {t('loading')}
      </Button>
    );
  }

  if (!bands.length) {
    return (
      <Tooltip label={t('emptyTooltip')}>
        <Button variant="default" size="compact-sm" disabled maw={170}>
          {t('empty')}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Menu position="bottom-end" shadow="md" width={280} withinPortal>
      <Menu.Target>
        <Button
          aria-label={t('label')}
          variant="subtle"
          size="compact-sm"
          // radius="md"
          px={10}
          maw={190}
          rightSection={<IconChevronDown size={14} stroke={1.8} />}
          loading={isSwitchingBand}
        >
          <Text component="span" truncate>
            {activeBand?.name ?? t('empty')}
          </Text>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{t('label')}</Menu.Label>
        {bands.map((band) => {
          const isActive = band.id === activeBandId;
          const roleLabelKey = roleLabelKeyByRole[band.membership.role];

          return (
            <Menu.Item
              key={band.id}
              onClick={() => onSelectBand(band.id)}
              disabled={isActive || isSwitchingBand}
              rightSection={isActive ? <IconCheck size={16} /> : null}
            >
              <Group gap={6} wrap="nowrap">
                <Text fw={600} truncate>
                  {band.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {t(`roles.${roleLabelKey}`)}
                </Text>
              </Group>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
};
