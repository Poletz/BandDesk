'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BorderAnimate } from '@gfazioli/mantine-border-animate';
import { IconArrowLeft } from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { z } from 'zod/v4';
import { ActionIcon, Button, Card, Group, PasswordInput, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { authClient } from '@/utils/auth-client';
import { signUpSchemaValidation } from '@/utils/zod-interfaces';

type SignUpFormValues = z.infer<typeof signUpSchemaValidation>;

export const SignUpForm = () => {
  const [visible, { toggle }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(signUpSchemaValidation),
  });

  const onValidate = async (values: { email: string; password: string; name: string }) => {
    setLoading(true);

    const { email, password, name } = values;
    try {
      const signUp = await authClient.signUp.email({
        email: email.toLowerCase(),
        password,
        name,
        image: 'null',
      });
      if (signUp.error) {
        throw new Error(signUp.error.message);
      }
      if (signUp.data?.user) {
        router.replace('/login');
      }
    } catch (err) {
      showNotification({
        color: 'red',
        title: 'Login failed',
        message: 'Invalid email or password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card withBorder w="100%" p="lg" radius="lg">
      <Group align="center" mb={12}>
        <ActionIcon
          variant="transparent"
          c="dark"
          onClick={() => {
            router.back();
          }}
        >
          <IconArrowLeft size={24} />
        </ActionIcon>
        <Title size="lg" ta="center">
          Sign Up
        </Title>
      </Group>
      <form onSubmit={form.onSubmit(onValidate)} style={{ width: '100%' }}>
        <TextInput
          mb={12}
          withAsterisk
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Enter your profile name"
          // key={form.key('email')}
          {...form.getInputProps('name')}
        />

        <TextInput
          mb={12}
          withAsterisk
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          // key={form.key('email')}
          {...form.getInputProps('email')}
        />

        <PasswordInput
          mb={12}
          withAsterisk
          label="Password"
          autoComplete="new-password"
          placeholder="Enter your password"
          // key={form.key('password')}
          visible={visible}
          onVisibilityChange={toggle}
          {...form.getInputProps('password')}
        />

        <Group justify="center" mt="md" w="100%">
          <BorderAnimate
            radius="xl"
            w="100%"
            variant="pulse"
            colorFrom="yellow.6"
            colorTo="red.8"
            borderWidth="sm"
            duration={5}
          >
            <Button
              variant="light"
              color="indigo"
              radius="xl"
              w="100%"
              type="submit"
              loading={loading}
            >
              Register
            </Button>
          </BorderAnimate>
        </Group>
      </form>
    </Card>
  );
};
