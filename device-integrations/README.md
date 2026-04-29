# Device Integrations

This folder contains the necessary scripts and code to integrate a physical LoRaWAN hardware node with the Web Dashboard.

## 1. Arduino Node (`Node_LoRaWAN.ino`)
This is the firmware for the ESP32 + DS3231 + LoRa module. 
It reads the pH sensor and battery voltage, gets the current Unix timestamp from the RTC, and encodes them into a 9-byte payload.

**Setup Instructions:**
1. Open the file in Arduino IDE.
2. Replace `DEVADDR`, `NWKSKEY`, and `APPSKEY` with your actual ABP credentials from ChirpStack.
3. Compile and upload to your ESP32.

**Payload Format:**
- `Byte 0-1`: pH value * 100
- `Byte 2`: Battery Percentage (0-100)
- `Byte 3-6`: Unix Timestamp (from RTC)
- `Byte 7-8`: Application Counter

## 2. ChirpStack Codec (`ChirpStack-Codec.js`)
This JavaScript function must be placed in your ChirpStack Device Profile under the "Codec" tab. It translates the 9-byte binary payload sent by the Arduino node into a JSON object that the webhook can understand.

**Setup Instructions:**
1. Go to ChirpStack > Device Profiles.
2. Select your profile, go to the **Codec** tab.
3. Select **Custom JavaScript codec functions**.
4. Paste the contents of `ChirpStack-Codec.js` into the `decodeUplink` code box.

## 3. Google Apps Script Webhook (`GoogleAppsScript.gs`)
This script acts as the bridge between ChirpStack and the Web Dashboard. It receives the decoded payload, calculates PDR (Packet Delivery Ratio) and Latency (by comparing the RTC timestamp to the server timestamp), logs the data to a Google Sheet for historical storage, and finally forwards the formatted data to the Node.js backend.

**Setup Instructions:**
1. Go to [script.google.com](https://script.google.com/) and create a new project.
2. Paste the contents of `GoogleAppsScript.gs`.
3. Click **Deploy > New deployment**. Select **Web app**.
4. Set "Who has access" to **Anyone**.
5. Copy the generated Web App URL and paste it into ChirpStack's HTTP Integration.
6. Make sure to update the `BACKEND_URL` variable inside the script to point to your Node.js backend server IP/domain (e.g., `http://YOUR_SERVER_IP:3000/api/telemetry`).
