import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo } from 'react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useTranslations } from 'next-intl';
import { Button, Group, Modal, Select, SimpleGrid, Text, Textarea, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { BOOKING_STATUSES } from '@/features';
import { Actions, BookingRequest, GigEvent, Venue } from '@/interfaces';
import { bookingStatusLabel } from '@/utils/misc';
import { parseGigEventSchema } from '@/utils/zod-interfaces';

interface GigModalProps {
  opened: boolean;
  type: Actions;
  close: () => void;
  gig?: Partial<GigPayload>;
  venues: Venue[];
  bookings: BookingRequest[];
  onSubmit?: (values: Omit<GigEvent, 'id'>, type: Actions) => void;
}

type GigPayload = Omit<GigEvent, 'id'>;

const emptyValues: GigPayload = {
  venueId: '',
  date: '',
  status: 'confirmed',
  title: '',
  setlistName: undefined,
  notes: undefined,
  bookingId: undefined,
};

const getValuesFromGig = (gig?: Partial<GigPayload>): GigPayload => {
  if (!gig) {
    return emptyValues;
  }

  return {
    venueId: gig.venueId ?? '',
    date: gig.date ?? '',
    status: gig.status ?? 'confirmed',
    title: gig.title ?? '',
    setlistName: gig.setlistName,
    notes: gig.notes,
    bookingId: gig.bookingId,
  };
};

export const GigModal = ({
  opened,
  close,
  type,
  gig,
  venues,
  bookings,
  onSubmit,
}: GigModalProps) => {
  const form = useForm<GigPayload>({
    initialValues: emptyValues,
    validateInputOnBlur: true,
    validate: zod4Resolver(parseGigEventSchema),
  });

  const t = useTranslations('SettingsModal');
  const tStatus = useTranslations('Statuses');

  const handleClose = useCallback(() => {
    form.reset();
    close();
  }, [close, form]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    form.setValues(getValuesFromGig(gig));
    form.resetDirty();
  }, [gig, opened, type]);

  const venueNameById = useMemo(
    () => Object.fromEntries(venues.map((venue) => [venue.id, venue.name])),
    [venues]
  );

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === form.values.bookingId),
    [bookings, form.values.bookingId]
  );

  useEffect(() => {
    if (!selectedBooking || type === Actions.VIEW) {
      return;
    }

    form.setValues({
      venueId: selectedBooking.venueId,
      status: selectedBooking.status,
      date: selectedBooking.requestedDate ?? form.values.date,
      title: form.values.title || `${venueNameById[selectedBooking.venueId] ?? 'Live'} - Gig`,
    });
  }, [selectedBooking, type, venueNameById]);

  const handleSubmit = form.onSubmit((values) => {
    if (!onSubmit) {
      return;
    }

    onSubmit(
      {
        ...values,
        bookingId: values.bookingId || undefined,
        notes: values.notes || undefined,
        setlistName: values.setlistName || undefined,
      },
      type
    );
  });

  const bookingOptions = bookings
    .filter(
      (booking) =>
        booking.status === 'confirmed' && (!booking.gigId || booking.id === form.values.bookingId)
    )
    .map((booking) => ({
      value: booking.id,
      label: `${booking.requestedDate ? dayjs(booking.requestedDate).format('DD MMM YYYY HH:mm') : 'Date TBD'} · ${venueNameById[booking.venueId] ?? 'Unknown venue'}`,
    }));

  const linkedBooking = Boolean(form.values.bookingId);

  return (
    <Modal.Root opened={opened} onClose={handleClose} size="lg" closeOnClickOutside={false}>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title fz="h3" fw="bold">
            {t(`gigs_${type}.title`)}
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <fieldset disabled={type === Actions.VIEW} style={{ border: 'none' }}>
              <SimpleGrid>
                <TextInput
                  withAsterisk
                  label={t('gigs_common.gigTitle')}
                  placeholder="Summer Tour"
                  {...form.getInputProps('title')}
                />
                <Select
                  clearable
                  label={t('gigs_common.linkedBooking')}
                  placeholder={t('gigs_common.linkedBookingPlaceholder')}
                  data={bookingOptions}
                  value={form.values.bookingId ?? null}
                  onChange={(value) => form.setFieldValue('bookingId', value ?? undefined)}
                />
                <Select
                  withAsterisk
                  disabled={linkedBooking}
                  label={t('gigs_common.venue')}
                  placeholder={t('gigs_common.venuePlaceholder')}
                  data={venues.map((venue) => ({ value: venue.id, label: venue.name }))}
                  {...form.getInputProps('venueId')}
                />
                <DateTimePicker
                  withAsterisk
                  disabled={linkedBooking}
                  label={t('gigs_common.gigDate')}
                  placeholder={t('gigs_common.gigDatePlaceholder')}
                  value={form.values.date ? dayjs(form.values.date).toDate() : null}
                  onChange={(value) =>
                    form.setFieldValue('date', value ? dayjs(value).toISOString() : '')
                  }
                />
                <Select
                  withAsterisk
                  disabled={linkedBooking}
                  label={t('gigs_common.status')}
                  data={BOOKING_STATUSES.map((status) => ({
                    value: status,
                    label: tStatus(`booking.${bookingStatusLabel[status]}`),
                  }))}
                  {...form.getInputProps('status')}
                />
                <TextInput
                  label={t('gigs_common.setlist')}
                  placeholder={t('gigs_common.setlistPlaceholder')}
                  value={form.values.setlistName ?? ''}
                  onChange={(event) => form.setFieldValue('setlistName', event.currentTarget.value)}
                />
                <Textarea
                  autosize
                  minRows={3}
                  label={t('gigs_common.notes')}
                  placeholder={t('gigs_common.notesPlaceholder')}
                  value={form.values.notes ?? ''}
                  onChange={(event) => form.setFieldValue('notes', event.currentTarget.value)}
                />
                {linkedBooking ? (
                  <Text size="xs" c="dimmed">
                    {t('gigs_common.linkedText')}
                  </Text>
                ) : null}
              </SimpleGrid>
            </fieldset>
            <Group justify="flex-end" m={12}>
              {type !== Actions.VIEW && (
                <Button variant="subtle" c="red" onClick={handleClose}>
                  {t('gigs_common.cancel')}
                </Button>
              )}
              <Button type="submit">{t(`gigs_${type}.submitLabel`)}</Button>
            </Group>
          </form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};
