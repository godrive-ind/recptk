import { MasterDataStatus, MasterDataType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/server/db';
import { logActivity, requireApiSession, withApiLogging } from '@/lib/server/http';
import { serializeMasterData } from '@/lib/server/serializers';
import { masterDataSchema } from '@/lib/server/validation';

const typeMap = {
  departments: MasterDataType.DEPARTMENT,
  recruiters: MasterDataType.RECRUITER,
  pics: MasterDataType.PIC,
  reasons: MasterDataType.REASON,
  sources: MasterDataType.SOURCE,
};

const statusMap = {
  Active: MasterDataStatus.ACTIVE,
  Inactive: MasterDataStatus.INACTIVE,
};

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const masterData = await getPrisma().masterData.findMany({
      where: { deletedAt: null },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ masterData: masterData.map(serializeMasterData) });
  }, auth.user.id);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const payload = masterDataSchema.parse(await request.json());
    const item = await getPrisma().masterData.create({
      data: {
        type: typeMap[payload.type],
        name: payload.name,
        status: statusMap[payload.status],
      },
    });
    await logActivity(request, {
      userId: auth.user.id,
      action: 'master.create',
      entityType: 'master_data',
      entityId: item.id,
      metadata: payload,
    });
    return NextResponse.json({ item: serializeMasterData(item) }, { status: 201 });
  }, auth.user.id);
}
