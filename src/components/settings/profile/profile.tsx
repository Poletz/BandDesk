'use client';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconEdit, IconEditOff } from '@tabler/icons-react';
import axios from 'axios';
import { Session, User } from 'better-auth';
import {
  ActionIcon,
  Avatar,
  Button,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';

export default function ProfileSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [editable, setEditable] = useState<boolean>(false);

  useEffect(() => {
    const session = async () => {
      setLoading(true);
      try {
        const { session, user } = (await axios.get('/api/auth/session')).data as {
          session: Session | null;
          user: User | null;
        };

        console.log('SESSION CLIENT!!!!!', session, user);
        if (!session || dayjs(session.expiresAt).isBefore(dayjs()) || !user) {
          showNotification({
            message: "Authentication failed. You'll be redirected to the Login page",
            color: 'orange.2',
            title: 'Session Expired',
          });

          return router.replace('/sign-out');
        }

        setUser(user);
        form.setInitialValues({ email: user.email, name: user.name });
        form.setValues({ email: user.email, name: user.name });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    session();
  }, [router]);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
    },
  });

  const handleSave = (values: typeof form.values) => {
    console.log(values);
    // TODO: update user profile
  };

  return (
    <Stack flex={1} maw={480}>
      <Group wrap="nowrap">
        <Group wrap="nowrap" justify="flex-start" mr="auto">
          <Skeleton visible={loading}>
            <Avatar size="lg" radius="xl" />
          </Skeleton>
          <Skeleton flex={1} w="100%" visible={loading}>
            <Text fw="bold" flex={1} w="100%">
              {user?.name}
            </Text>
          </Skeleton>
        </Group>
        <Tooltip label="Change Avatar">
          <ActionIcon
            disabled={loading}
            variant="light"
            size={40}
            radius="md"
            onClick={() => setEditable(editable ? !editable : editable)}
          >
            {!editable ? <IconEdit size={25} /> : <IconEditOff size={25} />}
          </ActionIcon>
        </Tooltip>
      </Group>

      <TextInput disabled={loading || !editable} label="Name" {...form.getInputProps('name')} />
      <TextInput disabled={loading || !editable} label="Email" {...form.getInputProps('email')} />

      <Button disabled={loading || !editable} onClick={() => form.onSubmit(handleSave)}>
        Save changes
      </Button>
    </Stack>
  );
}
