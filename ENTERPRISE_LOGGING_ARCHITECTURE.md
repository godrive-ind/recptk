# Enterprise-Grade Activity Logging & Audit Trail Architecture

Dokumen ini berisi rancangan arsitektur database dan sistem untuk fitur Activity Logging skala enterprise menggunakan stack PHP Native/Laravel dan MySQL/MariaDB.

## 1. STRUKTUR DATABASE SQL (DDL)

Untuk skalabilitas besar (Big Data) pada MySQL, sangat direkomendasikan memecah tabel menggunakan skema modular atau teknik partisi. Berikut adalah rancangan `activity_logs` menggunakan strategi single-table dengan partisi (berdasarkan periode), dan struktur JSON untuk data dinamis.

```sql
-- Membuat tabel activity_logs dengan partisi bulanan
CREATE TABLE activity_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    user_name VARCHAR(100) NULL,
    role VARCHAR(50) NULL,
    
    activity_type VARCHAR(50) NOT NULL COMMENT 'LOGIN, CRUD, EXPORT, dsb',
    module VARCHAR(100) NOT NULL COMMENT 'Nama modul, misal: Recruitment, Employee',
    action VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, VIEW',
    description TEXT NULL COMMENT 'Deskripsi detail aktivitas',
    
    old_data JSON NULL COMMENT 'Snapshot data sebelum diubah',
    new_data JSON NULL COMMENT 'Snapshot data setelah diubah',
    
    ip_address VARCHAR(45) NULL,
    device VARCHAR(50) NULL,
    browser VARCHAR(50) NULL,
    os VARCHAR(50) NULL,
    user_agent TEXT NULL,
    
    request_url VARCHAR(255) NULL,
    http_method VARCHAR(10) NULL,
    response_status INT NULL,
    session_id VARCHAR(100) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id, created_at),
    
    -- Foreign key opsional (bisa dilepas jika database displit secara microservice)
    INDEX idx_user_id (user_id),
    INDEX idx_activity (activity_type, module, action),
    INDEX idx_created_at (created_at)
) 
PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p202605 VALUES LESS THAN (UNIX_TIMESTAMP('2026-06-01 00:00:00')),
    PARTITION p202606 VALUES LESS THAN (UNIX_TIMESTAMP('2026-07-01 00:00:00')),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

### Penjelasan Desain Database:
1. **JSON Field**: Kolom `old_data` dan `new_data` menggunakan JSON memungkinkan skema dinamis untuk berbagai tabel tanpa membuat tabel log terpisah.
2. **Partitioning**: Tabel dipartisi berdasar waktu (`created_at`). Membantu menghapus data log lama dengan efisien (`DROP PARTITION`) ketimbang `DELETE` yang memakan memori.
3. **Indexing**: Indeks pada `created_at`, `user_id`, dan komposit `activity_type, module, action` untuk analytics yang efisien (Dashboard).

## 2. AUTO LOGGING SYSTEM (LARAVEL)

Kita menggunakan **Middleware** dan **Trait/Observer** (Eloquent) di Laravel untuk otomatis merespon CRUD dan HTTP Request.

### A. Trait Model (Auto CRUD Logging)
Gunakan *Observer pattern* di model.
```php
<?php
namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

trait AutoLoggable
{
    public static function bootAutoLoggable()
    {
        static::created(function ($model) {
            self::logActivity('CREATE', null, $model->toArray(), $model);
        });

        static::updated(function ($model) {
            self::logActivity('UPDATE', $model->getOriginal(), $model->getChanges(), $model);
        });

        static::deleted(function ($model) {
            self::logActivity('DELETE', $model->toArray(), null, $model);
        });
    }

    protected static function logActivity($action, $oldData, $newData, $model)
    {
        ActivityLog::create([
            'user_id'       => Auth::id() ?? null,
            'user_name'     => Auth::user()->name ?? 'System',
            'role'          => Auth::user()->role ?? 'System',
            'activity_type' => 'CRUD',
            'module'        => class_basename($model),
            'action'        => $action,
            'description'   => "User performed $action on " . class_basename($model),
            'old_data'      => $oldData ? json_encode($oldData) : null,
            'new_data'      => $newData ? json_encode($newData) : null,
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
            'request_url'   => request()->fullUrl(),
            'http_method'   => request()->method(),
            'created_at'    => now(),
        ]);
    }
}
```

Implementasi di Model:
```php
class Employee extends Model {
    use AutoLoggable;
}
```

### B. Middleware Automation (Route Logging)
Akan melacak Login, API Request, dan error.
```php
<?php
namespace App\Http\Middleware;

use Closure;
use App\Models\ActivityLog;

class RequestLogger
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        // Lempar logging ke Queue / Job agar tidak membebani response time!
        dispatch(new \App\Jobs\ProcessActivityLog(
            $request->all(),
            $request->ip(),
            $response->status(),
            auth()->user()
        ));

        return $response;
    }
}
```

## 3. STRATEGI & BEST PRACTICES

1. **Gunakan Asynchronous Queue (Job)**: Agar UX tetap cepat, insert data log dilemparkan ke background processing menggunakan Redis/Database queue Laravel, khususnya pada spek hosting RAM 3GB.
2. **Modular vs Single Table**: Gunakan **Single Table dengan Partitioning**. Secara administrasi sangat efisien. Modular table hanya diperlukan jika volume data mencapai milyaran row.
3. **Retention & Backup (Archiving)**: 
    - Simpan log aktif selama 6-12 bulan. 
    - Buat *Cron Job (Task Scheduler)* yang memindahkan log lebih dari 1 tahun ke database/tabel arsip `activity_logs_archive` lalu hapus menggunakan `ALTER TABLE activity_logs DROP PARTITION p202X`.
4. **Keamanan (Security)**:
    - Immutable Audit: Pastikan user database PHP tidak memiliki hak `UPDATE` dan `DELETE` pada tabel `activity_logs` (Gunakan GRANT privilege khusus).
    - Sensitif Data (Password, Token) harus di *unset/masking* sebelum log disimpan ke JSON.
5. **Fail-Safe**:
    - Bungkus AutoLoggable ke dalam blok `try...catch`. Jika gagal mencatat, JANGAN membunuh sistem utamanya. Tulis *fallback* ke `Log::error` Laravel (File logger).

## 4. ANALYTICS & DASHBOARD (QUERY)

**Contoh Query Analytics:**
```sql
-- Statistik aktivitas login berhasil vs gagal harian
SELECT 
    DATE(created_at) as date,
    action,
    COUNT(id) as total
FROM activity_logs 
WHERE module = 'Auth' 
GROUP BY DATE(created_at), action;

-- 10 User Paling Aktif Bulan Ini
SELECT user_name, COUNT(id) as actions_count 
FROM activity_logs 
WHERE created_at >= NOW() - INTERVAL 1 MONTH
GROUP BY user_id 
ORDER BY actions_count DESC 
LIMIT 10;
```
