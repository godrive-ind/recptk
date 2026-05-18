import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/server/db';
import { logActivity, requireApiSession, withApiLogging } from '@/lib/server/http';
import { serializeCandidate } from '@/lib/server/serializers';
import { candidateSchema, parseNullableDate } from '@/lib/server/validation';

function candidateCreateData(data: ReturnType<typeof candidateSchema.parse>) {
  return {
    ptkId: data.ptk_id,
    namaKandidat: data.nama_kandidat,
    noWaKandidat: data.no_wa_kandidat,
    melamarMelalui: data.melamar_melalui,
    tglJoinTolak: parseNullableDate(data.tgl_join_tolak),
    prosesRekrutmen: data.proses_rekrutmen,
    tglPsikotes: parseNullableDate(data.tgl_psikotes),
    tglItwHr: parseNullableDate(data.tgl_itw_hr),
    tglItwUser: parseNullableDate(data.tgl_itw_user),
    hasilRekrutmen: data.hasil_rekrutmen,
    gajiDisepakati: data.gaji_disepakati,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const candidates = await getPrisma().candidate.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ candidates: candidates.map(serializeCandidate) });
  }, auth.user.id);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (auth instanceof NextResponse) return auth;

  return withApiLogging(request, async () => {
    const payload = candidateSchema.parse(await request.json());
    const candidate = await getPrisma().candidate.create({ data: candidateCreateData(payload) });
    await logActivity(request, {
      userId: auth.user.id,
      action: 'candidate.create',
      entityType: 'candidate',
      entityId: candidate.id,
      metadata: { ptk_id: candidate.ptkId, hasil_rekrutmen: candidate.hasilRekrutmen },
    });
    return NextResponse.json({ candidate: serializeCandidate(candidate) }, { status: 201 });
  }, auth.user.id);
}
