"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import ExcelJS from "exceljs";

type ExcelRow = Record<string, string | number | boolean | null>;

const normalizeCell = (value: ExcelJS.CellValue) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value && typeof value === 'object' && 'text' in value) return value.text;
  if (value && typeof value === 'object' && 'result' in value) return String(value.result ?? '');
  return value as string | number | boolean | null;
};

export default function ImportPage() {
  const { importExcelData } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, ExcelRow[]> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setImportStatus("idle");
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        const result: Record<string, ExcelRow[]> = {};

        workbook.worksheets.forEach((worksheet) => {
          const headers: string[] = [];
          const rows: ExcelRow[] = [];
          worksheet.eachRow((row, rowNumber) => {
            const values = row.values as ExcelJS.CellValue[];
            if (rowNumber === 1) {
              values.slice(1).forEach((value) => headers.push(String(normalizeCell(value) || '').trim()));
              return;
            }

            const objectRow: ExcelRow = {};
            values.slice(1).forEach((value, index) => {
              const header = headers[index];
              if (header) objectRow[header] = normalizeCell(value);
            });
            if (Object.keys(objectRow).length > 0) rows.push(objectRow);
          });
          if (rows.length) result[worksheet.name] = rows;
        });
        
        setPreview(result);
      } catch (err) {
        setImportStatus("error");
        setStatusMessage("Gagal membaca file Excel. Pastikan format sesuai.");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = () => {
    if (!preview) return;
    setIsImporting(true);
    
    try {
      const ptkSheet = preview["Rekap PTK"] || preview["PTK"] || preview["ptk"] || Object.values(preview)[0] || [];
      // In their Excel, PTK and candidates are mostly blended or on "Rekap PTK"
      // We will just do best effort here.
      
      const newPtks = ptkSheet.map((row) => ({
        no_ptk: String(row["NO PTK"] || row.no_ptk || ""),
        posisi: String(row["POSISI"] || row.posisi || "Unknown"),
        jabatan: String(row["JABATAN LEVEL"] || row.jabatan || "-"),
        departemen: String(row["DEPARTEMEN"] || row.departemen || "-"),
        kontrak: String(row["KONTRAK"] || row.kontrak || "Bulanan"),
        alasan: String(row["ALASAN"] || row.alasan || "-"),
        pic: String(row["PIC / USER"] || row.pic || "-"),
        sdm_digantikan: String(row["NAMA SDM DIGANTIKAN"] || row.sdm_digantikan || "-"),
        nik_digantikan: String(row["NIK DIGANTIKAN"] || row.nik_digantikan || ""),
        tgl_keluar_mutasi: String(row["TGL KELUAR / MUTASI"] || row.tgl_keluar_mutasi || ""),
        keterangan_alasan: String(row["KETERANGAN ALASAN"] || row.keterangan_alasan || ""),
        recruiter: String(row["RECRUITER"] || row.recruiter || "-"),
        gaji_ditawarkan: String(row["GAJI DITAWARKAN"] || row.gaji_ditawarkan || ""),
        tgl_ptk_masuk: String(row["TGL PTK MASUK"] || row.tgl_ptk_masuk || new Date().toISOString().split('T')[0]),
        tgl_acc_ptk: String(row["TGL ACC PTK"] || row.tgl_acc_ptk || new Date().toISOString().split('T')[0]),
        total_permintaan: parseInt(String(row["TOTAL PERMINTAAN"] || row.total_permintaan || "1")) || 1
      }));

      // Candidate parsing from the same Rekap PTK sheet usually goes line by line
      const newCandidates = ptkSheet.filter((row) => row["NAMA KANDIDAT"] || row.nama_kandidat).map((row) => ({
        ptk_id: "auto-mapped", 
        nama_kandidat: String(row["NAMA KANDIDAT"] || row.nama_kandidat || "Unknown"),
        no_wa_kandidat: String(row["NO WA KANDIDAT"] || row.no_wa_kandidat || ""),
        melamar_melalui: String(row["MELAMAR MELALUI"] || row.melamar_melalui || "Unknown"),
        tgl_join_tolak: String(row["TGL JOIN / TOLAK"] || row.tgl_join_tolak || ""),
        proses_rekrutmen: String(row["PROSES REKRUTMEN"] || row.proses_rekrutmen || "Screening"),
        tgl_psikotes: String(row["TGL PSIKOTES"] || row.tgl_psikotes || ""),
        tgl_itw_hr: String(row["TGL ITW HR"] || row.tgl_itw_hr || ""),
        tgl_itw_user: String(row["TGL ITW USER"] || row.tgl_itw_user || ""),
        hasil_rekrutmen: String(row["HASIL REKRUTMEN"] || row.hasil_rekrutmen || "In Progress"),
        gaji_disepakati: String(row["GAJI DISEPAKATI"] || row.gaji_disepakati || "")
      }));

      importExcelData(newPtks, newCandidates);
      
      setImportStatus("success");
      setStatusMessage(`Berhasil menginisiasi import! ${newPtks.length} PTK dan ${newCandidates.length} Kandidat ditambahkan.`);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setImportStatus("error");
      setStatusMessage("Terjadi kesalahan saat meng-import struktur data.");
    } finally {
        setIsImporting(false);
    }
  };

  return (
    <div>
      <Header title="Import Data Excel" />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-3xl">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Upload File Excel (.xlsx)</h2>
          <p className="text-slate-500 text-sm">
            Sistem akan membaca Sheets bernama &quot;Rekap PTK&quot;. 
            Pastikan kolom Excel mengikuti format yang benar untuk No PTK, dsb.
          </p>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Pilih atau Drag & Drop file Excel</h3>
          <p className="text-sm text-slate-500 mb-6">Maksimal ukuran file 10MB</p>
          
          <label className="cursor-pointer">
            <Button asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Pilih File Excel
              </span>
            </Button>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </label>
        </div>

        {importStatus === "success" && (
           <div className="mt-6 p-4 bg-emerald-50 text-emerald-800 rounded-lg flex items-start gap-3 border border-emerald-200">
             <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
             <div>{statusMessage}</div>
           </div>
        )}
        
        {importStatus === "error" && (
           <div className="mt-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-start gap-3 border border-red-200">
             <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
             <div>{statusMessage}</div>
           </div>
        )}

        {preview && file && importStatus !== "success" && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-slate-800 mb-4">Preview Data: {file.name}</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto bg-slate-50 p-4 rounded-lg border border-slate-200">
               {Object.keys(preview).map(sheetName => (
                 <div key={sheetName}>
                   <h4 className="font-medium text-slate-700 bg-slate-200 px-3 py-1 rounded-md inline-block text-xs mb-2">Sheet: {sheetName}</h4>
                   <pre className="text-xs font-mono text-slate-600 bg-white p-3 border border-slate-200 rounded">
                     {JSON.stringify(preview[sheetName].slice(0, 3), null, 2)}
                     {preview[sheetName].length > 3 && `\n\n... dan ${preview[sheetName].length - 3} data lainnya`}
                   </pre>
                 </div>
               ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setFile(null); setPreview(null); }}>Batal</Button>
              <Button onClick={handleImport} disabled={isImporting}>
                 {isImporting ? "Mengimpor..." : "Import ke Database"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
