'use client';

import dayjs from 'dayjs';
import { useState } from 'react';
import { IconDownload, IconTrash, IconUpload } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  FileInput,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { documentsRepository } from '@/features/documents';
import { useDocumentsData } from '@/hooks/use-documents-data';
import { categoryLabel, DocumentCategory } from '@/interfaces';

const CATEGORY_OPTIONS: DocumentCategory[] = [
  'technical-rider',
  'stage-plot',
  'agibility',
  'siae',
  'songbook',
  'other',
];

const formatBytes = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentsComponent = () => {
  const t = useTranslations('Settings.documents');
  const queryClient = useQueryClient();
  const { documents, documentCountByCategory, activeBandId, isLoading } = useDocumentsData();

  const [uploadModalOpen, { open: openUpload, close: closeUpload }] = useDisclosure(false);
  const [docTitle, setDocTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const categoryOptions = CATEGORY_OPTIONS.map((c) => ({
    value: c,
    label: t(`categories.${c}`),
  }));

  const resetUploadForm = () => {
    setDocTitle('');
    setCategory('other');
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file || !activeBandId || !docTitle.trim()) {
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl, key } = await documentsRepository.requestUploadUrl(activeBandId, {
        fileName: file.name,
        contentType: file.type,
        category,
        title: docTitle.trim(),
        fileSizeBytes: file.size,
      });

      await documentsRepository.uploadFileToStorage(uploadUrl, file);

      await documentsRepository.createDocument(activeBandId, {
        key,
        fileName: file.name,
        contentType: file.type,
        category,
        title: docTitle.trim(),
        fileSizeBytes: file.size,
      });

      await queryClient.invalidateQueries({ queryKey: ['documents', activeBandId] });

      showNotification({ color: 'green', message: t('notifications.uploadSuccess') });
      resetUploadForm();
      closeUpload();
    } catch {
      showNotification({ color: 'red', message: t('notifications.uploadError') });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (documentId: string) => {
    if (!activeBandId) {
      return;
    }
    setDownloadingId(documentId);
    try {
      const url = await documentsRepository.getDownloadUrl(activeBandId, documentId);
      window.open(url, '_blank');
    } catch {
      showNotification({ color: 'red', message: t('notifications.downloadError') });
    } finally {
      setDownloadingId(null);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: ({ documentId }: { documentId: string }) =>
      documentsRepository.deleteDocument(activeBandId!, documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents', activeBandId] });
      showNotification({ color: 'green', message: t('notifications.deleteSuccess') });
    },
    onError: () => {
      showNotification({ color: 'red', message: t('notifications.deleteError') });
    },
  });

  const confirmDelete = (documentId: string, title: string) => {
    modals.openConfirmModal({
      title: t('confirm.deleteTitle'),
      children: (
        <Stack gap="xs">
          <Text size="sm">{title}</Text>
          <Text size="sm" c="dimmed">
            {t('confirm.deleteBody')}
          </Text>
        </Stack>
      ),
      labels: { confirm: t('actions.delete'), cancel: t('form.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate({ documentId }),
    });
  };

  return (
    <Stack w="100%" maw={1000}>
      <Group justify="space-between">
        <Title order={3}>{t('title')}</Title>
        <Button
          leftSection={<IconUpload size={16} />}
          onClick={openUpload}
          disabled={!activeBandId}
        >
          {t('upload')}
        </Button>
      </Group>

      <Card withBorder>
        <Text size="sm" c="dimmed" mb="sm">
          Categories
        </Text>
        <Group gap="xs">
          {Object.entries(documentCountByCategory).map(([cat, count]) => (
            <Badge key={cat} variant="light" size="lg">
              {categoryLabel[cat as DocumentCategory] ?? cat}: {count}
            </Badge>
          ))}
        </Group>
      </Card>

      <Card withBorder>
        <ScrollArea>
          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : documents.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              {t('empty')}
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('table.title')}</Table.Th>
                  <Table.Th>{t('table.category')}</Table.Th>
                  <Table.Th>{t('table.fileName')}</Table.Th>
                  <Table.Th>{t('table.size')}</Table.Th>
                  <Table.Th>{t('table.uploadedAt')}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {documents.map((doc) => (
                  <Table.Tr key={doc.id}>
                    <Table.Td fw={500}>{doc.title}</Table.Td>
                    <Table.Td>{categoryLabel[doc.category]}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" truncate maw={200}>
                        {doc.fileName}
                      </Text>
                    </Table.Td>
                    <Table.Td>{formatBytes(doc.fileSizeBytes)}</Table.Td>
                    <Table.Td>{dayjs(doc.createdAt).format('DD MMM YYYY')}</Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="flex-end">
                        <Tooltip label={t('actions.download')}>
                          <ActionIcon
                            variant="subtle"
                            loading={downloadingId === doc.id}
                            onClick={() => handleDownload(doc.id)}
                          >
                            <IconDownload size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('actions.delete')}>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            loading={Boolean(
                              deleteMutation.isPending &&
                              deleteMutation.variables?.documentId === doc.id
                            )}
                            onClick={() => confirmDelete(doc.id, doc.title)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </Card>

      <Modal
        opened={uploadModalOpen}
        onClose={() => {
          closeUpload();
          resetUploadForm();
        }}
        title={t('uploadModalTitle')}
        centered
      >
        <Stack>
          <TextInput
            label={t('form.title')}
            placeholder={t('form.titlePlaceholder')}
            value={docTitle}
            onChange={(e) => setDocTitle(e.currentTarget.value)}
            required
          />
          <Select
            label={t('form.category')}
            data={categoryOptions}
            value={category}
            onChange={(v) => setCategory((v as DocumentCategory) ?? 'other')}
            required
          />
          <FileInput
            label={t('form.file')}
            placeholder={t('form.filePlaceholder')}
            value={file}
            onChange={setFile}
            accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
            required
          />
          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={() => {
                closeUpload();
                resetUploadForm();
              }}
              disabled={isUploading}
            >
              {t('form.cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              loading={isUploading}
              disabled={!file || !docTitle.trim()}
            >
              {t('form.submit')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
