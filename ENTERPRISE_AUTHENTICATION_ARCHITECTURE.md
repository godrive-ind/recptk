# Enterprise-Grade Authentication Architecture (PHP/Laravel & MySQL)

Dokumen ini berisi rancangan lengkap MVP authentication system untuk aplikasi skala enterprise menggunakan stack PHP/Laravel dan MySQL/MariaDB yang siap di-deploy ke Shared Hosting cPanel maupun VPS.

## 1. STRUKTUR DATABASE (DDL)

```sql
-- Tabel Users
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('Super Admin', 'Admin', 'HR', 'Manager', 'User') DEFAULT 'User',
    status ENUM('Active', 'Inactive', 'Banned') DEFAULT 'Active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_username (username),
    INDEX idx_role_status (role, status)
);

-- Tabel Login Logs (Audit Trail)
CREATE TABLE login_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    username VARCHAR(50) NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    ip_address VARCHAR(45) NULL,
    browser VARCHAR(50) NULL,
    device VARCHAR(50) NULL,
    os VARCHAR(50) NULL,
    login_status ENUM('Success', 'Failed') NOT NULL,
    failed_reason TEXT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_login_time (login_time)
);

-- Tabel Password Resets
CREATE TABLE password_resets (
    email VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);
```

## 2. SYSTEM ARCHITECTURE & FOLDER STRUCTURE (LARAVEL)

```text
app/
├── Http/
│   ├── Controllers/
│   │   └── Auth/
│   │       ├── LoginController.php (Validasi, Auth::attempt, Log Insert)
│   │       ├── ResetPasswordController.php
│   │       └── UserController.php (CRUD User Management)
│   ├── Middleware/
│   │   ├── CheckRole.php (Role-based access control)
│   │   ├── AutoLogoutIdle.php (Session timeout)
│   │   └── ThrottleLogins.php (Anti brute-force)
│   └── Requests/
│       └── Auth/
│           └── LoginRequest.php (Sanitisasi & Validasi XSS/SQLi)
├── Models/
│   ├── User.php
│   └── LoginLog.php
└── Services/
    └── AuthService.php (Clean architecture, pemisahan logic dari controller)
```

## 3. IMPLEMENTASI BACKEND AUTH FLOW (LARAVEL)

### Controller Login
Menangani proses autentikasi, logging, dan perlindungan brute-force.

```php
<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\LoginLog;
use App\Models\User;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validation & CSRF Protection
        $credentials = $request->validate([
            'username' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string'],
        ]);

        $ip = $request->ip();
        $agent = $request->userAgent();

        // 2. Authentication (Bcrypt Hash)
        if (Auth::attempt(['username' => $credentials['username'], 'password' => $credentials['password'], 'status' => 'Active'], $request->boolean('remember'))) {
            $request->session()->regenerate(); // 3. Session Regeneration (Prevent Session Fixation)
            
            $user = Auth::user();
            $user->update(['last_login' => now()]);

            // 4. Log Success
            $this->logActivity($user->id, $user->username, 'Success', null, $ip, $agent);

            return redirect()->intended('/dashboard');
        }

        // 5. Log Failed Attempt
        $this->logActivity(null, $credentials['username'], 'Failed', 'Invalid credentials or inactive account.', $ip, $agent);

        // Hidden sensitive error message
        return back()->withErrors([
            'username' => 'Identitas kredensial tidak ditemukan atau salah.',
        ])->onlyInput('username');
    }

    public function logout(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            LoginLog::where('user_id', $user->id)
                    ->whereNull('logout_time')
                    ->latest()
                    ->first()
                    ?->update(['logout_time' => now()]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function logActivity($userId, $username, $status, $reason, $ip, $agent)
    {
        // Parsing Browser, OS, Device bisa menggunakan library jenssegers/agent
        LoginLog::create([
            'user_id' => $userId,
            'username' => $username,
            'ip_address' => $ip,
            'user_agent_full' => $agent, // Disimpan dalam backend processing queue jika perlu performa optimal
            'login_status' => $status,
            'failed_reason' => $reason
        ]);
    }
}
```

## 4. KEAMANAN SYSTEM (SECURITY BEST PRACTICES)

1. **Password Hashing**: Menggunakan Algoritma Bcrypt (Standard Laravel). Jangan pernah menggunakan MD5/SHA256 untuk password.
2. **Anti Brute-Force**: Laravel Rate Limiting (Maksimal 5x percobaan dalam 1 menit). Akun akan di-*lock* sementara jika terlalu sering gagal.
3. **Session Management**: Session di-*regenerate* saat login untuk menghindari pembajakan (Session Fixation). Auto-logout idle (dibangun di middleware) akan memutus session jika user tidak aktif > 30 menit.
4. **SQL Injection & XSS**: Menggunakan PDO Binding/ORM Eloquent. Dilarang keras merangkai raw SQL query dari input user. Validasi diatur ketat di Request Class.

## 5. MIDDLEWARE UNTUK ROLE SYSTEM

```php
<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!Auth::check() || !in_array(Auth::user()->role, $roles)) {
            abort(403, 'Akses Ditolak: Anda tidak memiliki izin untuk halaman ini.');
        }
        return $next($request);
    }
}
```
**Penggunaan di Route:**
```php
Route::middleware(['auth', 'role:HR,Admin,Super Admin'])->group(function () {
    Route::get('/ptk-management', [PTKController::class, 'index']);
});
```

---
*Catatan: Dokumen di atas mewakili blueprint arsitektur (PHP/MySQL) yang Anda minta. Untuk aplikasi React/Next.js real-time preview kita saat ini, UI authentication diganti secara fungsional untuk mendukung flow Username/Password secara modern.*
