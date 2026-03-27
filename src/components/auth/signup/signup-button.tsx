'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@mantine/core';
import { useAuthStore } from '@/store/auth';

export const SignUpButton = () => {
  const router = useRouter();
  const loading = useAuthStore((s) => s.authLoading);
  const t = useTranslations('Auth');

  return (
    <Button
      onClick={() => router.push('/sign-up')}
      radius="xl"
      variant="filled"
      w="100%"
      loading={loading}
    >
      {t('signUp')}
    </Button>
  );
};
