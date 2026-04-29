// ===================================================================
//  LoRa Network Monitor — Google Apps Script (REVISI)
//  Compatible with ChirpStack HTTP Integration (JSON webhook)
// ===================================================================

var SHEET_DATA  = "RawData";
var SHEET_STATE = "NodeState";
var WINDOW_SIZE = 100;

// tx_timestamp menggantikan uptime_ms di kolom & header
var HEADERS_DATA = [
  "Timestamp", "Device", "Battery Level", "Counter", "TX Timestamp (Unix)",
  "RSSI", "SNR", "SF", "Frequency (Hz)", "Sensor Value",
  "PDR (%)", "Latency (ms)", "Signal Status", "Note"
];

var HEADERS_STATE = [
  "Device", "Last Counter", "Last TX Timestamp", "First Counter (per boot)",
  "Current Session", "Window Received", "Total Expected", "Total Received",
  "Boot Epoch (ms)", "Restart Count"
];

// ===================================================================
//  doPost — Receives ChirpStack webhook
// ===================================================================
function doPost(e) {
  try {
    var raw  = e.postData.contents;
    var data = JSON.parse(raw);

    var deviceName  = (data.deviceInfo && data.deviceInfo.deviceName) ? data.deviceInfo.deviceName : "Unknown";
    var serverEpoch = Date.now();   // ms, waktu server terima paket
    var serverTime  = new Date(serverEpoch);

    // 1. RF metadata
    var rssi = "", snr = "", freq = "", sf = "";
    if (data.rxInfo && data.rxInfo.length > 0) {
      rssi = data.rxInfo[0].rssi;
      snr  = data.rxInfo[0].snr;
    }
    if (data.txInfo) {
      freq = data.txInfo.frequency;
      if (data.txInfo.modulation && data.txInfo.modulation.lora) {
        sf = data.txInfo.modulation.lora.spreadingFactor;
      }
    }

    // 2. Decode payload
    var counter = null, txTimestamp = null, batteryLevel = "", sensorValue = "";

    if (data.object) {
      // tx_timestamp dalam detik (dari DS3231 di node)
      txTimestamp  = parseIntOrNull(data.object.tx_timestamp);
      batteryLevel = (data.object.battery_pct !== undefined) ? data.object.battery_pct : "";
      sensorValue  = (data.object.adc_ph      !== undefined) ? data.object.adc_ph      : "";

      if (data.object.counter !== undefined) {
        counter = parseIntOrNull(data.object.counter);
      }

      if (sensorValue !== "" && sensorValue > 14) {
        sensorValue = sensorValue / 100.0;
      }
    }

    if (counter === null && data.fCnt !== undefined) {
      counter = data.fCnt;
    }

    // 3. Load State
    var state = loadState(deviceName);
    var note  = "";

    // 4. Duplicate Guard
    // Sekarang pakai tx_timestamp sebagai pengganti uptime untuk deteksi duplikat
    if (counter !== null && state.lastCounter !== null && counter === state.lastCounter &&
        txTimestamp !== null && state.lastTxTimestamp !== null && txTimestamp === state.lastTxTimestamp) {
      return jsonResponse({ status: "duplicate", message: "Skipped duplicate packet." });
    }

    // 5. Detect Node Restart
    // Counter turun DAN tx_timestamp turun (timestamp lebih kecil dari paket sebelumnya)
    var restartFlag = false;
    if (counter !== null && state.lastCounter !== null &&
        txTimestamp !== null && state.lastTxTimestamp !== null) {
      if (counter < state.lastCounter && txTimestamp < state.lastTxTimestamp) {
        restartFlag = true;
        state.firstCounter    = counter;
        state.lastCounter     = null;
        state.currentSession  = null;
        state.restartCount   += 1;
        note = "NODE_RESTART #" + state.restartCount;
      }
    }

    if (state.firstCounter === null && counter !== null) {
      state.firstCounter = counter;
    }

    // 6. PDR Calculation (tidak berubah)
    var pdr = "";
    if (counter !== null) {
      var currentSession = Math.ceil(counter / WINDOW_SIZE);

      if (state.currentSession === null) {
        state.currentSession = currentSession;
        state.windowReceived = 0;
      }

      if (currentSession !== state.currentSession) {
        var finalPdr = Number(((state.windowReceived / WINDOW_SIZE) * 100).toFixed(2));
        note = (note ? note + " | " : "") + "PDR_SESI_" + state.currentSession + "=" + finalPdr + "%";
        state.currentSession = currentSession;
        state.windowReceived = 0;
      }

      state.windowReceived             += 1;
      state.totalReceivedCumulative    += 1;

      if (restartFlag || state.lastCounter === null) {
        state.totalExpectedCumulative += 1;
      } else {
        var gap = counter - state.lastCounter;
        state.totalExpectedCumulative += (gap > 0 ? gap : 1);
      }

      var sessionStart = (currentSession - 1) * WINDOW_SIZE + 1;
      var countInRange = counter - sessionStart + 1;
      if (countInRange < 1) countInRange = 1;
      if (state.windowReceived > countInRange) state.windowReceived = countInRange;

      pdr = Number(((state.windowReceived / countInRange) * 100).toFixed(2));
    }

    // 7. ── Latency (RTC-based, jauh lebih simpel) ──────────────
    // tx_timestamp = detik Unix dari RTC node saat do_send() dipanggil
    // serverEpoch  = milidetik Unix dari server saat paket diterima
    // Latency      = selisih keduanya (dikonversi ke ms)
    var latencyMs = "";
    if (txTimestamp !== null) {
      latencyMs = serverEpoch - (txTimestamp * 1000);

      // Sanity check: latency negatif artinya jam RTC node belum disync
      // atau ada skew antara RTC node dan NTP server. Catat di note tapi tetap simpan.
      if (latencyMs < 0) {
        note = (note ? note + " | " : "") + "LATENCY_NEG(RTC_SKEW?)";
        // Tetap simpan nilai asli agar bisa dianalisis, jangan di-clamp ke 0
      }

      // Latency > 60 detik kemungkinan paket terlambat ekstrem atau RTC drift
      if (latencyMs > 60000) {
        note = (note ? note + " | " : "") + "LATENCY_HIGH";
      }
    }
    // ─────────────────────────────────────────────────────────────

    // 8. Signal Status
    var status = "";
    if (rssi !== "" && snr !== "") {
      var snrVal = parseFloat(String(snr).replace(',', '.'));
      if      (rssi > -70  && snrVal > 0)   status = "Excellent";
      else if (rssi > -100 && snrVal > -7)  status = "Good";
      else if (rssi > -110 && snrVal > -15) status = "Fair";
      else                                  status = "Poor";
    }

    // 9. Update State & Save
    if (counter     !== null) state.lastCounter     = counter;
    if (txTimestamp !== null) state.lastTxTimestamp = txTimestamp;
    saveState(deviceName, state);

    // 10. Write to Spreadsheet
    // txTimestamp disimpan sebagai Date object agar kolom E terbaca sebagai
    // tanggal di Sheets. Kalkulasi latency sudah selesai di atas (pakai integer).
    var txDate = txTimestamp !== null ? new Date(txTimestamp * 1000) : "";
    var dataSheet = getOrCreateSheet(SHEET_DATA, HEADERS_DATA);
    dataSheet.appendRow([
      serverTime, deviceName, batteryLevel, counter, txDate,
      rssi, snr, sf, freq, sensorValue,
      pdr, latencyMs, status, note
    ]);

    return jsonResponse({ status: "ok", pdr: pdr, latency: latencyMs, note: note });

  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// ===================================================================
//  doGet — Endpoint for React Dashboard
// ===================================================================
function doGet(e) {
  var params   = e ? (e.parameter || {}) : {};
  var limit    = params.limit    ? parseInt(params.limit) : 500;
  var device   = params.device   || null;
  var batLevel = params.batteryLevel || null;
  var sessOnly = params.session  === "true";

  var dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DATA);
  if (!dataSheet) return jsonResponse({ rows: [], error: "Sheet RawData not found" });

  var data = dataSheet.getDataRange().getValues();
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] && !r[1]) continue;

    var row = {
      timestamp    : r[0]  ? new Date(r[0]).toISOString() : "",
      device       : r[1]  || "",
      batteryLevel : r[2]  !== "" ? String(r[2])  : "",
      counter      : r[3]  !== "" ? Number(r[3])  : null,
      txTimestamp  : r[4]  !== "" ? Number(r[4])  : null,   // Unix detik dari RTC
      rssi         : r[5]  !== "" ? Number(r[5])  : null,
      snr          : r[6]  !== "" ? parseFloat(String(r[6]).replace(',', '.')) : null,
      sf           : r[7]  !== "" ? Number(r[7])  : null,
      frequency    : r[8]  !== "" ? Number(r[8])  : null,
      sensorValue  : r[9]  !== "" ? parseFloat(String(r[9]).replace(',', '.')) : null,
      pdr          : r[10] !== "" ? Number(r[10]) : null,
      latencyMs    : r[11] !== "" ? Number(r[11]) : null,
      status       : r[12] || "",
      note         : r[13] || ""
    };

    var sessionMatch = row.note.match(/PDR_SESI_(\d+)=([\d.]+)%/);
    if (sessionMatch) {
      row.pdrSession      = parseInt(sessionMatch[1]);
      row.pdrSessionValue = parseFloat(sessionMatch[2]);
    }

    if (device   && row.device               !== device)           continue;
    if (batLevel && String(row.batteryLevel) !== String(batLevel)) continue;
    if (sessOnly && !sessionMatch)                                 continue;

    rows.push(row);
  }

  if (rows.length > limit) rows = rows.slice(rows.length - limit);
  return jsonResponse({ rows: rows, count: rows.length });
}

// ===================================================================
//  HELPERS
// ===================================================================
function defaultState() {
  return {
    lastCounter: null, lastTxTimestamp: null, firstCounter: null,
    currentSession: null, windowReceived: 0,
    totalExpectedCumulative: 0, totalReceivedCumulative: 0,
    bootEpoch: null,   // dipertahankan di schema agar tidak break sheet lama
    restartCount: 0, _row: null
  };
}

function loadState(deviceName) {
  var sheet = getOrCreateSheet(SHEET_STATE, HEADERS_STATE);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === deviceName) {
      return {
        lastCounter             : data[i][1] !== "" ? Number(data[i][1]) : null,
        lastTxTimestamp         : data[i][2] !== "" ? Number(data[i][2]) : null,
        firstCounter            : data[i][3] !== "" ? Number(data[i][3]) : null,
        currentSession          : data[i][4] !== "" ? Number(data[i][4]) : null,
        windowReceived          : data[i][5] !== "" ? Number(data[i][5]) : 0,
        totalExpectedCumulative : data[i][6] !== "" ? Number(data[i][6]) : 0,
        totalReceivedCumulative : data[i][7] !== "" ? Number(data[i][7]) : 0,
        bootEpoch               : data[i][8] !== "" ? Number(data[i][8]) : null,
        restartCount            : data[i][9] !== "" ? Number(data[i][9]) : 0,
        _row: i + 1
      };
    }
  }
  return defaultState();
}

function saveState(deviceName, state) {
  var sheet = getOrCreateSheet(SHEET_STATE, HEADERS_STATE);
  var rowData = [
    deviceName,
    state.lastCounter       !== null ? state.lastCounter       : "",
    state.lastTxTimestamp   !== null ? state.lastTxTimestamp   : "",
    state.firstCounter      !== null ? state.firstCounter      : "",
    state.currentSession    !== null ? state.currentSession    : "",
    state.windowReceived,
    state.totalExpectedCumulative,
    state.totalReceivedCumulative,
    state.bootEpoch         !== null ? state.bootEpoch         : "",
    state.restartCount
  ];
  if (state._row) sheet.getRange(state._row, 1, 1, rowData.length).setValues([rowData]);
  else            sheet.appendRow(rowData);
}

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function parseIntOrNull(val) {
  if (val === undefined || val === null || val === "") return null;
  var n = parseInt(val, 10); return isNaN(n) ? null : n;
}

// ===================================================================
//  RESET FUNCTIONS (jalankan manual via editor)
// ===================================================================
function resetAll()       { resetRawData(); resetNodeState(); Logger.log("✓ Semua data direset."); }
function resetRawData()   { var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DATA);  if (sheet && sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1); }
function resetNodeState() { var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_STATE); if (sheet && sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1); }
