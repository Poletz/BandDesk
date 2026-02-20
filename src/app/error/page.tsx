'use client';

import Error from 'next/error';
import { useRouter, useSearchParams } from 'next/navigation';
import { connection } from 'next/server';
import { Button } from '@mantine/core';
import styles from './error.module.css';

interface ErrorSearchParams {
  authError: 'google';
  error: 'access_denied';
}

export default async function ErrorPage() {
  await connection();
  const router = useRouter();

  const searchParams: ErrorSearchParams | Record<string, string> = useSearchParams()
    .entries()
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  return (
    <div className={styles.errorDiv}>
      <Error
        style={{ height: '100px' }}
        statusCode={searchParams.error === 'access_denied' ? 503 : 400}
        title={
          searchParams.authError === 'google'
            ? `There was an issue with Google Auth. Try again or choose another sign in method`
            : undefined
        }
      />
      <Button onClick={() => router.push('/login')}>Return to Login</Button>
    </div>
  );
}
