# 💰 Cuan Cuy — Platform Manajemen & Keuntungan Bisnis

Aplikasi web modern untuk mencatat modal, stok, penjualan, dan keuntungan bisnis reselling secara real-time.

---

## 🚀 Pilihan Cara Hosting / Deploy

Aplikasi ini sudah **100% siap di-hosting** di berbagai platform cloud gratis:

### Opsi 1: Deploy di Vercel (Sangat Direkomendasikan ⭐)
1. Buat akun di [vercel.com](https://vercel.com).
2. Hubungkan akun GitHub Anda dan pilih repository **Web Hitung JB Barang**.
3. Vercel akan otomatis mendeteksi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. *(Opsional)* Jika ingin memakai database Supabase, masukkan **Environment Variables**:
   - `VITE_SUPABASE_URL` = URL project Supabase Anda
   - `VITE_SUPABASE_ANON_KEY` = Anon Key Supabase Anda
5. Klik **Deploy**! Web Anda langsung online dengan domain gratis `*.vercel.app`.

---

### Opsi 2: Deploy di Netlify
1. Buat akun di [netlify.com](https://netlify.com).
2. Klik **Add new site** → **Import an existing project** → pilih GitHub repo.
3. Atur build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. File `public/_redirects` sudah otomatis disiapkan agar tidak terjadi error 404 saat refresh halaman.
5. Klik **Deploy Cuan Cuy**.

---

### Opsi 3: Deploy Manual (Upload File ZIP ke Hosting cPanel / Shared Hosting)
1. Jalankan perintah di komputer Anda:
   ```bash
   npm run build
   ```
2. Buka folder `dist/`.
3. Kompres seluruh isi folder `dist/` menjadi `.zip` lalu upload ke folder `public_html` di cPanel hosting Anda.

---

## 🗄️ Menghubungkan Database Supabase (Opsional)

Aplikasi Cuan Cuy memiliki **2 Mode Operasi**:
1. **Mode Standalone (Otomatis)**: Jika `.env` tidak diisi, web otomatis berjalan menggunakan *LocalStorage browser* (aman, cepat, tanpa setup database).
2. **Mode Supabase Cloud**: Jika ingin sinkronisasi multi-perangkat dan multi-user:
   1. Buat project baru di [supabase.com](https://supabase.com).
   2. Buka menu **SQL Editor** di Supabase.
   3. Copy seluruh isi file `supabase/migration.sql` dan paste ke SQL Editor, lalu klik **Run**.
   4. Copy **Project URL** dan **Anon API Key** dari menu *Project Settings -> API*.
   5. Masukkan ke file `.env` di komputer Anda atau di pengaturan Environment Variables hosting:
      ```env
      VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
      VITE_SUPABASE_ANON_KEY=eyJh...
      ```

---

## 💻 Menjalankan Secara Lokal di Komputer

```bash
# 1. Install dependencies (jika belum)
npm install

# 2. Jalankan server lokal
npm run dev
```

Buka di browser: **[http://localhost:5174/](http://localhost:5174/)**
- **Username bawaan**: `feyy`
- **Password bawaan**: `faith12345`
