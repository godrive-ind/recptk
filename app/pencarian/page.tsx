"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function PencarianPage() {
  const { ptks, candidates } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    return candidates.filter(c => 
      c.nama_kandidat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.no_wa_kandidat && c.no_wa_kandidat.includes(searchTerm))
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [candidates, searchTerm]);

  // Summarize the candidate's history
  const historySummary = useMemo(() => {
    if (searchResults.length === 0) return null;
    
    const totalLamar = searchResults.length;
    const diterima = searchResults.filter(c => c.hasil_rekrutmen === "Diterima").length;
    const ditolak = searchResults.filter(c => c.hasil_rekrutmen === "Ditolak").length;
    
    // count unique positions applied to
    const uniquePositions = new Set(
       searchResults.map(c => {
         const p = ptks.find(ptk => ptk.id === c.ptk_id);
         return p ? p.posisi : 'Unknown';
       })
    ).size;
    
    // Status Terakhir based on most recent
    const latest = searchResults[0]; // because it's sorted desc by created_at
    const statusTerakhir = latest.hasil_rekrutmen;
    
    return {
      totalLamar, diterima, ditolak, uniquePositions, statusTerakhir
    };
  }, [searchResults, ptks]);

  return (
    <div>
      <Header title="Pencarian Kandidat" />

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
        <Search className="w-5 h-5 text-slate-400" />
        <Input 
           placeholder="Cari nama kandidat atau nomor WA..." 
           className="max-w-2xl text-lg h-12"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchTerm.trim() && historySummary && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <div className="text-xs text-slate-500 font-medium mb-1">Total Lamar</div>
             <div className="text-xl font-bold text-indigo-700">{historySummary.totalLamar} kali</div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <div className="text-xs text-slate-500 font-medium mb-1">Posisi Berbeda</div>
             <div className="text-xl font-bold text-slate-800">{historySummary.uniquePositions}</div>
           </div>
           <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100">
             <div className="text-xs text-emerald-600 font-medium mb-1">Diterima</div>
             <div className="text-xl font-bold text-emerald-700">{historySummary.diterima}</div>
           </div>
           <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
             <div className="text-xs text-red-600 font-medium mb-1">Ditolak</div>
             <div className="text-xl font-bold text-red-700">{historySummary.ditolak}</div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <div className="text-xs text-slate-500 font-medium mb-1">Status Terakhir</div>
             <div className="text-lg font-bold text-slate-800">{historySummary.statusTerakhir}</div>
           </div>
        </div>
      )}

      {searchTerm.trim() && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="font-semibold text-slate-800">Riwayat Lamaran</h3>
             <span className="text-sm text-slate-500">{searchResults.length} hasil ditemukan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nama (WA)</th>
                  <th className="px-4 py-3">No PTK / Posisi</th>
                  <th className="px-4 py-3">Recruiter / Tgl PTK</th>
                  <th className="px-4 py-3">Sumber / Tgl Join</th>
                  <th className="px-4 py-3">Proses Terakhir / Hasil</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((c) => {
                  const ptk = ptks.find(p => p.id === c.ptk_id);
                  return (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{c.nama_kandidat}</div>
                        <div className="text-xs text-slate-500">{c.no_wa_kandidat || '-'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800">{ptk?.no_ptk || 'Unknown PTK'}</div>
                        <div className="text-xs text-slate-500">{ptk?.posisi} ({ptk?.departemen})</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-800">{ptk?.recruiter || '-'}</div>
                        <div className="text-xs text-slate-500">
                          {ptk?.tgl_ptk_masuk ? new Date(ptk.tgl_ptk_masuk).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                         <div className="mb-1 text-slate-700">{c.melamar_melalui}</div>
                         {c.tgl_join_tolak && <div className="text-xs text-slate-500">Tgl: {new Date(c.tgl_join_tolak).toLocaleDateString('id-ID')}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-800 mb-1">{c.proses_rekrutmen}</div>
                        <span className={`px-2.5 py-0.5 text-[11px] rounded font-semibold ${
                          c.hasil_rekrutmen === 'Diterima' ? 'bg-emerald-100 text-emerald-700' : 
                          c.hasil_rekrutmen === 'Ditolak' ? 'bg-red-100 text-red-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {c.hasil_rekrutmen}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {searchResults.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      Tidak ada data kandidat ditemukan dengan kata kunci &quot;{searchTerm}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
