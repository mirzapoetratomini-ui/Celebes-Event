# Panduan Penerapan (Deployment Guide) Celebes Event ke Hosting

Aplikasi ini dibangun menggunakan **Node.js (Express + React Vite)** dengan dukungan database **MySQL / MariaDB (MySQLi)** yang siap langsung diunggah dan dijalankan di berbagai jenis hosting:

1. **cPanel Shared Hosting (Setup Node.js App)**
2. **VPS (Ubuntu / Debian / CentOS dengan Nginx & PM2)**
3. **Cloud Run / Docker Container**

---

## 1. Import Database ke MySQL Hosting (cPanel IDwebhost / phpMyAdmin)

1. Buka **phpMyAdmin** dari cPanel hosting Anda.
2. Di bilah menu sebelah kiri, klik nama database Anda: **`bergulir_celebeseventok`** (atau `bergulir_celebesevent`).
3. Klik tab **Impor / Import** di menu bagian atas.
4. Klik tombol **Choose File / Pilih File**, lalu pilih file **`database/schema.sql`** dari project ini.
5. Gulir ke bawah dan klik tombol **Kirim / Go**.
6. Status akan langsung berhasil (*sukses warna hijau*) dan seluruh tabel (`users`, `events`, `ticket_tiers`, `orders`, `tickets`, `vouchers`, `support_tickets`, `faqs`, dll) selesai dibuat.

---

## 2. Konfigurasi Environment (`.env`) di Hosting

Buat file `.env` di root direktori aplikasi hosting Anda:

```env
PORT=3000
NODE_ENV=production

# Konfigurasi Koneksi MySQL Hosting:
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=bergulir_userdb
MYSQL_PASSWORD=PasswordUserDatabaseAnda123!
MYSQL_DATABASE=bergulir_celebeseventok

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

## 4. Multi-Role Akun Resmi & Bawaan

- **Super Admin Utama (Pemilik)**: `redaksibergulircom@gmail.com` | Password: `Bergulir2026!#`
- **Super Admin Alternatif**: `admin@celebes-event.com` | Password: `demo123`
- **Kreator Event**: `kreator@celebescreative.id` | Password: `demo123`
- **Peserta / User**: `budi.santoso@gmail.com` | Password: `demo123`
- Tersedia form pendaftaran mandiri calon kreator & fitur persetujuan instan di Super Admin.
