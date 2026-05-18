"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useStore, getPTKStatusComputed, getPTKStatusLowongan } from "@/lib/store";
import { FileText, FileSpreadsheet, Download, Filter, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/button";

export default function LaporanPage() {
  const { ptks, candidates, departments, recruiters } = useStore();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear().toString();
  
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterDept, setFilterDept] = useState("");
  const [filterRecruiter, setFilterRecruiter] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPtks = ptks.filter(p => {
    if (!p.tgl_ptk_masuk) return false;
    const [year, month] = p.tgl_ptk_masuk.split('-');
    
    const matchMonth = year === filterYear && month === filterMonth;
    const matchDept = filterDept === "" || p.departemen === filterDept;
    const matchRecruiter = filterRecruiter === "" || p.recruiter === filterRecruiter;
    const computedStatus = getPTKStatusComputed(p, candidates);
    const matchStatus = filterStatus === "" || computedStatus === filterStatus;
    const matchSearch = p.no_ptk?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.posisi?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchMonth && matchDept && matchRecruiter && matchStatus && matchSearch;
  });

  const ptkAktifCount = filteredPtks.filter(p => getPTKStatusComputed(p, candidates) === "Berlaku").length;
  const ptkSelesaiCount = filteredPtks.filter(p => getPTKStatusComputed(p, candidates) === "Selesai").length;
  
  // Table detail for the view and export
  const exportData = filteredPtks.map((ptk, index) => {
    const cands = candidates.filter(c => c.ptk_id === ptk.id);
    const kandidatMasuk = cands.length;
    const interview = cands.filter(c => ["Psikotes", "Interview HR", "Interview User"].includes(c.proses_rekrutmen)).length;
    const diterima = cands.filter(c => c.hasil_rekrutmen === "Diterima").length;
    const reject = cands.filter(c => c.hasil_rekrutmen === "Ditolak").length;
    
    return {
      no: index + 1,
      no_ptk: ptk.no_ptk || '-',
      departemen: ptk.departemen || '-',
      posisi: ptk.posisi || '-',
      recruiter: ptk.recruiter || '-',
      kebutuhan: ptk.total_permintaan || 1,
      kandidatMasuk,
      interview,
      diterima,
      reject,
      status: getPTKStatusComputed(ptk, candidates),
      tgl_ptk: ptk.tgl_ptk_masuk || '-'
    };
  });

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Header ISO Style
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PT MANUFAKTUR ENTERPRISE TBK", 14, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Jl. Industri Raya No. 45, Jakarta", 14, 20);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN BULANAN REKRUTMEN & PTK", doc.internal.pageSize.width / 2, 35, { align: 'center' });
    
    // Document Control Block
    doc.setFontSize(8);
    const docIdText = "Doc No: HRD-FR-022";
    const revText = "Rev: 01";
    const dateText = "Date: " + new Date().toLocaleDateString();
    doc.text(docIdText, doc.internal.pageSize.width - 45, 15);
    doc.text(revText, doc.internal.pageSize.width - 45, 19);
    doc.text(dateText, doc.internal.pageSize.width - 45, 23);
    
    // Summary line
    doc.setFontSize(10);
    doc.text(`Periode: ${filterMonth}-${filterYear}  |  Departemen: ${filterDept || 'Semua'}  |  Recruiter: ${filterRecruiter || 'Semua'}`, 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['No', 'No PTK', 'Departemen', 'Posisi', 'Recruiter', 'Keb.', 'Kandidat', 'Interview', 'Diterima', 'Reject', 'Tanggal PTK', 'Status']],
      body: exportData.map(d => [
        d.no, d.no_ptk, d.departemen, d.posisi, d.recruiter, d.kebutuhan, d.kandidatMasuk, d.interview, d.diterima, d.reject, d.tgl_ptk, d.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 2 },
    });

    // Approval Section
    const finalY = (doc as any).lastAutoTable.finalY || 60;
    
    if (finalY < doc.internal.pageSize.height - 40) {
      doc.setFontSize(9);
      doc.text("Dibuat Oleh:", 40, finalY + 20);
      doc.text("_______________________", 30, finalY + 40);
      doc.text("HR / Recruiter", 43, finalY + 45);
      
      doc.text("Disetujui Oleh:", doc.internal.pageSize.width - 80, finalY + 20);
      doc.text("_______________________", doc.internal.pageSize.width - 92, finalY + 40);
      doc.text("HR Manager", doc.internal.pageSize.width - 77, finalY + 45);
    }
    
    // Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Halaman ${i} dari ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    doc.save(`Laporan_PTK_${filterYear}_${filterMonth}.pdf`);
  };

  const handleExportExcel = async () => {
    // Analytics summary
    const summaryData = [
      ["PT MANUFAKTUR ENTERPRISE TBK"],
      ["LAPORAN BULANAN REKRUTMEN & PTK"],
      ["Periode", `${filterMonth}-${filterYear}`],
      ["Departemen", filterDept || 'Semua'],
      [],
      ["SUMMARY KPI", ""],
      ["Total PTK (Filter)", filteredPtks.length],
      ["Total PTK Aktif", ptkAktifCount],
      ["Total PTK Selesai", ptkSelesaiCount],
      []
    ];

    const detailHeaders = ['No', 'No PTK', 'Departemen', 'Posisi', 'Recruiter', 'Kebutuhan', 'Kandidat Masuk', 'Interview', 'Diterima', 'Reject', 'Tgl PTK', 'Status'];
    const detailRows = exportData.map(d => [
      d.no, d.no_ptk, d.departemen, d.posisi, d.recruiter, d.kebutuhan, d.kandidatMasuk, d.interview, d.diterima, d.reject, d.tgl_ptk, d.status
    ]);
    
    const combinedData = [...summaryData, detailHeaders, ...detailRows];
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan_Bulanan");
    worksheet.addRows(combinedData);
    worksheet.columns = [
      { width: 5 }, { width: 15 }, { width: 20 }, { width: 25 }, { width: 15 },
      { width: 10 }, { width: 15 }, { width: 10 }, { width: 10 }, { width: 10 },
      { width: 15 }, { width: 15 },
    ];
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.getRow(summaryData.length + 1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Laporan_PTK_Detail_${filterYear}_${filterMonth}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <Header title="Laporan Bulanan" />

      <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-[#E5E5EA]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 font-semibold text-[#1d1d1f] mb-4 pb-3 border-b border-[#E5E5EA]">
           <Filter size={18} className="text-slate-400" /> Filter Laporan
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Bulan</label>
              <select className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-colors" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
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
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Tahun</label>
              <select className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-colors" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                {[...Array({length: 5})].map((_, i) => (
                  <option key={i} value={parseInt(currentYear) - i}>{parseInt(currentYear) - i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Departemen</label>
              <select className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-colors" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                <option value="">Semua Dept</option>
                {departments.filter(d => d.status === 'Active').map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Recruiter</label>
              <select className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-colors" value={filterRecruiter} onChange={e => setFilterRecruiter(e.target.value)}>
                <option value="">Semua Recruiter</option>
                {recruiters.filter(r => r.status === 'Active').map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Status PTK</label>
              <select className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-colors" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Semua Status</option>
                <option value="Berlaku">Berlaku</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cari Posisi/PTK</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                 </div>
                 <input type="text" className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white pl-9 pr-3 text-sm focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-colors" placeholder="Cari..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
        </div>
      </div>

      {/* Tampilan Preview dan Export Actions */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-[#E5E5EA] overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-b border-[#E5E5EA] gap-4">
           <div>
              <h3 className="font-bold text-[#1d1d1f] tracking-tight">Preview Data Export</h3>
              <p className="text-xs text-slate-500">Menampilkan {filteredPtks.length} data PTK yang sesuai dengan filter.</p>
           </div>
           <div className="flex gap-3 w-full sm:w-auto">
             <Button variant="outline" onClick={handleExportExcel} className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 w-full sm:w-auto">
               <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
             </Button>
             <Button onClick={handleExportPDF} className="rounded-xl bg-[#1d1d1f] hover:bg-slate-800 shadow-md text-white w-full sm:w-auto">
               <FileText className="w-4 h-4 mr-2 text-red-400" /> Export PDF
             </Button>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-[11px] text-slate-500 font-semibold uppercase bg-slate-50 border-b border-[#E5E5EA] tracking-wider">
              <tr>
                <th className="px-4 py-3">No PTK</th>
                <th className="px-4 py-3">Dept / Posisi</th>
                <th className="px-4 py-3">Recruiter</th>
                <th className="px-4 py-3 text-center">Keb.</th>
                <th className="px-4 py-3 text-center">Masuk</th>
                <th className="px-4 py-3 text-center">Diterima</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {exportData.slice(0, 10).map((d, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{d.no_ptk}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{d.posisi}</div>
                    <div className="text-xs text-slate-500">{d.departemen}</div>
                  </td>
                  <td className="px-4 py-3">{d.recruiter}</td>
                  <td className="px-4 py-3 text-center font-bold">{d.kebutuhan}</td>
                  <td className="px-4 py-3 text-center">{d.kandidatMasuk}</td>
                  <td className="px-4 py-3 text-center text-emerald-600 font-bold">{d.diterima}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] rounded-full uppercase font-bold tracking-widest ${
                      d.status === 'Berlaku' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
              {exportData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Tidak ada data PTK yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {exportData.length > 10 && (
            <div className="bg-slate-50 p-3 text-center text-sm text-slate-500 border-t border-slate-200">
              Menampilkan 10 dari {exportData.length} baris. Silakan export untuk melihat seluruh data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
