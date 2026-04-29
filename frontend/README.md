# Frontend Architecture & Code Explanation

This directory contains the React application built with Vite. It handles the user interface, real-time data reception via WebSockets, and data visualization.

## Main Entry Points
- **`main.jsx`**: The root file that renders the React application into the DOM. It wraps the app with necessary providers like `BrowserRouter` (for routing) and `LanguageProvider` (for multi-language support).
- **`App.jsx`**: Defines the main routing structure using `react-router-dom`. It routes users to the Dashboard, NodeDetail, Integration, or Info pages based on the URL.

## Pages (`src/pages/`)
- **`Dashboard.jsx`**: The main homepage. It connects to the Socket.io backend to listen for `telemetry_update` events. It displays a summary of all active sensor devices, their battery levels, and current pH values in a grid/list format.
- **`NodeDetail.jsx`**: A specific page dedicated to viewing the details of a single device (node). It renders detailed historical line charts for pH and battery voltage using the `SensorChart` component.
- **`Integration.jsx`**: A settings page that provides the necessary webhook URL and payload format required to send data to the backend. It is protected by a simple password gate (`admin123` by default) stored in `LocalStorage`.
- **`Info.jsx`**: A static page displaying general information, guides, or system architecture diagrams.

## Reusable Components (`src/components/`)
- **`Sidebar.jsx`**: The left-side navigation menu. It handles page navigation and contains the language toggle button to switch between English and Indonesian.
- **`SensorChart.jsx`**: A wrapper component for `react-chartjs-2`. It takes in historical array data and visualizes data trends over time.
- **`DataLogTable.jsx`**: Displays the raw historical data log of a node/device in a structured table row format, useful for debugging and precise data reading.
- **`BatteryGauge.jsx`**: A visual indicator component that dynamically changes color based on the battery percentage of an IoT device (e.g., green for full, red for low).

## Utilities & Services
- **`services/mockData.js`**: Contains simulation scripts and mock JSON payloads for UI testing. It allows developers to test the UI without having actual LoRaWAN devices transmitting data.
- **`contexts/LanguageContext.jsx`**: A React Context Provider that manages the global language state (English/Indonesian) and provides the translation function to all child components.
- **`utils/translations.js`**: A dictionary file storing key-value pairs of text in different languages, consumed by the `LanguageContext`.
