"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { useStore, MasterItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Edit, Trash2 } from "lucide-react";

type MasterType = 'departments' | 'recruiters' | 'pics' | 'reasons' | 'sources';

export default function MasterDataPage() {
  const store = useStore();
  const [activeTab, setActiveTab] = useState<MasterType>('departments');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', status: 'Active' as 'Active' | 'Inactive' });

  const tabs: { id: MasterType, label: string }[] = [
    { id: 'departments', label: 'Master Department' },
    { id: 'recruiters', label: 'Master Recruiter' },
    { id: 'pics', label: 'Master PIC/User' },
    { id: 'reasons', label: 'Master Alasan PTK' },
    { id: 'sources', label: 'Master Sumber Kandidat' },
  ];

  const currentData = store[activeTab];

  const handleOpenForm = (item?: MasterItem) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ name: item.name, status: item.status });
    } else {
      setEditingId(null);
      setFormData({ name: '', status: 'Active' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      store.updateMasterData(activeTab, editingId, formData.name, formData.status);
    } else {
      store.addMasterData(activeTab, formData.name);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data "${name}"?`)) {
      store.deleteMasterData(activeTab, id);
    }
  };

  return (
    <div>
      <Header title="Master Data Management" />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                  : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="font-semibold text-slate-800 tracking-tight">Daftar {tabs.find(t => t.id === activeTab)?.label}</h2>
          <p className="text-sm text-slate-500">Kelola opsi dropdown untuk formulir PTK</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Data
        </Button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
           <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">{editingId ? 'Edit Data' : 'Tambah Data Baru'}</h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-4">
             <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Field</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Masukkan nama..." />
             </div>
             {editingId && (
               <div className="w-full sm:w-48">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                <select 
                  className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2" 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})}
                >
                  <option value="Active">Aktif</option>
                  <option value="Inactive">Nonaktif</option>
                </select>
               </div>
             )}
             <Button type="submit" className="w-full sm:w-auto h-10">
               Simpan
             </Button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">No</th>
                <th className="px-6 py-3 whitespace-nowrap">Nama / Label</th>
                <th className="px-6 py-3 whitespace-nowrap">Status</th>
                <th className="px-6 py-3 whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap w-16 text-slate-500 font-medium">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
                      item.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleOpenForm(item)} className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-200 shadow-sm" title="Edit">
                        <Edit className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDelete(item.id, item.name)} className="p-2 text-red-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-red-200 shadow-sm" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data master {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}.
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
