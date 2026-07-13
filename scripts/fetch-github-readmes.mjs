import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";

const reposPath = resolve("public/data/repos.json");
const outputPath = resolve("public/data/readmes.json");
const priorityRepos = [
  "BWifiKill-ESP32-V4.0",
  "ESP32-TOOLS-PRO-480x320-V2.0",
  "CYBERDECK-MINI-ESP32",
  "RF-KILL-ESP32-DEVKIT",
  "RF-KILL",
  "BWifiKill-BW16-5Ghz",
  "BWifiKill-ESP32",
  "ESP32-TOOLS-MODERN"
];

function priorityIndex(repo) {
  const index = priorityRepos.findIndex((name) => name.toLowerCase() === String(repo.name || "").toLowerCase());
  return index === -1 ? 999 : index;
}

function authHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

function decodeBase64(content) {
  return Buffer.from(String(content || "").replace(/\n/g, ""), "base64").toString("utf8");
}

function isExternalUrl(url) {
  return /^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(url);
}

function splitRelativeUrl(url) {
  const value = String(url || "");
  const match = value.match(/^([^?#]*)([?#].*)?$/);
  return {
    path: match?.[1] || "",
    suffix: match?.[2] || ""
  };
}

function cleanRelativePath(url) {
  const { path, suffix } = splitRelativeUrl(url);
  const clean = path.replace(/^\.\//, "").replace(/^\/+/, "");
  return `${encodeURI(clean)}${suffix}`;
}

function normalizeRelativeUrl(url, repo) {
  if (isExternalUrl(url)) return url;

  const clean = cleanRelativePath(url);
  const branch = repo.default_branch || "main";
  return `https://github.com/${repo.full_name}/blob/${branch}/${clean}`;
}

function normalizeRelativeImage(url, repo) {
  if (isExternalUrl(url)) return url;

  const clean = cleanRelativePath(url);
  const branch = repo.default_branch || "main";
  return `https://raw.githubusercontent.com/${repo.full_name}/${branch}/${clean}`;
}

function rewriteMarkdownUrls(markdown, repo) {
  const withMarkdownLinks = markdown.replace(
    /(!?)\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g,
    (match, bang, label, url, title = "") => {
      const normalized = bang ? normalizeRelativeImage(url, repo) : normalizeRelativeUrl(url, repo);
      return `${bang}[${label}](${normalized}${title})`;
    }
  );

  return withMarkdownLinks.replace(/<img\b[^>]*>/gi, (tag) =>
    tag.replace(/(\bsrc\s*=\s*)(["'])([^"']+)\2/i, (match, prefix, quote, url) => {
      const normalized = normalizeRelativeImage(url, repo);
      return `${prefix}${quote}${normalized}${quote}`;
    })
  );
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function saveReadmes(readmes) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(readmes, null, 2)}\n`, "utf8");
}

async function fetchReadme(repo, processor) {
  const response = await fetch(`https://api.github.com/repos/${repo.full_name}/readme`, {
    headers: authHeaders()
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${repo.full_name} README returned ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const markdown = decodeBase64(data.content);
  const normalizedMarkdown = rewriteMarkdownUrls(markdown, repo);
  const rendered = await processor.render(normalizedMarkdown);

  return {
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    readme_html_url: data.html_url,
    readme_download_url: data.download_url,
    default_branch: repo.default_branch,
    updated_at: repo.updated_at,
    topics: repo.topics || [],
    language: repo.language,
    markdown,
    html: rendered.code,
    headings: rendered.metadata.headings
  };
}

async function main() {
  const repos = await readJson(reposPath, []);
  const existing = await readJson(outputPath, []);

  if (!Array.isArray(repos) || repos.length === 0) {
    await saveReadmes(existing);
    console.warn("No repos found; preserved existing README data.");
    return;
  }

  const processor = await createMarkdownProcessor({ gfm: true, smartypants: false });
  const readmes = [];

  for (const repo of repos.filter((item) => !item.fork && !item.archived)) {
    try {
      const readme = await fetchReadme(repo, processor);
      if (readme) {
        readmes.push(readme);
        console.log(`Fetched README for ${repo.full_name}`);
      }
    } catch (error) {
      console.warn(`Could not fetch README for ${repo.full_name}: ${error.message}`);
    }
  }

  readmes.sort((a, b) => priorityIndex(a) - priorityIndex(b) || new Date(b.updated_at) - new Date(a.updated_at));
  await saveReadmes(readmes.length > 0 ? readmes : existing);
  console.log(`Saved ${readmes.length || existing.length} README entries to ${outputPath}`);
}

main();
