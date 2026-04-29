#include <lmic.h>
#include <hal/hal.h>
#include <SPI.h>

// Jika Anda menggunakan library RTClib untuk DS3231, sertakan ini:
// #include <Wire.h>
// #include "RTClib.h"
// RTC_DS3231 rtc;

// ========== LORAWAN KEYS (ABP Configuration) ==========
// LoRaWAN NwkSKey, network session key
static const PROGMEM u1_t NWKSKEY[16] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

// LoRaWAN AppSKey, application session key
static const u1_t PROGMEM APPSKEY[16] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

// LoRaWAN end-device address (DevAddr)
static const u4_t DEVADDR = 0x00000000;

void os_getArtEui (u1_t* buf) { }
void os_getDevEui (u1_t* buf) { }
void os_getDevKey (u1_t* buf) { }

// Payload (7 bytes)
static uint8_t mydata[7];
static osjob_t sendjob;
const unsigned TX_INTERVAL = 60; // Send interval in seconds

// Pin mapping (Sesuaikan dengan modul LoRa Anda)
const lmic_pinmap lmic_pins = {
    .nss = 10,
    .rxtx = LMIC_UNUSED_PIN,
    .rst = 9,
    .dio = {2, 6, 7},
};

void onEvent (ev_t ev) {
    if (ev == EV_TXCOMPLETE) {
        Serial.println(F("EV_TXCOMPLETE (Packet Sent)"));
        os_setTimedCallback(&sendjob, os_getTime()+sec2osticks(TX_INTERVAL), do_send);
    }
}

void do_send(osjob_t* j){
    if (LMIC.opmode & OP_TXRXPEND) {
        Serial.println(F("OP_TXRXPEND, not sending"));
    } else {
        // --- BACA SENSOR & RTC ---
        // 1. tx_timestamp (Dari RTC module)
        // DateTime now = rtc.now();
        // uint32_t tx_timestamp = now.unixtime();
        uint32_t tx_timestamp = 1714000000; // Contoh dummy unix timestamp
        
        // 2. battery_pct
        uint8_t batteryLevel = 98; // Contoh baca dari pin analog (0-100%)
        
        // 3. adc_ph (dikali 100)
        float phValue = 7.25; 
        uint16_t phEncoded = (uint16_t)(phValue * 100);

        // --- ENCODE PAYLOAD (Sesuai Codec) ---
        // Byte 0-3: tx_timestamp
        mydata[0] = (tx_timestamp >> 24) & 0xFF;
        mydata[1] = (tx_timestamp >> 16) & 0xFF;
        mydata[2] = (tx_timestamp >> 8) & 0xFF;
        mydata[3] = tx_timestamp & 0xFF;
        
        // Byte 4: battery_pct
        mydata[4] = batteryLevel;
        
        // Byte 5-6: adc_ph
        mydata[5] = (phEncoded >> 8) & 0xFF;
        mydata[6] = phEncoded & 0xFF;

        // Prepare upstream data transmission
        LMIC_setTxData2(1, mydata, sizeof(mydata), 0);
        Serial.println(F("Packet queued"));
    }
}

void setup() {
    Serial.begin(115200);
    Serial.println(F("Starting LoRaWAN Node..."));

    // if (!rtc.begin()) { Serial.println("Couldn't find RTC"); }

    os_init();
    LMIC_reset();

    uint8_t appskey[sizeof(APPSKEY)];
    uint8_t nwkskey[sizeof(NWKSKEY)];
    memcpy_P(appskey, APPSKEY, sizeof(APPSKEY));
    memcpy_P(nwkskey, NWKSKEY, sizeof(NWKSKEY));
    LMIC_setSession (0x1, DEVADDR, nwkskey, appskey);

    LMIC_setLinkCheckMode(0);
    LMIC.dn2Dr = DR_SF9;
    LMIC_setDrTxpow(DR_SF7,14);

    do_send(&sendjob);
}

void loop() {
    os_runloop_once();
}
