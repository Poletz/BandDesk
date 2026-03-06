'use client';

import dayjs from 'dayjs';
import { Badge, Card, Group, ScrollArea, Stack, Table, Text, Title } from '@mantine/core';
import { useDocumentsData } from '@/hooks/use-documents-data';
import { categoryLabel } from '@/interfaces';

export const DocumentsComponent = () => {
  const { documents, documentCountByCategory } = useDocumentsData();

  return (
    <Stack w="100%" maw={1000}>
      <Title order={3}>Documents</Title>

      <Card withBorder>
        <Text size="sm" c="dimmed">
          Categories
        </Text>
        <Group mt="sm" gap="xs">
          {Object.entries(documentCountByCategory).map(([category, count]) => (
            <Badge key={category} variant="light" size="lg">
              {categoryLabel[category] ?? category}: {count}
            </Badge>
          ))}
        </Group>
      </Card>

      <Card withBorder>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>File name</Table.Th>
                <Table.Th>Uploaded</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {documents.map((document) => (
                <Table.Tr key={document.id}>
                  <Table.Td>{document.title}</Table.Td>
                  <Table.Td>{categoryLabel[document.category]}</Table.Td>
                  <Table.Td>{document.fileName}</Table.Td>
                  <Table.Td>{dayjs(document.uploadedAt).format('DD MMM YYYY')}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>
    </Stack>
  );
};
