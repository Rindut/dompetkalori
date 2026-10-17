# DompetKalori

Aplikasi pencatatan kalori dengan dompet dan foodcourt isometrik. Data tersimpan di browser perangkat ini melalui localStorage. Tidak ada akun atau sinkronisasi antarperangkat.

## Menjalankan

Butuh Node.js 22 atau lebih baru. Dari folder proyek:

```bash
npm run dev
```

Buka **http://localhost:3041**. Port default aplikasi adalah 3041. Jika port itu kelak dipakai aplikasi lain, jalankan `PORT=3042 npm run dev` setelah mengecek port pengganti.

Untuk membuka dari HP pada Wi-Fi yang sama, jalankan `HOST=0.0.0.0 npm run dev`, lalu buka `http://<IP-komputer>:3041` di HP. `localhost` pada HP menunjuk ke HP itu sendiri.

## Alur singkat

Isi profil untuk mendapat anggaran. Cari makanan, pilih porsi dan jumlah, lalu tekan **Bayar**. Pencatatan tersimpan sebelum animasi dompet dan waiter berjalan. Buka meja harian untuk edit, hapus, atau salin menu kemarin. Tombol **Makanan sendiri** tersedia jika katalog belum cocok.

Katalog aplikasi memuat makanan dari TKPI 2017, nasi goreng dari tabel komposisi bahan makanan BPS, serta menu Healthy Food dengan estimasi bahan salad dari FDA. Kalori per 100 g bersumber dari tabel; berat porsi pada sebagian besar makanan adalah asumsi awal BPK dan belum ditimbang di penjual. Katalog dasar dan status porsi ada di `BPK Katalog Makanan Awal.xlsx`; data aplikasi terkini ada di `app/foods.json`.

Foodcourt memiliki 10 kios. Healthy Food menempati kios hijau di depan, sementara menu Soto dan kios Pecel/ketoprak tergabung dalam Soto & Pecel. Waiter berbaju hijau mengantar makanan tanpa tas.

## Pemeriksaan

```bash
npm run check
```

Dokumen produk, teknis, desain, dan UAT ada di folder `docs/`. Spreadsheet di folder utama mencatat perencanaan awal dan belum tentu mencerminkan seluruh perubahan implementasi terbaru.

Rumus anggaran kerja ada di `BPK Metode Anggaran.xlsx`. Hanya untuk dewasa yang memenuhi syarat perhitungan. Sebelum dipakai sebagai rekomendasi publik, metode dan angka porsi perlu ditinjau ahli gizi.
