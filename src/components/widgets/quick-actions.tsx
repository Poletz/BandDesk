import { IconFileImport, IconMapPinPlus, IconMusicPlus } from '@tabler/icons-react';
import { Button } from '@mantine/core';

export const QuickActionsWidget = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Button leftSection={<IconMusicPlus size={20} />}>Add Live</Button>
      <Button leftSection={<IconMapPinPlus size={20} />}>Add Venue</Button>
      <Button leftSection={<IconFileImport size={20} />}>Add Document</Button>
    </div>
  );
};
