import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/server/db';
import { logActivity, requireApiSession, withApiLogging } from '@/lib/server/http';
import { serializeCandidate } from '@/lib/server/serializers';
import { candidateUpdateSchema, parseNullableDate } from '@/lib/server/validation';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function candidateUpdateData(data: ReturnType<typeof candidateUpdateSchema.parse>) {
  return {
    ...(data.ptk_id !== undefined && { ptkId: data.ptk_id }),
    ...(data.nama_kandidat !== undefined && { namaKandidat: data.nama_kandidat }),
    ...(data.no_wa_kandidat !== undefined && { noWaKandidat: data.no_wa_kandidat }),
    ...(data.melamar_melalui !== undefined && { melamarMelalui: data.melamar_melalui }),
    ...(data.tgl_join_tolak !== undefined && { tglJoinTolak: parseNullableDate(data.tgl_join_tolak) }),
    ...(data.proses_rekrutmen !== undefined && { prosesRekrutmen: data.proses_rekrutmen }),
    ...(data.tgl_psikotes !== undefined && { tglPsikotes: parseNullableDate(data.tgl_psikotes) }),
    ...(data.tgl_itw_hr !== undefined && { tglItwHr: parseNullableDate(data.tgl_itw_hr) }),
    ...(data.tgl_itw_user !== undefined && { tglItwUser: parseNullableDate(data.tgl_itw_user) }),
    ...(data.hasil_rekrutmen !== undefined && { hasilRekrutmen: data.hasil_rekrutmen }),
    ...(data.gaji_disepakati !== undefined && { gajiDisepakati: data.gaji_disepakati }),
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const { id } = await context.params;
    const payload = candidateUpdateSchema.parse(await request.json());
    const candidate = await getPrisma().candidate.update({
      where: { id },
      data: candidateUpdateData(payload),
    });
    await logActivity(request, {
      userId: auth.user.id,
      action: 'candidate.update',
      entityType: 'candidate',
      entityId: candidate.id,
      metadata: payload,
    });
    return NextResponse.json({ candidate: serializeCandidate(candidate) });
  }, auth.user.id);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const { id } = await context.params;
    const candidate = await getPrisma().candidate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logActivity(request, {
      userId: auth.user.id,
      action: 'candidate.delete',
      entityType: 'candidate',
      entityId: id,
    });
    return NextResponse.json({ candidate: serializeCandidate(candidate) });
  }, auth.user.id);
}
