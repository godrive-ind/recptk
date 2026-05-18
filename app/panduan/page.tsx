"use client";

import { Header } from "@/components/layout/header";

export default function PanduanPage() {
  return (
    <div>
      <Header title="Panduan Pengguna" />

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Panduan Penggunaan Aplikasi Rekrutmen</h2>

        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              Membuat Permintaan Tenaga Kerja (PTK)
            </h3>
            <p className="text-slate-600 mb-2 leading-relaxed">
              Buka menu <strong>Data PTK</strong> lalu klik tombol <strong>Tambah PTK</strong>. Lengkapi form yang disediakan:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li><strong>Total Permintaan</strong> hanya perlu diisi saat pembuatan PTK pertama kali.</li>
              <li>Jika status lowongan sudah ✅ <strong>PENUH</strong>, Anda tidak bisa lagi menambahkan kandidat dengan status Diterima ke posisi tersebut.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              Mengelola Kandidat
            </h3>
            <p className="text-slate-600 mb-2 leading-relaxed">
              Buka menu <strong>Data Kandidat</strong> lalu klik tombol <strong>Tambah Kandidat</strong>. Pilih lowongan PTK yang sesuai.
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Anda bisa memperbarui status proses rekrutmen setiap saat.</li>
              <li>Jika kandidat terpilih, ubah Hasil Rekrutmen menjadi <strong>Diterima</strong>. Sistem akan otomatis mengurangi sisa <strong>Kekurangan</strong> di PTK tersebut.</li>
              <li>Jika PTK sudah penuh (Kekurangan = 0), opsi &quot;Diterima&quot; pada form kandidat akan dikunci.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
              Indikator Status & Warna
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="border border-slate-200 rounded-lg p-4 bg-emerald-50">
                <div className="font-semibold text-emerald-800 mb-1">✅ PENUH (Terisi Semua)</div>
                <div className="text-sm text-emerald-600">Terjadi ketika jumlah kandidat diterima sudah memenuhi total permintaan. Warna baris hijau muda.</div>
              </div>
              <div className="border border-slate-200 rounded-lg p-4 bg-amber-50">
                <div className="font-semibold text-amber-800 mb-1">⚠ BUKA (Masih Kurang)</div>
                <div className="text-sm text-amber-600">PTK masih memproses kandidat dan usia PTK belum melebihi 90 hari. Warna baris kuning muda.</div>
              </div>
              <div className="border border-slate-200 rounded-lg p-4 bg-red-50">
                <div className="font-semibold text-red-800 mb-1">⌛ KADALUARSA</div>
                <div className="text-sm text-red-600">Usia PTK (Days Open) lebih dari 90 hari dan status masih BUKA. Warna baris merah muda.</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
              Dashboard & Statistik
            </h3>
            <p className="text-slate-600 mb-2 leading-relaxed">
              Anda dapat menggunakan dropdown <strong>Bulan</strong> dan <strong>Tahun</strong> pada halaman Dashboard, Laporan Bulanan, dan Statistik Recruiter untuk melihat performa spesifik pada rentang waktu tersebut.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
