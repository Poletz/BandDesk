import { getTranslations } from 'next-intl/server';
import { Center, Divider, Image, Stack } from '@mantine/core';
import { LoginForm } from '@/components/auth/login/login-form';
import { SignUpButton } from '@/components/auth/signup';
import { LocaleSelect } from '@/components/header';
import { LoginRedirectBanner } from './_internal/login-redirect-banner';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reason?: string }>;
}) {
  const sP = await searchParams;
  const t = await getTranslations('Auth');

  return (
    <Center style={{ height: '100dvh' }}>
      <Stack align="center" justify="center" style={{ minWidth: '300px', maxWidth: '500px' }}>
        <LocaleSelect />
        <LoginRedirectBanner reason={sP.reason} />

        <Image src="/img/login-test.jpg" w={100} h={100} fit="cover" bdrs="xl" />
        <LoginForm redirectUrl={sP.redirect} />

        <Divider w="100%" my={12} label={t('or')} />

        <SignUpButton />
      </Stack>
    </Center>
  );
}
