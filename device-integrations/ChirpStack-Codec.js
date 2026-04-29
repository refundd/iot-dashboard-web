function decodeUplink(input) {
  var bytes = input.bytes;
  var data = {};
 
  // 1. Payload Original (Minimal 3 byte)
  if (bytes.length >= 3) {
    data.adc_ph      = (bytes[0] << 8) | bytes[1];
    data.battery_pct = bytes[2];
  }
 
  // 2. Payload Baru: RTC Timestamp & App Counter (9 byte)
  if (bytes.length >= 9) {
    // Unix timestamp (detik) dari DS3231 — dikirim saat TX
    var ts = ((bytes[3] << 24) | (bytes[4] << 16) | (bytes[5] << 8) | bytes[6]) >>> 0;
    data.tx_timestamp     = ts;
    data.tx_timestamp_iso = new Date(ts * 1000).toISOString(); // e.g. "2025-04-19T08:30:00.000Z"
 
    // App counter
    data.counter = (bytes[7] << 8) | bytes[8];
  }
 
  return {
    data:     data,
    warnings: [],
    errors:   []
  };
}
