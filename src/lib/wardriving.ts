export const REQUIRED_WARDRIVING_COLUMNS = ["Lat", "Lng", "SSID", "BSSID", "RSSI", "Channel", "Auth"] as const;

export interface WardrivingNetwork {
  ssid: string;
  bssid: string;
  rssi: string;
  channel: string;
  auth: string;
  sourceFile: string;
}

export interface WardrivingMarker {
  lat: number;
  lng: number;
  networks: WardrivingNetwork[];
}

export interface WardrivingMapData {
  fileName: string;
  fileNames: string[];
  routes: [number, number][][];
  markers: WardrivingMarker[];
  center: [number, number];
  stats: {
    files: number;
    records: number;
    gps: number;
    aps: number;
    open: number;
    discarded: number;
  };
}

const HEADER_NAMES = new Map(
  REQUIRED_WARDRIVING_COLUMNS.map((column) => [normalizeHeader(column), column])
);

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
    } else if (!quoted && character === delimiter) {
      count += 1;
    } else if (!quoted && (character === "\n" || character === "\r")) {
      break;
    }
  }
  return count;
}

function detectDelimiter(text: string) {
  const candidates = [",", ";", "\t"];
  return candidates.reduce((best, candidate) =>
    delimiterScore(text, candidate) > delimiterScore(text, best) ? candidate : best
  , candidates[0]);
}

function parseDelimitedText(text: string) {
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
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === delimiter) {
      row.push(value.trim());
      value = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error("El CSV contiene una celda entre comillas sin cerrar.");
  row.push(value.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function finiteNumber(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validPosition(latValue: string, lngValue: string): [number, number] | null {
  const lat = finiteNumber(latValue);
  const lng = finiteNumber(lngValue);
  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return [lat, lng];
}

export function decodeWardrivingFile(buffer: ArrayBuffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

export function parseWardrivingCsv(text: string, fileName: string): WardrivingMapData {
  const table = parseDelimitedText(text);
  if (table.length < 2) throw new Error("El CSV no contiene registros para procesar.");

  const rawHeaders = table[0];
  const headerIndexes = new Map<string, number>();
  rawHeaders.forEach((header, index) => {
    const canonical = HEADER_NAMES.get(normalizeHeader(header));
    if (canonical) headerIndexes.set(canonical, index);
  });

  const missing = REQUIRED_WARDRIVING_COLUMNS.filter((column) => !headerIndexes.has(column));
  if (missing.length) throw new Error(`Faltan columnas obligatorias: ${missing.join(", ")}.`);

  const rows = table.slice(1);
  const groups = new Map<string, { lat: number; lng: number; networks: WardrivingNetwork[] }>();
  const route: [number, number][] = [];
  const uniqueBssids = new Set<string>();
  const openBssids = new Set<string>();
  let locatedRecords = 0;
  let previousPosition = "";

  const read = (row: string[], column: typeof REQUIRED_WARDRIVING_COLUMNS[number]) =>
    row[headerIndexes.get(column) ?? -1]?.trim() ?? "";

  rows.forEach((row) => {
    const position = validPosition(read(row, "Lat"), read(row, "Lng"));
    if (!position) return;

    locatedRecords += 1;
    const [lat, lng] = position;
    const key = `${lat}|${lng}`;
    const bssid = read(row, "BSSID");
    const normalizedBssid = bssid.toUpperCase();
    const auth = read(row, "Auth");

    if (!groups.has(key)) groups.set(key, { lat, lng, networks: [] });
    groups.get(key)?.networks.push({
      ssid: read(row, "SSID"),
      bssid,
      rssi: read(row, "RSSI"),
      channel: read(row, "Channel"),
      auth,
      sourceFile: fileName,
    });

    if (key !== previousPosition) {
      route.push([lat, lng]);
      previousPosition = key;
    }
    if (normalizedBssid) uniqueBssids.add(normalizedBssid);
    if (normalizedBssid && ["OPEN", "NONE", "0"].includes(auth.toUpperCase())) openBssids.add(normalizedBssid);
  });

  if (!locatedRecords || !route.length) throw new Error("El CSV no contiene coordenadas GPS válidas distintas de cero.");

  const markers = [...groups.values()].map(({ lat, lng, networks }) => {
    const seen = new Set<string>();
    const sorted = [...networks].sort((left, right) =>
      (finiteNumber(right.rssi) ?? -999) - (finiteNumber(left.rssi) ?? -999)
    );
    const uniqueNetworks = sorted.filter((network) => {
      const identity = `${network.bssid.toUpperCase()}|${network.ssid}`;
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
    return { lat, lng, networks: uniqueNetworks };
  });

  const center: [number, number] = [
    route.reduce((sum, point) => sum + point[0], 0) / route.length,
    route.reduce((sum, point) => sum + point[1], 0) / route.length,
  ];

  return {
    fileName,
    fileNames: [fileName],
    routes: [route],
    markers,
    center,
    stats: {
      files: 1,
      records: rows.length,
      gps: route.length,
      aps: uniqueBssids.size,
      open: openBssids.size,
      discarded: rows.length - locatedRecords,
    },
  };
}

export function mergeWardrivingMaps(maps: WardrivingMapData[]): WardrivingMapData {
  if (!maps.length) throw new Error("No hay archivos para combinar.");
  if (maps.length === 1) return maps[0];

  const fileNames = maps.flatMap((item) => item.fileNames);
  const routes = maps.flatMap((item) => item.routes);
  const groups = new Map<string, WardrivingMarker>();

  maps.forEach((item) => {
    item.markers.forEach((point) => {
      const key = `${point.lat}|${point.lng}`;
      const existing = groups.get(key);
      if (existing) existing.networks.push(...point.networks);
      else groups.set(key, { lat: point.lat, lng: point.lng, networks: [...point.networks] });
    });
  });

  const markers = [...groups.values()].map((point) => ({
    ...point,
    networks: [...point.networks].sort((left, right) =>
      (finiteNumber(right.rssi) ?? -999) - (finiteNumber(left.rssi) ?? -999)
    ),
  }));
  const positions = routes.flat();
  const uniqueBssids = new Set<string>();
  const openBssids = new Set<string>();
  markers.forEach((point) => point.networks.forEach((network) => {
    const bssid = network.bssid.toUpperCase();
    if (bssid) uniqueBssids.add(bssid);
    if (bssid && ["OPEN", "NONE", "0"].includes(network.auth.toUpperCase())) openBssids.add(bssid);
  }));

  return {
    fileName: `${fileNames.length} archivos combinados`,
    fileNames,
    routes,
    markers,
    center: [
      positions.reduce((sum, point) => sum + point[0], 0) / positions.length,
      positions.reduce((sum, point) => sum + point[1], 0) / positions.length,
    ],
    stats: {
      files: fileNames.length,
      records: maps.reduce((sum, item) => sum + item.stats.records, 0),
      gps: maps.reduce((sum, item) => sum + item.stats.gps, 0),
      aps: uniqueBssids.size,
      open: openBssids.size,
      discarded: maps.reduce((sum, item) => sum + item.stats.discarded, 0),
    },
  };
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function buildStandaloneWardrivingHtml(data: WardrivingMapData) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ruta de wardriving · ${data.fileName.replace(/[<>&"]/g, "")}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css">
  <style>
    html,body,#map{height:100%;margin:0}body{background:#060914;color:#f5f7ff;font-family:Inter,Segoe UI,sans-serif}#map{background:#0a1020}
    .panel{position:fixed;z-index:1000;top:18px;right:18px;width:230px;padding:16px;border:1px solid #28d7ec;border-radius:14px;background:rgba(7,12,27,.92);box-shadow:0 16px 45px rgba(0,0,0,.42);backdrop-filter:blur(10px)}
    .panel h1{color:#28d7ec;font-size:17px;margin:0 0 10px}.panel p{display:flex;justify-content:space-between;gap:12px;margin:6px 0;font-size:13px}.panel strong{color:#ff70c7}.panel small{color:#9da8c2;display:block;margin-top:10px;overflow-wrap:anywhere}
    .popup{max-height:310px;min-width:230px;overflow-y:auto}.popup h3{margin:0 0 8px;color:#18223a}.ap{border-top:1px solid #d8ddea;padding:7px 0}.ap strong,.ap span{display:block;overflow-wrap:anywhere}.ap span{color:#46516a;font-size:12px;margin-top:2px}
    @media(max-width:620px){.panel{top:8px;right:8px;left:8px;width:auto}}
  </style>
</head>
<body>
  <div id="map"></div>
  <aside class="panel"><h1>Ruta de wardriving</h1><p><span>Archivos</span><strong>${data.stats.files}</strong></p><p><span>Registros</span><strong>${data.stats.records}</strong></p><p><span>Puntos GPS</span><strong>${data.stats.gps}</strong></p><p><span>AP únicos</span><strong>${data.stats.aps}</strong></p><p><span>AP abiertos</span><strong>${data.stats.open}</strong></p><small></small></aside>
  <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <script>
    const data=${safeJson(data)};
    document.querySelector('.panel small').textContent=data.fileName;
    const map=L.map('map',{preferCanvas:true}).setView(data.center,15);
    const baseMaps={
      'Calles / Streets':L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri'}),
      'Satélite / Satellite':L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri, Maxar, Earthstar Geographics'}),
      'OpenStreetMap':L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}),
      'Oscuro / Dark':L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd',attribution:'&copy; OpenStreetMap contributors &copy; CARTO'}),
      'Topográfico / Topographic':L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'Map data &copy; OpenStreetMap contributors · Style &copy; OpenTopoMap'})
    };
    baseMaps['Calles / Streets'].addTo(map);
    L.control.layers(baseMaps,undefined,{position:'bottomleft',collapsed:true}).addTo(map);
    const routeColors=['#28d7ec','#ff70c7','#29ef9f','#ffb454','#a98bff','#5aa9ff'];
    const bounds=L.latLngBounds([]);
    data.routes.forEach((route,index)=>{if(!route.length)return;L.polyline(route,{color:routeColors[index%routeColors.length],weight:5,opacity:.9}).addTo(map);route.forEach(point=>bounds.extend(point))});
    data.markers.forEach((point,index)=>{
      const popup=document.createElement('div');popup.className='popup';
      const heading=document.createElement('h3');heading.textContent=point.networks.length+' red(es)';popup.append(heading);
      point.networks.forEach(network=>{const card=document.createElement('div');card.className='ap';const name=document.createElement('strong');name.textContent=network.ssid||'[SSID oculto]';card.append(name);[['BSSID: ',network.bssid],['RSSI: ',network.rssi+' dBm · Canal: '+network.channel],['Seguridad: ',network.auth],['Archivo: ',network.sourceFile]].forEach(([label,value])=>{const row=document.createElement('span');row.textContent=label+(value||'—');card.append(row)});popup.append(card)});
      L.circleMarker([point.lat,point.lng],{radius:Math.min(12,5+Math.sqrt(point.networks.length)),color:index===0?'#29ef9f':'#101426',weight:2,fillColor:index===data.markers.length-1?'#ff547d':'#ff70c7',fillOpacity:.95}).bindPopup(popup,{maxWidth:340}).addTo(map);
      bounds.extend([point.lat,point.lng]);
    });
    if(bounds.isValid())map.fitBounds(bounds,{padding:[45,45]});
  <\/script>
</body>
</html>`;
}
