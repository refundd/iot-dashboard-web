// ChirpStack v4 Codec for LoRaWAN Node
// Decode uplink function.
//
// Payload format (7 bytes total):
// Byte 0-3: tx_timestamp (uint32_t, Unix timestamp from RTC)
// Byte 4:   battery_pct (uint8_t, 0-100%)
// Byte 5-6: adc_ph (uint16_t, pH value * 100)

function decodeUplink(input) {
  var data = {};
  
  if (input.bytes.length >= 7) {
    // 1. Decode tx_timestamp (4 bytes, Big-Endian)
    data.tx_timestamp = (input.bytes[0] << 24) |
                        (input.bytes[1] << 16) |
                        (input.bytes[2] << 8)  |
                         input.bytes[3];
                         
    // Convert to unsigned in JS
    data.tx_timestamp = data.tx_timestamp >>> 0; 
    
    // 2. Decode battery_pct (1 byte)
    data.battery_pct = input.bytes[4];
    
    // 3. Decode adc_ph (2 bytes, Big-Endian)
    data.adc_ph = (input.bytes[5] << 8) | input.bytes[6];
  }
  
  return {
    data: data,
    warnings: [],
    errors: []
  };
}
