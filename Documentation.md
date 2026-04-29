# IoT Dashboard Web Application Documentation

This documentation covers the setup, deployment, and architecture of the IoT Web Based Dashboard. The system consists of a Node.js backend and a React frontend.

## 1. System Overview

- **Frontend**: React application built with Vite, utilizing TailwindCSS/vanilla CSS for styling, Recharts/Chart.js for data visualization, and Socket.io-client for real-time data reception.
- **Backend**: Express.js server acting as a webhook receiver for Google Spreadsheet/LoRaWAN gateway data and a WebSocket server using Socket.io to push real-time updates to the frontend.

## 2. Directory Structure

```text
Dashboard_Backup/
├── backend/       # Node.js Express server
│   ├── package.json
│   └── server.js
├── FunThing/      # React Frontend (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/       # Frontend source code
└── Documentation.md # This file
```

## 3. Deployment Instructions

### Prerequisites
- Install **Node.js** (v18+ recommended)
- Install **npm** (comes with Node.js)

### Step 1: Deploying the Backend
The backend receives HTTP POST requests (e.g., from your LoRaWAN infrastructure or Google Apps Script webhook) and broadcasts them to the React frontend via WebSocket.

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
   *The backend server will run on port `3000` by default (e.g., `http://localhost:3000`). It listens for POST requests at `/api/telemetry`.*

### Step 2: Deploying the Frontend (Development Mode)
To run the dashboard locally for development:

1. Open a **new** terminal window and navigate to the frontend folder:
   ```bash
   cd FunThing
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The frontend will typically be accessible at `http://localhost:5173`. It will automatically connect to the backend server running on port `3000`.*

### Step 3: Deploying the Frontend (Production)
For deploying to a live web server (like Vercel, Netlify, or an Nginx server):

1. Navigate to the frontend folder:
   ```bash
   cd FunThing
   ```
2. Build the production files:
   ```bash
   npm run build
   ```
3. The built static files will be located in the `FunThing/dist/` folder. You can serve this folder using any static web server. For a quick local preview, run:
   ```bash
   npm run preview
   ```

## 4. How the Data Flows
1. **IoT Node** sends telemetry data to a Gateway (via LoRaWAN).
2. **Gateway/Network Server** (or Google Apps Script) forwards this data via an HTTP POST request to `http://<your-backend-ip>:3000/api/telemetry`.
3. **Backend (`server.js`)** receives the payload, formats it, and broadcasts a `telemetry_update` event via WebSockets.
4. **Frontend (React)** listens for `telemetry_update` and updates the UI charts and device status in real-time.

## 5. Code Explanation

### 5.1. Backend (`backend/`)
- **`server.js`**: Ini adalah file utama untuk server backend. File ini menggunakan `express` untuk membuat server HTTP yang menerima data dari luar (via endpoint POST `/api/telemetry`). Data yang diterima ini kemudian diformat dan dikirimkan secara langsung (real-time) ke frontend menggunakan `socket.io` (melalui event WebSocket `telemetry_update`). Data terakhir juga disimpan di cache sementara (in-memory) agar ketika ada pengguna baru yang membuka web dashboard, mereka langsung mendapat data terakhir tersebut tanpa harus menunggu data masuk berikutnya.

### 5.2. Frontend (`FunThing/src/`)
Frontend dibangun menggunakan **React JS** dan di-build dengan **Vite**.

- **`main.jsx` & `App.jsx`**: Titik masuk utama (entry point) aplikasi React. `App.jsx` mendefinisikan *routing* menggunakan `react-router-dom` agar pengguna bisa berpindah halaman (seperti dari Dashboard ke Integration atau ke NodeDetail).
- **`pages/` (Halaman Utama):**
  - **`Dashboard.jsx`**: Halaman beranda utama yang menampilkan ringkasan/monitoring semua device sensor yang aktif di peta/list.
  - **`NodeDetail.jsx`**: Halaman spesifik untuk melihat detail satu device/node tertentu. Di halaman ini, riwayat data sensor akan dimunculkan dengan lebih rinci.
  - **`Integration.jsx`**: Halaman yang menampilkan informasi untuk mengkonfigurasi integrasi webhook/API agar data dari luar bisa masuk ke backend.
  - **`Info.jsx`**: Halaman informasi umum atau panduan.
- **`components/` (Komponen UI yang Bisa Digunakan Berulang Kali):**
  - **`Sidebar.jsx`**: Navigasi menu (sidebar) di sebelah kiri untuk berpindah-pindah antar halaman.
  - **`SensorChart.jsx`**: Komponen untuk menggambar grafik menggunakan library `chart.js` dan `react-chartjs-2`. Komponen ini akan memvisualisasikan tren data dari waktu ke waktu secara reaktif.
  - **`DataLogTable.jsx`**: Menampilkan histori data log dari node/device dalam format baris tabel.
  - **`BatteryGauge.jsx`**: Komponen visual indikator untuk menampilkan tingkat atau persentase baterai dari device IoT.
- **`services/mockData.js`**: Berisi data simulasi untuk keperluan pengujian (testing) UI. Berguna saat Anda mengembangkan UI tapi belum ada device nyata yang mengirim data.
- **`contexts/LanguageContext.jsx` & `utils/translations.js`**: Dua file ini digunakan untuk mengurus fitur pengaturan multi-bahasa pada dashboard. `translations.js` menyimpan perbendaharaan kata (kamus), dan `LanguageContext.jsx` mendistribusikannya ke seluruh komponen di aplikasi.
