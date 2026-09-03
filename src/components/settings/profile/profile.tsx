'use client';

import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconCamera } from '@tabler/icons-react';
import { isAxiosError } from 'axios';
import { Session, User } from 'better-auth';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { BandProfileForm } from '@/components/settings/profile/band-profile-form';
import { authClient } from '@/utils/auth-client';
import { getApiErrorMessage, http, uploadFileToStorage } from '@/utils/http';

const ALLOWED_AVATAR_TYPES = 'image/png,image/jpeg,image/webp';

export default function ProfileSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = async () => {
      setLoading(true);
      try {
        const { session, user } = (await http.get('/api/auth/session')).data as {
          session: Session | null;
          user: User | null;
        };

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
        if (!isAxiosError(error)) {
          return showNotification({
            message: 'An unexpected error occurred. Please try again',
            color: 'orange.2',
            title: 'Unexpected Error',
          });
        }

        showNotification({
          message: error.message,
          color: 'red.4',
          title: error.name,
        });
      } finally {
        setLoading(false);
      }
    };

    void session();
  }, [router]);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
    },
  });

  const handleSave = async (values: typeof form.values) => {
    setSaving(true);
    try {
      const { error } = await authClient.updateUser({ name: values.name.trim() });
      if (error) {
        throw new Error(error.message);
      }
      setUser((current) => (current ? { ...current, name: values.name.trim() } : current));
      showNotification({ message: 'Profile updated successfully.', color: 'green' });
    } catch (error) {
      showNotification({
        message: getApiErrorMessage(error, 'Unable to update profile. Please try again.'),
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: uploadData } = await http.post<{ uploadUrl: string; key: string }>(
        '/api/users/avatar-upload-url',
        {
          fileName: file.name,
          contentType: file.type,
          fileSizeBytes: file.size,
        }
      );

      await uploadFileToStorage(uploadData.uploadUrl, file);

      const { data: commitData } = await http.post<{ url: string }>('/api/users/avatar', {
        key: uploadData.key,
      });

      const { error } = await authClient.updateUser({ image: commitData.url });
      if (error) {
        throw new Error(error.message);
      }

      setUser((current) => (current ? { ...current, image: commitData.url } : current));
      showNotification({ message: 'Avatar updated successfully.', color: 'green' });
    } catch (error) {
      showNotification({
        message: getApiErrorMessage(error, 'Unable to update avatar. Please try again.'),
        color: 'red',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <Group flex={1} justify="space-around" align="flex-start">
      <Stack flex={1} maw={480}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_AVATAR_TYPES}
          style={{ display: 'none' }}
          onChange={handleAvatarFileSelected}
        />
        <Group wrap="nowrap">
          <Group wrap="nowrap" justify="flex-start" flex={1}>
            <Skeleton visible={loading} w="fit-content">
              <Box pos="relative" w="fit-content">
                <Avatar size="lg" radius="xl" src={user?.image ?? undefined} />
                <Tooltip label="Change avatar">
                  <ActionIcon
                    disabled={uploadingAvatar}
                    loading={uploadingAvatar}
                    variant="filled"
                    size="sm"
                    radius="xl"
                    pos="absolute"
                    bottom={-2}
                    right={-2}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconCamera size={14} />
                  </ActionIcon>
                </Tooltip>
              </Box>
            </Skeleton>
            <Skeleton flex={1} w="100%" visible={loading} ml={12}>
              <Text fw="bold" flex={1} w="100%">
                {user?.name}
              </Text>
            </Skeleton>
          </Group>
        </Group>

        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack>
            <TextInput disabled={loading || saving} label="Name" {...form.getInputProps('name')} />
            <TextInput disabled label="Email" {...form.getInputProps('email')} />

            <Button type="submit" disabled={loading || uploadingAvatar} loading={saving}>
              Save changes
            </Button>
          </Stack>
        </form>
      </Stack>

      <Divider orientation="vertical" />

      <BandProfileForm />
    </Group>
  );
}
