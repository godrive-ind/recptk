import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { getPrisma, isDatabaseConfigured } from './db';

export type ApiContext = {
  user: {
    id?: string;
  };
  session: null;
};

export function clientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export function userAgent(request: NextRequest) {
  return request.headers.get('user-agent') || 'unknown';
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status });
}

export async function requireApiSession(request: NextRequest): Promise<ApiContext | NextResponse> {
  if (!isDatabaseConfigured()) {
    return jsonError('Database is not configured. Set DATABASE_URL in Vercel.', 503);
  }

  return {
    user: {},
    session: null,
  };
}

export async function withApiLogging(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  userId?: string,
) {
  const started = Date.now();
  let response: NextResponse;

  try {
    response = await handler();
  } catch (error) {
    response = handleRouteError(error);
    await logServerError(request, error, userId);
  }

  if (isDatabaseConfigured()) {
    getPrisma().apiLog.create({
      data: {
        userId,
        method: request.method,
        path: request.nextUrl.pathname,
        statusCode: response.status,
        durationMs: Date.now() - started,
        ipAddress: clientIp(request),
        userAgent: userAgent(request),
      },
    }).catch(() => undefined);
  }

  return response;
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError('Validation failed', 422, error.flatten());
  }

  if (error instanceof Error && error.message.includes('DATABASE_URL')) {
    return jsonError('Database is not configured. Set DATABASE_URL in Vercel.', 503);
  }

  return jsonError('Internal server error', 500);
}

export async function logActivity(
  request: NextRequest,
  params: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  if (!isDatabaseConfigured()) return;

  await getPrisma().activityLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
      ...(params.userId && { user: { connect: { id: params.userId } } }),
      ipAddress: clientIp(request),
      userAgent: userAgent(request),
    },
  });
}

export async function logServerError(request: NextRequest, error: unknown, userId?: string) {
  if (!isDatabaseConfigured()) return;

  const normalized = error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { message: String(error), stack: undefined };

  await getPrisma().errorLog.create({
    data: {
      userId,
      source: `${request.method} ${request.nextUrl.pathname}`,
      message: normalized.message,
      stack: normalized.stack,
      context: { path: request.nextUrl.pathname },
      severity: 'error',
    },
  });
}
