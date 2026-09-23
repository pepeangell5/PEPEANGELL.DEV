import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeWardrivingRows,
  calculateDurationMs,
  calculateScanIntervalsMs,
  formatDuration,
  haversineDistanceMeters,
  isTrackPoint,
  isWifiObservation,
  mergeWardrivingMaps,
  parseWardrivingCsv,
  parseWardrivingRows,
  validPosition,
} from "../src/lib/wardriving.ts";

const HEADER = "UTC,Millis,Lat,Lng,Sat,HDOP,SSID,BSSID,RSSI,Channel,Auth";
const csv = (...rows) => [HEADER, ...rows].join("\n");

test("clasifica por separado trayectoria GPS y observaciones Wi-Fi", () => {
  const rows = parseWardrivingRows(csv(
    "2026-09-22 10:00:00,2000,25.790000,-108.990000,8,1.1,,,,,",
    "2026-09-22 10:00:01,1000,25.780000,-108.980000,8,1.1,,,,,",
    "2026-09-22 10:00:02,3000,25.800000,-109.000000,8,1.1,Red,AA:BB:CC:DD:EE:01,-55,6,WPA2",
  ), "muestra.csv", "file-a");
  assert.equal(isTrackPoint(rows[0]), true);
  assert.equal(isWifiObservation(rows[0]), false);
  assert.equal(isTrackPoint(rows[2]), false);
  assert.equal(isWifiObservation(rows[2]), true);
  const analysis = analyzeWardrivingRows(rows);
  assert.equal(analysis.summary.trackPoints, 2);
  assert.equal(analysis.summary.wifiObservations, 1);
  assert.deepEqual(analysis.route[0], [25.78, -108.98], "la ruta se ordena por Millis");
});

test("una red oculta sigue siendo observación cuando tiene BSSID", () => {
  const [row] = parseWardrivingRows(csv(
    "2026-09-22 10:00:00,1000,25.78,-108.98,7,1.4,<hidden>,11:22:33:44:55:66,-70,11,WPA2",
  ), "hidden.csv");
  assert.equal(isWifiObservation(row), true);
  assert.equal(isTrackPoint(row), false);
});

test("agrupa varias redes con el mismo Millis como un solo escaneo", () => {
  const data = parseWardrivingCsv(csv(
    "2026-09-22 10:00:00,1000,25.78,-108.98,8,1.1,A,AA:00:00:00:00:01,-40,1,WPA2",
    "2026-09-22 10:00:00,1000,25.78,-108.98,8,1.1,B,AA:00:00:00:00:02,-50,6,OPEN",
    "2026-09-22 10:00:05,6000,25.79,-108.99,8,1.1,C,AA:00:00:00:00:03,-60,11,WPA3",
  ), "scans.csv", "scan-file");
  assert.equal(data.stats.wifiObservations, 3);
  assert.equal(data.stats.scans, 2);
  assert.equal(data.stats.bssids, 3);
});

test("calcula distancia Haversine", () => {
  const meters = haversineDistanceMeters([0, 0], [0, 1]);
  assert.ok(Math.abs(meters - 111_195) < 150);
});

test("calcula y formatea duración por UTC", () => {
  const rows = parseWardrivingRows(csv(
    "2026-09-22 10:00:00,1000,25.78,-108.98,8,1.1,,,,,",
    "2026-09-22 10:13:23,804000,25.79,-108.99,8,1.1,,,,,",
  ), "duration.csv");
  assert.equal(calculateDurationMs(rows), 803_000);
  assert.equal(formatDuration(803_000), "13 min 23 s");
  assert.equal(formatDuration(3_904_000), "1 h 05 min 04 s");
});

test("calcula el intervalo medio usando diferencias positivas", () => {
  const rows = parseWardrivingRows(csv(
    "2026-09-22 10:00:00,1000,25.78,-108.98,8,1.1,A,AA:00:00:00:00:01,-40,1,WPA2",
    "2026-09-22 10:00:00,1000,25.78,-108.98,8,1.1,B,AA:00:00:00:00:02,-50,6,WPA2",
    "2026-09-22 10:00:05,6006,25.79,-108.99,8,1.1,C,AA:00:00:00:00:03,-60,11,WPA2",
    "2026-09-22 10:00:10,11012,25.80,-109.00,8,1.1,D,AA:00:00:00:00:04,-65,3,WPA2",
  ), "interval.csv");
  assert.deepEqual(calculateScanIntervalsMs(rows.filter(isWifiObservation)), [5006, 5006]);
  assert.equal(parseWardrivingCsv(csv(
    "2026-09-22 10:00:00,1000,25.78,-108.98,8,1.1,A,AA:00:00:00:00:01,-40,1,WPA2",
    "2026-09-22 10:00:05,6006,25.79,-108.99,8,1.1,C,AA:00:00:00:00:03,-60,11,WPA2",
    "2026-09-22 10:00:10,11012,25.80,-109.00,8,1.1,D,AA:00:00:00:00:04,-65,3,WPA2",
  ), "interval.csv").stats.scanIntervalMs, 5006);
});

test("mantiene separados los escaneos de archivos con Millis repetidos", () => {
  const first = parseWardrivingCsv(csv(
    "2026-09-22 10:00:00,1000,25.78,-108.98,8,1.1,A,AA:00:00:00:00:01,-40,1,WPA2",
    "2026-09-22 10:00:05,6000,25.79,-108.99,8,1.1,B,AA:00:00:00:00:02,-50,6,OPEN",
  ), "dia1.csv", "file-1");
  const second = parseWardrivingCsv(csv(
    "2026-09-23 10:00:00,1000,25.88,-108.88,8,1.1,C,AA:00:00:00:00:03,-45,1,WPA3",
    "2026-09-23 10:00:05,6000,25.89,-108.89,8,1.1,D,AA:00:00:00:00:04,-55,6,OPEN",
  ), "dia2.csv", "file-2");
  const merged = mergeWardrivingMaps([first, second]);
  assert.equal(merged.stats.files, 2);
  assert.equal(merged.stats.scans, 4);
  assert.equal(merged.stats.scanIntervalMs, 5000);
  assert.equal(merged.routes.length, 2, "no une las rutas entre archivos");
});

test("acepta CSV antiguo sin filas GPS y usa una posición por escaneo como fallback", () => {
  const oldHeader = "Lat,Lng,SSID,BSSID,RSSI,Channel,Auth";
  const data = parseWardrivingCsv([
    oldHeader,
    "25.78,-108.98,A,AA:00:00:00:00:01,-40,1,WPA2",
    "25.78,-108.98,B,AA:00:00:00:00:02,-50,6,OPEN",
    "25.79,-108.99,C,AA:00:00:00:00:03,-60,11,WPA3",
  ].join("\n"), "legacy.csv");
  assert.equal(data.stats.trackPoints, 0);
  assert.equal(data.stats.wifiObservations, 3);
  assert.equal(data.routes[0].length, 2);
  assert.equal(data.fileSummaries[0].usedFallbackRoute, true);
});

test("rechaza coordenadas fuera de rango y 0,0", () => {
  assert.equal(validPosition("0", "0"), null);
  assert.equal(validPosition("91", "10"), null);
  assert.equal(validPosition("25.78", "-108.98")?.[0], 25.78);
  const data = parseWardrivingCsv(csv(
    "2026-09-22 10:00:00,1000,0,0,8,1.1,A,AA:00:00:00:00:01,-40,1,WPA2",
    "2026-09-22 10:00:01,2000,91,-108.98,8,1.1,,,,,",
    "2026-09-22 10:00:02,3000,25.78,-108.98,8,1.1,B,AA:00:00:00:00:02,-50,6,OPEN",
  ), "invalid.csv");
  assert.equal(data.stats.discarded, 2);
  assert.equal(data.stats.wifiObservations, 1);
});

test("ignora líneas vacías y tolera filas incompletas", () => {
  const data = parseWardrivingCsv(`${HEADER}\n\n2026-09-22 10:00:00,1000,25.78,-108.98\n2026-09-22 10:00:01,2000,,,`, "incomplete.csv");
  assert.equal(data.stats.records, 2);
  assert.equal(data.stats.trackPoints, 1);
  assert.equal(data.stats.discarded, 1);
});

test("deduplica globalmente BSSID y AP abiertos", () => {
  const data = parseWardrivingCsv(csv(
    "2026-09-22 10:00:00,1000,25.78,-108.98,8,1.1,A,aa:bb:cc:dd:ee:ff,-40,1,OPEN",
    "2026-09-22 10:00:05,6000,25.79,-108.99,8,1.1,A,AA:BB:CC:DD:EE:FF,-55,1,OPEN",
  ), "open.csv");
  assert.equal(data.stats.bssids, 1);
  assert.equal(data.stats.open, 1);
  assert.equal(data.stats.wifiObservations, 2);
});
