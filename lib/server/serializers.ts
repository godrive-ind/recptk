import type { Candidate, MasterData, Ptk, User } from '@prisma/client';

function dateOnly(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : '';
}

function money(value: unknown) {
  return value == null ? '' : String(value);
}

export function publicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.fullName,
  };
}

export function serializePtk(ptk: Ptk) {
  return {
    id: ptk.id,
    no_ptk: ptk.noPtk,
    posisi: ptk.posisi,
    jabatan: ptk.jabatan,
    departemen: ptk.departemen,
    kontrak: ptk.kontrak,
    alasan: ptk.alasan,
    pic: ptk.pic,
    sdm_digantikan: ptk.sdmDigantikan || '',
    nik_digantikan: ptk.nikDigantikan || '',
    tgl_keluar_mutasi: dateOnly(ptk.tglKeluarMutasi),
    keterangan_alasan: ptk.keteranganAlasan || '',
    recruiter: ptk.recruiter,
    gaji_ditawarkan: money(ptk.gajiDitawarkan),
    tgl_ptk_masuk: dateOnly(ptk.tglPtkMasuk),
    tgl_acc_ptk: dateOnly(ptk.tglAccPtk),
    total_permintaan: ptk.totalPermintaan,
    created_at: ptk.createdAt.toISOString(),
  };
}

export function serializeCandidate(candidate: Candidate) {
  return {
    id: candidate.id,
    ptk_id: candidate.ptkId,
    nama_kandidat: candidate.namaKandidat,
    no_wa_kandidat: candidate.noWaKandidat || '',
    melamar_melalui: candidate.melamarMelalui,
    tgl_join_tolak: dateOnly(candidate.tglJoinTolak),
    proses_rekrutmen: candidate.prosesRekrutmen,
    tgl_psikotes: dateOnly(candidate.tglPsikotes),
    tgl_itw_hr: dateOnly(candidate.tglItwHr),
    tgl_itw_user: dateOnly(candidate.tglItwUser),
    hasil_rekrutmen: candidate.hasilRekrutmen,
    gaji_disepakati: money(candidate.gajiDisepakati),
    created_at: candidate.createdAt.toISOString(),
  };
}

const typeMap = {
  DEPARTMENT: 'departments',
  RECRUITER: 'recruiters',
  PIC: 'pics',
  REASON: 'reasons',
  SOURCE: 'sources',
} as const;

export function serializeMasterData(item: MasterData) {
  return {
    id: item.id,
    type: typeMap[item.type],
    name: item.name,
    status: item.status === 'ACTIVE' ? 'Active' : 'Inactive',
    created_at: item.createdAt.toISOString(),
  };
}
