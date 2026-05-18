"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useStore, type Candidate } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Edit, Trash2 } from "lucide-react";

export default function CandidatesPage() {
  const { ptks, candidates, sources, addCandidate, updateCandidate, deleteCandidate } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    ptk_id: "",
    nama_kandidat: "",
    no_wa_kandidat: "",
    melamar_melalui: "Internal",
    tgl_join_tolak: "",
    proses_rekrutmen: "Screening CV",
    tgl_psikotes: "",
    tgl_itw_hr: "",
    tgl_itw_user: "",
    hasil_rekrutmen: "In Progress",
    gaji_disepakati: ""
  });

  const [searchQuery, setSearchQuery] = useState("");

  const handleOpenForm = (candidate?: Candidate) => {
    if (candidate) {
      setEditingId(candidate.id);
      setFormData({
        ptk_id: candidate.ptk_id,
        nama_kandidat: candidate.nama_kandidat,
        no_wa_kandidat: candidate.no_wa_kandidat,
        melamar_melalui: candidate.melamar_melalui,
        tgl_join_tolak: candidate.tgl_join_tolak,
        proses_rekrutmen: candidate.proses_rekrutmen,
        tgl_psikotes: candidate.tgl_psikotes,
        tgl_itw_hr: candidate.tgl_itw_hr,
        tgl_itw_user: candidate.tgl_itw_user,
        hasil_rekrutmen: candidate.hasil_rekrutmen,
        gaji_disepakati: candidate.gaji_disepakati
      });
    } else {
      setEditingId(null);
      // Select the first "Buka" PTK as default if possible
      const defaultPtk = ptks.find(p => {
        const diterima = candidates.filter(c => c.ptk_id === p.id && c.hasil_rekrutmen === "Diterima").length;
        return (p.total_permintaan || 1) > diterima;
      }) || ptks[0];

      setFormData({
        ptk_id: defaultPtk?.id || "",
        nama_kandidat: "",
        no_wa_kandidat: "",
        melamar_melalui: "Internal",
        tgl_join_tolak: "",
        proses_rekrutmen: "Screening CV",
        tgl_psikotes: "",
        tgl_itw_hr: "",
        tgl_itw_user: "",
        hasil_rekrutmen: "In Progress",
        gaji_disepakati: ""
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCandidate(editingId, formData);
    } else {
      addCandidate(formData);
    }
    setIsFormOpen(false);
  };

  const getPTKName = (ptkId: string) => {
    const ptk = ptks.find(p => p.id === ptkId);
    return ptk ? `${ptk.no_ptk} - ${ptk.posisi} (${ptk.departemen})` : 'PTK Tidak Ditemukan';
  };

  // Check if selected PTK is full, disable 'Diterima' or show warning
  const selectedPtk = ptks.find(p => p.id === formData.ptk_id);
  const selectedPtkDiterima = candidates.filter(c => c.ptk_id === formData.ptk_id && c.hasil_rekrutmen === "Diterima" && c.id !== editingId).length;
  const isPtkFull = selectedPtk && selectedPtkDiterima >= (selectedPtk.total_permintaan || 1);

  const filteredCandidates = candidates.filter(c => {
    const searchLower = searchQuery.toLowerCase();
    const matchName = c.nama_kandidat?.toLowerCase().includes(searchLower);
    const matchPhone = c.no_wa_kandidat?.toLowerCase().includes(searchLower);
    return matchName || matchPhone;
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <Header title="Data Kandidat Rekrutmen" />

      <div className="flex flex-col flex-wrap gap-4 bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-[#E5E5EA]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
          <div className="flex flex-col w-full sm:w-auto">
            <h2 className="font-semibold text-[#1d1d1f] tracking-tight">Daftar Kandidat</h2>
            <p className="text-sm text-slate-500">Kelola dan lacak progress rekrutmen kandidat</p>
          </div>
          <Button onClick={() => handleOpenForm()} className="h-11 rounded-xl bg-[#007AFF] hover:bg-[#0066CC] shadow text-white px-6 w-full sm:w-auto transition-transform hover:scale-[1.02]">
            <Plus className="w-5 h-5 mr-2" />
            Tambah Kandidat
          </Button>
        </div>
        <div className="w-full">
          <Input 
            placeholder="Cari nama atau nomor WA..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-md h-11"
          />
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_16px_rgb(0,0,0,0.06)] border border-[#E5E5EA]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-[#1d1d1f] tracking-tight">{editingId ? 'Edit Kandidat' : 'Tambah Kandidat Baru'}</h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Lowongan (PTK)</label>
              <select 
                required
                className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                value={formData.ptk_id} 
                onChange={e => setFormData({...formData, ptk_id: e.target.value, hasil_rekrutmen: isPtkFull && formData.hasil_rekrutmen === 'Diterima' ? 'In Progress' : formData.hasil_rekrutmen})}
              >
                <option value="" disabled>-- Pilih PTK --</option>
                {ptks.map(ptk => {
                  const ptkDiterima = candidates.filter(c => c.ptk_id === ptk.id && c.hasil_rekrutmen === "Diterima").length;
                  const isPtkItemFull = ptkDiterima >= (ptk.total_permintaan || 1);
                  return (
                    <option key={ptk.id} value={ptk.id}>
                      {ptk.no_ptk} - {ptk.posisi} - {ptk.departemen} {isPtkItemFull ? '(PENUH)' : ''}
                    </option>
                  )
                })}
              </select>
              {isPtkFull && (
                <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Lowongan ini sudah memenuhi kuota target (&apos;Diterima&apos;). Anda tidak dapat mengubah status menjadi &apos;Diterima&apos;.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kandidat</label>
              <Input required value={formData.nama_kandidat} onChange={e => setFormData({...formData, nama_kandidat: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No WA Kandidat</label>
              <Input value={formData.no_wa_kandidat} onChange={e => setFormData({...formData, no_wa_kandidat: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Melamar Melalui</label>
              <select 
                className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                value={formData.melamar_melalui} 
                onChange={e => setFormData({...formData, melamar_melalui: e.target.value})}
              >
                {sources && sources.filter(s => s.status === 'Active').map(source => (
                   <option key={source.id} value={source.name}>{source.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proses Rekrutmen Terkini</label>
              <select 
                className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                value={formData.proses_rekrutmen} 
                onChange={e => setFormData({...formData, proses_rekrutmen: e.target.value})}
              >
                <option value="Screening CV">Screening CV</option>
                <option value="Psikotes">Psikotes</option>
                <option value="Interview HR">Interview HR</option>
                <option value="Interview User">Interview User</option>
                <option value="Offering Letter">Offering Letter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasil Rekrutmen</label>
              <select 
                className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:bg-slate-100"
                value={formData.hasil_rekrutmen} 
                onChange={e => setFormData({...formData, hasil_rekrutmen: e.target.value})}
              >
                <option value="In Progress">In Progress</option>
                <option value="Diterima" disabled={isPtkFull}>Diterima {isPtkFull ? '(Kuota Penuh)' : ''}</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tgl Join / Tolak</label>
              <Input type="date" value={formData.tgl_join_tolak} onChange={e => setFormData({...formData, tgl_join_tolak: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tgl Psikotes</label>
              <Input type="date" value={formData.tgl_psikotes} onChange={e => setFormData({...formData, tgl_psikotes: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tgl Interview HR</label>
              <Input type="date" value={formData.tgl_itw_hr} onChange={e => setFormData({...formData, tgl_itw_hr: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tgl Interview User</label>
              <Input type="date" value={formData.tgl_itw_user} onChange={e => setFormData({...formData, tgl_itw_user: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gaji Disepakati</label>
               <Input type="text" value={formData.gaji_disepakati} onChange={e => setFormData({...formData, gaji_disepakati: e.target.value})} />
            </div>

            <div className="lg:col-span-3 pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
              <Button type="submit">Simpan Kandidat</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-[#E5E5EA] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-[#E5E5EA]">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Nama Kandidat</th>
                <th className="px-6 py-3 whitespace-nowrap">WA / Sumber</th>
                <th className="px-6 py-3 whitespace-nowrap">Lowongan PTK</th>
                <th className="px-6 py-3 whitespace-nowrap">Status Proses</th>
                <th className="px-6 py-3 whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{candidate.nama_kandidat}</div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                     <div className="mb-1 text-slate-700">{candidate.no_wa_kandidat || '-'}</div>
                     <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{candidate.melamar_melalui}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-xs">
                    {getPTKName(candidate.ptk_id)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800 mb-1">{candidate.proses_rekrutmen}</div>
                    <span className={`px-2.5 py-0.5 text-[11px] rounded font-semibold ${
                      candidate.hasil_rekrutmen === 'Diterima' ? 'bg-emerald-100 text-emerald-700' : 
                      candidate.hasil_rekrutmen === 'Ditolak' ? 'bg-red-100 text-red-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {candidate.hasil_rekrutmen}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleOpenForm(candidate)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                       </button>
                       <button onClick={() => deleteCandidate(candidate.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data Kandidat. Klik tombol <span className="font-semibold">Tambah Kandidat</span> untuk membuat.
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
