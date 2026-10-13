# Rencana Implementasi: Autonomous AI Trading Agent & Trade Journal

Berdasarkan artikel MindStudio (*"How to Build a 24/7 AI Trading Agent with Claude Code and Alpaca"*), kita mengadopsi pilar utama arsitektur agen trading mandiri: **Research ➔ Trade Decision ➔ Trade Journaling ➔ Risk Control**, disesuaikan dengan ekosistem AuraSignals yang mencakup **BTC/USDT** dan **XAU/USD (Emas)**.

---

## 1. Analisa & Rekomendasi Pendekatan Terbaik

### Mengapa Pendekatan Hybrid adalah Pilihan Terbaik?
1. **Keterbatasan Alpaca untuk XAU/USD:**
   - Broker Alpaca hanya mendukung saham AS dan beberapa kripto, **tidak mendukung trading komoditas spot emas (XAU/USD)**.
   - Jika website 100% bergantung pada Alpaca, sinyal XAU/USD tidak dapat dijalankan.
2. **Kekuatan Utama Artikel adalah "AI Trading Loop & Journaling":**
   - Nilai jual tertinggi dari sistem di artikel tersebut adalah kemampuan AI untuk **menganalisa pasar 24/7** dan menyajikan **Trade Journal transparan** yang menjelaskan secara gamblang *mengapa* posisi dibuka dan *bagaimana* risiko dikelola.
3. **Aksesibilitas Pengunjung:**
   - Website tetap dapat berjalan mulus untuk semua pengunjung tanpa mewajibkan pendaftaran broker AS pihak ketiga, namun portofolio owner $500 dijalankan dengan disiplin eksekusi trading agent profesional.

---

## 2. Fitur-Fitur yang Akan Dibangun

### A. AI Trading Agent Decision Engine (Backend & Logic)
- **Siklus Research:** Mesin secara berkala (per 1 jam / H1) mengevaluasi struktur harga, indikator (RSI, ATR, Trend, Order Block), dan status jam pasar (termasuk deteksi otomatis libur akhir pekan XAU/USD).
- **Siklus Trade Evaluation:** AI menentukan kelayakan sinyal (Buy / Sell / Hold) dengan *Risk-to-Reward ratio* minimal 1:2.
- **Siklus Trade Journal:** Setiap kali posisi dibuka atau ditutup, AI membuat catatan jurnal terstruktur:
  - *Setup*: Alasan teknikal masuk pasar (*Support/Resistance bounce*, *Liquidity sweep*, dll.).
  - *Risk Management*: Perhitungan risiko modal dari akun $500 (lot sizing aman).
  - *Outcome*: Evaluasi ketika Hit TP atau Hit SL.

### B. Komponen Baru: AI Trade Journal Panel (Frontend)
- Ditambahkan ke dalam tab **Sinyal Live** tepat di bawah kartu posisi aktif / akun owner.
- Menampilkan:
  - **Status Keputusan Agen:** (*Active Position* / *Scanning Market* / *Market Closed*).
  - **Catatan Jurnal AI Terkini:** Penjelasan ringkas dan kredibel mengenai logika posisi yang sedang berjalan.
  - **Log Keputusan Terakhir:** Riwayat catatan singkat 3-5 keputusan transaksi sebelumnya.

### C. Peningkatan Akun Live Owner ($500)
- Menghubungkan eksekusi otomatis dengan aturan ketat manajemen modal:
  - Maksimal risiko per transaksi: 1%–2% dari modal $500.
  - Menampilkan metrik *Trade Efficiency*, *Profit Factor*, dan *Discipline Score*.

### D. Jembatan Alpaca API Ready (Opsional)
- Menyediakan arsitektur backend endpoint untuk integrasi kunci API Alpaca Paper Trading jika pemilik ingin menghubungkan order BTC ke akun broker Alpaca di kemudian hari.

---

## 3. Tahapan Implementasi

1. **Tahap 1: Pembuatan AI Reasoning & Journal Engine**
   - Mengembangkan modul `aiTradingAgent.ts` yang menghasilkan *trade journal entry* berbasis data teknikal real-time.
2. **Tahap 2: UI AI Trade Journal Card**
   - Merancang kartu visual modern bergaya fintech untuk menampilkan jurnal AI pada posisi berjalan.
3. **Tahap 3: Integrasi Portofolio Owner & Validasi Sistem**
   - Menghubungkan log jurnal dengan riwayat transaksi closed trades dan portofolio live owner $500.
   - Uji verifikasi build dan deploy ke preview serta repositori GitHub.
