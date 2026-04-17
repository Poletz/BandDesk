'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Center, Loader, LoadingOverlay, Stack, Text } from '@mantine/core';
import { authClient } from '@/utils/auth-client';

export default function SignOutPage() {
  const router = useRouter();
  const t = useTranslations('Auth');

  useEffect(() => {
    const signOut = async () => {
      try {
        await authClient.signOut();
      } catch (error) {
        console.error(error);
      } finally {
        router.replace('/login');
      }
    };

    void signOut();
  }, [router]);

  return (
    <LoadingOverlay
      visible
      loaderProps={{
        children: (
          <Stack>
            <Center>
              <Loader size={50} />
            </Center>
            <Text>{t('loggingOut')}</Text>
          </Stack>
        ),
      }}
    />
  );
}
