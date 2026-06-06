import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputPaths = [resolve("src/data/news.generated.json"), resolve("public/data/news.json")];
const maxAgeDays = 30;
const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
const now = new Date();
const cutoffTime = now.getTime() - maxAgeMs;

const feeds = [
  { name: "Hackaday", url: "https://hackaday.com/blog/feed/" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews" },
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/" },
  { name: "Flipper Blog", url: "https://blog.flipper.net/rss/" },
  { name: "Adafruit Blog", url: "https://blog.adafruit.com/feed/" },
  { name: "Raspberry Pi News", url: "https://www.raspberrypi.com/news/feed/" },
  { name: "Arduino Blog", url: "https://blog.arduino.cc/feed/" },
  { name: "Hackster News", url: "https://www.hackster.io/news.atom" },
  { name: "Hashcat Releases", url: "https://github.com/hashcat/hashcat/releases.atom" },
  { name: "Bettercap Releases", url: "https://github.com/bettercap/bettercap/releases.atom" },
  { name: "Pwnagotchi Releases", url: "https://github.com/jayofelony/pwnagotchi/releases.atom" },
  { name: "M5Cardputer Releases", url: "https://github.com/m5stack/M5Cardputer/releases.atom" },
  { name: "ESP32 Marauder Releases", url: "https://github.com/justcallmekoko/ESP32Marauder/releases.atom" }
];

const topicRules = [
  { topic: "Flipper", terms: ["flipper zero", "flipper one", "flipper"] },
  { topic: "Cardputer/M5Stack", terms: ["cardputer", "m5cardputer", "m5stack", "m5stick", "m5core", "m5stamp", "m5paper", "m5dial"] },
  { topic: "Hashcat", terms: ["hashcat", "password cracking", "password recovery"] },
  { topic: "Pwnagotchi", terms: ["pwnagotchi", "bettercap"] },
  { topic: "Firmware", terms: ["firmware", "embedded", "bootloader", "ota"] },
  { topic: "ESP32", terms: ["esp32", "esp8266", "esp32-s3", "esp32-c3", "espressif", "marauder"] },
  { topic: "Dev boards", terms: ["arduino", "raspberry pi", "rp2040", "rp2350", "risc-v", "microcontroller", "single-board computer"] },
  { topic: "Gadgets", terms: ["gadget", "device", "handheld", "hardware", "cyberdeck", "linux handheld", "pocket computer"] },
  { topic: "RF", terms: ["rf", "radio", "sdr", "sub-ghz", "sub ghz", "nrf24", "lora", "meshtastic", "hackrf", "yard stick", "yardstick", "proxmark", "proxmark3"] },
  { topic: "WiFi/BLE", terms: ["wifi", "wi-fi", "bluetooth", "ble"] },
  { topic: "NFC/RFID", terms: ["nfc", "rfid"] },
  { topic: "IoT", terms: ["iot", "smart home", "sensor", "lilygo", "t-deck", "t-embed", "t-display", "seeed studio"] },
  { topic: "Seguridad", terms: ["security", "cybersecurity", "vulnerability", "exploit", "malware", "hacking"] }
];

const preferredTerms = [
  "flipper",
  "cardputer",
  "m5stack",
  "hashcat",
  "pwnagotchi",
  "bettercap",
  "firmware",
  "esp32",
  "embedded",
  "hardware",
  "rf",
  "wifi",
  "bluetooth",
  "iot",
  "hackrf",
  "proxmark",
  "meshtastic",
  "lilygo"
];

const htmlEntities = new Map([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["quot", "\""],
  ["apos", "'"],
  ["#039", "'"],
  ["nbsp", " "]
]);

function decodeHtml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z0-9#]+);/gi, (_, entity) => htmlEntities.get(entity) ?? `&${entity};`)
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeHtml(match?.[1] ?? "");
}

function rssLink(itemXml) {
  const link = tagValue(itemXml, "link");
  if (link) {
    return link;
  }
  return tagValue(itemXml, "guid");
}

function atomLink(entryXml) {
  const hrefMatch = entryXml.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (hrefMatch) {
    return decodeHtml(hrefMatch[1]);
  }
  return tagValue(entryXml, "link");
}

function topicsFor(text) {
  const lower = text.toLowerCase();
  return topicRules
    .filter((rule) => rule.terms.some((term) => matchesTerm(lower, term)))
    .map((rule) => rule.topic);
}

function matchesTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function scoreItem(item) {
  const haystack = `${item.title} ${item.summary} ${item.topics.join(" ")}`.toLowerCase();
  return preferredTerms.reduce((score, term) => score + (matchesTerm(haystack, term) ? 1 : 0), item.topics.length);
}

function hasOnlySecurity(item) {
  return item.topics.length === 1 && item.topics[0] === "Seguridad";
}

function isRecent(item) {
  if (!item.published_at) {
    return false;
  }

  const publishedTime = Date.parse(item.published_at);
  return Number.isFinite(publishedTime) && publishedTime >= cutoffTime && publishedTime <= now.getTime() + 60 * 60 * 1000;
}

function dedupeItems(items) {
  const byKey = new Map();

  for (const rawItem of items.map(normalizeItem)) {
    if (!rawItem.title || !rawItem.url || rawItem.topics.length === 0 || !isRecent(rawItem)) {
      continue;
    }

    const key = rawItem.url.toLowerCase().replace(/[#?].*$/, "") || rawItem.title.toLowerCase();
    const current = byKey.get(key);
    if (!current || Date.parse(rawItem.published_at) > Date.parse(current.published_at) || scoreItem(rawItem) > scoreItem(current)) {
      byKey.set(key, rawItem);
    }
  }

  const byTitle = new Map();

  for (const item of byKey.values()) {
    const titleKey = item.title.toLowerCase().replace(/\s+/g, " ").trim();
    const current = byTitle.get(titleKey);

    if (!current || Date.parse(item.published_at) > Date.parse(current.published_at) || scoreItem(item) > scoreItem(current)) {
      byTitle.set(titleKey, item);
    }
  }

  return [...byTitle.values()];
}

function balancedSelection(items, limit) {
  const ranked = items.sort((a, b) => {
    const dateA = a.published_at ? Date.parse(a.published_at) : 0;
    const dateB = b.published_at ? Date.parse(b.published_at) : 0;
    return scoreItem(b) - scoreItem(a) || dateB - dateA;
  });

  const selected = [];
  const sourceCounts = new Map();
  let securityOnlyCount = 0;

  for (const item of ranked) {
    const sourceCount = sourceCounts.get(item.source) ?? 0;
    const securityOnly = hasOnlySecurity(item);

    if (sourceCount >= 8) {
      continue;
    }

    if (securityOnly && securityOnlyCount >= 8) {
      continue;
    }

    selected.push(item);
    sourceCounts.set(item.source, sourceCount + 1);
    securityOnlyCount += securityOnly ? 1 : 0;

    if (selected.length === limit) {
      break;
    }
  }

  return selected.sort((a, b) => {
    const dateA = a.published_at ? Date.parse(a.published_at) : 0;
    const dateB = b.published_at ? Date.parse(b.published_at) : 0;
    return dateB - dateA;
  });
}

function parseDate(value) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function parseRssItems(xml, source) {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(([itemXml]) => {
    const title = tagValue(itemXml, "title");
    const url = rssLink(itemXml);
    const summary = tagValue(itemXml, "description") || tagValue(itemXml, "content:encoded");
    const publishedAt = parseDate(tagValue(itemXml, "pubDate") || tagValue(itemXml, "dc:date"));
    const topics = topicsFor(`${title} ${summary}`);

    return { title, url, source, published_at: publishedAt, summary, topics };
  });
}

function parseAtomItems(xml, source) {
  return [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map(([entryXml]) => {
    const title = tagValue(entryXml, "title");
    const url = atomLink(entryXml);
    const summary = tagValue(entryXml, "summary") || tagValue(entryXml, "content");
    const publishedAt = parseDate(tagValue(entryXml, "published") || tagValue(entryXml, "updated"));
    const topics = topicsFor(`${title} ${summary}`);

    return { title, url, source, published_at: publishedAt, summary, topics };
  });
}

function normalizeItem(item) {
  const cleanSummary = decodeHtml(item.summary).slice(0, 260);
  return {
    title: decodeHtml(item.title),
    url: item.url,
    source: item.source,
    published_at: item.published_at,
    summary: cleanSummary,
    topics: [...new Set(item.topics)]
  };
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      "User-Agent": "PepeAngell-Labs-News/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return [...parseRssItems(xml, feed.name), ...parseAtomItems(xml, feed.name)];
}

async function readExisting() {
  for (const outputPath of outputPaths) {
    try {
      const json = await readFile(outputPath, "utf8");
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed.items;
      }
    } catch {
      // Keep trying the next generated file.
    }
  }

  return [];
}

async function save(payload) {
  for (const outputPath of outputPaths) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }
}

const allItems = [];
const errors = [];

for (const feed of feeds) {
  try {
    allItems.push(...(await fetchFeed(feed)));
  } catch (error) {
    errors.push(`${feed.name}: ${error.message}`);
  }
}

const existingItems = await readExisting();
let items = dedupeItems([...allItems, ...existingItems]).filter((item) => scoreItem(item) > 0);

items = balancedSelection(items, 24);

const payload = {
  generated_at: now.toISOString(),
  max_age_days: maxAgeDays,
  sources: feeds.map((feed) => ({ name: feed.name, url: feed.url })),
  errors,
  items
};

await save(payload);
console.log(`Generated ${items.length} news items${errors.length ? ` (${errors.length} feed errors)` : ""}.`);
