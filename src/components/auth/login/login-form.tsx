'use client';

import { useRouter } from 'next/navigation';
import { BorderAnimate } from '@gfazioli/mantine-border-animate';
import {
  Button,
  Checkbox,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { isEmail, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { useAuthStore } from '@/store/auth';
import { authClient } from '@/utils/auth-client';
import { IconGoogleSvg } from './_internal/_icon_svg';

export const LoginForm = () => {
  const [visible, { toggle }] = useDisclosure(false);

  const authLoading = useAuthStore((s) => s.authLoading);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);

  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validateInputOnBlur: true,
    validate: {
      email: isEmail('Invalid Email'),
      password: (val) => (!val ? 'Field cannot be empty' : null),
    },
  });

  const onValidate = async (values: { email: string; password: string; rememberMe: boolean }) => {
    setAuthLoading(true);
    const { email, password, rememberMe } = values;
    try {
      const signIn = await authClient.signIn.email({ email, password, rememberMe });
      if (signIn.data?.user) {
        router.replace('/');
      }
    } catch (err) {
      console.error(err);
      showNotification({
        color: 'red',
        title: 'Login failed',
        message: 'Invalid email or password',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setAuthLoading(true);
    try {
      const gooleSignIn = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
        errorCallbackURL: '/error?authError=google',
      });
      console.log('GOOGLE SIGNIN:', gooleSignIn);
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <>
      <Stack w="100%">
        <Button
          onClick={signInWithGoogle}
          leftSection={<IconGoogleSvg />}
          variant="default"
          radius="xl"
          w="100%"
          loading={authLoading}
        >
          Continue with Google
        </Button>
      </Stack>
      <Divider w="100%" />
      <Title size="lg" m={0}>
        Sign In
      </Title>
      <Text m={0} size="sm">
        with your email to access&nbsp;<strong>Dash-Template</strong>
      </Text>
      <form onSubmit={form.onSubmit(onValidate)} style={{ width: '100%' }}>
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
          autoComplete="current-password"
          placeholder="Enter your password"
          // key={form.key('password')}
          visible={visible}
          onVisibilityChange={toggle}
          {...form.getInputProps('password')}
        />

        <Checkbox
          mt={12}
          label="Remember me"
          // key={form.key('rememberMe')}
          {...form.getInputProps('rememberMe')}
        />

        <Group justify="center" mt="md" w="100%">
          <BorderAnimate
            radius="xl"
            w="100%"
            variant="pulse"
            colorFrom="grape"
            colorTo="indigo"
            borderWidth="sm"
            duration={5}
          >
            <Button
              variant="default"
              radius="xl"
              w="100%"
              type="submit"
              color="dark"
              loading={authLoading}
            >
              Continue
            </Button>
          </BorderAnimate>
        </Group>
      </form>
    </>
  );
};
