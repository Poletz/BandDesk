'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconAlertCircle } from '@tabler/icons-react';
import { Alert } from '@mantine/core';

export const LoginRedirectBanner = ({ reason }: { reason?: string }) => {
  const router = useRouter();

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
    session_expired: 'Your session expired. Please sign in again.',
    unauthorized: 'You must sign in to access that page.',
  };

  return (
    <Alert variant="light" color="orange" radius="md" mb="md" icon={<IconAlertCircle size={18} />}>
      {messages[reason] ?? 'Please sign in to continue.'}
    </Alert>
  );
};
