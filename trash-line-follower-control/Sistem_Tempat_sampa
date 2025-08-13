// === ROBOT LINE FOLLOWER PID HYBRID + STATE MACHINE (analogWrite) ===
// Fitur:
// - PID line follower (maju & mundur)
// - Konfirmasi 5 detik saat distance2 <= thresholdPenuh (volume sampah penuh)
// - Persimpangan (semua sensor hitam) = sampai waste center (BUANG)
// - Status & indikator:
//   * IDLE: Hijau stabil (kosong)
//   * CONFIRM_FULL: validasi 5 detik
//   * OTW: Kuning blink + beep panjang awal (nada sedang)
//   * MASALAH: Merah blink + beep cepat nada tinggi (obstacle/keluar jalur)
//   * BUANG: Merah stabil + beep panjang nada sedang
//   * BALIK: Kuning blink + beep panjang awal, line-following mundur sampai persimpangan (posisi awal)

#include "pitches.h"

// ================= PIN DEFINITIONS =================
#define SENSOR_KIRI_PIN   25
#define SENSOR_TENGAH_PIN 26
#define SENSOR_KANAN_PIN  27

// Motor kanan
#define ENA_PIN  23
#define IN1_PIN  19
#define IN2_PIN  18

// Motor kiri
#define ENB_PIN  22
#define IN3_PIN  5
#define IN4_PIN  17

// Ultrasonik
#define trigPin1 9    // depan / obstacle
#define echoPin1 10
#define trigPin2 15   // ketinggian sampah
#define echoPin2 16

// LED & Buzzer
#define ledMerah   11
#define ledKuning  12
#define ledHijau   13
#define BUZZER_PIN 14

// ================= SETTINGS =================
#define GARIS_HITAM LOW
const int   BASE_SPEED          = 200; // 0..255
const float thresholdPenuh      = 10.0; // cm (sampah dianggap "penuh" jika <= ini)
const float thresholdObstacle   = 10.0; // cm (ada halangan di depan)
const unsigned long BLINK_Y_MS  = 500; // blink kuning
const unsigned long BLINK_R_MS  = 200; // blink merah
const unsigned long CONFIRM_MS  = 5000; // 5 detik konfirmasi penuh

// PID (maju)
float Kp = 40, Ki = 0.0, Kd = 25;
float error = 0, lastError = 0, integral = 0;

// PID (mundur) — bisa beda gain jika perlu
float Kp_back = 40, Ki_back = 0.0, Kd_back = 25;
float errorB = 0, lastErrorB = 0, integralB = 0;

// ================= STATE MACHINE =================
enum RobotState { STATE_IDLE, STATE_CONFIRM_FULL, STATE_OTW, STATE_MASALAH, STATE_BUANG, STATE_BALIK };
RobotState state = STATE_IDLE;
RobotState prevState = STATE_IDLE;

unsigned long confirmStart = 0;
float initialDistance2 = 0;

unsigned long ledYPrev = 0;
unsigned long ledRPrev = 0;

bool otwBeeped = false;
bool balikBeeped = false;

// ================= HELPER: Motors =================
void motorKiri(int kecepatan) {
  kecepatan = constrain(kecepatan, -255, 255);
  if (kecepatan > 0) { digitalWrite(IN3_PIN, HIGH); digitalWrite(IN4_PIN, LOW); }
  else if (kecepatan < 0) { digitalWrite(IN3_PIN, LOW); digitalWrite(IN4_PIN, HIGH); }
  else { digitalWrite(IN3_PIN, LOW); digitalWrite(IN4_PIN, LOW); }
  analogWrite(ENB_PIN, abs(kecepatan));
}

void motorKanan(int kecepatan) {
  kecepatan = constrain(kecepatan, -255, 255);
  if (kecepatan > 0) { digitalWrite(IN1_PIN, HIGH); digitalWrite(IN2_PIN, LOW); }
  else if (kecepatan < 0) { digitalWrite(IN1_PIN, LOW); digitalWrite(IN2_PIN, HIGH); }
  else { digitalWrite(IN1_PIN, LOW); digitalWrite(IN2_PIN, LOW); }
  analogWrite(ENA_PIN, abs(kecepatan));
}

void motorStop() { motorKiri(0); motorKanan(0); }

// ================= HELPER: Sensors =================
float bacaUltrasonik(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW); delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long durasi = pulseIn(echoPin, HIGH, 30000UL); // timeout 30ms
  if (durasi == 0) return 9999.0; // jika timeout, anggap jauh
  return (durasi * 0.0343f) / 2.0f;
}

// ================= HELPER: Indicators =================
void setLED(bool r, bool y, bool g) {
  digitalWrite(ledMerah,   r ? HIGH : LOW);
  digitalWrite(ledKuning,  y ? HIGH : LOW);
  digitalWrite(ledHijau,   g ? HIGH : LOW);
}

void blinkKuning() {
  unsigned long now = millis();
  if (now - ledYPrev >= BLINK_Y_MS) {
    ledYPrev = now;
    digitalWrite(ledKuning, !digitalRead(ledKuning));
  }
  digitalWrite(ledMerah, LOW);
  digitalWrite(ledHijau, LOW);
}

void blinkMerah() {
  unsigned long now = millis();
  if (now - ledRPrev >= BLINK_R_MS) {
    ledRPrev = now;
    digitalWrite(ledMerah, !digitalRead(ledMerah));
  }
  digitalWrite(ledKuning, LOW);
  digitalWrite(ledHijau, LOW);
}

void beepSekaliPanjang(int freq, int durMs) { tone(BUZZER_PIN, freq, durMs); }
void beepCepatTinggi() { tone(BUZZER_PIN, NOTE_C6, 100); } // dipanggil terus di MASALAH
void beepLamaSedang() { tone(BUZZER_PIN, NOTE_A4, 500); }  // BUANG

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(IN1_PIN, OUTPUT); pinMode(IN2_PIN, OUTPUT);
  pinMode(IN3_PIN, OUTPUT); pinMode(IN4_PIN, OUTPUT);
  pinMode(ENA_PIN, OUTPUT); pinMode(ENB_PIN, OUTPUT);

  pinMode(SENSOR_KIRI_PIN, INPUT_PULLUP);
  pinMode(SENSOR_TENGAH_PIN, INPUT_PULLUP);
  pinMode(SENSOR_KANAN_PIN, INPUT_PULLUP);

  pinMode(trigPin1, OUTPUT); pinMode(echoPin1, INPUT);
  pinMode(trigPin2, OUTPUT); pinMode(echoPin2, INPUT);

  pinMode(ledMerah, OUTPUT); pinMode(ledKuning, OUTPUT); pinMode(ledHijau, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  setLED(false,false,true); // hijau ON (idle)
  Serial.println("Robot Line Follower PID Hybrid + State Machine READY");
}

// ================= LINE FOLLOW (FORWARD) =================
void followLineForward(bool kiri, bool tengah, bool kanan) {
  // hitung error (maju)
  if (kiri && !tengah && !kanan) error = -1;
  else if (!kiri && tengah && !kanan) error = 0;
  else if (!kiri && !tengah && kanan) error = 1;
  else if (kiri && tengah && !kanan) error = -0.5;
  else if (!kiri && tengah && kanan) error = 0.5;
  else error = lastError; // kehilangan garis -> pakai error terakhir

  integral += error;
  float derivative = error - lastError;
  float correction = (Kp * error) + (Ki * integral) + (Kd * derivative);
  lastError = error;

  int left  = BASE_SPEED + correction;
  int right = BASE_SPEED - correction;

  motorKiri(left);
  motorKanan(right);
}

// ================= LINE FOLLOW (REVERSE) =================
// saat mundur, arah koreksi dibalik agar tetap mengikuti garis
void followLineReverse(bool kiri, bool tengah, bool kanan) {
  // error untuk mundur: kebalikan dari maju
  if (kiri && !tengah && !kanan) errorB = +1;
  else if (!kiri && tengah && !kanan) errorB = 0;
  else if (!kiri && !tengah && kanan) errorB = -1;
  else if (kiri && tengah && !kanan) errorB = +0.5;
  else if (!kiri && tengah && kanan) errorB = -0.5;
  else errorB = lastErrorB;

  integralB += errorB;
  float derivative = errorB - lastErrorB;
  float correction = (Kp_back * errorB) + (Ki_back * integralB) + (Kd_back * derivative);
  lastErrorB = errorB;

  // kecepatan negatif = mundur
  int left  = -(BASE_SPEED + correction);
  int right = -(BASE_SPEED - correction);

  motorKiri(left);
  motorKanan(right);
}

// ================= MAIN LOOP =================
void loop() {
  float distance1 = bacaUltrasonik(trigPin1, echoPin1); // depan (obstacle)
  float distance2 = bacaUltrasonik(trigPin2, echoPin2); // ketinggian sampah

  bool kiri   = (digitalRead(SENSOR_KIRI_PIN)   == GARIS_HITAM);
  bool tengah = (digitalRead(SENSOR_TENGAH_PIN) == GARIS_HITAM);
  bool kanan  = (digitalRead(SENSOR_KANAN_PIN)  == GARIS_HITAM);
  bool persimpangan = (kiri && tengah && kanan);
  bool kehilanganGaris = (!kiri && !tengah && !kanan);

  // deteksi transisi state untuk one-shot actions
  if (state != prevState) {
    if (state == STATE_OTW) { otwBeeped = false; }
    if (state == STATE_BALIK) { balikBeeped = false; }
    prevState = state;
  }

  switch (state) {
    case STATE_IDLE: {
      setLED(false,false,true); // hijau ON
      noTone(BUZZER_PIN);
      motorStop();

      // jika tempat sampah penuh -> masuk konfirmasi
      if (distance2 <= thresholdPenuh) {
        state = STATE_CONFIRM_FULL;
        confirmStart = millis();
        initialDistance2 = distance2;
        Serial.println("Idle -> Confirm Full (start 5s)");
      }
    } break;

    case STATE_CONFIRM_FULL: {
      // jika selama konfirmasi 5 detik ketinggian berkurang -> reset ke IDLE
      if (distance2 > initialDistance2) {
        state = STATE_IDLE;
        Serial.println("Confirm Full -> Cancel (berkurang)");
        break;
      }
      // jika sudah 5 detik dan tidak berkurang -> OTW
      if (millis() - confirmStart >= CONFIRM_MS) {
        state = STATE_OTW;
        Serial.println("Confirm Full -> OTW");
      }
      // indikator tetap hijau agar tidak membingungkan
      setLED(false,false,true);
    } break;

    case STATE_OTW: {
      // indikator
      blinkKuning();
      if (!otwBeeped) { beepSekaliPanjang(NOTE_A4, 500); otwBeeped = true; }

      // prioritas masalah
      if (distance1 <= thresholdObstacle || kehilanganGaris) {
        state = STATE_MASALAH;
        Serial.println("OTW -> MASALAH");
        break;
      }

      // sampai waste center (persimpangan)
      if (persimpangan) {
        motorStop();
        state = STATE_BUANG;
        Serial.println("OTW -> BUANG (persimpangan terdeteksi)");
        break;
      }

      // PID maju
      followLineForward(kiri, tengah, kanan);
    } break;

    case STATE_MASALAH: {
      blinkMerah();
      beepCepatTinggi();
      motorStop();

      // recover jika obstacle hilang dan garis ditemukan lagi
      if (distance1 > thresholdObstacle && !kehilanganGaris) {
        state = STATE_OTW;
        Serial.println("MASALAH -> OTW (recovered)");
      }
    } break;

    case STATE_BUANG: {
      // merah stabil + beep lama nada sedang, menunggu petugas buang
      setLED(true,false,false);
      beepLamaSedang();
      motorStop();

      // Jika sampah sudah kosong (naik di atas threshold penuh) -> BALIK
      if (distance2 > thresholdPenuh) {
        state = STATE_BALIK;
        Serial.println("BUANG -> BALIK (kosong)");
      }
    } break;

    case STATE_BALIK: {
      // indikator
      blinkKuning();
      if (!balikBeeped) { beepSekaliPanjang(NOTE_A4, 500); balikBeeped = true; }

      // kita gunakan persimpangan sebagai "posisi awal" juga
      // ketika ketemu persimpangan saat mundur -> kembali IDLE
      if (persimpangan) {
        motorStop();
        state = STATE_IDLE;
        Serial.println("BALIK -> IDLE (posisi awal)");
        break;
      }

      // PID mundur
      followLineReverse(kiri, tengah, kanan);

      // jika obstacle depan terdeteksi saat mundur, bisa abaikan
      // atau treat as MASALAH; di sini kita treat sebagai masalah juga
      if (distance1 <= thresholdObstacle) {
        state = STATE_MASALAH;
        Serial.println("BALIK -> MASALAH (obstacle)");
      }
    } break;
  }

  // debug ringan
  // Serial.print("d1:"); Serial.print(distance1);
  // Serial.print(" d2:"); Serial.print(distance2);
  // Serial.print(" | S:"); Serial.print((int)state);
  // Serial.print(" | K:"); Serial.print(kiri);
  // Serial.print(tengah); Serial.println(kanan);
}
