"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { useStore, type PTK, getPTKCloseDate, getPTKDaysOpen, getPTKKekurangan, getPTKStatusLowongan, getPTKStatusComputed } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Edit, Trash2, Users, ArrowUpDown } from "lucide-react";

type SortField = 'no_ptk' | 'posisi' | 'kebutuhan' | 'statusPtk' | 'statusLowongan' | 'recruiter' | 'kontrak' | 'alasan';
type SortOrder = 'asc' | 'desc';

export default function PTKPage() {
  const { ptks, candidates, departments, recruiters, pics, reasons, addPTK, updatePTK, deletePTK } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  const [sortField, setSortField] = useState<SortField>('no_ptk');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({...prev, [id]: !prev[id]}));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedPtks = [...ptks].sort((a, b) => {
    let aVal: any = a[sortField as keyof typeof a];
    let bVal: any = b[sortField as keyof typeof b];

    if (sortField === 'kebutuhan') {
      aVal = a.total_permintaan;
      bVal = b.total_permintaan;
    } else if (sortField === 'statusPtk') {
      aVal = getPTKStatusComputed(a, candidates);
      bVal = getPTKStatusComputed(b, candidates);
    } else if (sortField === 'statusLowongan') {
      aVal = getPTKStatusLowongan(a, candidates);
      bVal = getPTKStatusLowongan(b, candidates);
    }

    // Default string fallback to handle empty or undefined safely
    aVal = aVal || "";
    bVal = bVal || "";

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const [formData, setFormData] = useState({
    no_ptk: "",
    posisi: "",
    jabatan: "Staff",
    departemen: "",
    kontrak: "Bulanan",
    alasan: "Penambahan",
    pic: "",
    sdm_digantikan: "",
    nik_digantikan: "",
    tgl_keluar_mutasi: "",
    keterangan_alasan: "",
    recruiter: "",
    gaji_ditawarkan: "",
    tgl_ptk_masuk: new Date().toISOString().split('T')[0],
    tgl_acc_ptk: new Date().toISOString().split('T')[0],
    total_permintaan: 1
  });

  const handleOpenForm = (ptk?: PTK) => {
    if (ptk) {
      setEditingId(ptk.id);
      setFormData({
        no_ptk: ptk.no_ptk || "",
        posisi: ptk.posisi || "",
        jabatan: ptk.jabatan || "Staff",
        departemen: ptk.departemen || "",
        kontrak: ptk.kontrak || "Bulanan",
        alasan: ptk.alasan || "Penambahan",
        pic: ptk.pic || "",
        sdm_digantikan: ptk.sdm_digantikan || "",
        nik_digantikan: ptk.nik_digantikan || "",
        tgl_keluar_mutasi: ptk.tgl_keluar_mutasi || "",
        keterangan_alasan: ptk.keterangan_alasan || "",
        recruiter: ptk.recruiter || "",
        gaji_ditawarkan: ptk.gaji_ditawarkan || "",
        tgl_ptk_masuk: ptk.tgl_ptk_masuk || new Date().toISOString().split('T')[0],
        tgl_acc_ptk: ptk.tgl_acc_ptk || new Date().toISOString().split('T')[0],
        total_permintaan: ptk.total_permintaan || 1
      });
    } else {
      setEditingId(null);
      setFormData({
        no_ptk: "",
        posisi: "",
        jabatan: "Staff",
        departemen: "",
        kontrak: "Bulanan",
        alasan: "Penambahan",
        pic: "",
        sdm_digantikan: "",
        nik_digantikan: "",
        tgl_keluar_mutasi: "",
        keterangan_alasan: "",
        recruiter: "",
        gaji_ditawarkan: "",
        tgl_ptk_masuk: new Date().toISOString().split('T')[0],
        tgl_acc_ptk: new Date().toISOString().split('T')[0],
        total_permintaan: 1
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePTK(editingId, formData);
    } else {
      addPTK(formData);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <Header title="Data Permintaan Tenaga Kerja (PTK)" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-[#E5E5EA]">
        <div className="flex flex-col w-full sm:w-auto">
          <h2 className="font-semibold text-[#1d1d1f] tracking-tight">Daftar PTK</h2>
          <p className="text-sm text-slate-500">Kelola permintaan tenaga kerja di sistem</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="h-11 rounded-xl bg-[#007AFF] hover:bg-[#0066CC] shadow text-white px-6 w-full sm:w-auto transition-transform hover:scale-[1.02]">
          <Plus className="w-5 h-5 mr-2" />
          Tambah PTK
        </Button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_16px_rgb(0,0,0,0.06)] border border-[#E5E5EA]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-[#1d1d1f] tracking-tight">{editingId ? 'Edit PTK' : 'Tambah PTK Baru'}</h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No PTK</label>
              <Input required value={formData.no_ptk} onChange={e => setFormData({...formData, no_ptk: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Posisi</label>
              <Input required value={formData.posisi} onChange={e => setFormData({...formData, posisi: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan Level</label>
              <Input required value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Departemen</label>
              <select className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2" required value={formData.departemen} onChange={e => setFormData({...formData, departemen: e.target.value})}>
                <option value="" disabled>Pilih Departemen</option>
                {departments.filter(d => d.status === 'Active').map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kontrak</label>
              <Input disabled value={formData.kontrak} onChange={e => setFormData({...formData, kontrak: e.target.value})} />
            </div>
            
            {/* START CONDITIONAL LOGIC */}
            <div className="lg:col-span-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wider">Detail Kebutuhan</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alasan</label>
                  <select className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2" required value={formData.alasan} onChange={e => setFormData({...formData, alasan: e.target.value})}>
                    <option value="" disabled>Pilih Alasan</option>
                    {reasons.filter(r => r.status === 'Active').map(reason => (
                      <option key={reason.id} value={reason.name}>{reason.name}</option>
                    ))}
                  </select>
                </div>
                
                {formData.alasan.includes("Pergantian") && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Karyawan Digantikan</label>
                      <Input required value={formData.sdm_digantikan} onChange={e => setFormData({...formData, sdm_digantikan: e.target.value})} placeholder="Nama karyawan..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">NIK Karyawan Lama</label>
                      <Input required value={formData.nik_digantikan} onChange={e => setFormData({...formData, nik_digantikan: e.target.value})} placeholder="Nomor Induk Karyawan..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Keluar / Mutasi</label>
                      <Input type="date" required value={formData.tgl_keluar_mutasi} onChange={e => setFormData({...formData, tgl_keluar_mutasi: e.target.value})} />
                    </div>
                  </>
                )}

                {formData.alasan === "Lainnya" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Alasan Lainnya</label>
                    <textarea 
                      required 
                      className="w-full flex min-h-[80px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2" 
                      value={formData.keterangan_alasan} 
                      onChange={e => setFormData({...formData, keterangan_alasan: e.target.value})} 
                      placeholder="Jelaskan alasan permintaan..."
                    />
                  </div>
                )}
              </div>
            </div>
            {/* END CONDITIONAL LOGIC */}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PIC / User</label>
              <select className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2" required value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})}>
                <option value="" disabled>Pilih PIC / User</option>
                {pics.filter(p => p.status === 'Active').map(pic => (
                  <option key={pic.id} value={pic.name}>{pic.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recruiter</label>
              <select className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2" required value={formData.recruiter} onChange={e => setFormData({...formData, recruiter: e.target.value})}>
                <option value="" disabled>Pilih Recruiter</option>
                {recruiters.filter(r => r.status === 'Active').map(recruiter => (
                  <option key={recruiter.id} value={recruiter.name}>{recruiter.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gaji Ditawarkan</label>
              <Input type="number" value={formData.gaji_ditawarkan} onChange={e => setFormData({...formData, gaji_ditawarkan: e.target.value})} placeholder="Opsional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tgl PTK Masuk</label>
              <Input type="date" required value={formData.tgl_ptk_masuk} onChange={e => setFormData({...formData, tgl_ptk_masuk: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tgl ACC PTK</label>
              <Input type="date" value={formData.tgl_acc_ptk} onChange={e => setFormData({...formData, tgl_acc_ptk: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Permintaan</label>
              <Input type="number" min="1" required value={formData.total_permintaan} onChange={e => setFormData({...formData, total_permintaan: parseInt(e.target.value) || 1})} />
            </div>
            
            <div className="lg:col-span-3 pt-4 flex justify-end gap-3 mt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
              <Button type="submit">Simpan PTK</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-[#E5E5EA] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-[#E5E5EA]">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('no_ptk')}>
                  <div className="flex items-center gap-1">No PTK <ArrowUpDown className={`w-3 h-3 ${sortField === 'no_ptk' ? 'text-indigo-600' : 'text-transparent group-hover:text-slate-400'}`} /></div>
                </th>
                <th className="px-6 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('posisi')}>
                  <div className="flex items-center gap-1">Posisi / Dept <ArrowUpDown className={`w-3 h-3 ${sortField === 'posisi' ? 'text-indigo-600' : 'text-transparent group-hover:text-slate-400'}`} /></div>
                </th>
                <th className="px-6 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('recruiter')}>
                  <div className="flex items-center gap-1">Recruiter <ArrowUpDown className={`w-3 h-3 ${sortField === 'recruiter' ? 'text-indigo-600' : 'text-transparent group-hover:text-slate-400'}`} /></div>
                </th>
                <th className="px-6 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('kontrak')}>
                  <div className="flex items-center gap-1">Kontrak & Alasan <ArrowUpDown className={`w-3 h-3 ${sortField === 'kontrak' ? 'text-indigo-600' : 'text-transparent group-hover:text-slate-400'}`} /></div>
                </th>
                <th className="px-6 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('kebutuhan')}>
                  <div className="flex items-center gap-1">Kebutuhan / Kurang <ArrowUpDown className={`w-3 h-3 ${sortField === 'kebutuhan' ? 'text-indigo-600' : 'text-transparent group-hover:text-slate-400'}`} /></div>
                </th>
                <th className="px-6 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('statusPtk')}>
                  <div className="flex items-center gap-1">Status PTK <ArrowUpDown className={`w-3 h-3 ${sortField === 'statusPtk' ? 'text-indigo-600' : 'text-transparent group-hover:text-slate-400'}`} /></div>
                </th>
                <th className="px-6 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('statusLowongan')}>
                  <div className="flex items-center gap-1">Status Lowongan <ArrowUpDown className={`w-3 h-3 ${sortField === 'statusLowongan' ? 'text-indigo-600' : 'text-transparent group-hover:text-slate-400'}`} /></div>
                </th>
                <th className="px-6 py-3 whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedPtks.map((ptk) => {
                const statusPtk = getPTKStatusComputed(ptk, candidates);
                const statusLowongan = getPTKStatusLowongan(ptk, candidates);
                const kekurangan = getPTKKekurangan(ptk, candidates);
                
                let rowColor = "border-b border-slate-100 hover:bg-slate-50 transition-colors";
                if (statusPtk === "Kadaluarsa") {
                  rowColor = "border-b border-red-100 bg-red-50 hover:bg-red-100 transition-colors";
                } else if (statusLowongan === "Tutup") {
                  rowColor = "border-b border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-colors";
                } else if (statusLowongan === "Buka") {
                  rowColor = "border-b border-amber-100 bg-amber-50/50 hover:bg-amber-100 transition-colors";
                }

                return (
                 <React.Fragment key={ptk.id}>
                  <tr className={`${rowColor} cursor-pointer`} onClick={() => toggleRow(ptk.id)}>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{expandedRows[ptk.id] ? '▼' : '▶'}</span>
                      {ptk.no_ptk}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{ptk.posisi}</div>
                    <div className="text-xs text-slate-500">{ptk.departemen} - {ptk.jabatan}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{ptk.recruiter || "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{ptk.kontrak}</div>
                    <div className="text-xs text-slate-500">{ptk.alasan}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-800 font-medium">Bth: {ptk.total_permintaan} org</div>
                    <div className="text-xs font-semibold text-slate-700">Krg: {kekurangan} org</div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wide ${
                      statusPtk === 'Berlaku' ? 'bg-indigo-100 text-indigo-700' : 
                      statusPtk === 'Selesai' ? 'bg-slate-200 text-slate-700' : 'bg-red-200 text-red-800'
                    }`}>
                      {statusPtk}
                    </span>
                    {statusLowongan === "Buka" && statusPtk !== "Selesai" && (
                       <div className="text-[10px] uppercase font-bold mt-2 text-slate-500 tracking-wider">
                         Days Open: <span className={Number(getPTKDaysOpen(ptk, candidates)) > 75 ? 'text-red-500' : 'text-slate-700'}>{getPTKDaysOpen(ptk, candidates)}</span>
                       </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-bold flex items-center w-fit gap-1 ${
                      statusLowongan === 'Buka' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
                    }`}>
                      {statusLowongan === 'Buka' ? '⚠ BUKA' : '✅ PENUH'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                       <button onClick={() => window.location.href='/candidates'} className="p-2 text-slate-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-300 shadow-sm" title="Kelola Kandidat">
                        <Plus className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleOpenForm(ptk)} className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-200 shadow-sm" title="Edit PTK">
                        <Edit className="w-4 h-4" />
                       </button>
                       <button onClick={() => deletePTK(ptk.id)} className="p-2 text-red-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-red-200 shadow-sm" title="Hapus PTK">
                        <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
                {expandedRows[ptk.id] && (
                  <tr>
                    <td colSpan={8} className="bg-slate-50 p-6 border-b border-slate-200">
                       <div className="bg-white border text-sm border-slate-200 rounded-lg shadow-sm overflow-hidden">
                         <div className="bg-slate-100 font-semibold text-slate-700 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                           <span>Kandidat untuk PTK {ptk.no_ptk} ({ptk.posisi})</span>
                           <button onClick={() => window.location.href='/candidates'} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition">Detail</button>
                         </div>
                         <div className="p-4">
                           {candidates.filter(c => c.ptk_id === ptk.id).length === 0 ? (
                             <div className="text-slate-500 text-center py-4">Belum ada kandidat.</div>
                           ) : (
                             <ul className="space-y-2">
                               {candidates.filter(c => c.ptk_id === ptk.id).map(c => (
                                 <li key={c.id} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
                                    <div>
                                      <span className="font-semibold text-slate-800">{c.nama_kandidat}</span>
                                      <span className="text-xs text-slate-500 ml-2">({c.melamar_melalui})</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-xs text-slate-600 font-medium bg-white px-2 py-1 rounded border border-slate-200">{c.proses_rekrutmen}</span>
                                      <span className={`px-2 py-0.5 text-xs rounded font-bold ${
                                        c.hasil_rekrutmen === 'Diterima' ? 'bg-emerald-100 text-emerald-700' : 
                                        c.hasil_rekrutmen === 'Ditolak' ? 'bg-red-100 text-red-700' : 
                                        'bg-blue-100 text-blue-700'
                                      }`}>
                                        {c.hasil_rekrutmen}
                                      </span>
                                    </div>
                                 </li>
                               ))}
                             </ul>
                           )}
                         </div>
                       </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              )})}
              {sortedPtks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data PTK. Klik tombol <span className="font-semibold">Tambah PTK</span> untuk membuat.
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
