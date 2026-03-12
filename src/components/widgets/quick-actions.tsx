import { IconFileImport, IconMapPinPlus, IconMusicPlus } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { QuickAction } from '@/interfaces';

interface QuickActionsWidgetProps {
  click: (type: QuickAction) => void;
}

export const QuickActionsWidget = ({ click }: QuickActionsWidgetProps) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Button onClick={() => click(QuickAction.LIVE)} leftSection={<IconMusicPlus size={20} />}>
        Add Live
      </Button>
      <Button onClick={() => click(QuickAction.VENUE)} leftSection={<IconMapPinPlus size={20} />}>
        Add Venue
      </Button>
      <Button onClick={() => click(QuickAction.DOC)} leftSection={<IconFileImport size={20} />}>
        Add Document
      </Button>
    </div>
  );
};
