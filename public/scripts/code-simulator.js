(() => {
  const snippets = [
    {
      id: "wifi-scan",
      title: "Escaner WiFi pasivo",
      titleEn: "Passive WiFi scanner",
      file: "wifi_spectrum_scan.ino",
      language: "C++ / ESP32",
      code: String.raw`#include <WiFi.h>

struct NetworkSample {
  String ssid;
  int32_t rssi;
  uint8_t channel;
  wifi_auth_mode_t security;
};

void printHeader() {
  Serial.println("\n[ ESP32 PASSIVE WIFI SCANNER ]");
  Serial.println("CH  RSSI  SECURITY  SSID");
  Serial.println("--  ----  --------  ----------------");
}

void scanSpectrum() {
  int count = WiFi.scanNetworks(false, true);
  printHeader();

  for (int i = 0; i < count; i++) {
    NetworkSample sample {
      WiFi.SSID(i),
      WiFi.RSSI(i),
      WiFi.channel(i),
      WiFi.encryptionType(i)
    };

    Serial.printf("%02u  %4d  %8u  %s\n",
      sample.channel,
      sample.rssi,
      sample.security,
      sample.ssid.c_str());
  }

  WiFi.scanDelete();
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(250);
}

void loop() {
  scanSpectrum();
  delay(8000);
}`
    },
    {
      id: "ble-scan",
      title: "Monitor BLE de laboratorio",
      titleEn: "Lab BLE monitor",
      file: "ble_lab_monitor.ino",
      language: "C++ / ESP32",
      code: String.raw`#include <NimBLEDevice.h>

class LabAdvertisedCallbacks : public NimBLEAdvertisedDeviceCallbacks {
  void onResult(NimBLEAdvertisedDevice* device) override {
    Serial.printf("[BLE] %s | RSSI %d",
      device->getAddress().toString().c_str(),
      device->getRSSI());

    if (device->haveName()) {
      Serial.printf(" | %s", device->getName().c_str());
    }

    if (device->haveServiceUUID()) {
      Serial.printf(" | UUID %s",
        device->getServiceUUID().toString().c_str());
    }

    Serial.println();
  }
};

void setup() {
  Serial.begin(115200);
  NimBLEDevice::init("ESP32-LAB-MONITOR");

  NimBLEScan* scanner = NimBLEDevice::getScan();
  scanner->setAdvertisedDeviceCallbacks(new LabAdvertisedCallbacks());
  scanner->setActiveScan(false);
  scanner->setInterval(90);
  scanner->setWindow(45);
}

void loop() {
  NimBLEScan* scanner = NimBLEDevice::getScan();
  Serial.println("\nStarting passive BLE window...");
  scanner->start(5, false);
  scanner->clearResults();
  delay(2000);
}`
    },
    {
      id: "esp-now",
      title: "Telemetria ESP-NOW",
      titleEn: "ESP-NOW telemetry",
      file: "espnow_telemetry.ino",
      language: "C++ / ESP32",
      code: String.raw`#include <WiFi.h>
#include <esp_now.h>

struct TelemetryPacket {
  uint32_t sequence;
  float temperature;
  float voltage;
  uint32_t uptime;
};

uint8_t receiver[] = {0x24, 0x6F, 0x28, 0x00, 0x00, 0x01};
uint32_t sequenceId = 0;

void onPacketSent(const uint8_t* mac, esp_now_send_status_t status) {
  Serial.printf("Packet status: %s\n",
    status == ESP_NOW_SEND_SUCCESS ? "DELIVERED" : "RETRY");
}

void setupPeer() {
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, receiver, 6);
  peer.channel = 1;
  peer.encrypt = false;
  esp_now_add_peer(&peer);
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }

  esp_now_register_send_cb(onPacketSent);
  setupPeer();
}

void loop() {
  TelemetryPacket packet {
    ++sequenceId,
    24.5f,
    4.08f,
    millis()
  };

  esp_now_send(receiver, reinterpret_cast<uint8_t*>(&packet), sizeof(packet));
  delay(1500);
}`
    },
    {
      id: "mqtt",
      title: "Cliente MQTT seguro",
      titleEn: "Secure MQTT client",
      file: "mqtt_secure_node.ino",
      language: "C++ / ESP32",
      code: String.raw`#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

WiFiClientSecure tlsClient;
PubSubClient mqtt(tlsClient);

const char* broker = "mqtt.example.net";
const uint16_t brokerPort = 8883;

void connectBroker() {
  while (!mqtt.connected()) {
    String clientId = "esp32-lab-" + String((uint32_t)ESP.getEfuseMac(), HEX);

    if (mqtt.connect(clientId.c_str())) {
      mqtt.subscribe("lab/esp32/commands");
      mqtt.publish("lab/esp32/status", "online", true);
    } else {
      Serial.printf("MQTT retry, state=%d\n", mqtt.state());
      delay(2000);
    }
  }
}

void publishTelemetry() {
  char payload[128];
  snprintf(payload, sizeof(payload),
    "{\"rssi\":%d,\"heap\":%u,\"uptime\":%lu}",
    WiFi.RSSI(), ESP.getFreeHeap(), millis());

  mqtt.publish("lab/esp32/telemetry", payload);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin("LAB_WIFI", "YOUR_PASSWORD");
  tlsClient.setCACert(ROOT_CA);
  mqtt.setServer(broker, brokerPort);
}

void loop() {
  if (!mqtt.connected()) connectBroker();
  mqtt.loop();
  publishTelemetry();
  delay(3000);
}`
    },
    {
      id: "web-server",
      title: "Servidor web ESP32",
      titleEn: "ESP32 web server",
      file: "async_status_server.ino",
      language: "C++ / ESP32",
      code: String.raw`#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

AsyncWebServer server(80);

String buildStatusJson() {
  JsonDocument document;
  document["device"] = "ESP32-LAB";
  document["uptime"] = millis();
  document["rssi"] = WiFi.RSSI();
  document["free_heap"] = ESP.getFreeHeap();
  document["status"] = "ready";

  String output;
  serializeJson(document, output);
  return output;
}

void configureRoutes() {
  server.on("/api/status", HTTP_GET, [](AsyncWebServerRequest* request) {
    AsyncWebServerResponse* response = request->beginResponse(
      200, "application/json", buildStatusJson());
    response->addHeader("Cache-Control", "no-store");
    request->send(response);
  });

  server.on("/health", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(200, "text/plain", "OK");
  });

  server.onNotFound([](AsyncWebServerRequest* request) {
    request->send(404, "application/json", "{\"error\":\"not_found\"}");
  });
}

void setup() {
  Serial.begin(115200);
  WiFi.begin("LAB_WIFI", "YOUR_PASSWORD");
  while (WiFi.status() != WL_CONNECTED) delay(250);
  configureRoutes();
  server.begin();
}

void loop() {
  delay(1000);
}`
    },
    {
      id: "ota",
      title: "Actualizacion OTA",
      titleEn: "OTA update",
      file: "secure_ota_service.ino",
      language: "C++ / ESP32",
      code: String.raw`#include <WiFi.h>
#include <ArduinoOTA.h>

void configureOta() {
  ArduinoOTA.setHostname("esp32-lab-node");
  ArduinoOTA.setPasswordHash("REPLACE_WITH_HASH");

  ArduinoOTA.onStart([]() {
    String target = ArduinoOTA.getCommand() == U_FLASH ? "firmware" : "filesystem";
    Serial.printf("OTA start: %s\n", target.c_str());
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    uint8_t percent = progress / (total / 100);
    Serial.printf("OTA progress: %u%%\r", percent);
  });

  ArduinoOTA.onEnd([]() {
    Serial.println("\nOTA verified. Rebooting...");
  });

  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("OTA error[%u]\n", error);
  });

  ArduinoOTA.begin();
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin("LAB_WIFI", "YOUR_PASSWORD");

  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print('.');
  }

  configureOta();
  Serial.println("OTA service ready");
}

void loop() {
  ArduinoOTA.handle();
  delay(10);
}`
    },
    {
      id: "nrf24",
      title: "Monitor NRF24L01",
      titleEn: "NRF24L01 monitor",
      file: "nrf24_lab_receiver.ino",
      language: "C++ / ESP32",
      code: String.raw`#include <SPI.h>
#include <RF24.h>

RF24 radio(4, 5);
const uint8_t pipeAddress[6] = "LAB01";

struct RadioFrame {
  uint32_t sequence;
  uint16_t sensorId;
  float value;
  uint8_t checksum;
};

uint8_t calculateChecksum(const RadioFrame& frame) {
  const uint8_t* bytes = reinterpret_cast<const uint8_t*>(&frame);
  uint8_t checksum = 0;

  for (size_t i = 0; i < sizeof(frame) - 1; i++) {
    checksum ^= bytes[i];
  }

  return checksum;
}

void setup() {
  Serial.begin(115200);

  if (!radio.begin()) {
    Serial.println("NRF24 not detected");
    while (true) delay(1000);
  }

  radio.setChannel(76);
  radio.setDataRate(RF24_1MBPS);
  radio.setPALevel(RF24_PA_LOW);
  radio.openReadingPipe(1, pipeAddress);
  radio.startListening();
}

void loop() {
  if (!radio.available()) return;

  RadioFrame frame;
  radio.read(&frame, sizeof(frame));
  bool valid = frame.checksum == calculateChecksum(frame);

  Serial.printf("SEQ=%lu SENSOR=%u VALUE=%.2f VALID=%s\n",
    frame.sequence, frame.sensorId, frame.value, valid ? "YES" : "NO");
}`
    },
    {
      id: "freertos",
      title: "Tareas de red FreeRTOS",
      titleEn: "FreeRTOS network tasks",
      file: "freertos_network_tasks.ino",
      language: "C++ / ESP32",
      code: String.raw`#include <WiFi.h>

QueueHandle_t telemetryQueue;

struct SensorReading {
  uint32_t timestamp;
  float temperature;
  int wifiRssi;
};

void sensorTask(void* parameter) {
  SensorReading reading;

  for (;;) {
    reading.timestamp = millis();
    reading.temperature = 22.0f + random(-20, 20) / 10.0f;
    reading.wifiRssi = WiFi.RSSI();
    xQueueOverwrite(telemetryQueue, &reading);
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}

void networkTask(void* parameter) {
  SensorReading reading;

  for (;;) {
    if (xQueueReceive(telemetryQueue, &reading, portMAX_DELAY)) {
      Serial.printf("[%lu] temp=%.1f rssi=%d heap=%u\n",
        reading.timestamp,
        reading.temperature,
        reading.wifiRssi,
        ESP.getFreeHeap());
    }
  }
}

void setup() {
  Serial.begin(115200);
  telemetryQueue = xQueueCreate(1, sizeof(SensorReading));

  xTaskCreatePinnedToCore(sensorTask, "sensor", 4096, nullptr, 2, nullptr, 0);
  xTaskCreatePinnedToCore(networkTask, "network", 6144, nullptr, 1, nullptr, 1);
}

void loop() {
  vTaskDelay(portMAX_DELAY);
}`
    },
    {
      id: "channel-map",
      title: "Mapa de canales WiFi",
      titleEn: "WiFi channel map",
      file: "wifi_channel_map.ino",
      language: "C++ / ESP32",
      code: String.raw`#include <WiFi.h>

constexpr uint8_t CHANNELS = 13;
uint16_t channelHits[CHANNELS + 1] = {0};
int32_t strongestRssi[CHANNELS + 1];

void resetMap() {
  for (uint8_t channel = 1; channel <= CHANNELS; channel++) {
    channelHits[channel] = 0;
    strongestRssi[channel] = -120;
  }
}

void collectPassiveSamples() {
  int networks = WiFi.scanNetworks(false, true);

  for (int index = 0; index < networks; index++) {
    uint8_t channel = WiFi.channel(index);
    if (channel < 1 || channel > CHANNELS) continue;

    channelHits[channel]++;
    strongestRssi[channel] = max(strongestRssi[channel], WiFi.RSSI(index));
  }

  WiFi.scanDelete();
}

void renderChannelMap() {
  Serial.println("\nCH | NETWORKS | PEAK | ACTIVITY");

  for (uint8_t channel = 1; channel <= CHANNELS; channel++) {
    Serial.printf("%02u | %8u | %4d | ",
      channel, channelHits[channel], strongestRssi[channel]);

    for (uint16_t i = 0; i < channelHits[channel]; i++) {
      Serial.print('#');
    }

    Serial.println();
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
}

void loop() {
  resetMap();
  collectPassiveSamples();
  renderChannelMap();
  delay(10000);
}`
    },
    {
      id: "https-telemetry",
      title: "Telemetria HTTPS",
      titleEn: "HTTPS telemetry",
      file: "https_telemetry_client.ino",
      language: "C++ / ESP32",
      code: String.raw`#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* endpoint = "https://api.example.net/v1/telemetry";
WiFiClientSecure secureClient;

String createPayload() {
  JsonDocument data;
  data["device_id"] = "esp32-lab-07";
  data["uptime_ms"] = millis();
  data["wifi_rssi"] = WiFi.RSSI();
  data["free_heap"] = ESP.getFreeHeap();

  String payload;
  serializeJson(data, payload);
  return payload;
}

bool postTelemetry() {
  HTTPClient http;
  http.begin(secureClient, endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_API_KEY);

  String payload = createPayload();
  int statusCode = http.POST(payload);
  bool accepted = statusCode >= 200 && statusCode < 300;

  Serial.printf("HTTPS status=%d bytes=%u result=%s\n",
    statusCode, payload.length(), accepted ? "ACCEPTED" : "FAILED");

  http.end();
  return accepted;
}

void setup() {
  Serial.begin(115200);
  WiFi.begin("LAB_WIFI", "YOUR_PASSWORD");
  secureClient.setCACert(ROOT_CA);

  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
  }
}

void loop() {
  postTelemetry();
  delay(15000);
}`
    }
  ];

  const root = document.querySelector("[data-code-simulator]");
  if (!root) return;

  const select = root.querySelector("[data-simulator-select]");
  const input = root.querySelector("[data-simulator-input]");
  const codeElement = root.querySelector("[data-simulator-code]");
  const codeView = root.querySelector(".simulator-code");
  const lineNumbers = root.querySelector("[data-simulator-lines]");
  const fileName = root.querySelector("[data-simulator-file]");
  const language = root.querySelector("[data-simulator-language]");
  const scenario = root.querySelector("[data-simulator-scenario]");
  const status = root.querySelector("[data-simulator-status]");
  const percent = root.querySelector("[data-simulator-percent]");
  const progress = root.querySelector("[data-simulator-progress]");
  const keystrokes = root.querySelector("[data-simulator-keystrokes]");
  const lineCount = root.querySelector("[data-simulator-line-count]");
  const speedButton = root.querySelector("[data-simulator-speed]");
  const resetButton = root.querySelector("[data-simulator-reset]");
  const randomButton = root.querySelector("[data-simulator-random]");
  const clock = root.querySelector("[data-simulator-clock]");
  const codeShell = root.querySelector("[data-simulator-code-shell]");

  const keywords = new Set([
    "alignas", "auto", "bool", "break", "case", "catch", "class", "const", "constexpr", "continue",
    "default", "delete", "do", "else", "enum", "false", "float", "for", "if", "int", "long", "namespace",
    "new", "nullptr", "private", "protected", "public", "return", "short", "signed", "sizeof", "static",
    "struct", "switch", "template", "this", "true", "try", "typedef", "uint8_t", "uint16_t", "uint32_t",
    "unsigned", "using", "void", "volatile", "while"
  ]);
  const types = new Set([
    "String", "WiFi", "WiFiClientSecure", "HTTPClient", "PubSubClient", "AsyncWebServer", "AsyncWebServerRequest",
    "AsyncWebServerResponse", "JsonDocument", "NimBLEDevice", "NimBLEScan", "NimBLEAdvertisedDevice",
    "NimBLEAdvertisedDeviceCallbacks", "RF24", "QueueHandle_t", "SensorReading", "RadioFrame", "TelemetryPacket",
    "NetworkSample"
  ]);

  let activeIndex = 0;
  let cursorIndex = 0;
  let typedCode = "";
  let speed = 1;
  let keyCount = 0;

  function isEnglish() {
    return document.documentElement.lang === "en";
  }

  function localizedTitle(snippet) {
    return isEnglish() ? snippet.titleEn : snippet.title;
  }

  function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function highlightLine(line) {
    if (line.trimStart().startsWith("#")) return `<span class="sim-pre">${escapeHtml(line)}</span>`;

    const tokens = line.match(/\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?(?:[fFuUlL]+)?\b|\b[A-Za-z_]\w*\b|\s+|./g) || [];
    let offset = 0;

    return tokens.map((token) => {
      const safe = escapeHtml(token);
      const remaining = line.slice(offset + token.length);
      offset += token.length;

      if (token.startsWith("//")) return `<span class="sim-comment">${safe}</span>`;
      if (token.startsWith('"') || token.startsWith("'")) return `<span class="sim-string">${safe}</span>`;
      if (/^\d/.test(token)) return `<span class="sim-number">${safe}</span>`;
      if (keywords.has(token)) return `<span class="sim-keyword">${safe}</span>`;
      if (types.has(token) || /^[A-Z][A-Za-z0-9_]*$/.test(token)) return `<span class="sim-type">${safe}</span>`;
      if (/^[A-Za-z_]\w*$/.test(token) && /^\s*\(/.test(remaining)) return `<span class="sim-function">${safe}</span>`;
      return safe;
    }).join("");
  }

  function highlightCode(code) {
    return code.split("\n").map(highlightLine).join("\n");
  }

  function render() {
    const current = snippets[activeIndex];
    codeElement.innerHTML = `${highlightCode(typedCode)}<span class="simulator-cursor"></span>`;

    const lines = Math.max(1, typedCode.split("\n").length);
    lineNumbers.textContent = Array.from({ length: lines }, (_, index) => index + 1).join("\n");
    lineCount.textContent = String(lines).padStart(4, "0");
    keystrokes.textContent = String(keyCount).padStart(4, "0");

    const completion = Math.min(100, Math.round((cursorIndex / current.code.length) * 100));
    percent.textContent = `${completion}%`;
    progress.style.width = `${completion}%`;
    status.textContent = completion === 100
      ? (isEnglish() ? "COMPLETE" : "COMPLETO")
      : cursorIndex > 0
        ? (isEnglish() ? "TYPING" : "ESCRIBIENDO")
        : (isEnglish() ? "READY" : "LISTO");

    codeView.scrollTop = codeView.scrollHeight;
    lineNumbers.scrollTop = codeView.scrollTop;
  }

  function loadSnippet(index) {
    activeIndex = index;
    cursorIndex = 0;
    typedCode = "";
    keyCount = 0;

    const current = snippets[activeIndex];
    select.value = current.id;
    fileName.textContent = current.file;
    language.textContent = current.language;
    scenario.textContent = localizedTitle(current);
    render();
    input.focus();
  }

  function typeCode() {
    const current = snippets[activeIndex];
    if (cursorIndex >= current.code.length) return;

    typedCode += current.code.slice(cursorIndex, cursorIndex + speed);
    cursorIndex = Math.min(current.code.length, cursorIndex + speed);
    keyCount += 1;
    render();
  }

  function useRandomSnippet() {
    let next = activeIndex;
    while (next === activeIndex && snippets.length > 1) {
      next = Math.floor(Math.random() * snippets.length);
    }
    loadSnippet(next);
  }

  function updateSnippetLanguage() {
    [...select.options].forEach((option, index) => {
      option.textContent = localizedTitle(snippets[index]);
    });
    scenario.textContent = localizedTitle(snippets[activeIndex]);
    render();
  }

  snippets.forEach((snippet) => {
    const option = document.createElement("option");
    option.value = snippet.id;
    option.textContent = localizedTitle(snippet);
    select.append(option);
  });

  select.addEventListener("change", () => {
    const index = snippets.findIndex((snippet) => snippet.id === select.value);
    loadSnippet(index >= 0 ? index : 0);
  });

  input.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const ignored = ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (ignored.includes(event.key)) return;
    event.preventDefault();
    typeCode();
  });

  input.addEventListener("beforeinput", (event) => {
    event.preventDefault();
    typeCode();
  });

  codeShell.addEventListener("click", () => input.focus());
  resetButton.addEventListener("click", () => loadSnippet(activeIndex));
  randomButton.addEventListener("click", useRandomSnippet);
  speedButton.addEventListener("click", () => {
    speed = speed === 1 ? 4 : 1;
    speedButton.textContent = `x${speed}`;
    input.focus();
  });

  codeView.addEventListener("scroll", () => {
    lineNumbers.scrollTop = codeView.scrollTop;
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-lang-option]")) return;
    window.setTimeout(updateSnippetLanguage, 0);
  });

  function updateClock() {
    clock.textContent = new Date().toLocaleTimeString("en-GB", { hour12: false });
  }

  updateClock();
  window.setInterval(updateClock, 1000);
  loadSnippet(0);
})();
