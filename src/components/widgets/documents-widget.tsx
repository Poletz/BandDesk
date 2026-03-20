'use client';

import dayjs from 'dayjs';
import { IconArrowRight, IconFileDescription } from '@tabler/icons-react';
import { Badge, Card, Divider, Group, NavLink, Stack, Text, Title } from '@mantine/core';
import { useDocumentsData } from '@/hooks/use-documents-data';

export const DocumentsWidget = () => {
  const { recentDocuments, documents } = useDocumentsData();

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>Documents</Title>
          <Badge variant="light">{documents.length}</Badge>
        </Group>

        <Divider />

        <Stack gap="xs">
          {recentDocuments.length ? (
            recentDocuments.map((document) => (
              <Group key={document.id} justify="space-between" align="flex-start">
                <Group gap="xs" align="center">
                  <IconFileDescription size={16} />
                  <div>
                    <Text fw={600} size="sm" lineClamp={1}>
                      {document.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {document.fileName}
                    </Text>
                  </div>
                </Group>
                <Text size="xs" c="dimmed">
                  {dayjs(document.uploadedAt).format('DD MMM')}
                </Text>
              </Group>
            ))
          ) : (
            <Text fz="md" style={{ textAlign: 'center' }}>
              No Documents available
            </Text>
          )}
        </Stack>

        <NavLink
          label="Go to Documents"
          href="/dashboard/settings?tab=docs"
          rightSection={<IconArrowRight size={12} />}
          variant="subtle"
          bdrs="md"
          active
        />
      </Stack>
    </Card>
  );
};
