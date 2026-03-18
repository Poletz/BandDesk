import { NextResponse } from 'next/server';
import type { User } from 'better-auth';
import { treeifyError, ZodError } from 'zod/v4';
import type { ApiErrorCode } from '@/utils/http';

const SESSION_EXPIRED_MESSAGE = 'Session expired! Please login again.';
const FORBIDDEN_ITEM_MESSAGE = 'You cannot access this item.';
const VALIDATION_ERROR_MESSAGE = 'Validation error';
const EMPTY_UPDATE_MESSAGE = 'Nothing to update';

export function apiError(message: string, code: ApiErrorCode, status: number) {
  return NextResponse.json(
    {
      message,
      code,
    },
    { status }
  );
}

export function sessionExpiredError() {
  return apiError(SESSION_EXPIRED_MESSAGE, 'SESSION_EXPIRED', 401);
}

export function isAuthenticatedUser(user: User | null): user is User {
  return user !== null;
}

export function notFoundError(resourceName: string) {
  return apiError(`${resourceName} not found`, 'NOT_FOUND', 404);
}

export function forbiddenItemError() {
  return apiError(FORBIDDEN_ITEM_MESSAGE, 'UNAUTHORIZED', 403);
}

export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      message: VALIDATION_ERROR_MESSAGE,
      errors: treeifyError(error),
    },
    { status: 400 }
  );
}

export function emptyUpdateError() {
  return NextResponse.json({ message: EMPTY_UPDATE_MESSAGE }, { status: 400 });
}
