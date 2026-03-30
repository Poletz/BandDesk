import { IconFileImport, IconMapPinPlus, IconMusicPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@mantine/core';
import { QuickAction } from '@/interfaces';

interface QuickActionsWidgetProps {
  onAction: (type: QuickAction) => void;
}

export const QuickActionsWidget = ({ onAction }: QuickActionsWidgetProps) => {
  const t = useTranslations('Home');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Button onClick={() => onAction(QuickAction.LIVE)} leftSection={<IconMusicPlus size={20} />}>
        {t('quickActions.addLive')}
      </Button>
      <Button
        onClick={() => onAction(QuickAction.VENUE)}
        leftSection={<IconMapPinPlus size={20} />}
      >
        {t('quickActions.addVenue')}
      </Button>
      <Button onClick={() => onAction(QuickAction.DOC)} leftSection={<IconFileImport size={20} />}>
        {t('quickActions.addDocument')}
      </Button>
    </div>
  );
};
