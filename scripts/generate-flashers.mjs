import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const username = "pepeangell5";
const staticFlashersPath = resolve("src/data/flashers.json");
const reposPath = resolve("public/data/repos.json");
const srcOutputPath = resolve("src/data/flashers.generated.json");
const publicOutputPath = resolve("public/data/flashers.json");

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function saveJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromRepoName(name) {
  return String(name || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b(v\d+(?:\.\d+)*)\b/gi, (match) => match.toUpperCase())
    .replace(/\b(esp32|esp8266|bw16|rf|ble|wifi|ghz|tft|oled|gps|nrf|cc1101|ir)\b/gi, (match) => match.toUpperCase())
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\bESP32\b/g, "ESP32")
    .replace(/\bBW16\b/g, "BW16");
}

function repoKeyFromUrl(url) {
  const match = String(url || "").match(/github\.com\/([^/]+\/[^/#?]+)/i);
  return match?.[1]?.toLowerCase() || "";
}

function repoKey(repo) {
  return String(repo?.full_name || `${username}/${repo?.name || ""}`).toLowerCase();
}

function normalizeUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.href.endsWith("/") ? parsed.href : `${parsed.href}/`;
  } catch {
    return "";
  }
}

function textFor(repo) {
  return `${repo?.name || ""} ${repo?.description || ""} ${(repo?.topics || []).join(" ")} ${repo?.language || ""}`.toLowerCase();
}

function inferModules(repo, manualModules = []) {
  const text = textFor(repo);
  const modules = new Set(manualModules.filter(Boolean));
  const rules = [
    ["ESP32-S3", ["esp32-s3", "esp32s3"]],
    ["ESP32-C3", ["esp32-c3", "esp32c3"]],
    ["ESP32", ["esp32", "espressif"]],
    ["BW16", ["bw16"]],
    ["RTL8720DN", ["rtl8720dn"]],
    ["WiFi", ["wifi", "wi-fi", "wireless"]],
    ["BLE", ["ble", "bluetooth"]],
    ["RF", ["rf", "radio", "subghz", "sub-ghz"]],
    ["NRF24", ["nrf24", "nrf24l01"]],
    ["CC1101", ["cc1101"]],
    ["TFT", ["tft", "ili9488", "ili9341", "st7789"]],
    ["OLED", ["oled", "ssd1306", "sh1106"]],
    ["Display", ["display", "screen", "lcd"]],
    ["M5Stack", ["m5stack", "m5stick", "m5core", "m5stamp"]],
    ["Cardputer", ["cardputer"]],
    ["GPS", ["gps", "neo-6m", "neo 6m"]],
    ["IR", ["infrared", "ir"]]
  ];

  for (const [label, terms] of rules) {
    if (terms.some((term) => text.includes(term))) {
      modules.add(label);
    }
  }

  return [...modules].slice(0, 8);
}

function inferBoard(repo, manualBoard) {
  if (manualBoard) return manualBoard;

  const text = textFor(repo);
  if (text.includes("cardputer")) return "M5Stack Cardputer";
  if (text.includes("esp32-s3") || text.includes("esp32s3")) return "ESP32-S3 compatible";
  if (text.includes("esp32-c3") || text.includes("esp32c3")) return "ESP32-C3 compatible";
  if (text.includes("bw16") || text.includes("rtl8720dn")) return "BW16 RTL8720DN";
  if (text.includes("esp32")) return "ESP32 compatible";
  return "Hardware compatible";
}

function inferDisplay(repo, manualDisplay) {
  if (manualDisplay) return manualDisplay;

  const text = textFor(repo);
  if (text.includes("ili9488") || text.includes("480x320")) return "TFT ILI9488 480x320 SPI";
  if (text.includes("ili9341")) return "TFT ILI9341 SPI";
  if (text.includes("st7789")) return "TFT ST7789 SPI";
  if (text.includes("oled") || text.includes("ssd1306")) return "OLED SSD1306";
  if (text.includes("cardputer")) return "M5Stack Cardputer integrated display";
  if (text.includes("display") || text.includes("screen") || text.includes("tft")) return "Display depending on build";
  return "Optional serial/display output";
}

function candidateUrls(repo, manualUrl) {
  const candidates = new Set();
  const normalizedManual = normalizeUrl(manualUrl);
  const normalizedHomepage = normalizeUrl(repo?.homepage);

  if (normalizedManual) candidates.add(normalizedManual);
  if (normalizedHomepage) candidates.add(normalizedHomepage);
  if (repo?.name) candidates.add(`https://${username}.github.io/${repo.name}/`);

  return [...candidates];
}

async function fetchText(url, accept = "text/html") {
  try {
    const headers = { Accept: accept };
    const response = await fetch(url, { headers });
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  }
}

async function fetchPagesUrl(fullName) {
  if (!fullName) return "";

  try {
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com/repos/${fullName}/pages`, { headers });
    if (!response.ok) return "";
    const data = await response.json();
    return normalizeUrl(data?.html_url);
  } catch {
    return "";
  }
}

async function detectFlasherUrl(repo, manualUrl) {
  const pagesUrl = await fetchPagesUrl(repo?.full_name);
  const candidates = candidateUrls(repo, manualUrl);
  if (pagesUrl) candidates.unshift(pagesUrl);

  for (const candidate of [...new Set(candidates)]) {
    const manifest = await fetchText(new URL("manifest.json", candidate).href, "application/json");
    if (manifest.trim().startsWith("{") && manifest.includes("\"builds\"")) {
      return candidate;
    }

    const indexHtml = await fetchText(candidate);
    if (indexHtml.includes("esp-web-install-button")) {
      return candidate;
    }
  }

  return "";
}

function buildEntry(repo, manual, flasherUrl, manualIndex) {
  return {
    name: manual?.name || titleFromRepoName(repo.name),
    slug: manual?.slug || slugify(repo.name),
    board: inferBoard(repo, manual?.board),
    display: inferDisplay(repo, manual?.display),
    modules: inferModules(repo, manual?.modules || []),
    status: manual?.status || "Web flasher",
    flasher_url: flasherUrl,
    github_url: manual?.github_url || repo.html_url || `https://github.com/${repo.full_name}`,
    updated_at: repo.updated_at || "",
    source: manual ? "manual" : "auto",
    sort_order: manualIndex === -1 ? 999 : manualIndex
  };
}

async function main() {
  const staticFlashers = await readJson(staticFlashersPath, []);
  const existingGenerated = await readJson(srcOutputPath, []);
  const repos = await readJson(reposPath, []);
  const manualByRepo = new Map(staticFlashers.map((flasher, index) => [repoKeyFromUrl(flasher.github_url), { flasher, index }]));
  const generatedByRepo = new Map(existingGenerated.map((flasher) => [repoKeyFromUrl(flasher.github_url), flasher]));
  const entries = [];

  for (const repo of repos) {
    if (repo.archived || repo.fork) continue;

    const key = repoKey(repo);
    const manualMeta = manualByRepo.get(key);
    const previous = generatedByRepo.get(key);
    const flasherUrl = await detectFlasherUrl(repo, manualMeta?.flasher?.flasher_url || previous?.flasher_url || "");

    if (!manualMeta && !flasherUrl) {
      continue;
    }

    entries.push(buildEntry(repo, manualMeta?.flasher, flasherUrl, manualMeta?.index ?? -1));
  }

  for (const [key, manualMeta] of manualByRepo.entries()) {
    if (entries.some((entry) => repoKeyFromUrl(entry.github_url) === key)) continue;
    entries.push({
      ...manualMeta.flasher,
      source: "manual",
      sort_order: manualMeta.index,
      updated_at: ""
    });
  }

  const sorted = entries
    .sort((a, b) => a.sort_order - b.sort_order || new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .map(({ sort_order, ...entry }) => entry);

  await saveJson(srcOutputPath, sorted);
  await saveJson(publicOutputPath, sorted);
  console.log(`Saved ${sorted.length} flasher entries.`);
}

main();
