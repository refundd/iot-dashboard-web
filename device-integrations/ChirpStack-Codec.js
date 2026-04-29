// ChirpStack v4 Codec for LoRaWAN Water Quality Node
// Function to decode uplink payloads.
// 
// Payload format (3 bytes minimum):
// Byte 0-1: pH value (multiplied by 100 to send as integer)
// Byte 2: Battery Level (0-100%)

function decodeUplink(input) {
  var data = {};
  
  if (input.bytes.length >= 3) {
    // Decode pH (e.g., 7.32 is sent as 732)
    // Shift byte 0 by 8 bits and bitwise OR with byte 1
    data.ph = ((input.bytes[0] << 8) | input.bytes[1]) / 100.0;
    
    // Decode Battery Level
    data.batteryLevel = input.bytes[2];
  }
  
  return {
    data: data,
    warnings: [],
    errors: []
  };
}
