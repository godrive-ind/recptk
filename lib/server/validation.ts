import { z } from 'zod';

const optionalDate = z.string().trim().optional().nullable().transform((value) => value || undefined);
const optionalMoney = z.union([z.string(), z.number()]).optional().nullable().transform((value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
});

export const ptkSchema = z.object({
  no_ptk: z.string().trim().min(1).max(80),
  posisi: z.string().trim().min(1).max(160),
  jabatan: z.string().trim().min(1).max(100),
  departemen: z.string().trim().min(1).max(100),
  kontrak: z.string().trim().min(1).max(80),
  alasan: z.string().trim().min(1).max(120),
  pic: z.string().trim().min(1).max(120),
  sdm_digantikan: z.string().trim().max(160).optional().default(''),
  nik_digantikan: z.string().trim().max(80).optional().default(''),
  tgl_keluar_mutasi: optionalDate,
  keterangan_alasan: z.string().trim().max(1000).optional().default(''),
  recruiter: z.string().trim().min(1).max(120),
  gaji_ditawarkan: optionalMoney,
  tgl_ptk_masuk: z.string().trim().min(1),
  tgl_acc_ptk: optionalDate,
  total_permintaan: z.coerce.number().int().min(1).max(500),
});

export const ptkUpdateSchema = ptkSchema.partial();

export const candidateSchema = z.object({
  ptk_id: z.string().trim().min(1),
  nama_kandidat: z.string().trim().min(1).max(160),
  no_wa_kandidat: z.string().trim().max(40).optional().default(''),
  melamar_melalui: z.string().trim().min(1).max(120),
  tgl_join_tolak: optionalDate,
  proses_rekrutmen: z.string().trim().min(1).max(100),
  tgl_psikotes: optionalDate,
  tgl_itw_hr: optionalDate,
  tgl_itw_user: optionalDate,
  hasil_rekrutmen: z.string().trim().min(1).max(80),
  gaji_disepakati: optionalMoney,
});

export const candidateUpdateSchema = candidateSchema.partial();

export const masterDataSchema = z.object({
  type: z.enum(['departments', 'recruiters', 'pics', 'reasons', 'sources']),
  name: z.string().trim().min(1).max(140),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
});

export const masterDataUpdateSchema = masterDataSchema.partial().extend({
  type: z.enum(['departments', 'recruiters', 'pics', 'reasons', 'sources']),
});

export function parseDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

export function parseNullableDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}
