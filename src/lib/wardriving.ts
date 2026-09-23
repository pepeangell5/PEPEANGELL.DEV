export const WARDRIVING_COLUMNS = [
  "UTC", "Millis", "Lat", "Lng", "Sat", "HDOP", "SSID", "BSSID", "RSSI", "Channel", "Auth",
] as const;

export const REQUIRED_WARDRIVING_COLUMNS = ["Lat", "Lng"] as const;

type WardrivingColumn = typeof WARDRIVING_COLUMNS[number];
export type GeoPoint = [number, number];

export interface WardrivingRow {
  sourceId: string;
  sourceFile: string;
  rowIndex: number;
  utc: string;
  millisText: string;
  millis: number | null;
  latText: string;
  lngText: string;
  lat: number | null;
  lng: number | null;
  sat: string;
  hdop: string;
  ssid: string;
  bssid: string;
  rssi: string;
  channel: string;
  auth: string;
}

export interface WardrivingNetwork {
  ssid: string;
  bssid: string;
  rssi: string;
  channel: string;
  auth: string;
  sourceFile: string;
  sourceId: string;
  utc: string;
  millis: number | null;
}

export interface WardrivingMarker {
  lat: number;
  lng: number;
  networks: WardrivingNetwork[];
}

export interface WardrivingFileSummary {
  sourceId: string;
  fileName: string;
  records: number;
  trackPoints: number;
  wifiObservations: number;
  scans: number;
  durationMs: number | null;
  routeKm: number;
  scanIntervalsMs: number[];
  discarded: number;
  usedFallbackRoute: boolean;
}

export interface WardrivingStats {
  files: number;
  records: number;
  durationMs: number | null;
  routeKm: number;
  trackPoints: number;
  wifiObservations: number;
  bssids: number;
  open: number;
  scans: number;
  scanIntervalMs: number | null;
  discarded: number;
}

export interface WardrivingMapData {
  fileName: string;
  fileNames: string[];
  fileSummaries: WardrivingFileSummary[];
  routes: GeoPoint[][];
  markers: WardrivingMarker[];
  center: GeoPoint;
  stats: WardrivingStats;
}

const HEADER_NAMES = new Map(WARDRIVING_COLUMNS.map((column) => [normalizeHeader(column), column]));

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function delimiterScore(line: string, delimiter: string) {
  let quoted = false;
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && character === delimiter) count += 1;
    else if (!quoted && (character === "\n" || character === "\r")) break;
  }
  return count;
}

function detectDelimiter(text: string) {
  const candidates = [",", ";", "\t"];
  return candidates.reduce((best, candidate) =>
    delimiterScore(text, candidate) > delimiterScore(text, best) ? candidate : best
  , candidates[0]);
}

export function parseDelimitedText(text: string) {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else value += character;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === delimiter) {
      row.push(value.trim());
      value = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else value += character;
  }
  if (quoted) throw new Error("El CSV contiene una celda entre comillas sin cerrar.");
  row.push(value.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

export function finiteNumber(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function validPosition(latValue: string | number | null, lngValue: string | number | null): GeoPoint | null {
  const lat = typeof latValue === "number" ? latValue : finiteNumber(latValue ?? "");
  const lng = typeof lngValue === "number" ? lngValue : finiteNumber(lngValue ?? "");
  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) return null;
  return [lat, lng];
}

export function hasValidCoordinates(row: WardrivingRow) {
  return validPosition(row.lat, row.lng) !== null;
}

export function isTrackPoint(row: WardrivingRow) {
  return hasValidCoordinates(row) && [row.ssid, row.bssid, row.rssi, row.channel, row.auth]
    .every((value) => value.trim() === "");
}

export function isWifiObservation(row: WardrivingRow) {
  return hasValidCoordinates(row) && row.bssid.trim() !== "";
}

export function normalizeBssid(value: string) {
  return value.trim().toUpperCase();
}

function parseUtcMilliseconds(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutTimezone = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(trimmed);
  const normalized = withoutTimezone ? `${trimmed.replace(" ", "T")}Z` : trimmed;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateDurationMs(rows: WardrivingRow[]) {
  const timestamps = rows.map((row) => parseUtcMilliseconds(row.utc)).filter((value): value is number => value !== null);
  if (timestamps.length < 2) return null;
  return Math.max(...timestamps) - Math.min(...timestamps);
}

export function haversineDistanceMeters(from: GeoPoint, to: GeoPoint) {
  const earthRadiusMeters = 6_371_008.8;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const deltaLat = radians(to[0] - from[0]);
  const deltaLng = radians(to[1] - from[1]);
  const lat1 = radians(from[0]);
  const lat2 = radians(to[0]);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateRouteDistanceKm(route: GeoPoint[]) {
  let meters = 0;
  for (let index = 1; index < route.length; index += 1) meters += haversineDistanceMeters(route[index - 1], route[index]);
  return meters / 1000;
}

function compareRowsByMillis(left: WardrivingRow, right: WardrivingRow) {
  if (left.millis !== null && right.millis !== null && left.millis !== right.millis) return left.millis - right.millis;
  if (left.millis !== null && right.millis === null) return -1;
  if (left.millis === null && right.millis !== null) return 1;
  return left.rowIndex - right.rowIndex;
}

export function buildFallbackWifiRoute(observations: WardrivingRow[]) {
  const route: GeoPoint[] = [];
  const withMillis = observations.filter((row) => row.millis !== null);
  if (withMillis.length) {
    const scans = new Map<number, WardrivingRow>();
    withMillis.forEach((row) => {
      if (row.millis !== null && !scans.has(row.millis)) scans.set(row.millis, row);
    });
    [...scans.values()].sort(compareRowsByMillis).forEach((row) => {
      const position = validPosition(row.lat, row.lng);
      if (position) route.push(position);
    });
    return route;
  }
  let previousKey = "";
  observations.forEach((row) => {
    const position = validPosition(row.lat, row.lng);
    if (!position) return;
    const key = `${position[0]}|${position[1]}`;
    if (key !== previousKey) route.push(position);
    previousKey = key;
  });
  return route;
}

export function calculateScanIntervalsMs(observations: WardrivingRow[]) {
  const scanTimes = [...new Set(observations.map((row) => row.millis).filter((value): value is number => value !== null))]
    .sort((left, right) => left - right);
  const differences: number[] = [];
  for (let index = 1; index < scanTimes.length; index += 1) {
    const difference = scanTimes[index] - scanTimes[index - 1];
    if (difference > 0) differences.push(difference);
  }
  return differences;
}

export function analyzeWardrivingRows(rows: WardrivingRow[]) {
  const trackRows = rows.filter(isTrackPoint).sort(compareRowsByMillis);
  const observations = rows.filter(isWifiObservation);
  const trackRoute = trackRows.map((row) => validPosition(row.lat, row.lng)).filter((point): point is GeoPoint => point !== null);
  const usedFallbackRoute = trackRoute.length === 0 && observations.length > 0;
  const route = usedFallbackRoute ? buildFallbackWifiRoute(observations) : trackRoute;
  const scanIntervalsMs = calculateScanIntervalsMs(observations);
  const scans = new Set(observations.map((row) => row.millis).filter((value) => value !== null)).size;
  return {
    route,
    observations,
    summary: {
      sourceId: rows[0]?.sourceId ?? "",
      fileName: rows[0]?.sourceFile ?? "",
      records: rows.length,
      trackPoints: trackRows.length,
      wifiObservations: observations.length,
      scans,
      durationMs: calculateDurationMs(rows),
      routeKm: calculateRouteDistanceKm(trackRoute),
      scanIntervalsMs,
      discarded: rows.filter((row) => !hasValidCoordinates(row)).length,
      usedFallbackRoute,
    } satisfies WardrivingFileSummary,
  };
}

export function decodeWardrivingFile(buffer: ArrayBuffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

export function parseWardrivingRows(text: string, fileName: string, sourceId = `${fileName}:0`) {
  const table = parseDelimitedText(text);
  if (table.length < 2) throw new Error("El CSV no contiene registros para procesar.");
  const headerIndexes = new Map<WardrivingColumn, number>();
  table[0].forEach((header, index) => {
    const canonical = HEADER_NAMES.get(normalizeHeader(header));
    if (canonical) headerIndexes.set(canonical, index);
  });
  const missing = REQUIRED_WARDRIVING_COLUMNS.filter((column) => !headerIndexes.has(column));
  if (missing.length) throw new Error(`Faltan columnas obligatorias: ${missing.join(", ")}.`);
  const read = (row: string[], column: WardrivingColumn) => {
    const index = headerIndexes.get(column);
    return index === undefined ? "" : row[index]?.trim() ?? "";
  };
  return table.slice(1).map((row, index): WardrivingRow => {
    const latText = read(row, "Lat");
    const lngText = read(row, "Lng");
    const millisText = read(row, "Millis");
    return {
      sourceId, sourceFile: fileName, rowIndex: index + 2, utc: read(row, "UTC"), millisText,
      millis: finiteNumber(millisText), latText, lngText, lat: finiteNumber(latText), lng: finiteNumber(lngText),
      sat: read(row, "Sat"), hdop: read(row, "HDOP"), ssid: read(row, "SSID"), bssid: read(row, "BSSID"),
      rssi: read(row, "RSSI"), channel: read(row, "Channel"), auth: read(row, "Auth"),
    };
  });
}

function rowsToMarkers(observations: WardrivingRow[]) {
  const groups = new Map<string, WardrivingMarker>();
  observations.forEach((row) => {
    const position = validPosition(row.lat, row.lng);
    if (!position) return;
    const key = `${position[0]}|${position[1]}`;
    const marker = groups.get(key) ?? { lat: position[0], lng: position[1], networks: [] };
    marker.networks.push({
      ssid: row.ssid, bssid: row.bssid, rssi: row.rssi, channel: row.channel, auth: row.auth,
      sourceFile: row.sourceFile, sourceId: row.sourceId, utc: row.utc, millis: row.millis,
    });
    groups.set(key, marker);
  });
  return [...groups.values()].map((marker) => ({
    ...marker,
    networks: marker.networks.sort((left, right) => (finiteNumber(right.rssi) ?? -999) - (finiteNumber(left.rssi) ?? -999)),
  }));
}

export function calculateCombinedStats(fileSummaries: WardrivingFileSummary[], markers: WardrivingMarker[]): WardrivingStats {
  const networks = markers.flatMap((marker) => marker.networks);
  const uniqueBssids = new Set<string>();
  const openBssids = new Set<string>();
  networks.forEach((network) => {
    const bssid = normalizeBssid(network.bssid);
    const auth = network.auth.trim().toUpperCase();
    if (bssid) uniqueBssids.add(bssid);
    if (bssid && ["OPEN", "NONE", "0"].includes(auth)) openBssids.add(bssid);
  });
  const validDurations = fileSummaries.map((file) => file.durationMs).filter((value): value is number => value !== null);
  const scanIntervals = fileSummaries.flatMap((file) => file.scanIntervalsMs);
  return {
    files: fileSummaries.length,
    records: fileSummaries.reduce((sum, file) => sum + file.records, 0),
    durationMs: validDurations.length ? validDurations.reduce((sum, value) => sum + value, 0) : null,
    routeKm: fileSummaries.reduce((sum, file) => sum + file.routeKm, 0),
    trackPoints: fileSummaries.reduce((sum, file) => sum + file.trackPoints, 0),
    wifiObservations: fileSummaries.reduce((sum, file) => sum + file.wifiObservations, 0),
    bssids: uniqueBssids.size,
    open: openBssids.size,
    scans: fileSummaries.reduce((sum, file) => sum + file.scans, 0),
    scanIntervalMs: scanIntervals.length ? scanIntervals.reduce((sum, value) => sum + value, 0) / scanIntervals.length : null,
    discarded: fileSummaries.reduce((sum, file) => sum + file.discarded, 0),
  };
}

function calculateCenter(routes: GeoPoint[][], markers: WardrivingMarker[]): GeoPoint {
  const routePoints = routes.flat();
  const positions = routePoints.length ? routePoints : markers.map((marker): GeoPoint => [marker.lat, marker.lng]);
  if (!positions.length) return [0, 0];
  return [
    positions.reduce((sum, point) => sum + point[0], 0) / positions.length,
    positions.reduce((sum, point) => sum + point[1], 0) / positions.length,
  ];
}

export function parseWardrivingCsv(text: string, fileName: string, sourceId = `${fileName}:0`): WardrivingMapData {
  const rows = parseWardrivingRows(text, fileName, sourceId);
  const analysis = analyzeWardrivingRows(rows);
  const markers = rowsToMarkers(analysis.observations);
  if (!analysis.route.length && !markers.length) throw new Error("El CSV no contiene puntos GPS ni observaciones Wi-Fi con coordenadas válidas.");
  const routes = analysis.route.length ? [analysis.route] : [];
  const fileSummaries = [analysis.summary];
  return {
    fileName, fileNames: [fileName], fileSummaries, routes, markers,
    center: calculateCenter(routes, markers), stats: calculateCombinedStats(fileSummaries, markers),
  };
}

export function mergeWardrivingMaps(maps: WardrivingMapData[]): WardrivingMapData {
  if (!maps.length) throw new Error("No hay archivos para combinar.");
  if (maps.length === 1) return maps[0];
  const fileNames = maps.flatMap((item) => item.fileNames);
  const fileSummaries = maps.flatMap((item) => item.fileSummaries);
  const routes = maps.flatMap((item) => item.routes);
  const groups = new Map<string, WardrivingMarker>();
  maps.forEach((item) => item.markers.forEach((point) => {
    const key = `${point.lat}|${point.lng}`;
    const existing = groups.get(key);
    if (existing) existing.networks.push(...point.networks);
    else groups.set(key, { lat: point.lat, lng: point.lng, networks: [...point.networks] });
  }));
  const markers = [...groups.values()].map((marker) => ({
    ...marker,
    networks: marker.networks.sort((left, right) => (finiteNumber(right.rssi) ?? -999) - (finiteNumber(left.rssi) ?? -999)),
  }));
  return {
    fileName: `${fileNames.length} archivos combinados`, fileNames, fileSummaries, routes, markers,
    center: calculateCenter(routes, markers), stats: calculateCombinedStats(fileSummaries, markers),
  };
}

export function formatDuration(durationMs: number | null) {
  if (durationMs === null || !Number.isFinite(durationMs)) return "—";
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, "0")} min ${String(seconds).padStart(2, "0")} s`;
  return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function buildStandaloneWardrivingHtml(data: WardrivingMapData) {
  const number = new Intl.NumberFormat("es-MX");
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ruta de wardriving · ${data.fileName.replace(/[<>&"]/g, "")}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css"><style>
html,body,#map{height:100%;margin:0}body{background:#060914;color:#f5f7ff;font-family:Inter,Segoe UI,sans-serif}#map{background:#0a1020}
.panel{position:fixed;z-index:1000;top:18px;right:18px;width:270px;max-height:calc(100vh - 68px);overflow:auto;padding:16px;border:1px solid #28d7ec;border-radius:14px;background:rgba(7,12,27,.92);box-shadow:0 16px 45px rgba(0,0,0,.42);backdrop-filter:blur(10px)}
.panel h1{color:#28d7ec;font-size:17px;margin:0 0 10px}.panel p{display:flex;justify-content:space-between;gap:12px;margin:6px 0;font-size:12px}.panel strong{color:#ff70c7;text-align:right}.panel small{color:#9da8c2;display:block;margin-top:10px;overflow-wrap:anywhere}
.popup{max-height:310px;min-width:230px;overflow-y:auto}.popup h3{margin:0 0 8px;color:#18223a}.ap{border-top:1px solid #d8ddea;padding:7px 0}.ap strong,.ap span{display:block;overflow-wrap:anywhere}.ap span{color:#46516a;font-size:12px;margin-top:2px}@media(max-width:620px){.panel{top:8px;right:8px;left:48px;width:auto;max-height:180px}}
</style></head><body><div id="map"></div><aside class="panel"><h1>Ruta de wardriving</h1>
<p><span>Archivos</span><strong>${number.format(data.stats.files)}</strong></p><p><span>Registros</span><strong>${number.format(data.stats.records)}</strong></p>
<p><span>Duración</span><strong>${formatDuration(data.stats.durationMs)}</strong></p><p><span>Ruta registrada</span><strong>${data.stats.routeKm.toFixed(2)} km</strong></p>
<p><span>Puntos de trayectoria</span><strong>${number.format(data.stats.trackPoints)}</strong></p><p><span>Observaciones Wi-Fi</span><strong>${number.format(data.stats.wifiObservations)}</strong></p>
<p><span>BSSID únicos</span><strong>${number.format(data.stats.bssids)}</strong></p><p><span>AP abiertos únicos</span><strong>${number.format(data.stats.open)}</strong></p>
<p><span>Escaneos con resultados</span><strong>${number.format(data.stats.scans)}</strong></p><p><span>Intervalo medio</span><strong>${data.stats.scanIntervalMs === null ? "—" : `${(data.stats.scanIntervalMs / 1000).toFixed(3)} s`}</strong></p>
<p><span>Sin ubicación</span><strong>${number.format(data.stats.discarded)}</strong></p><small></small></aside>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"><\/script><script>
const data=${safeJson(data)};document.querySelector('.panel small').textContent=data.fileName;const map=L.map('map',{preferCanvas:true}).setView(data.center,15);
const baseMaps={'Calles / Streets':L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri'}),'Satélite / Satellite':L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri, Maxar, Earthstar Geographics'}),'OpenStreetMap':L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}),'Oscuro / Dark':L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd',attribution:'&copy; OpenStreetMap contributors &copy; CARTO'}),'Topográfico / Topographic':L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'Map data &copy; OpenStreetMap contributors · Style &copy; OpenTopoMap'})};baseMaps['Calles / Streets'].addTo(map);L.control.layers(baseMaps,undefined,{position:'bottomleft',collapsed:true}).addTo(map);
const routeColors=['#28d7ec','#ff70c7','#29ef9f','#ffb454','#a98bff','#5aa9ff'];const bounds=L.latLngBounds([]);data.routes.forEach((route,index)=>{if(!route.length)return;L.polyline(route,{color:routeColors[index%routeColors.length],weight:5,opacity:.9}).addTo(map);route.forEach(point=>bounds.extend(point))});
data.markers.forEach(point=>{const popup=document.createElement('div');popup.className='popup';const heading=document.createElement('h3');heading.textContent=point.networks.length+' observación(es)';popup.append(heading);point.networks.forEach(network=>{const card=document.createElement('div');card.className='ap';const name=document.createElement('strong');name.textContent=!network.ssid||network.ssid.toLowerCase()==='<hidden>'?'[SSID oculto]':network.ssid;card.append(name);[['BSSID: ',network.bssid],['RSSI: ',network.rssi+' dBm · Canal: '+network.channel],['Seguridad: ',network.auth],['Archivo: ',network.sourceFile]].forEach(([label,value])=>{const row=document.createElement('span');row.textContent=label+(value||'—');card.append(row)});popup.append(card)});L.circleMarker([point.lat,point.lng],{radius:Math.min(12,5+Math.sqrt(point.networks.length)),color:'#101426',weight:2,fillColor:'#ff70c7',fillOpacity:.95}).bindPopup(popup,{maxWidth:340}).addTo(map);bounds.extend([point.lat,point.lng])});data.routes.forEach(route=>{if(!route.length)return;L.circleMarker(route[0],{radius:7,color:'#0c1724',weight:2,fillColor:'#29ef9f',fillOpacity:1,interactive:false}).addTo(map);L.circleMarker(route[route.length-1],{radius:7,color:'#0c1724',weight:2,fillColor:'#ff547d',fillOpacity:1,interactive:false}).addTo(map)});if(bounds.isValid())map.fitBounds(bounds,{padding:[45,45]});
<\/script></body></html>`;
}
