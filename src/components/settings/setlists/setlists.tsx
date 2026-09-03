'use client';

import dayjs from 'dayjs';
import { useState } from 'react';
import { IconArrowDown, IconArrowUp, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { SetlistSongInput, setlistsRepository } from '@/features/setlists';
import { useSetlistsData } from '@/hooks/use-setlists-data';
import { Setlist } from '@/interfaces';
import { BAND_PERMISSIONS, hasBandPermission } from '@/utils/band-permissions';
import { getApiErrorMessage } from '@/utils/http';

const MIN_TITLE_LENGTH = 2;

const emptySong = (): SetlistSongInput => ({
  title: '',
  artist: '',
  key: '',
  notes: '',
});

export const SetlistsComponent = () => {
  const t = useTranslations('Settings.setlists');
  const queryClient = useQueryClient();
  const { setlists, activeBandId, role, isLoading } = useSetlistsData();

  const canWrite = role ? hasBandPermission(role, BAND_PERMISSIONS.SETLIST_WRITE) : false;

  const [createModalOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editModalOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingSetlist, setEditingSetlist] = useState<Setlist | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSongs, setEditSongs] = useState<SetlistSongInput[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['setlists', activeBandId] });

  const handleCreate = async () => {
    if (!activeBandId || newTitle.trim().length < MIN_TITLE_LENGTH) {
      return;
    }
    setIsCreating(true);
    try {
      const setlistId = await setlistsRepository.create(activeBandId, {
        title: newTitle.trim(),
      });
      await invalidate();
      showNotification({ color: 'green', message: t('notifications.createSuccess') });
      closeCreate();
      setNewTitle('');

      setEditingSetlist({
        id: setlistId,
        bandId: activeBandId,
        title: newTitle.trim(),
        status: 'draft',
        songs: [],
        createdByUserId: '',
        lastModifiedByUserId: '',
        lastModifiedAt: '',
        createdAt: '',
        updatedAt: '',
      });
      setEditTitle(newTitle.trim());
      setEditSongs([]);
      openEdit();
    } catch (error) {
      showNotification({
        color: 'red',
        message: getApiErrorMessage(error, t('notifications.createError')),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (setlist: Setlist) => {
    setEditingSetlist(setlist);
    setEditTitle(setlist.title);
    setEditSongs(
      setlist.songs.map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist ?? '',
        key: song.key ?? '',
        notes: song.notes ?? '',
      }))
    );
    openEdit();
  };

  const handleSaveSetlist = async () => {
    if (!activeBandId || !editingSetlist || editTitle.trim().length < MIN_TITLE_LENGTH) {
      return;
    }
    setIsSaving(true);
    try {
      await setlistsRepository.update(activeBandId, editingSetlist.id, {
        title: editTitle.trim(),
        songs: editSongs
          .filter((song) => song.title.trim().length > 0)
          .map((song) => ({
            id: song.id,
            title: song.title.trim(),
            artist: song.artist || null,
            key: song.key || null,
            notes: song.notes || null,
          })),
      });
      await invalidate();
      showNotification({ color: 'green', message: t('notifications.updateSuccess') });
      closeEdit();
      setEditingSetlist(null);
    } catch (error) {
      showNotification({
        color: 'red',
        message: getApiErrorMessage(error, t('notifications.updateError')),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (setlist: Setlist) => {
    if (!activeBandId) {
      return;
    }
    setStatusUpdatingId(setlist.id);
    try {
      await setlistsRepository.update(activeBandId, setlist.id, {
        status: setlist.status === 'published' ? 'draft' : 'published',
      });
      await invalidate();
      showNotification({
        color: 'green',
        message:
          setlist.status === 'published'
            ? t('notifications.unpublishSuccess')
            : t('notifications.publishSuccess'),
      });
    } catch (error) {
      showNotification({
        color: 'red',
        message: getApiErrorMessage(error, t('notifications.statusError')),
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (setlistId: string) => setlistsRepository.remove(activeBandId!, setlistId),
    onSuccess: () => {
      void invalidate();
      showNotification({ color: 'green', message: t('notifications.deleteSuccess') });
    },
    onError: (error) => {
      showNotification({
        color: 'red',
        message: getApiErrorMessage(error, t('notifications.deleteError')),
      });
    },
  });

  const confirmDelete = (setlist: Setlist) => {
    modals.openConfirmModal({
      title: t('confirm.deleteTitle'),
      children: (
        <Stack gap="xs">
          <Text size="sm">{setlist.title}</Text>
          <Text size="sm" c="dimmed">
            {t('confirm.deleteBody')}
          </Text>
        </Stack>
      ),
      labels: { confirm: t('actions.delete'), cancel: t('form.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(setlist.id),
    });
  };

  const updateSongField = (index: number, field: keyof SetlistSongInput, value: string) => {
    setEditSongs((current) =>
      current.map((song, i) => (i === index ? { ...song, [field]: value } : song))
    );
  };

  const removeSong = (index: number) => {
    setEditSongs((current) => current.filter((_, i) => i !== index));
  };

  const moveSong = (index: number, direction: -1 | 1) => {
    setEditSongs((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <Stack w="100%" maw={1000}>
      <Group justify="space-between">
        <Title order={3}>{t('title')}</Title>
        {canWrite ? (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreate}
            disabled={!activeBandId}
          >
            {t('create')}
          </Button>
        ) : null}
      </Group>

      <Card withBorder>
        <ScrollArea>
          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : setlists.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              {t('empty')}
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('table.title')}</Table.Th>
                  <Table.Th>{t('table.status')}</Table.Th>
                  <Table.Th>{t('table.songCount')}</Table.Th>
                  <Table.Th>{t('table.lastModified')}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {setlists.map((setlist) => (
                  <Table.Tr key={setlist.id}>
                    <Table.Td fw={500}>{setlist.title}</Table.Td>
                    <Table.Td>
                      <Badge color={setlist.status === 'published' ? 'green' : 'gray'}>
                        {t(`statuses.${setlist.status}`)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{setlist.songs.length}</Table.Td>
                    <Table.Td>{dayjs(setlist.lastModifiedAt).format('DD MMM YYYY')}</Table.Td>
                    <Table.Td>
                      {canWrite ? (
                        <Group gap="xs" justify="flex-end">
                          <Button
                            size="xs"
                            variant="subtle"
                            loading={statusUpdatingId === setlist.id}
                            onClick={() => handleToggleStatus(setlist)}
                          >
                            {setlist.status === 'published'
                              ? t('actions.unpublish')
                              : t('actions.publish')}
                          </Button>
                          <Tooltip label={t('actions.edit')}>
                            <ActionIcon variant="subtle" onClick={() => openEditModal(setlist)}>
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={t('actions.delete')}>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              loading={Boolean(
                                deleteMutation.isPending && deleteMutation.variables === setlist.id
                              )}
                              onClick={() => confirmDelete(setlist)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      ) : null}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </Card>

      <Modal
        opened={createModalOpen}
        onClose={() => {
          closeCreate();
          setNewTitle('');
        }}
        title={t('createModalTitle')}
        centered
      >
        <Stack>
          <TextInput
            label={t('form.title')}
            placeholder={t('form.titlePlaceholder')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.currentTarget.value)}
            error={
              newTitle.length > 0 && newTitle.trim().length < MIN_TITLE_LENGTH
                ? t('form.titleTooShort')
                : null
            }
            required
          />
          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={() => {
                closeCreate();
                setNewTitle('');
              }}
              disabled={isCreating}
            >
              {t('form.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={isCreating}
              disabled={newTitle.trim().length < MIN_TITLE_LENGTH}
            >
              {t('form.submit')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={editModalOpen}
        onClose={() => {
          closeEdit();
          setEditingSetlist(null);
        }}
        title={t('editModalTitle')}
        centered
        size="lg"
      >
        <Stack>
          <TextInput
            label={t('form.title')}
            value={editTitle}
            onChange={(e) => setEditTitle(e.currentTarget.value)}
            error={
              editTitle.length > 0 && editTitle.trim().length < MIN_TITLE_LENGTH
                ? t('form.titleTooShort')
                : null
            }
            required
          />

          <Stack gap="xs">
            {editSongs.map((song, index) => (
              <Card key={song.id ?? index} withBorder padding="sm">
                <Group align="flex-start" wrap="nowrap">
                  <Stack gap="xs" flex={1}>
                    <TextInput
                      label={t('form.songTitle')}
                      value={song.title}
                      onChange={(e) => updateSongField(index, 'title', e.currentTarget.value)}
                      required
                    />
                    <Group grow>
                      <TextInput
                        label={t('form.songArtist')}
                        value={song.artist ?? ''}
                        onChange={(e) => updateSongField(index, 'artist', e.currentTarget.value)}
                      />
                      <TextInput
                        label={t('form.songKey')}
                        value={song.key ?? ''}
                        onChange={(e) => updateSongField(index, 'key', e.currentTarget.value)}
                      />
                    </Group>
                    <Textarea
                      label={t('form.songNotes')}
                      value={song.notes ?? ''}
                      onChange={(e) => updateSongField(index, 'notes', e.currentTarget.value)}
                      autosize
                      minRows={1}
                    />
                  </Stack>
                  <Stack gap={4}>
                    <ActionIcon
                      variant="subtle"
                      disabled={index === 0}
                      onClick={() => moveSong(index, -1)}
                    >
                      <IconArrowUp size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      disabled={index === editSongs.length - 1}
                      onClick={() => moveSong(index, 1)}
                    >
                      <IconArrowDown size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => removeSong(index)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>

          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => setEditSongs((current) => [...current, emptySong()])}
          >
            {t('form.addSong')}
          </Button>

          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={() => {
                closeEdit();
                setEditingSetlist(null);
              }}
              disabled={isSaving}
            >
              {t('form.cancel')}
            </Button>
            <Button
              onClick={handleSaveSetlist}
              loading={isSaving}
              disabled={editTitle.trim().length < MIN_TITLE_LENGTH}
            >
              {t('form.submit')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
