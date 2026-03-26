import dayjs from 'dayjs';
import { useCallback, useEffect } from 'react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { BOOKING_STATUSES } from '@/features';
import { Actions, BookingRequest, Venue } from '@/interfaces';
import { bookingStatusLabel } from '@/utils/misc';
import { parseBookingSchema } from '@/utils/zod-interfaces';

interface BookingModalProps {
  opened: boolean;
  type: Actions;
  close: () => void;
  booking?: BookingRequest;
  venues: Venue[];
  onSubmit?: (
    values: Omit<BookingRequest, 'id' | 'createdAt' | 'updatedAt'>,
    type: Actions
  ) => void;
}

type BookingPayload = Omit<BookingRequest, 'id' | 'createdAt' | 'updatedAt'>;

const emptyValues: BookingPayload = {
  venueId: '',
  requestedDate: undefined,
  status: 'requested',
  feeProposal: undefined,
  notes: undefined,
};

const modalByAction = {
  [Actions.CREATE]: {
    title: 'Create booking',
    submitLabel: 'Create',
  },
  [Actions.UPDATE]: {
    title: 'Edit booking',
    submitLabel: 'Save changes',
  },
  [Actions.VIEW]: {
    title: 'View booking',
    submitLabel: 'Close',
  },
};

const getValuesFromBooking = (booking?: BookingRequest): BookingPayload => {
  if (!booking) {
    return emptyValues;
  }

  return {
    venueId: booking.venueId,
    requestedDate: booking.requestedDate,
    status: booking.status,
    feeProposal: booking.feeProposal,
    notes: booking.notes,
  };
};

export const BookingModal = ({
  opened,
  close,
  type,
  booking,
  venues,
  onSubmit,
}: BookingModalProps) => {
  const form = useForm<BookingPayload>({
    initialValues: emptyValues,
    validateInputOnBlur: true,
    validate: zod4Resolver(parseBookingSchema),
  });

  const handleClose = useCallback(() => {
    form.reset();
    close();
  }, [close, form]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    form.setValues(getValuesFromBooking(type !== Actions.CREATE ? booking : undefined));
    form.resetDirty();
  }, [booking, opened, type]);

  const handleSubmit = form.onSubmit((values) => {
    if (!onSubmit) {
      return;
    }

    onSubmit(
      {
        ...values,
        notes: values.notes || undefined,
      },
      type
    );
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
            <fieldset disabled={type === Actions.VIEW} style={{ border: 'none' }}>
              <SimpleGrid>
                <Select
                  withAsterisk
                  label="Venue"
                  placeholder="Select a venue"
                  data={venues.map((venue) => ({ value: venue.id, label: venue.name }))}
                  {...form.getInputProps('venueId')}
                />
                <DateTimePicker
                  label="Requested date"
                  placeholder="Select date and time"
                  value={
                    form.values.requestedDate ? dayjs(form.values.requestedDate).toDate() : null
                  }
                  clearable
                  onChange={(value) =>
                    form.setFieldValue(
                      'requestedDate',
                      value ? dayjs(value).toISOString() : undefined
                    )
                  }
                />
                <Select
                  withAsterisk
                  label="Status"
                  data={BOOKING_STATUSES.map((status) => ({
                    value: status,
                    label: bookingStatusLabel[status],
                  }))}
                  {...form.getInputProps('status')}
                />
                <NumberInput
                  label="Fee proposal"
                  min={0}
                  thousandSeparator=" "
                  prefix="€ "
                  allowDecimal={false}
                  value={form.values.feeProposal}
                  onChange={(value) =>
                    form.setFieldValue('feeProposal', Number(value) || undefined)
                  }
                />
                <Textarea
                  autosize
                  minRows={3}
                  label="Notes"
                  placeholder="Booking notes"
                  value={form.values.notes ?? ''}
                  onChange={(event) => form.setFieldValue('notes', event.currentTarget.value)}
                />
                {type === Actions.VIEW ? (
                  <>
                    <TextInput
                      label="Created at"
                      value={dayjs(booking?.createdAt).format('DD MMM YYYY HH:mm')}
                      readOnly
                    />
                    <TextInput
                      label="Updated at"
                      value={dayjs(booking?.updatedAt).format('DD MMM YYYY HH:mm')}
                      readOnly
                    />
                  </>
                ) : null}
              </SimpleGrid>
            </fieldset>
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
