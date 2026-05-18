import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/server/db';

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const payload = await request.json().catch(() => ({}));

  await getPrisma().errorLog.create({
    data: {
      source: 'client',
      message: String(payload.message || 'Client error'),
      stack: payload.stack ? String(payload.stack).slice(0, 8000) : undefined,
      context: { path: payload.path || request.nextUrl.pathname },
      severity: 'error',
    },
  });

  return NextResponse.json({ ok: true });
}
