import { MasterDataStatus, MasterDataType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/server/db';
import { logActivity, requireApiSession, withApiLogging } from '@/lib/server/http';
import { serializeMasterData } from '@/lib/server/serializers';
import { masterDataUpdateSchema } from '@/lib/server/validation';

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const { id } = await context.params;
    const payload = masterDataUpdateSchema.parse(await request.json());
    const item = await getPrisma().masterData.update({
      where: { id },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.status !== undefined && { status: statusMap[payload.status] }),
        ...(payload.type !== undefined && { type: typeMap[payload.type] }),
      },
    });
    await logActivity(request, {
      userId: auth.user.id,
      action: 'master.update',
      entityType: 'master_data',
      entityId: item.id,
      metadata: payload,
    });
    return NextResponse.json({ item: serializeMasterData(item) });
  }, auth.user.id);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const { id } = await context.params;
    const item = await getPrisma().masterData.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logActivity(request, {
      userId: auth.user.id,
      action: 'master.delete',
      entityType: 'master_data',
      entityId: id,
    });
    return NextResponse.json({ item: serializeMasterData(item) });
  }, auth.user.id);
}
