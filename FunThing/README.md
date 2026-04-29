# LoRaWAN Water Quality Monitoring Dashboard

**Name**: Mohamad Rifan Kasyiful Asrar  
**Student ID (NIM)**: 1102223020  
**Major**: S1 Teknik Elektro  
**University**: Telkom University  

![Dashboard Preview](./public/vite.svg) 
*(Note: Replace with actual screenshot if available)*

## Overview
This project is a real-time Water Quality Monitoring Dashboard designed for LoRaWAN IoT networks. It processes incoming sensor data (pH, Turbidity, TDS, Temperature, DO) and visualizes it through interactive charts and data logs.

## Features
-   **Universal Integration**: Native support for **ChirpStack** JSON payloads.
-   **Real-time Visuals**: Live updates for Node Health, Connection Metrics (RSSI/SNR), and Water Quality Sensors.
-   **Auto-Discovery**: Automatically detects and adds new LoRaWAN nodes.
-   **Personalization**: Rename and reorder nodes; persistent settings via LocalStorage.
-   **History**: Exportable data logs and historical time-series charts.

## How to Run Locally

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Dev Server**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

## Deployment (GitHub Pages)
This project is configured for automatic deployment to GitHub Pages.
1.  Push this code to a GitHub repository.
2.  Go to **Settings > Pages**.
3.  Under **Source**, select **GitHub Actions**.
4.  The included workflow (`.github/workflows/deploy.yml`) will automatically build and deploy the site to a live URL.
