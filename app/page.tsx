"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useStore, getPTKStatusLowongan, getPTKStatusComputed, getPTKKekurangan } from "@/lib/store";
import { FileText, Users, UserCheck, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default function Dashboard() {
  const { ptks, candidates } = useStore();
  
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear().toString();
  
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);

  // Global filters typically apply to reports, but PRD says "kartu metrik (global, bisa difilter bulan/tahun)".
  
  // Filter PTKs for cards and departemen table
  const filteredPtks = ptks.filter(p => {
    if (!p.tgl_ptk_masuk) return false;
    const [year, month] = p.tgl_ptk_masuk.split('-');
    return year === filterYear && month === filterMonth;
  });

  const totalPermintaan = filteredPtks.reduce((sum, p) => sum + (p.total_permintaan || 0), 0);
  const lowonganBuka = filteredPtks.filter(p => getPTKStatusLowongan(p, candidates) === "Buka").length;
  
  const ptkIds = filteredPtks.map(p => p.id);
  const filteredCandidates = candidates.filter(c => ptkIds.includes(c.ptk_id));
  
  const kandidatDiterima = filteredCandidates.filter(c => c.hasil_rekrutmen === "Diterima").length;
  const kandidatDitolak = filteredCandidates.filter(c => c.hasil_rekrutmen === "Ditolak").length;
  
  const ptkKadaluarsa = filteredPtks.filter(p => getPTKStatusComputed(p, candidates) === "Kadaluarsa").length;

  const stats = [
    { label: "Total Permintaan", value: totalPermintaan, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Lowongan Terbuka", value: lowonganBuka, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Kandidat Diterima", value: kandidatDiterima, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Kandidat Ditolak", value: kandidatDitolak, icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
    { label: "PTK Kadaluarsa", value: ptkKadaluarsa, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  // Permintaan PTK per Departemen (using filteredPtks)
  const deptStats = filteredPtks.reduce((acc, p) => {
    acc[p.departemen] = (acc[p.departemen] || 0) + (p.total_permintaan || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <Header title="Dashboard Rekrutmen" />
      
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-[#E5E5EA]">
        <div className="flex-1 sm:max-w-xs">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Bulan</label>
          <select 
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
            value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="01">Januari</option><option value="02">Februari</option>
            <option value="03">Maret</option><option value="04">April</option>
            <option value="05">Mei</option><option value="06">Juni</option>
            <option value="07">Juli</option><option value="08">Agustus</option>
            <option value="09">September</option><option value="10">Oktober</option>
            <option value="11">November</option><option value="12">Desember</option>
          </select>
        </div>
        <div className="flex-1 sm:max-w-xs">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Tahun</label>
          <select 
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
            value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
          >
            {[...Array({length: 5})].map((_, i) => (
              <option key={i} value={parseInt(currentYear) - i}>{parseInt(currentYear) - i}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-[#E5E5EA] flex flex-col gap-3 transition-transform hover:scale-[1.02]">
            <div className={`w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl bg-opacity-50 ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-[#E5E5EA] overflow-hidden">
        <h3 className="font-semibold text-[#1d1d1f] mb-6 text-sm uppercase tracking-wider">Permintaan per Departemen ({filterYear})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 font-semibold">Departemen</th>
                {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].map(m => (
                  <th key={m} className="px-2 py-2 text-center">{m}</th>
                ))}
                <th className="px-3 py-2 text-center font-bold text-slate-700">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(
                ptks.filter(p => p.tgl_ptk_masuk?.startsWith(filterYear)).reduce((acc, p) => {
                  acc[p.departemen] = true;
                  return acc;
                }, {} as Record<string, boolean>)
              ).sort().map(dept => {
                const deptPtks = ptks.filter(p => p.departemen === dept && p.tgl_ptk_masuk?.startsWith(filterYear));
                let totalYear = 0;
                
                return (
                  <tr key={dept} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-800 whitespace-nowrap">{dept}</td>
                    {Array.from({length: 12}).map((_, i) => {
                      const monthStr = (i + 1).toString().padStart(2, '0');
                      const sum = deptPtks.filter(p => p.tgl_ptk_masuk?.split('-')[1] === monthStr).reduce((s, p) => s + (p.total_permintaan || 0), 0);
                      totalYear += sum;
                      return (
                        <td key={i} className={`px-2 py-2 text-center ${sum > 0 ? 'font-semibold text-indigo-700 bg-indigo-50/30' : 'text-slate-400'}`}>
                          {sum > 0 ? sum : '-'}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold text-slate-800 bg-slate-50">{totalYear}</td>
                  </tr>
                );
              })}
              {ptks.filter(p => p.tgl_ptk_masuk?.startsWith(filterYear)).length === 0 && (
                <tr>
                   <td colSpan={14} className="px-4 py-8 text-center text-slate-500">Tidak ada data departemen untuk tahun {filterYear}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 mb-4">Rekap per Nomor PTK (Semua Data)</h2>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left text-sm text-slate-600 relative">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/90 backdrop-blur-sm sticky top-0 border-b border-slate-200 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3">No PTK</th>
                  <th className="px-4 py-3">Departemen</th>
                  <th className="px-3 py-3 text-center">Minta</th>
                  <th className="px-3 py-3 text-center">Isi</th>
                  <th className="px-3 py-3 text-center">Kurang</th>
                  <th className="px-3 py-3 text-center">% Terisi</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Recruiter</th>
                </tr>
              </thead>
              <tbody>
                {[...ptks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((ptk) => {
                  const statusLowongan = getPTKStatusLowongan(ptk, candidates);
                  const statusPtk = getPTKStatusComputed(ptk, candidates);
                  const kekurangan = getPTKKekurangan(ptk, candidates);
                  const permintaan = ptk.total_permintaan || 1;
                  const diterima = candidates.filter(c => c.ptk_id === ptk.id && c.hasil_rekrutmen === "Diterima").length;
                  const percent = Math.round((diterima / permintaan) * 100);

                  return (
                  <tr key={ptk.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                       <div className="font-semibold text-slate-900">{ptk.no_ptk}</div>
                       <div className="text-xs text-slate-500 truncate max-w-[120px]">{ptk.posisi}</div>
                    </td>
                    <td className="px-4 py-3">{ptk.departemen}</td>
                    <td className="px-3 py-3 text-center font-medium bg-slate-50/50">{permintaan}</td>
                    <td className="px-3 py-3 text-center font-medium text-emerald-600">{diterima}</td>
                    <td className="px-3 py-3 text-center font-medium text-red-600">{kekurangan}</td>
                    <td className="px-3 py-3 text-center">
                       <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-slate-700">{percent}%</span>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500" style={{ width: `${Math.min(percent, 100)}%` }} />
                          </div>
                       </div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      <div className="flex flex-col gap-1 items-center">
                        <span className={`px-2 py-0.5 rounded font-semibold w-full text-center ${
                          statusLowongan === 'Buka' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {statusLowongan === 'Buka' ? '⚠ BUKA' : '✅ PENUH'}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                           statusPtk === 'Berlaku' ? 'text-indigo-600' :
                           statusPtk === 'Selesai' ? 'text-slate-500' : 'text-red-500'
                        }`}>
                           {statusPtk}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{ptk.recruiter || '-'}</td>
                  </tr>
                )})}
                {ptks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Belum ada data PTK.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
