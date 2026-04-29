# Backend Architecture & Code Explanation

This directory contains the Node.js Express server. It serves as the primary bridge between external IoT infrastructure (like ChirpStack or Google Apps Script) and the React frontend.

## Core File: `server.js`

This single file contains the entire backend logic. It initializes an HTTP server using Express and attaches a WebSocket server using Socket.io.

### 1. HTTP Endpoints
- **`POST /api/telemetry`**: 
  - **Purpose**: This is the main webhook receiver. External services (like the Google Apps Script forwarding the LoRaWAN payload) send HTTP POST requests containing JSON data to this endpoint.
  - **Logic**: It validates the incoming JSON payload. If the data is valid, it formats it slightly and immediately passes it to the WebSocket server to be broadcasted to all connected frontend clients.
  - **Caching**: It also updates an in-memory cache variable (`latestTelemetryCache`). This ensures that if a frontend client connects *after* the telemetry was sent, it can still receive the latest known data without waiting for the next physical sensor transmission.

- **`GET /`**: 
  - **Purpose**: A simple health-check endpoint. You can open `http://localhost:3000/` in a browser to quickly verify if the backend server is running.

### 2. WebSocket Implementation (Socket.io)
- **`io.on('connection')`**:
  - **Purpose**: Listens for new WebSocket connections from the React frontend.
  - **Logic**: When a new client connects (e.g., a user opens the dashboard in their browser), the server immediately emits a `telemetry_update` event containing the data from `latestTelemetryCache`. This provides an instant UI update upon loading the page.
- **`io.emit('telemetry_update', data)`**:
  - **Purpose**: This function is triggered internally right after `POST /api/telemetry` successfully receives new data. It broadcasts the new data to *every* currently connected frontend client simultaneously, achieving the "real-time" dashboard effect.

### 3. CORS Configuration
- The backend is configured with the `cors` middleware to allow Cross-Origin Resource Sharing. This is critical because the Vite frontend runs on a different port (`5173`) than the backend (`3000`) during development. Without CORS enabled, the browser would block the frontend from communicating with the backend API.
