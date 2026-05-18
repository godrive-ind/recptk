import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/server/db';
import { logActivity, requireApiSession, withApiLogging } from '@/lib/server/http';
import { serializePtk } from '@/lib/server/serializers';
import { parseNullableDate, ptkUpdateSchema } from '@/lib/server/validation';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function ptkUpdateData(data: ReturnType<typeof ptkUpdateSchema.parse>) {
  return {
    ...(data.no_ptk !== undefined && { noPtk: data.no_ptk }),
    ...(data.posisi !== undefined && { posisi: data.posisi }),
    ...(data.jabatan !== undefined && { jabatan: data.jabatan }),
    ...(data.departemen !== undefined && { departemen: data.departemen }),
    ...(data.kontrak !== undefined && { kontrak: data.kontrak }),
    ...(data.alasan !== undefined && { alasan: data.alasan }),
    ...(data.pic !== undefined && { pic: data.pic }),
    ...(data.sdm_digantikan !== undefined && { sdmDigantikan: data.sdm_digantikan }),
    ...(data.nik_digantikan !== undefined && { nikDigantikan: data.nik_digantikan }),
    ...(data.tgl_keluar_mutasi !== undefined && { tglKeluarMutasi: parseNullableDate(data.tgl_keluar_mutasi) }),
    ...(data.keterangan_alasan !== undefined && { keteranganAlasan: data.keterangan_alasan }),
    ...(data.recruiter !== undefined && { recruiter: data.recruiter }),
    ...(data.gaji_ditawarkan !== undefined && { gajiDitawarkan: data.gaji_ditawarkan }),
    ...(data.tgl_ptk_masuk !== undefined && { tglPtkMasuk: new Date(`${data.tgl_ptk_masuk}T00:00:00.000Z`) }),
    ...(data.tgl_acc_ptk !== undefined && { tglAccPtk: parseNullableDate(data.tgl_acc_ptk) }),
    ...(data.total_permintaan !== undefined && { totalPermintaan: data.total_permintaan }),
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const { id } = await context.params;
    const payload = ptkUpdateSchema.parse(await request.json());
    const ptk = await getPrisma().ptk.update({
      where: { id },
      data: ptkUpdateData(payload),
    });
    await logActivity(request, {
      userId: auth.user.id,
      action: 'ptk.update',
      entityType: 'ptk',
      entityId: ptk.id,
      metadata: payload,
    });
    return NextResponse.json({ ptk: serializePtk(ptk) });
  }, auth.user.id);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const { id } = await context.params;
    const ptk = await getPrisma().ptk.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logActivity(request, {
      userId: auth.user.id,
      action: 'ptk.delete',
      entityType: 'ptk',
      entityId: id,
    });
    return NextResponse.json({ ptk: serializePtk(ptk) });
  }, auth.user.id);
}
