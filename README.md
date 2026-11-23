# Task Manager API

REST API untuk task pribadi. Pengguna mendaftar, login dengan email dan password, lalu memakai satu token untuk mengelola task miliknya. Dibuat dengan Node.js (CommonJS), Express 5, Prisma 6, dan PostgreSQL 18.

[Koleksi Postman](./postman_collection.json) · **API live:** [`task-manager-api-production-b16dd331.up.railway.app`](https://task-manager-api-production-b16dd331.up.railway.app/health/ready)

## Jalankan lokal

Gunakan Node.js 24 dan Docker Desktop dengan Linux containers. Dari PowerShell:

```powershell
git clone https://github.com/radithyaps/task-manager-api.git
cd task-manager-api
node scripts/setup-local.js
docker compose up --build -d --wait
Invoke-RestMethod http://127.0.0.1:3000/health/ready
```

`setup-local.js` membuat `.env` berisi dua rahasia lokal acak: kunci JWT dan password PostgreSQL. Jika `.env` sudah ada, script mempertahankannya. Docker menjalankan `api` dan `db`; API menerapkan migrasi saat startup. Hasil `status: ready` berarti API berhasil menjalankan query ke database.

- **Alamat lokal:** `http://127.0.0.1:3000`; database `task_manager` pada port `55432`.
- **Lihat log:** `docker compose logs -f api`.
- **Hentikan:** `docker compose down`. Data tetap berada di volume `pgdata`.
- **Jalankan kembali:** `docker compose up -d --wait`. Tambahkan `--build` setelah mengubah kode.

### Pengembangan dengan nodemon

Untuk mengedit JavaScript dan melihat perubahan tanpa membangun ulang image, gunakan `.env` lokal dari langkah di atas. Jalankan API langsung di host dan biarkan PostgreSQL berjalan di Docker:

```powershell
docker compose stop api
docker compose up -d --wait db
npm ci
npm run db:generate
npm run db:deploy
npm run dev
```

Hentikan `npm run dev` dengan `Ctrl+C` sebelum menyalakan container API pada port yang sama. Proyek mendukung Node 20.19+, 22.12+, dan 24.x pada masing-masing lini LTS tersebut.

## Cara memakai API

1. Kirim `POST /api/auth/register` dengan `name`, `email`, `password` untuk membuat akun.
2. Kirim `POST /api/auth/login` dengan `email`, `password`. Ambil `data.accessToken` dari respons.
3. Pada endpoint privat, kirim header `Authorization: Bearer <accessToken>`. Token berlaku **7 hari**; setelah itu pengguna login kembali. Keluar dari aplikasi dilakukan dengan menghapus token di klien. Salinan token yang masih ada tetap berlaku sampai kedaluwarsa.

Kirim body sebagai `application/json`, maksimum 16 KiB. Contoh membuat task:

```json
{"title":"Kirim laporan mingguan","priority":"HIGH","dueDate":"2027-01-15T17:00:00+07:00"}
```

| Method | Path | Akses | Hasil |
| --- | --- | --- | --- |
| GET | `/health` | Publik | `200` jika proses HTTP hidup |
| GET | `/health/ready` | Publik | `200` jika database menjawab, `503` jika tidak |
| POST | `/api/auth/register` | Publik | `201`, `data.user` tanpa password/hash |
| POST | `/api/auth/login` | Publik | `200`, `data.user`, `data.accessToken`, `data.tokenType`, `data.expiresIn` (detik) |
| GET | `/api/auth/me` | JWT | `200`, profil pemilik token di `data.user` |
| GET | `/api/tasks` | JWT | `200`, array `data` dan `meta` paginasi |
| POST | `/api/tasks` | JWT | `201`, task baru di `data`, header `Location` |
| GET | `/api/tasks/:id` | JWT | `200`, detail task |
| PATCH | `/api/tasks/:id` | JWT | `200`, task setelah perubahan |
| DELETE | `/api/tasks/:id` | JWT | `200`, `data.id` yang dihapus |

**Validasi akun:** nama 2–80 karakter; email disimpan dalam huruf kecil dan harus unik. Password minimal 12 karakter dan maksimal 72 byte UTF-8 karena batas bcrypt. Password tidak di-trim.

**Validasi task:** `title` wajib saat membuat task (1–200 karakter). `description` opsional, maksimal 2000 karakter. `status`: `PENDING` (default), `IN_PROGRESS`, `COMPLETED`. `priority`: `LOW`, `MEDIUM` (default), `HIGH`. `dueDate` menerima waktu ISO 8601 dengan zona; hasil dikembalikan dalam UTC. PATCH membutuhkan minimal satu field. Kirim `null` untuk mengosongkan deskripsi atau tenggat. `userId` diambil dari token; field tambahan ditolak.

**Daftar:** `page` default 1, maksimum 10000; `limit` default 20, maksimum 100. Gunakan `status`, `priority`, atau `search` untuk memfilter. Pencarian mencocokkan potongan judul/deskripsi tanpa membedakan kapitalisasi. `sortBy` menerima `createdAt`, `updatedAt`, `dueDate`, `title`, `priority`, atau `status`; `order` menerima `asc` atau `desc`. Default: `createdAt desc`, dengan `id` sebagai pemecah seri.

```text
GET /api/tasks?status=PENDING&priority=HIGH&search=laporan&page=1&limit=10
```
```json
{"success":true,"data":[],"meta":{"page":1,"limit":10,"total":0,"totalPages":0}}
```

**Error:** `400` input/JSON tidak valid, `401` login atau token tidak sah, `403` origin ditolak, `404` endpoint/task tidak ditemukan (termasuk task milik orang lain), `409` email duplikat, `413` body terlalu besar, `415` jenis konten salah, `429` terlalu banyak request. Error internal tidak mengirim stack trace. Contoh PATCH dengan body kosong:

```json
{"success":false,"message":"Input tidak valid.","errors":[{"field":"body","message":"Kirim minimal satu field untuk diubah."}]}
```

## Testing dengan Postman atau terminal

Dengan API lokal aktif, jalankan `npm test` dari folder proyek. Perintah ini menjalankan **koleksi Postman yang sama** menggunakan Newman versi terkunci; npm mengunduh runner saat pertama kali dipakai. Atau impor `postman_collection.json` ke Postman dan pilih **Run collection**. Variabel `baseUrl` awalnya menunjuk ke `http://127.0.0.1:3000`.

Untuk menguji API yang sudah di-deploy, arahkan `baseUrl` ke alamat Railway:

```powershell
npm test -- --env-var baseUrl=https://task-manager-api-production-b16dd331.up.railway.app
```

Koleksi berisi **21 request**. Selain register, login, profil, dan CRUD, koleksi menguji password salah (`401`), email duplikat (`409`), status task tidak valid (`400`), dan akses lintas akun (`404`). Akun B harus mendapat daftar kosong dan tidak dapat membaca, mengubah, atau menghapus task akun A. Task uji dihapus kembali oleh A. Setiap run membuat dua akun demo acak, jadi gunakan database lokal atau khusus pengujian.

Hasil verifikasi: **21 request, 21 assertion lulus, 0 gagal** — sama di lokal (Node 24 + PostgreSQL 18 Docker) maupun terhadap API produksi di Railway. Menjalankan koleksi pada database produksi akan menyisakan akun demo; bersihkan bila perlu dengan `DELETE FROM "User" WHERE email LIKE 'postman.%@example.test';`.

## Struktur kode

| Lokasi | Tanggung jawab |
| --- | --- |
| `src/routes/` | Mencocokkan method/path dengan middleware dan controller. |
| `src/validators/`, `src/middlewares/` | Memeriksa input Zod, memverifikasi JWT Bearer, membatasi request, dan menyeragamkan error. |
| `src/controllers/` | Mengambil input yang sudah lolos validasi dan menyusun respons HTTP. |
| `src/services/` | Hash/password, token, serta operasi database yang dibatasi berdasarkan pemilik task. |
| `src/config/prisma.js` | Membaca konfigurasi dan membuat satu Prisma Client per proses. |
| `prisma/` | Model `User` dan `Task`, relasi satu-ke-banyak, indeks, serta riwayat migrasi PostgreSQL. |
| `src/app.js`, `src/index.js` | Menyusun aplikasi Express, membuka port, dan menutup koneksi saat server dihentikan. |

## Deployment: Railway untuk API, Neon untuk database

API berjalan di `https://task-manager-api-production-b16dd331.up.railway.app`. Health check `GET /health/ready` menjawab `{"status":"ready"}`, dan seluruh koleksi Postman (21 request) sudah lulus di alamat tersebut.

1. **Neon.** Gunakan PostgreSQL 18 dan buka **Connect**. Untuk **branch, database, dan role yang sama**, salin URL dengan pooling aktif (`DATABASE_URL`, host memiliki `-pooler`), lalu URL dengan pooling nonaktif (`DIRECT_URL`). Salin URL lengkap termasuk opsi TLS; jangan salin awalan perintah `psql`.
2. **Railway.** Login dengan GitHub, lalu **New Project → Deploy from GitHub repo** dan pilih repo ini. Railway mendeteksi [`Dockerfile`](./Dockerfile); [`railway.json`](./railway.json) menetapkan builder Docker, health check `/health`, dan restart saat gagal.
3. **Variables.** Buka tab **Variables** pada service, lalu isi `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (acak, minimal 32 karakter), dan `TRUST_PROXY_HOPS=1`. Jangan menambahkan `PORT` karena Railway memberikannya otomatis. Jangan menyimpan credential di repo atau koleksi Postman.
4. **Domain.** Buka **Settings → Networking → Generate Domain**, lalu cek `https://<domain>/health/ready`. Dockerfile menjalankan `prisma migrate deploy` sebelum server menerima request, jadi tabel di Neon dibuat otomatis.

Catatan free tier: service tidur setelah beberapa menit tanpa aktivitas dan bangun saat ada request, sehingga request pertama bisa terasa lambat (±30–60 detik). Selama tidur tidak ada biaya compute. Sebelum dinilai, buka `/health` sekali agar service sudah bangun.

File [`render.yaml`](./render.yaml) disimpan sebagai alternatif bila ingin memakai Render (Blueprint dengan satu Web Service Free); pada Render, `JWT_SECRET` dibuat otomatis.

Compose digunakan untuk pengembangan lokal. Untuk menjalankan Node di host dengan Neon, isi `DATABASE_URL`, `DIRECT_URL`, dan `JWT_SECRET` di `.env`, lalu `npm ci`, `npm run db:generate`, `npm run db:deploy`, dan `npm start`. Untuk mengembangkan migrasi baru, gunakan `npm run db:migrate -- --name nama_perubahan` pada database pengembangan, lalu simpan SQL hasilnya. `npm run db:status` menampilkan status migrasi.

Konfigurasi tambahan ada di [`.env.example`](./.env.example). Default: bcrypt 12 ronde, 300 request API dan 20 request gabungan register/login per IP dalam 15 menit. `CORS_ORIGIN` berisi origin frontend yang diizinkan (pisahkan dengan koma). `TRUST_PROXY_HOPS` default `0` untuk akses lokal dan `1` di Railway karena API berada di belakang proxy platform. Rate limit bawaan berlaku per proses.
