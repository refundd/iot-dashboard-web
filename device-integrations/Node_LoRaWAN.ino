#include <lmic.h>
#include <hal/hal.h>
#include <SPI.h>

// ========== LORAWAN KEYS (ABP Configuration) ==========
// LoRaWAN NwkSKey, network session key
static const PROGMEM u1_t NWKSKEY[16] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

// LoRaWAN AppSKey, application session key
static const u1_t PROGMEM APPSKEY[16] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

// LoRaWAN end-device address (DevAddr)
static const u4_t DEVADDR = 0x00000000;

// These callbacks are only used in OTAA, leave empty for ABP.
void os_getArtEui (u1_t* buf) { }
void os_getDevEui (u1_t* buf) { }
void os_getDevKey (u1_t* buf) { }

static uint8_t mydata[3];
static osjob_t sendjob;
const unsigned TX_INTERVAL = 60; // Send interval in seconds

// Pin mapping (Sesuaikan dengan modul LoRa Anda, misal Dragino Shield)
const lmic_pinmap lmic_pins = {
    .nss = 10,
    .rxtx = LMIC_UNUSED_PIN,
    .rst = 9,
    .dio = {2, 6, 7},
};

void onEvent (ev_t ev) {
    if (ev == EV_TXCOMPLETE) {
        Serial.println(F("EV_TXCOMPLETE (Packet Sent)"));
        // Schedule next transmission
        os_setTimedCallback(&sendjob, os_getTime()+sec2osticks(TX_INTERVAL), do_send);
    }
}

void do_send(osjob_t* j){
    if (LMIC.opmode & OP_TXRXPEND) {
        Serial.println(F("OP_TXRXPEND, not sending"));
    } else {
        // --- BACA SENSOR DISINI ---
        // Contoh data dummy untuk pH dan Battery
        float phValue = 7.32; // Ganti dengan logika baca sensor analogRead(A0)
        uint8_t batteryLevel = 95; // 0-100%

        // Encode Payload (Sesuaikan dengan ChirpStack Codec)
        // Byte 0-1: pH * 100 (contoh: 7.32 * 100 = 732)
        // Byte 2: Battery %
        uint16_t phEncoded = phValue * 100;
        mydata[0] = phEncoded >> 8;
        mydata[1] = phEncoded & 0xFF;
        mydata[2] = batteryLevel;

        // Prepare upstream data transmission at the next possible time.
        LMIC_setTxData2(1, mydata, sizeof(mydata), 0);
        Serial.println(F("Packet queued"));
    }
}

void setup() {
    Serial.begin(115200);
    Serial.println(F("Starting LoRaWAN Node..."));

    // LMIC init
    os_init();
    LMIC_reset();

    uint8_t appskey[sizeof(APPSKEY)];
    uint8_t nwkskey[sizeof(NWKSKEY)];
    memcpy_P(appskey, APPSKEY, sizeof(APPSKEY));
    memcpy_P(nwkskey, NWKSKEY, sizeof(NWKSKEY));
    LMIC_setSession (0x1, DEVADDR, nwkskey, appskey);

    // Disable link check validation (for ABP)
    LMIC_setLinkCheckMode(0);
    
    // Set data rate and transmit power (SF7)
    LMIC.dn2Dr = DR_SF9;
    LMIC_setDrTxpow(DR_SF7,14);

    // Start job
    do_send(&sendjob);
}

void loop() {
    os_runloop_once();
}
