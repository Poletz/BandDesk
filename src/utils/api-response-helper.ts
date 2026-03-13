import { NextResponse } from 'next/server';
import type { ApiErrorCode } from '@/utils/http';

export function apiError(message: string, code: ApiErrorCode, status: number) {
  return NextResponse.json(
    {
      message,
      code,
    },
    { status }
  );
}
