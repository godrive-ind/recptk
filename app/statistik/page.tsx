"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useStore, getPTKStatusComputed, getPTKStatusLowongan, getPTKDaysOpen } from "@/lib/store";

export default function StatistikPage() {
  const { ptks, candidates } = useStore();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear().toString();
  
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);

  // Group by Recruiter
  const recruiters = Array.from(new Set(ptks.map(p => p.recruiter).filter(Boolean)));

  const getRecruiterStats = (recruiterName: string) => {
    // Filter PTKs for this recruiter in the selected month & year
    const recruiterPtks = ptks.filter(p => {
       if (p.recruiter !== recruiterName) return false;
       if (!p.tgl_ptk_masuk) return false;
       const [year, month] = p.tgl_ptk_masuk.split('-');
       return year === filterYear && month === filterMonth;
    });

    const totalPermintaan = recruiterPtks.reduce((sum, p) => sum + (p.total_permintaan || 0), 0);
    
    // Get all candidates for these PTKs
    const ptkIds = recruiterPtks.map(p => p.id);
    const recruiterCandidates = candidates.filter(c => ptkIds.includes(c.ptk_id));

    const totalDiterima = recruiterCandidates.filter(c => c.hasil_rekrutmen === "Diterima").length;
    const totalDitolak = recruiterCandidates.filter(c => c.hasil_rekrutmen === "Ditolak").length;
    
    // Masih proses if hasil is not Diterima/Ditolak AND the lowongan is still Open
    const totalMasihProses = recruiterCandidates.filter(c => {
      if (c.hasil_rekrutmen === "Diterima" || c.hasil_rekrutmen === "Ditolak") return false;
      const ptk = ptks.find(p => p.id === c.ptk_id);
      return ptk ? getPTKStatusLowongan(ptk, candidates) === "Buka" : false;
    }).length;

    const closingRate = totalPermintaan > 0 ? ((totalDiterima / totalPermintaan) * 100).toFixed(1) : 0;
    
    // Avg Days Open for "Buka" PTKs
    const openPtks = recruiterPtks.filter(p => getPTKStatusLowongan(p, candidates) === "Buka");
    const avgDaysOpen = openPtks.length > 0 
       ? Math.round(openPtks.reduce((sum, p) => sum + (getPTKDaysOpen(p, candidates) as number), 0) / openPtks.length)
       : 0;

    const ptkAktif = recruiterPtks.filter(p => getPTKStatusComputed(p, candidates) === "Berlaku").length;

    return {
      totalPermintaan, totalDiterima, totalDitolak, totalMasihProses, closingRate, avgDaysOpen, ptkAktif
    };
  };

  return (
    <div>
      <Header title="Statistik Recruiter" />

      <div className="mb-6 flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Bulan</label>
          <select 
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="01">Januari</option>
            <option value="02">Februari</option>
            <option value="03">Maret</option>
            <option value="04">April</option>
            <option value="05">Mei</option>
            <option value="06">Juni</option>
            <option value="07">Juli</option>
            <option value="08">Agustus</option>
            <option value="09">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Tahun</label>
          <select 
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
          >
            {[...Array({length: 5})].map((_, i) => (
              <option key={i} value={parseInt(currentYear) - i}>{parseInt(currentYear) - i}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Recruiter</th>
                <th className="px-4 py-4 text-center">Permintaan<br/>Dihandle</th>
                <th className="px-4 py-4 text-center">Kandidat<br/>Diterima</th>
                <th className="px-4 py-4 text-center">Kandidat<br/>Ditolak</th>
                <th className="px-4 py-4 text-center">Masih<br/>Proses</th>
                <th className="px-4 py-4 text-center">% Closing</th>
                <th className="px-4 py-4 text-center">Avg Days Open<br/>(PTK Buka)</th>
                <th className="px-4 py-4 text-center">PTK Aktif</th>
              </tr>
            </thead>
            <tbody>
              {recruiters.map(recruiter => {
                 const stats = getRecruiterStats(recruiter);
                 return (
                   <tr key={recruiter} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-800">{recruiter}</td>
                      <td className="px-4 py-4 text-center font-medium bg-slate-50/50">{stats.totalPermintaan}</td>
                      <td className="px-4 py-4 text-center font-medium text-emerald-600">{stats.totalDiterima}</td>
                      <td className="px-4 py-4 text-center font-medium text-red-600">{stats.totalDitolak}</td>
                      <td className="px-4 py-4 text-center font-medium text-indigo-600">{stats.totalMasihProses}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${stats.closingRate}%` }} />
                           </div>
                           <span className="text-xs font-semibold">{stats.closingRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">{stats.avgDaysOpen} hari</td>
                      <td className="px-4 py-4 text-center">{stats.ptkAktif}</td>
                   </tr>
                 );
              })}
              {recruiters.length === 0 && (
                <tr>
                   <td colSpan={8} className="px-4 py-8 text-center text-slate-500">Belum ada data recruiter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
