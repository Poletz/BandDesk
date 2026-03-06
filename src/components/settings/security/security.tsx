'use client';

import { Button, Divider, Group, Image, PasswordInput, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Provider } from '@/interfaces';

export default function SecuritySettingsPage({ provider }: { provider: Provider | null }) {
  const form = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleChangePassword = (values: typeof form.values) => {
    console.log(values);
    // TODO: call auth API
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
        <Stack>
          <Title order={4}>Change password</Title>

          <PasswordInput label="Current password" {...form.getInputProps('currentPassword')} />
          <PasswordInput label="New password" {...form.getInputProps('newPassword')} />
          <PasswordInput label="Confirm new password" {...form.getInputProps('confirmPassword')} />

          <Button onClick={() => form.onSubmit(handleChangePassword)}>Update password</Button>
        </Stack>
      )}

      <Divider my="md" />

      <Title order={4}>Sessions</Title>
      <Button color="red" variant="light">
        Sign out from all devices
      </Button>
    </Stack>
  );
}
