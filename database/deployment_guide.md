# Panduan Penerapan (Deployment Guide) Celebes Event ke Hosting

Aplikasi ini dibangun menggunakan **Node.js (Express + React Vite)** dengan dukungan database **MySQL / MariaDB (MySQLi)** yang siap langsung diunggah dan dijalankan di berbagai jenis hosting:

1. **cPanel Shared Hosting (Setup Node.js App)**
2. **VPS (Ubuntu / Debian / CentOS dengan Nginx & PM2)**
3. **Cloud Run / Docker Container**

---

## 1. Import Database ke MySQL Hosting

1. Masuk ke **cPanel** hosting Anda.
2. Buka menu **MySQL Databases**:
   - Buat database baru, contoh: `u1234_celebesevent`
   - Buat user database baru, contoh: `u1234_dbuser` dan masukkan password kuat.
   - Tambahkan user ke database dengan mencentang **ALL PRIVILEGES**.
3. Buka **phpMyAdmin** dari cPanel.
4. Pilih database `u1234_celebesevent` di sebelah kiri.
5. Klik tab **Import** di bagian atas, pilih file `database/schema.sql`, lalu klik **Go / Kirim**.
6. Semua tabel (`users`, `events`, `ticket_tiers`, `orders`, `tickets`, dll) beserta data awal akan selesai dibuat secara otomatis.

---

## 2. Konfigurasi Environment (`.env`) di Hosting

Buat file `.env` di root direktori hosting Anda dengan konfigurasi MySQL yang telah dibuat:

```env
PORT=3000
NODE_ENV=production

# Konfigurasi Koneksi MySQL Hosting
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=u1234_dbuser
MYSQL_PASSWORD=PasswordKalianYangKuat123!
MYSQL_DATABASE=u1234_celebesevent

# URL Domain Anda
APP_URL=https://nama-domain-anda.com
```

---

## 3. Langkah Deploy di cPanel (Node.js Selector)

1. Buka menu **Setup Node.js App** di cPanel.
2. Klik **Create Application**:
   - **Node.js version**: Pilih versi `18.x`, `20.x`, atau `22.x`.
   - **Application mode**: `Production`.
   - **Application root**: `public_html` atau subfolder misal `celebesapp`.
   - **Application URL**: Pilih domain atau subdomain Anda.
   - **Application startup file**: `server.ts` atau `dist/server.js`.
3. Upload seluruh file project (kecuali folder `node_modules` untuk menghemat kuota upload).
4. Di halaman Setup Node.js App, klik tombol **Run NPM Install**.
5. Jalankan perintah build:
   ```bash
   npm run build
   ```
6. Klik **Restart Application**. Website Anda langsung online!

---

## 4. Multi-Role Akun Bawaan untuk Uji Coba

- **Super Admin**: `admin@celebes-event.com` | Password: `demo123`
- **Kreator Event**: `kreator@celebescreative.id` | Password: `demo123`
- **Peserta / User**: `budi.santoso@gmail.com` | Password: `demo123`
- Tersedia tombol **Role Switcher** instan pada menu navigasi untuk mencoba semua hak akses tanpa repot login ulang.
