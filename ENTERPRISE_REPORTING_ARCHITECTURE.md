# Enterprise Reporting Architecture (PDF & Excel)

Dokumen ini berisi rancangan arsitektur database dan sistem (Backend, REST API, Queue) untuk fitur Export Laporan Bulanan berstandar ISO/Corporate pada stack PHP/Laravel.

## 1. STRUKTUR DATABASE (DDL)

```sql
-- Tabel untuk tracking riwayat export (berguna jika dilakukan secara Asynchronous/Queue)
CREATE TABLE report_exports (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    report_type VARCHAR(50) NOT NULL COMMENT 'Bulanan, Mingguan, dll',
    file_type ENUM('PDF', 'EXCEL') NOT NULL,
    filter_json JSON NULL COMMENT 'Menyimpan State Filter yg digunakan',
    generated_file VARCHAR(255) NULL COMMENT 'Path S3 / Storage',
    status ENUM('Pending', 'Processing', 'Completed', 'Failed') DEFAULT 'Pending',
    generated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status)
);
```

## 2. BACKEND ARCHITECTURE (Laravel)

### Library yang Direkomendasikan
1. **PDF**: `barryvdh/laravel-dompdf` atau `spatie/laravel-pdf` (untuk performa Puppeteer/Chromium backend).
2. **Excel**: `maatwebsite/excel` (Laravel Excel).

### Pola Eksekusi (Queue vs Synchronous)
Jika Laporan Bulanan mencakup ratusan row, kita bisa langsung `stream` (Synchronous). Namun jika data ribuan atau Excel memiliki analytic yang berat, kita wajib menggunakan **Asynchronous Queue**.

**Controller (Asynchronous Request):**
```php
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ReportExport;
use App\Jobs\GenerateMonthlyReportJob;

class ReportController extends Controller
{
    public function exportMonthly(Request $request)
    {
        $filteredData = $request->only(['month', 'year', 'department', 'recruiter']);
        $fileType = $request->input('file_type', 'PDF'); // 'PDF' or 'EXCEL'

        // 1. Create Pending Record
        $exportLog = ReportExport::create([
            'user_id' => auth()->id(),
            'report_type' => 'Bulanan',
            'file_type' => $fileType,
            'filter_json' => json_encode($filteredData),
            'status' => 'Pending',
        ]);

        // 2. Dispatch Job to Queue (Beanstalkd / Redis)
        GenerateMonthlyReportJob::dispatch($exportLog, $filteredData);

        return response()->json([
            'success' => true,
            'message' => 'Laporan sedang diproses. Silakan kembali beberapa saat lagi.',
            'export_id' => $exportLog->id
        ]);
    }
}
```

### Laravel Excel Implementation Example
Menggunakan implementasi format enterprise yang rapi:
```php
namespace App\Exports;

use App\Models\Ptk;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class MonthlyPtkExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize
{
    protected $filters;

    public function __construct($filters) {
        $this->filters = $filters;
    }

    public function collection() {
        return Ptk::with('candidates')->whereMonth('tgl_ptk_masuk', $this->filters['month'])->get();
    }

    public function headings(): array {
        return ['No PTK', 'Departemen', 'Jabatan', 'Recruiter', 'Kandidat Masuk', 'Status'];
    }

    public function styles(Worksheet $sheet) {
        return [
            1 => ['font' => ['bold' => true, 'size' => 12]], // Styling Header
        ];
    }
}
```

## 3. ISO / CORPORATE REPORT STANDARD

Laporan (utamanya PDF) wajib mematuhi kaidah _Controlled Document_ jika digunakan pada level Enterprise/Manufacturing:
1. **Document Control Block**: Nomor Dokumen, Revisi, Tanggal Revisi/Cetak. Biasanya diletakkan di sudut kanan atas.
2. **Approval Signatures**: "Disiapkan Oleh (Recruiter)", "Diperiksa Oleh (Manager HR)", "Disetujui Oleh (Direktur)". Biasanya diletakkan di akhir dokumen.
3. **Typography**: Menggunakan font web-safe standard seperti Arial atau Helvetica. Tidak menggunakan warna mencolok; dominan Hitam, Abu-abu, dan aksen warna korporat (biru/merah).
4. **Header Konstan**: Menggunakan the `thead` tag di HTML untuk laporan PDF yang berlanjut ke halaman ke-2, agar _Table Header_ diulang secara otomatis oleh dompdf.

### Contoh HTML Header untuk DomPDF
```html
<header>
    <table width="100%" class="iso-header">
        <tr>
            <td width="20%"><img src="corporate-logo.png" /></td>
            <td width="60%" class="text-center"><h2>LAPORAN BULANAN REKRUTMEN</h2></td>
            <td width="20%" class="text-right">
                <small>Doc No: HRD-FR-022<br>Rev: 01<br>Tgl: {{ now()->format('d M Y') }}</small>
            </td>
        </tr>
    </table>
</header>
```

---
*Catatan MVP: Pada preview environment AI Studio ini, implementasi eksport PDF & Excel dilakukan secara langsung (client-side) menggunakan library javascript `jspdf`, `jspdf-autotable`, dan `xlsx` agar export bisa disimulasikan sesuai standar korporasi secara real-time.*
