# Enterprise Master Data Architecture

Dokumen ini berisi rancangan arsitektur database dan sistem (Backend, REST API, Database) untuk modul Master Management dalam stack berbasis Laravel/PHP + MySQL.

## 1. DATABASE SCHEMA

### `master_departments`
```sql
CREATE TABLE master_departments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NULL UNIQUE,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    sort_order INT DEFAULT 0,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
```

### `master_recruiters`
```sql
CREATE TABLE master_recruiters (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
```

### `master_pic_users`
```sql
CREATE TABLE master_pic_users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    position VARCHAR(100) NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
```

### `master_ptk_reasons`
```sql
CREATE TABLE master_ptk_reasons (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL COMMENT 'e.g. Pergantian (EoC), Penambahan',
    requires_replacement_info BOOLEAN DEFAULT FALSE COMMENT 'Munculkan field tambahan jika true',
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    sort_order INT DEFAULT 0,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
```

*(tabel master identik lainnya seperti `master_positions`, `master_locations`, etc.)*

## 2. CRUD EXAMPLES - PHP / LARAVEL

**Contoh Model `MasterDepartment.php`:**
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\AutoLoggable; // Logging system yg direquest sebelumnya

class MasterDepartment extends Model
{
    use AutoLoggable;
    
    protected $fillable = ['name', 'code', 'status', 'sort_order', 'created_by', 'updated_by'];

    // Scopes for performance
    public function scopeActive($query) {
        return $query->where('status', 'Active')->orderBy('sort_order', 'ASC');
    }
}
```

**Controller - `MasterDepartmentController.php`:**
```php
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MasterDepartment;
use Illuminate\Support\Facades\Cache;

class MasterDepartmentController extends Controller
{
    public function index() {
        // Digunakan cache agar server optimal bila data jarang berubah
        $data = Cache::remember('master_departments_active', 3600, function () {
            return MasterDepartment::active()->get(['id', 'name', 'code']);
        });
        return response()->json(['success' => true, 'data' => $data]);
    }
    
    public function store(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:150|unique:master_departments,name',
            'status' => 'required|in:Active,Inactive'
        ]);
        
        $validated['created_by'] = auth()->id();
        $dept = MasterDepartment::create($validated);
        
        Cache::forget('master_departments_active');
        return response()->json(['success' => true, 'message' => 'Department created', 'data' => $dept]);
    }
}
```

## 3. SECURITY & PERFORMANCE

1. **Caching**: Menggunakan Redis Cache (atau file `Cache::remember`) sangat disarankan untuk master data yang dimuat berkali-kali pada dropdown PTK. Hapus cache hanya saat ada update/delete.
2. **Indexing**: B-Tree index pada field `status` karena ini selalu dipertanyakan pada dropdown form: `WHERE status = 'Active'`.
3. **Audit Trail**: Integrasikan dengan arsitektur Enterprise Logger agar tau siapa HR yang menambah jabatan/rekruiter.
4. **Soft Delete vs Status (Active/Inactive)**: Jangan gunakan `softDeletes` atau hapus fisik jika field sudah berelasi ke transaksi PTK. Gunakan status `Inactive` agar data historikal PTK lama tidak rusak ketika relasi ID dicari.

---
_Dalam MVP di project sandbox ini, sistem akan dioperasikan secara State Management lokal di Frontend sehingga master-master dapat disimulasikan sesuai target._
