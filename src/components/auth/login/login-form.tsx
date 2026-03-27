'use client';

import { useRouter } from 'next/navigation';
import { BorderAnimate } from '@gfazioli/mantine-border-animate';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useTranslations } from 'next-intl';
import { z } from 'zod/v4';
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
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { useAuthStore } from '@/store/auth';
import { authClient } from '@/utils/auth-client';
import { signInSchemaValidation } from '@/utils/zod-interfaces';
import { IconGoogleSvg } from './_internal/_icon_svg';

type SignInFormValues = z.infer<typeof signInSchemaValidation>;

interface LoginFormProps {
  redirectUrl?: string;
}

export const LoginForm = ({ redirectUrl }: LoginFormProps) => {
  const [visible, { toggle }] = useDisclosure(false);

  const authLoading = useAuthStore((s) => s.authLoading);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const t = useTranslations('Auth');
  const tGen = useTranslations('Common');

  const router = useRouter();

  const form = useForm<SignInFormValues>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(signInSchemaValidation),
  });

  const onValidate = async (values: { email: string; password: string; rememberMe?: boolean }) => {
    setAuthLoading(true);
    const { email, password, rememberMe } = values;
    try {
      const signIn = await authClient.signIn.email({ email, password, rememberMe });
      if (signIn.data?.user) {
        router.replace(redirectUrl ?? '/');
      }
    } catch (err) {
      console.error(err);
      showNotification({
        color: 'red',
        title: t('loginFailed'),
        message: t('invalidCredentials'),
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setAuthLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectUrl ?? '/',
        errorCallbackURL: '/error?authError=google',
      });
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
          {t('continueWithGoogle')}
        </Button>
      </Stack>
      <Divider w="100%" />
      <Title size="lg" m={0}>
        {t('signIn')}
      </Title>
      <Text m={0} size="sm">
        {t('signInSubtitle')}&nbsp;<strong>{tGen('appName')}</strong>
      </Text>
      <form onSubmit={form.onSubmit(onValidate)} style={{ width: '100%' }}>
        <TextInput
          mb={12}
          withAsterisk
          label={t('email')}
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          // key={form.key('email')}
          {...form.getInputProps('email')}
        />

        <PasswordInput
          mb={12}
          withAsterisk
          label={t('password')}
          autoComplete="current-password"
          placeholder={t('passwordPlaceholder')}
          // key={form.key('password')}
          visible={visible}
          onVisibilityChange={toggle}
          {...form.getInputProps('password')}
        />

        <Checkbox mt={12} label={t('rememberMe')} {...form.getInputProps('rememberMe')} />

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
              {t('continue')}
            </Button>
          </BorderAnimate>
        </Group>
      </form>
    </>
  );
};
