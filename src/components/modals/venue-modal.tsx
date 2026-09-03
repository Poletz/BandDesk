import { useCallback, useEffect } from 'react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { Button, Group, Modal, SimpleGrid, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { Actions, Venue } from '@/interfaces';
import { getApiErrorMessage, http } from '@/utils/http';
import { parseVenueSchema } from '@/utils/zod-interfaces';
import { PhoneField } from './_internal/phone-input';

interface VenueModelProps {
  opened: boolean;
  type: Actions;
  close: () => void;
  venue?: Venue;
  onSubmit?: (values?: Omit<Venue, 'id'>, type?: Actions) => void;
}

const emptyValues: Omit<Venue, 'id'> = {
  name: '',
  address: '',
  city: '',
  contactEmail: '',
  contactName: '',
  contactPhone: '',
  notes: '',
};

const modalByAction = {
  [Actions.CREATE]: {
    title: 'Create venue',
    submitLabel: 'Create',
  },
  [Actions.UPDATE]: {
    title: 'Edit venue',
    submitLabel: 'Save changes',
  },
  [Actions.VIEW]: {
    title: 'View venue',
    submitLabel: 'Close',
  },
};

const getValuesFromVenue = (venue?: Venue): Omit<Venue, 'id'> => {
  if (!venue) {
    return emptyValues;
  }

  return {
    name: venue.name,
    city: venue.city ?? '',
    address: venue.address ?? '',
    contactName: venue.contactName ?? '',
    contactEmail: venue.contactEmail ?? '',
    contactPhone: venue.contactPhone ?? '',
    notes: venue.notes ?? '',
  };
};

export const VenueModal = ({ opened, close, type, venue, onSubmit }: VenueModelProps) => {
  const form = useForm<Omit<Venue, 'id'>>({
    initialValues: emptyValues,
    validateInputOnBlur: true,
    validate: zod4Resolver(parseVenueSchema),
  });

  const handleClose = useCallback(() => {
    form.reset();
    close();
  }, [close, form]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    form.setValues(getValuesFromVenue(type !== Actions.CREATE ? venue : undefined));
    form.resetDirty();
  }, [venue, opened, type]);

  const handleSubmit = form.onSubmit(async (values) => {
    console.log(values);
    if (onSubmit) {
      return onSubmit(values, type);
    }
    try {
      const { data } = await http.post<{ id: string }>('/api/venues', values);
      if (data) {
        handleClose();
        showNotification({
          message: 'Venue created!',
          fz: 'h4',
          color: 'green',
          bg: 'lime.4',
          position: 'bottom-center',
        });
      }
    } catch (err) {
      showNotification({
        message: getApiErrorMessage(err, 'An error occurred. Please try again later.'),
        color: 'red',
      });
    }
  });

  const modalConfig = modalByAction[type] ?? modalByAction[Actions.CREATE];

  return (
    <Modal.Root opened={opened} onClose={handleClose} size="lg" closeOnClickOutside={false}>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title fz="h3" fw="bold">
            {modalConfig.title}
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <SimpleGrid>
              <TextInput
                readOnly={type === Actions.VIEW}
                withAsterisk
                label="Name"
                placeholder="Insert name..."
                {...form.getInputProps('name')}
              />
              <Group grow align="flex-start">
                <TextInput
                  readOnly={type === Actions.VIEW}
                  label="City"
                  placeholder="Insert city..."
                  {...form.getInputProps('city')}
                />
                <TextInput
                  readOnly={type === Actions.VIEW}
                  label="Address"
                  placeholder="Insert address..."
                  {...form.getInputProps('address')}
                />
              </Group>
              <Group grow align="flex-start">
                <TextInput
                  readOnly={type === Actions.VIEW}
                  label="Contact name"
                  placeholder="Insert fullname..."
                  {...form.getInputProps('contactName')}
                />
                <TextInput
                  readOnly={type === Actions.VIEW}
                  label="Contact email"
                  placeholder="Insert email..."
                  {...form.getInputProps('contactEmail')}
                />
              </Group>
              <fieldset
                disabled={type === Actions.VIEW}
                style={{ border: 'none', padding: 0, margin: 0 }}
              >
                <PhoneField
                  value={form.values.contactPhone}
                  error={form.errors.contactPhone}
                  onChange={(value) => form.setFieldValue('contactPhone', value ?? '')}
                />
              </fieldset>
              <Textarea
                readOnly={type === Actions.VIEW}
                autosize
                minRows={3}
                label="Notes"
                placeholder="PA, stage size, parking, etc..."
                {...form.getInputProps('notes')}
              />
            </SimpleGrid>
            <Group justify="flex-end" m={12}>
              {type !== Actions.VIEW && (
                <Button variant="subtle" c="red" onClick={handleClose}>
                  Cancel
                </Button>
              )}
              <Button type="submit">{modalConfig.submitLabel}</Button>
            </Group>
          </form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};
