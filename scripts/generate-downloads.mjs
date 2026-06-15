import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const flashersPath = resolve("src/data/flashers.generated.json");
const reposPath = resolve("public/data/repos.json");
const srcOutputPath = resolve("src/data/downloads.generated.json");
const publicOutputPath = resolve("public/data/downloads.json");
const documentsRepoFullName = "pepeangell5/Documentos-Descargas";
const excludedRepoNames = new Set(["PEPEANGELL.DEV", "pepeangell5", "Documentos-Descargas"]);
const excludedDocumentNames = new Set(["readme.md", "license", "license.md"]);

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function repoNameFromUrl(url) {
  const match = String(url || "").match(/github\.com\/([^/]+\/[^/#?]+)/i);
  return match?.[1] || "";
}

function repoSlug(fullName) {
  return String(fullName || "").split("/").pop() || "";
}

function dirnameFromPath(path) {
  const clean = String(path || "").replace(/\\/g, "/");
  if (!clean || !clean.includes("/")) return "";
  return clean.split("/").slice(0, -1).join("/");
}

function encodeGithubTreePath(path) {
  return String(path || "")
    .split("/")
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");
}

async function fetchJson(url) {
  if (!url) return null;

  try {
    const headers = { Accept: "application/json" };
    if (process.env.GITHUB_TOKEN && url.includes("api.github.com")) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function firmwareHash(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromRepoName(name) {
  return String(name || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b(v\d+(?:\.\d+)*)\b/gi, (match) => match.toUpperCase())
    .replace(/\b(esp32|esp8266|bw16|rf|ble|wifi|ghz|tft|oled|gps|nrf|cc1101|ir|fpv|pc)\b/gi, (match) =>
      match.toUpperCase()
    )
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function textFor(repo) {
  return `${repo?.name || ""} ${repo?.description || ""} ${(repo?.topics || []).join(" ")} ${repo?.language || ""}`.toLowerCase();
}

function inferModules(repo) {
  const text = textFor(repo);
  const modules = new Set();
  const rules = [
    ["ESP32-S3", ["esp32-s3", "esp32s3"]],
    ["ESP32-C3", ["esp32-c3", "esp32c3", "esp32c3-supermini"]],
    ["ESP32", ["esp32", "espressif"]],
    ["ESP8266", ["esp8266"]],
    ["BW16", ["bw16"]],
    ["RTL8720DN", ["rtl8720dn"]],
    ["WiFi", ["wifi", "wi-fi", "wireless", "deauther"]],
    ["BLE", ["ble", "bluetooth"]],
    ["RF", ["rf", "radio", "sub-ghz", "subghz"]],
    ["NRF24", ["nrf24", "nrf24l01"]],
    ["CC1101", ["cc1101"]],
    ["TFT", ["tft", "ili9488", "ili9341", "st7789"]],
    ["OLED", ["oled", "ssd1306", "sh1106"]],
    ["Display", ["display", "screen", "lcd", "pantalla"]],
    ["Cardputer", ["cardputer"]],
    ["GPS", ["gps", "neo-6m", "neo 6m"]],
    ["IR", ["infrared", "ir", "remote"]],
    ["ESP-NOW", ["esp-now", "espnow"]],
    ["Drone", ["drone", "fpv"]],
    ["USB", ["usb", "rubberducky", "keyboard"]]
  ];

  for (const [label, terms] of rules) {
    if (terms.some((term) => text.includes(term))) {
      modules.add(label);
    }
  }

  return modules.size > 0 ? [...modules].slice(0, 8) : ["Proyecto"];
}

function inferBoard(repo) {
  const text = textFor(repo);
  if (text.includes("cardputer")) return "M5Stack Cardputer";
  if (text.includes("esp32-s3") || text.includes("esp32s3")) return "ESP32-S3 compatible";
  if (text.includes("esp32-c3") || text.includes("esp32c3")) return "ESP32-C3 compatible";
  if (text.includes("esp8266")) return "ESP8266 compatible";
  if (text.includes("bw16") || text.includes("rtl8720dn")) return "BW16 RTL8720DN";
  if (text.includes("arduino")) return "Arduino compatible";
  if (text.includes("esp32")) return "ESP32 compatible";
  return "Hardware compatible";
}

function inferDisplay(repo) {
  const text = textFor(repo);
  if (text.includes("ili9488") || text.includes("480x320")) return "TFT ILI9488 480x320 SPI";
  if (text.includes("ili9341")) return "TFT ILI9341 SPI";
  if (text.includes("st7789")) return "TFT ST7789 SPI";
  if (text.includes("oled") || text.includes("ssd1306")) return "OLED SSD1306";
  if (text.includes("cardputer")) return "M5Stack Cardputer integrated display";
  if (text.includes("display") || text.includes("screen") || text.includes("pantalla")) return "Display depending on build";
  return "Optional serial/display output";
}

function shouldIncludeRepo(repo, includedFullNames) {
  return (
    repo?.full_name &&
    !repo.archived &&
    !repo.fork &&
    !includedFullNames.has(repo.full_name) &&
    !excludedRepoNames.has(repo.name)
  );
}

function releaseAssetsFrom(release) {
  return (release?.assets || [])
    .filter((asset) => asset.browser_download_url)
    .map((asset) => ({
      name: asset.name,
      url: asset.browser_download_url,
      size: asset.size,
      download_count: asset.download_count
    }));
}

function buildDownloadEntry(flasher, repo, manifest, release) {
  const fullName = repo?.full_name || repoNameFromUrl(flasher.github_url);
  const branch = repo?.default_branch || "main";
  const githubUrl = flasher.github_url || repo?.html_url || "";
  const repoBase = githubUrl.replace(/\/$/, "");
  const flasherUrl = flasher.flasher_url || "";

  const webFlasherBinaries = [];
  const binaryFolders = new Set();

  for (const build of manifest?.builds || []) {
    for (const part of build.parts || []) {
      if (!part.path || !flasherUrl) continue;

      const folder = dirnameFromPath(part.path);
      if (folder) binaryFolders.add(folder);

      webFlasherBinaries.push({
        label: part.path.split("/").pop(),
        path: part.path,
        url: new URL(part.path, flasherUrl).href,
        offset: part.offset,
        chip_family: build.chipFamily
      });
    }
  }

  const binariosUrl =
    binaryFolders.size > 0
      ? `${repoBase}/tree/${branch}/${encodeGithubTreePath([...binaryFolders][0])}`
      : `${repoBase}/search?q=extension%3Abin&type=code`;

  return {
    name: flasher.name,
    slug: flasher.slug || firmwareHash(flasher.name),
    status: flasher.status,
    board: flasher.board,
    display: flasher.display,
    modules: flasher.modules || [],
    github_url: githubUrl,
    full_name: fullName,
    default_branch: branch,
    web_flasher_url: flasherUrl,
    binarios_url: binariosUrl,
    release_tag: release?.tag_name || "",
    release_assets: releaseAssetsFrom(release),
    zip_url: `${repoBase}/archive/refs/heads/${branch}.zip`,
    readme_url: `/firmware/#${firmwareHash(repoSlug(fullName) || flasher.name)}`,
    web_flasher_binaries: webFlasherBinaries
  };
}

function buildRepoDownloadEntry(repo, release) {
  const branch = repo.default_branch || "main";
  const repoBase = String(repo.html_url || `https://github.com/${repo.full_name}`).replace(/\/$/, "");
  const repoName = repoSlug(repo.full_name);

  return {
    name: titleFromRepoName(repo.name),
    slug: firmwareHash(repo.name),
    status: "Repositorio",
    board: inferBoard(repo),
    display: inferDisplay(repo),
    modules: inferModules(repo),
    github_url: repoBase,
    full_name: repo.full_name,
    default_branch: branch,
    web_flasher_url: "",
    binarios_url: `${repoBase}/search?q=extension%3Abin&type=code`,
    release_tag: release?.tag_name || "",
    release_assets: releaseAssetsFrom(release),
    zip_url: `${repoBase}/archive/refs/heads/${branch}.zip`,
    readme_url: `/firmware/#${firmwareHash(repoName || repo.name)}`,
    web_flasher_binaries: []
  };
}

function fileNameFromPath(path) {
  return String(path || "").split("/").pop() || "";
}

function folderNameFromPath(path) {
  const parts = String(path || "").split("/");
  return parts.length > 1 ? parts.slice(0, -1).join("/") : "Raiz";
}

function readableFileTitle(path) {
  const name = fileNameFromPath(path).replace(/\.[^.]+$/, "");
  return titleFromRepoName(name);
}

function rawGithubUrl(fullName, branch, path) {
  return `https://raw.githubusercontent.com/${fullName}/${encodeURIComponent(branch)}/${encodeGithubTreePath(path)}`;
}

function githubBlobUrl(fullName, branch, path) {
  return `https://github.com/${fullName}/blob/${encodeURIComponent(branch)}/${encodeGithubTreePath(path)}`;
}

async function buildDocumentsDownloadEntry(repo) {
  const fullName = repo?.full_name || documentsRepoFullName;
  const branch = repo?.default_branch || "main";
  const repoBase = String(repo?.html_url || `https://github.com/${fullName}`).replace(/\/$/, "");
  const tree = await fetchJson(`https://api.github.com/repos/${fullName}/git/trees/${branch}?recursive=1`);
  const documents = (tree?.tree || [])
    .filter((entry) => entry.type === "blob" && entry.path)
    .filter((entry) => !excludedDocumentNames.has(fileNameFromPath(entry.path).toLowerCase()))
    .filter((entry) => !fileNameFromPath(entry.path).startsWith("."))
    .map((entry) => ({
      name: readableFileTitle(entry.path),
      file_name: fileNameFromPath(entry.path),
      folder: folderNameFromPath(entry.path),
      path: entry.path,
      size: entry.size || 0,
      download_url: rawGithubUrl(fullName, branch, entry.path),
      github_url: githubBlobUrl(fullName, branch, entry.path)
    }))
    .sort((a, b) => a.folder.localeCompare(b.folder) || a.file_name.localeCompare(b.file_name));

  return {
    type: "documents",
    name: "Documentacion y descargas",
    slug: "documentos-descargas",
    status: "Documentos",
    board: "PDFs, guias y recursos",
    display: "Archivos publicados desde GitHub",
    modules: ["PDF", "Documentacion", "Descargas"],
    github_url: repoBase,
    full_name: fullName,
    default_branch: branch,
    web_flasher_url: "",
    binarios_url: "",
    release_tag: "",
    release_assets: [],
    zip_url: `${repoBase}/archive/refs/heads/${branch}.zip`,
    readme_url: "",
    web_flasher_binaries: [],
    documents
  };
}

async function saveJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const flashers = await readJson(flashersPath, []);
  const repos = await readJson(reposPath, []);
  const repoByName = new Map(repos.map((repo) => [repo.full_name, repo]));
  const downloads = [];
  const includedFullNames = new Set();
  const documentsRepo =
    repoByName.get(documentsRepoFullName) || {
      full_name: documentsRepoFullName,
      name: "Documentos-Descargas",
      html_url: `https://github.com/${documentsRepoFullName}`,
      default_branch: "main"
    };

  downloads.push(await buildDocumentsDownloadEntry(documentsRepo));
  includedFullNames.add(documentsRepoFullName);

  for (const flasher of flashers) {
    const fullName = repoNameFromUrl(flasher.github_url);
    const repo = repoByName.get(fullName);
    const manifestUrl = flasher.flasher_url ? new URL("manifest.json", flasher.flasher_url).href : "";
    const manifest = await fetchJson(manifestUrl);
    const release = await fetchJson(`https://api.github.com/repos/${fullName}/releases/latest`);
    downloads.push(buildDownloadEntry(flasher, repo, manifest, release));
    if (fullName) includedFullNames.add(fullName);
  }

  for (const repo of repos) {
    if (!shouldIncludeRepo(repo, includedFullNames)) continue;

    const release = await fetchJson(`https://api.github.com/repos/${repo.full_name}/releases/latest`);
    downloads.push(buildRepoDownloadEntry(repo, release));
    includedFullNames.add(repo.full_name);
  }

  await saveJson(srcOutputPath, downloads);
  await saveJson(publicOutputPath, downloads);
  console.log(`Saved ${downloads.length} download entries.`);
}

main();
