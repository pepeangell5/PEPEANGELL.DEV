import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const flashersPath = resolve("src/data/flashers.json");
const reposPath = resolve("public/data/repos.json");
const srcOutputPath = resolve("src/data/downloads.generated.json");
const publicOutputPath = resolve("public/data/downloads.json");

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
    const response = await fetch(url, { headers: { Accept: "application/json" } });
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

function buildDownloadEntry(flasher, repo, manifest) {
  const fullName = repo?.full_name || repoNameFromUrl(flasher.github_url);
  const branch = repo?.default_branch || "main";
  const githubUrl = flasher.github_url || repo?.html_url || "";
  const repoBase = githubUrl.replace(/\/$/, "");
  const flasherUrl = flasher.flasher_url || "";
  const manifestUrl = flasherUrl ? new URL("manifest.json", flasherUrl).href : "";

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
    manifest_url: manifestUrl,
    binarios_url: binariosUrl,
    releases_url: `${repoBase}/releases`,
    zip_url: `${repoBase}/archive/refs/heads/${branch}.zip`,
    readme_url: `/firmware/#${firmwareHash(repoSlug(fullName) || flasher.name)}`,
    web_flasher_binaries: webFlasherBinaries
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

  for (const flasher of flashers) {
    const fullName = repoNameFromUrl(flasher.github_url);
    const repo = repoByName.get(fullName);
    const manifestUrl = flasher.flasher_url ? new URL("manifest.json", flasher.flasher_url).href : "";
    const manifest = await fetchJson(manifestUrl);
    downloads.push(buildDownloadEntry(flasher, repo, manifest));
  }

  await saveJson(srcOutputPath, downloads);
  await saveJson(publicOutputPath, downloads);
  console.log(`Saved ${downloads.length} download entries.`);
}

main();
