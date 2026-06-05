import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const username = "pepeangell5";
const endpoint = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`;
const outputPath = resolve("public/data/repos.json");
const priorityRepos = [
  "BWifiKill-ESP32-V4.0",
  "ESP32-TOOLS-PRO-480x320-V2.0",
  "CYBERDECK-MINI-ESP32",
  "BWifiKill-BW16-5Ghz",
  "BWifiKill-ESP32",
  "ESP32-TOOLS-MODERN"
];

function priorityIndex(repo) {
  const index = priorityRepos.findIndex((name) => name.toLowerCase() === String(repo.name || "").toLowerCase());
  return index === -1 ? 999 : index;
}

const normalizeRepo = (repo) => ({
  name: repo.name,
  full_name: repo.full_name,
  description: repo.description,
  html_url: repo.html_url,
  homepage: repo.homepage,
  language: repo.language,
  stargazers_count: repo.stargazers_count,
  forks_count: repo.forks_count,
  updated_at: repo.updated_at,
  topics: Array.isArray(repo.topics) ? repo.topics : [],
  archived: Boolean(repo.archived),
  fork: Boolean(repo.fork)
});

async function readExistingRepos() {
  try {
    const existing = await readFile(outputPath, "utf8");
    return JSON.parse(existing);
  } catch {
    return [];
  }
}

async function saveRepos(repos) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(repos, null, 2)}\n`, "utf8");
}

async function main() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const repos = data
      .map(normalizeRepo)
      .sort((a, b) => priorityIndex(a) - priorityIndex(b) || new Date(b.updated_at) - new Date(a.updated_at));
    await saveRepos(repos);
    console.log(`Saved ${repos.length} public repos to ${outputPath}`);
  } catch (error) {
    const existing = await readExistingRepos();
    await saveRepos(existing);
    console.warn(`Could not fetch GitHub repos: ${error.message}`);
    console.warn(`Preserved ${existing.length} existing repos in ${outputPath}`);
  }
}

main();
