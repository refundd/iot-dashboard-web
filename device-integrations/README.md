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

## 4. Code Explanation

### `Node_LoRaWAN.ino` (ESP32 Hardware Node)
- **`readBattVoltage()`**: Reads the analog value from the battery pin and converts it to actual voltage considering the voltage divider resistors.
- **`battToPercent(float v)`**: Takes the battery voltage and maps it to a percentage (0-100%) using a lookup table.
- **`onEvent(ev_t ev)`**: A callback function from the LMIC library that handles LoRaWAN events. It detects `EV_TXCOMPLETE` (successful transmission) and schedules the next transmission.
- **`do_send(osjob_t* j)`**: The core function that gathers sensor data (pH & battery) and the current Unix Timestamp from the DS3231 RTC. It encodes these values into a 9-byte `mydata` array and queues it for LoRa transmission via `LMIC_setTxData2`.
- **`setup()`**: Initializes Serial communication, RTC, pH sensor, and configures the LMIC LoRaWAN session (ABP keys) and Spreading Factor.
- **`loop()`**: Continuously runs `os_runloop_once();` which drives the LMIC background state machine to process queued transmissions and receive windows.

### `ChirpStack-Codec.js` (ChirpStack Server)
- **`decodeUplink(input)`**: When the gateway captures the 9-byte radio signal, it arrives at ChirpStack as raw binary. This function uses bit-shifting (`<<`, `|`) to reassemble the binary into a neat JSON object containing readable variables like `adc_ph`, `battery_pct`, `tx_timestamp`, and `counter`.

### `GoogleAppsScript.gs` (Webhook & Database)
- **`doPost(e)`**: The automated endpoint triggered when ChirpStack sends JSON to Google Scripts. It extracts the JSON data, prevents duplicate entries, detects node restarts, **calculates Latency** (node RTC time vs server time), **calculates Packet Delivery Ratio (PDR)**, and writes a new log row to Google Sheets.
- **`doGet(e)`**: Turns your Google Spreadsheet into a read-only API. The React Dashboard constantly polls this endpoint to fetch the latest 500 rows of data.
- **`loadState()` & `saveState()`**: Helper functions that read and save persistent state (like the last counter received) into a separate sheet (`NodeState`). This ensures PDR calculations remain accurate even if old logs are deleted.
- **`getOrCreateSheet()`**: A smart function that checks if a specific Google Sheet tab exists and creates it with bold headers if it doesn't.
- **`parseIntOrNull(val)`**: A utility function to safely parse integers, preventing NaN errors.
- **`resetAll()`, `resetRawData()`, `resetNodeState()`**: Manual utility functions provided in the Google Script editor to clear all historical data logs and reset statistical counters back to zero.
