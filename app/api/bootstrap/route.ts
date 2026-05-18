import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/server/db';
import { requireApiSession, withApiLogging } from '@/lib/server/http';
import { serializeCandidate, serializeMasterData, serializePtk } from '@/lib/server/serializers';

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const prisma = getPrisma();
    const [ptks, candidates, masterData] = await Promise.all([
      prisma.ptk.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } }),
      prisma.candidate.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } }),
      prisma.masterData.findMany({ where: { deletedAt: null }, orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
    ]);

    return NextResponse.json({
      ptks: ptks.map(serializePtk),
      candidates: candidates.map(serializeCandidate),
      masterData: masterData.map(serializeMasterData),
    });
  }, auth.user.id);
}
