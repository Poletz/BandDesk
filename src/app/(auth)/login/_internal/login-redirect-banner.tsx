'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Alert } from '@mantine/core';

export const LoginRedirectBanner = ({ reason }: { reason?: string }) => {
  const router = useRouter();
  const t = useTranslations('Auth');

  useEffect(() => {
    if (reason) {
      // remove params so refresh does not show banner again
      router.replace('/login', { scroll: false });
    }
  }, [reason, router]);

  if (!reason) {
    return null;
  }

  const messages: Record<string, string> = {
    session_expired: t('redirect.sessionExpired'),
    unauthorized: t('redirect.unauthorized'),
  };

  return (
    <Alert variant="light" color="orange" radius="md" mb="md" icon={<IconAlertCircle size={18} />}>
      {messages[reason] ?? t('redirect.default')}
    </Alert>
  );
};
