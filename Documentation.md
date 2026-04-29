# IoT Dashboard Web Application Documentation

![Dashboard Preview](preview.png)

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
├── frontend/      # React Frontend (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/       # Frontend source code
├── device-integrations/ # Codec, Apps Script, and Arduino INO files
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
   cd frontend
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
   cd frontend
   ```
2. Build the production files:
   ```bash
   npm run build
   ```
3. The built static files will be located in the `frontend/dist/` folder. You can serve this folder using any static web server. For a quick local preview, run:
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
- **`server.js`**: This is the main file for the backend server. It uses `express` to create an HTTP server that receives external data (via the `/api/telemetry` POST endpoint). The received data is then formatted and sent in real-time to the frontend using `socket.io` (via the `telemetry_update` WebSocket event). The latest data is also stored in an in-memory cache so that when new users open the web dashboard, they immediately get the latest data without having to wait for the next incoming data.

### 5.2. Frontend (`frontend/src/`)
The frontend is built using **React JS** and bundled with **Vite**.

- **`main.jsx` & `App.jsx`**: The main entry points of the React application. `App.jsx` defines the *routing* using `react-router-dom` so users can navigate between pages (such as from the Dashboard to Integration or NodeDetail).
- **`pages/` (Main Pages):**
  - **`Dashboard.jsx`**: The main homepage displaying a summary/monitoring view of all active sensor devices on a map/list.
  - **`NodeDetail.jsx`**: A specific page to view the details of a particular device/node. Historical sensor data is displayed in more detail here.
  - **`Integration.jsx`**: A page displaying information to configure the webhook/API integration so external data can reach the backend.
  - **`Info.jsx`**: A general information or guide page.
- **`components/` (Reusable UI Components):**
  - **`Sidebar.jsx`**: The left-side navigation menu for moving between pages.
  - **`SensorChart.jsx`**: A component to draw charts using the `chart.js` and `react-chartjs-2` libraries. It visualizes data trends over time reactively.
  - **`DataLogTable.jsx`**: Displays the historical data log of a node/device in a table row format.
  - **`BatteryGauge.jsx`**: A visual indicator component to show the battery level or percentage of an IoT device.
- **`services/mockData.js`**: Contains simulation data for UI testing purposes. Useful when developing the UI before actual devices start sending data.
- **`contexts/LanguageContext.jsx` & `utils/translations.js`**: These two files handle the multi-language configuration features on the dashboard. `translations.js` stores the vocabulary (dictionary), and `LanguageContext.jsx` distributes it to all components in the application.

### 5.3. IoT Hardware Integration (`device-integrations/`)
This folder contains the source code for the hardware and its data bridges:
- **`Node_LoRaWAN.ino`**: Arduino (ESP32) source code for reading the pH sensor, battery percentage, and time from the DS3231 RTC module, then transmitting them via LoRaWAN.
- **`ChirpStack-Codec.js`**: A JavaScript script to be copied to the ChirpStack server (Device Profiles -> Codec section) that decodes the 9-byte *binary payload* from the ESP32 into a readable JSON format.
- **`GoogleAppsScript.gs`**: A *webhook* script copied to Google Apps Script. It receives the payload from ChirpStack, calculates network metrics like Latency and Packet Delivery Ratio (PDR), saves it to a spreadsheet, and forwards the data directly to the Node.js Backend.

*(For a more detailed installation guide regarding device integration, please see the `device-integrations/README.md` file)*
