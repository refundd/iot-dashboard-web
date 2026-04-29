// Google Apps Script (Webhook Receiver for ChirpStack)
// This script receives the HTTP POST from ChirpStack, logs it to a Google Sheet, 
// and forwards it to the Node.js backend.

var SHEET_NAME = "DataLog";
var BACKEND_URL = "http://YOUR_BACKEND_IP:3000/api/telemetry"; // Ganti dengan IP Node.js server Anda

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    
    // Pastikan ini adalah event uplink dari ChirpStack
    if (payload.event === "up") {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
      if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
        sheet.appendRow(["Timestamp", "Device", "Counter", "Sensor Value", "Battery Level", "RSSI", "SNR", "SF", "Frequency", "Signal Status"]);
      }
      
      var timestamp = new Date();
      var deviceName = payload.deviceInfo.deviceName;
      var counter = payload.fCnt;
      
      var rxInfo = payload.rxInfo && payload.rxInfo.length > 0 ? payload.rxInfo[0] : {};
      var txInfo = payload.txInfo || {};
      
      var rssi = rxInfo.rssi || 0;
      var snr = rxInfo.snr || 0;
      var sf = (txInfo.modulation && txInfo.modulation.lora) ? txInfo.modulation.lora.spreadingFactor : 0;
      var freq = txInfo.frequency || 0;
      
      var object = payload.object || {};
      var sensorValue = object.ph || 0;
      var batteryLevel = object.batteryLevel || 100;
      
      var signalStatus = (rssi > -90) ? "Excellent" : ((rssi > -105) ? "Good" : "Weak");
      
      // 1. Simpan ke Google Sheet
      sheet.appendRow([timestamp, deviceName, counter, sensorValue, batteryLevel, rssi, snr, sf, freq, signalStatus]);
      
      // 2. Teruskan (Forward) ke Node.js Backend untuk Dashboard Real-time
      var backendPayload = {
        device_id: deviceName,
        counter: counter,
        sensorValue: sensorValue,
        batteryLevel: batteryLevel,
        rssi: rssi,
        snr: snr,
        sf: sf,
        frequency: freq,
        signalStatus: signalStatus
      };
      
      var options = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(backendPayload),
        "muteHttpExceptions": true
      };
      
      UrlFetchApp.fetch(BACKEND_URL, options);
      
      return ContentService.createTextOutput(JSON.stringify({"status": "success"})).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput("Ignored event");
  } catch(error) {
    return ContentService.createTextOutput("Error: " + error.toString());
  }
}

// Handler GET request (digunakan oleh Frontend Dashboard untuk mengambil history jika webhook mati)
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var rowObject = {};
    for (var j = 0; j < headers.length; j++) {
      rowObject[headers[j]] = data[i][j];
    }
    rows.push(rowObject);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ "rows": rows })).setMimeType(ContentService.MimeType.JSON);
}
