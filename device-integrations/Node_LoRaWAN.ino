// ═══════════════════════════════════════════════════════════
//  LoRaWAN REAL NODE — ESP32 + DS3231 (pH & Batt Dummy)
// ═══════════════════════════════════════════════════════════
#include <lmic.h>
#include <hal/hal.h>
#include <SPI.h>
#include <Wire.h>
#include <RTClib.h>
#include "DFRobot_ESP_PH.h"
#include <EEPROM.h>

#define PH_PIN   36
#define BATT_PIN 34

#define ESPADC       4095.0
#define ESPVOLTAGE   3300.0
#define BATT_OFFSET  0.354
#define BATT_R1      10000.0
#define BATT_R2      10000.0
#define BATT_FACTOR  ((BATT_R1 + BATT_R2) / BATT_R2)

// ─── Mode ─────────────────────────────────────────────────────────────────────
// 0 = dummy (pH & baterai = 0)
// 1 = real (baca sensor pH & baterai)
#define SENSOR_MODE 0

DFRobot_ESP_PH ph;
RTC_DS3231 rtc;
static bool rtcOk = false;

// ─── Kredensial ABP ───────────────────────────────────────────────────────────
static u4_t DEVADDR = 0x0076E6C6;
static u1_t NWKSKEY[16] = { 0x1B, 0xC8, 0xA5, 0x70, 0x29, 0x26, 0x62, 0xAF, 0x07, 0xBB, 0xB2, 0x3D, 0x0A, 0xFA, 0x51, 0x86 };
static u1_t APPSKEY[16] = { 0x17, 0x37, 0x9C, 0xE0, 0x4F, 0x09, 0x60, 0x2E, 0x6C, 0xC3, 0xFF, 0x35, 0x75, 0xD4, 0xDA, 0x9A };

void os_getArtEui (u1_t* buf) { }
void os_getDevEui (u1_t* buf) { }
void os_getDevKey (u1_t* buf) { }

// Payload 9 byte:
// [0][1] = pH x100 (uint16)
// [2]    = Battery %
// [3][4][5][6] = Unix Timestamp dari RTC (uint32)
// [7][8] = App counter (uint16)
static uint8_t mydata[9];
static uint16_t app_counter = 0;
static osjob_t sendjob;
const unsigned TX_INTERVAL = 5;

// ─── Pin Mapping ──────────────────────────────────────────────────────────────
const lmic_pinmap lmic_pins = {
    .nss  = 13,
    .rxtx = LMIC_UNUSED_PIN,
    .rst  = 16,
    .dio  = {27, 17, LMIC_UNUSED_PIN},
};

// ─── Fungsi Baterai ───────────────────────────────────────────────────────────
float readBattVoltage() {
    int raw = analogRead(BATT_PIN);
    float vADC = (float)raw / ESPADC * ESPVOLTAGE / 1000.0;
    return (vADC * BATT_FACTOR) - BATT_OFFSET;
}

int battToPercent(float v) {
    const float voltTable[] = { 4.20, 4.15, 4.11, 4.08, 4.02, 3.98, 3.95, 3.91, 3.87, 3.83,
                                 3.79, 3.75, 3.71, 3.67, 3.63, 3.59, 3.55, 3.51, 3.45, 3.40, 3.30 };
    const int   pctTable[]  = { 100,   95,   90,   85,   80,   75,   70,   65,   60,   55,
                                  50,   45,   40,   35,   30,   25,   20,   15,   10,    5,    0 };
    const int TABLE_SIZE = 21;

    if (v >= voltTable[0]) return 100;
    if (v <= voltTable[TABLE_SIZE - 1]) return 0;

    for (int i = 0; i < TABLE_SIZE - 1; i++) {
        if (v >= voltTable[i + 1]) {
            float vHigh = voltTable[i];
            float vLow  = voltTable[i + 1];
            int   pHigh = pctTable[i];
            int   pLow  = pctTable[i + 1];
            return pLow + (int)((v - vLow) / (vHigh - vLow) * (pHigh - pLow));
        }
    }
    return 0;
}

// ─── LoRaWAN Logic ────────────────────────────────────────────────────────────
void onEvent(ev_t ev) {
    if (ev == EV_TXCOMPLETE) {
        Serial.println(F("TX_DONE"));
        os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(TX_INTERVAL), do_send);
    }
}

void do_send(osjob_t* j) {
    if (LMIC.opmode & OP_TXRXPEND) {
        Serial.println(F("OP_TXRXPEND, not sending"));
        return;
    }

    uint16_t phEncoded;
    uint8_t battPct;

#if SENSOR_MODE == 1
    // Mode real — baca sensor
    float voltage = analogRead(PH_PIN) / ESPADC * ESPVOLTAGE;
    float phValue = ph.readPH(voltage, 25.0);
    phEncoded = (uint16_t)(phValue * 100);

    float vBatt = readBattVoltage();
    battPct = battToPercent(vBatt);

    Serial.print(F("pH: "));      Serial.print(phValue, 2);
    Serial.print(F(" | Batt: ")); Serial.print(vBatt, 2);
    Serial.print(F("V ("));       Serial.print(battPct);
    Serial.print(F("%) | "));
#else
    // Mode dummy
    phEncoded = 0;
    battPct   = 0;
    Serial.print(F("[DUMMY] | "));
#endif

    uint32_t currentTs = rtcOk ? rtc.now().unixtime() : (uint32_t)(millis() / 1000UL);
    app_counter++;

    mydata[0] = highByte(phEncoded);
    mydata[1] = lowByte(phEncoded);
    mydata[2] = battPct;
    mydata[3] = (currentTs >> 24) & 0xFF;
    mydata[4] = (currentTs >> 16) & 0xFF;
    mydata[5] = (currentTs >> 8)  & 0xFF;
    mydata[6] = currentTs & 0xFF;
    mydata[7] = highByte(app_counter);
    mydata[8] = lowByte(app_counter);

    LMIC_setTxData2(1, mydata, sizeof(mydata), 0);

    Serial.print(F("TS: "));         Serial.print(currentTs);
    Serial.print(F(" | Counter: ")); Serial.println(app_counter);
    Serial.println(F("Packet Queued"));
}

void setup() {
    Serial.begin(115200);
    EEPROM.begin(32);

    Wire.begin();
    rtcOk = rtc.begin();
    if (!rtcOk) {
        Serial.println(F("[WARN] RTC tidak ditemukan — fallback menggunakan uptime (detik)"));
    } else {
        if (rtc.lostPower()) {
            Serial.println(F("[WARN] RTC lost power — pastikan waktu diatur ulang"));
        }
        Serial.println(F("[OK] RTC Ready"));
    }

    pinMode(15, OUTPUT);
    digitalWrite(15, LOW);
    delay(1000);

    ph.begin();

    os_init();
    LMIC_reset();
    LMIC_setSession(0x13, DEVADDR, NWKSKEY, APPSKEY);
    LMIC_setLinkCheckMode(0);
    LMIC_setDrTxpow(DR_SF7, 14);

#if SENSOR_MODE == 0
    Serial.println(F("[MODE] DUMMY — pH & Batt = 0"));
#else
    Serial.println(F("[MODE] REAL — baca sensor pH & Batt"));
#endif

    do_send(&sendjob);
}

void loop() {
    os_runloop_once();
}
