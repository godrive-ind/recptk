import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/server/db';
import { logActivity, requireApiSession, withApiLogging } from '@/lib/server/http';
import { serializePtk } from '@/lib/server/serializers';
import { parseDate, parseNullableDate, ptkSchema } from '@/lib/server/validation';

function ptkCreateData(data: ReturnType<typeof ptkSchema.parse>) {
  return {
    noPtk: data.no_ptk,
    posisi: data.posisi,
    jabatan: data.jabatan,
    departemen: data.departemen,
    kontrak: data.kontrak,
    alasan: data.alasan,
    pic: data.pic,
    sdmDigantikan: data.sdm_digantikan,
    nikDigantikan: data.nik_digantikan,
    tglKeluarMutasi: parseNullableDate(data.tgl_keluar_mutasi),
    keteranganAlasan: data.keterangan_alasan,
    recruiter: data.recruiter,
    gajiDitawarkan: data.gaji_ditawarkan,
    tglPtkMasuk: parseDate(data.tgl_ptk_masuk)!,
    tglAccPtk: parseNullableDate(data.tgl_acc_ptk),
    totalPermintaan: data.total_permintaan,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const ptks = await getPrisma().ptk.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ptks: ptks.map(serializePtk) });
  }, auth.user.id);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const payload = ptkSchema.parse(await request.json());
    const ptk = await getPrisma().ptk.create({ data: ptkCreateData(payload) });
    await logActivity(request, {
      userId: auth.user.id,
      action: 'ptk.create',
      entityType: 'ptk',
      entityId: ptk.id,
      metadata: { no_ptk: ptk.noPtk },
    });
    return NextResponse.json({ ptk: serializePtk(ptk) }, { status: 201 });
  }, auth.user.id);
}
