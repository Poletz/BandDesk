'use client';

import { useState } from 'react';
import { Button, Divider, Group, Image, PasswordInput, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { Provider } from '@/interfaces';
import { authClient } from '@/utils/auth-client';
import { getApiErrorMessage } from '@/utils/http';

export default function SecuritySettingsPage({ provider }: { provider: Provider | null }) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      newPassword: (value) => (value.length >= 8 ? null : 'Password must be at least 8 characters'),
      confirmPassword: (value, values) =>
        value === values.newPassword ? null : 'Passwords do not match',
    },
  });

  const handleChangePassword = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      if (error) {
        throw new Error(error.message);
      }
      showNotification({ message: 'Password updated successfully.', color: 'green' });
      form.reset();
    } catch (error) {
      showNotification({
        message: getApiErrorMessage(
          error,
          'Unable to update password. Please check your current password and try again.'
        ),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack flex={1} maw={480}>
      {provider && provider.providerId === 'google' ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, marginRight: '4px' }}>Provider:</span>
            <Group ml="auto">
              <Text fz="lg" style={{ textTransform: 'capitalize' }}>
                {provider.providerId}
              </Text>
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/500px-Google_%22G%22_logo.svg.png"
                w={35}
                ml="auto"
              />
            </Group>
          </div>
          <Text
            mt={12}
            w="100%"
            style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '14px' }}
          >
            Account linked with Google SignIn
          </Text>
        </div>
      ) : (
        <form onSubmit={form.onSubmit(handleChangePassword)}>
          <Stack>
            <Title order={4}>Change password</Title>

            <PasswordInput
              disabled={loading}
              label="Current password"
              {...form.getInputProps('currentPassword')}
            />
            <PasswordInput
              disabled={loading}
              label="New password"
              {...form.getInputProps('newPassword')}
            />
            <PasswordInput
              disabled={loading}
              label="Confirm new password"
              {...form.getInputProps('confirmPassword')}
            />

            <Button type="submit" loading={loading}>
              Update password
            </Button>
          </Stack>
        </form>
      )}

      <Divider my="md" />

      <Title order={4}>Sessions</Title>
      <Button color="red" variant="light">
        Sign out from all devices
      </Button>
    </Stack>
  );
}
