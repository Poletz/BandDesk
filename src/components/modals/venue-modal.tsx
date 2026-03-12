import { Modal } from '@mantine/core';
import { Actions } from '@/interfaces';

interface VenueModelProps {
  opened: boolean;
  type: Actions;
  close: () => void;
}

export const VenueModal = ({ opened, close, type }: VenueModelProps) => {
  console.log(type);

  return (
    <Modal opened={opened} onClose={close}>
      Hello
    </Modal>
  );
};
