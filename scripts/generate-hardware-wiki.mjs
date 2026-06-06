import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const catalogPath = resolve("src/data/hardware-catalog.json");
const projectsPath = resolve("src/data/projects.json");
const flashersPath = resolve("src/data/flashers.json");
const readmesPath = resolve("public/data/readmes.json");
const srcOutputPath = resolve("src/data/hardware-wiki.generated.json");
const publicOutputPath = resolve("public/data/hardware-wiki.json");

const categoryOrder = ["MCU", "Display", "RF", "IR", "Sensors", "Power", "Input", "Prototyping", "Actuators", "Detectado"];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function aliasHit(text, aliases) {
  const normalizedText = normalize(text);
  return aliases.some((alias) => normalizedText.includes(normalize(alias)));
}

function matchesComponent(candidate, component) {
  const normalizedCandidate = normalize(candidate);
  const aliases = [component.name, ...(component.aliases || [])].map(normalize).filter(Boolean);
  return aliases.some((alias) => normalizedCandidate.includes(alias) || alias.includes(normalizedCandidate));
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/`+/g, "")
    .replace(/\*\*/g, "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, (match) => match.match(/\[([^\]]+)\]/)?.[1] || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyComponent(value) {
  const text = stripMarkdown(value);
  if (!text || text.length < 3 || text.length > 80) return false;
  if (/^(componente|component|cantidad|notas?|nota|modulo|conexi[oó]n recomendada|oled|esp32)$/i.test(text)) return false;
  if (/^\d+$/.test(text)) return false;
  if (/\b(SDA|SCL|GPIO|Pin|vista|acci[oó]n|funci[oó]n)\b/i.test(text)) return false;
  return /esp32|bw16|rtl|oled|ssd|sh1106|tft|ili|st7789|st7735|nrf|cc1101|rf433|ir|gps|neo-?6m|encoder|rotativo|tp4056|step|bater|lipo|capacitor|bot[oó]n|interruptor|pcb|proto|cable|dupont|usb|motor|sensor|cardputer|acebott/i.test(text);
}

function extractHardwareTableItems(markdown, repoName) {
  const lines = String(markdown || "").split(/\r?\n/);
  const found = [];
  let inHardwareSection = false;

  for (const line of lines) {
    if (/^#{2,4}\s+/.test(line)) {
      inHardwareSection = /hardware|componente|componentes|alimentaci[oó]n|conexi[oó]n|material/i.test(line);
      continue;
    }

    if (!inHardwareSection || !line.trim().startsWith("|")) continue;
    if (/^\|\s*-+/.test(line) || /\|\s*:?-{2,}/.test(line)) continue;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => stripMarkdown(cell));

    const candidate = cells[0];
    if (isLikelyComponent(candidate)) {
      found.push({ name: candidate, repo: repoName });
    }
  }

  return found;
}

function collectSourceNames(component, readmes, projects, flashers) {
  const aliases = [component.name, ...(component.aliases || [])];
  const sources = new Set();

  for (const repo of readmes) {
    if (aliasHit(`${repo.name} ${repo.full_name} ${repo.description} ${repo.markdown}`, aliases)) {
      sources.add(repo.name);
    }
  }

  for (const project of projects) {
    const text = [
      project.name,
      project.description,
      project.details,
      ...(project.hardware || []),
      ...(project.tags || [])
    ].join(" ");
    if (aliasHit(text, aliases)) sources.add(project.name);
  }

  for (const flasher of flashers) {
    const text = [flasher.name, flasher.board, flasher.display, ...(flasher.modules || [])].join(" ");
    if (aliasHit(text, aliases)) sources.add(flasher.name);
  }

  return [...sources].sort((a, b) => a.localeCompare(b));
}

function createDetectedComponent(name, sources) {
  return {
    name,
    category: "Detectado",
    aliases: [name],
    description: "Componente detectado automáticamente en una tabla o sección de hardware de un README público.",
    voltage: "Pendiente de documentar según el módulo exacto.",
    usage: "Detectado en documentación pública del laboratorio.",
    warning: "Verificar pinout, voltaje y hoja de datos antes de conectarlo.",
    auto_detected: true,
    sources: [...sources].sort((a, b) => a.localeCompare(b))
  };
}

async function saveJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const catalog = await readJson(catalogPath, []);
  const readmes = await readJson(readmesPath, []);
  const projects = await readJson(projectsPath, []);
  const flashers = await readJson(flashersPath, []);

  const components = catalog.map((component) => ({
    ...component,
    sources: collectSourceNames(component, readmes, projects, flashers),
    auto_detected: false
  }));

  const detected = new Map();
  for (const repo of readmes) {
    for (const item of extractHardwareTableItems(repo.markdown, repo.name)) {
      const isKnown = components.some((component) => matchesComponent(item.name, component));
      if (isKnown) continue;

      const key = normalize(item.name);
      if (!detected.has(key)) detected.set(key, { name: item.name, sources: new Set() });
      detected.get(key).sources.add(item.repo);
    }
  }

  for (const item of detected.values()) {
    components.push(createDetectedComponent(item.name, item.sources));
  }

  components.sort((a, b) => {
    const categoryA = categoryOrder.indexOf(a.category);
    const categoryB = categoryOrder.indexOf(b.category);
    const safeA = categoryA === -1 ? 999 : categoryA;
    const safeB = categoryB === -1 ? 999 : categoryB;
    return safeA - safeB || a.name.localeCompare(b.name);
  });

  await saveJson(srcOutputPath, components);
  await saveJson(publicOutputPath, components);
  console.log(`Saved ${components.length} hardware wiki entries.`);
}

main();
