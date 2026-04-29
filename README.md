# LoRaWAN Water Quality Monitoring Dashboard

**Name**: Mohamad Rifan Kasyiful Asrar  
**Student ID (NIM)**: 1102223020  
**Major**: S1 Teknik Elektro  
**University**: Telkom University  

![Dashboard Preview](preview.png)

## Overview
This repository contains the complete stack for a real-time Water Quality Monitoring Dashboard designed for LoRaWAN IoT networks. It processes incoming sensor data (such as pH and battery levels), routes them through Google Apps Script and a Node.js backend, and visualizes them on a modern React frontend.

## Repository Structure

- **[`frontend/`](./frontend/)**: React application built with Vite. It features live charts, device management, auto-discovery, and historical data tables.
- **[`backend/`](./backend/)**: Node.js & Express server. It receives webhook data from the LoRaWAN gateway/Google Apps Script and pushes real-time WebSocket events to the frontend.
- **[`device-integrations/`](./device-integrations/)**: Hardware integration scripts:
  - `Node_LoRaWAN.ino`: Arduino/ESP32 firmware for the physical sensor nodes.
  - `ChirpStack-Codec.js`: Payload decoder for the ChirpStack Network Server.
  - `GoogleAppsScript.gs`: Webhook bridge that calculates network metrics (Latency, PDR) and logs data.

## Features
- **Universal Integration**: Support for ChirpStack via HTTP Integrations and Google Apps Script.
- **Real-time Metrics**: Live updates for Node Health, Connection Metrics (RSSI/SNR, Latency, PDR), and Sensors.
- **Hardware Ready**: Includes tested C++ LoRaWAN Arduino code and binary payload codecs.
- **Personalization**: Rename nodes, view detailed historical logs, and switch languages.

## Quick Start
Please refer to the detailed [**Documentation**](./Documentation.md) file for complete setup and deployment instructions for both the server and the hardware devices.

To run the web app locally:

1. **Start Backend**:
   ```bash
   cd backend
   npm install
   node server.js
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.
