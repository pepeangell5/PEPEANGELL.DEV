(() => {
  const storageKey = "pepeangell-labs-language";
  const excludedSelector = "script, style, code, pre, [data-no-translate], .readme-raw, .support-terminal";
  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  let applying = false;

  const translations = new Map(
    Object.entries({
      "Saltar al contenido": "Skip to content",
      "Inicio": "Home",
      "Apoyo": "Support",
      "Firmware": "Firmware",
      "Repos": "Repos",
      "Flashers": "Flashers",
      "Hardware": "Hardware",
      "Descargas": "Downloads",
      "Noticias": "News",
      "Contacto": "Contact",
      "Idioma": "Language",
      "Navegacion principal": "Main navigation",
      "Navegación principal": "Main navigation",
      "PepeAngell Labs home": "PepeAngell Labs home",
      "Mascota rosa de PepeAngell Labs con lentes pixelados": "Pink PepeAngell Labs mascot with pixel sunglasses",
      "Mascota rosa de PepeAngell Labs": "Pink PepeAngell Labs mascot",
      "Ver firmwares": "View firmware",
      "Ver firmware": "View firmware",
      "Ver flashers": "View flashers",
      "Ver descargas": "View downloads",
      "Apoyar": "Support",
      "Firmware educativo, hardware hacking controlado y herramientas de laboratorio para ESP32, RF, BLE, WiFi, displays, cyberdecks y pruebas embebidas autorizadas.":
        "Educational firmware, controlled hardware hacking and lab tools for ESP32, RF, BLE, WiFi, displays, cyberdecks and authorized embedded testing.",
      "Firmware, descargas y apoyo": "Firmware, downloads and support",
      "Accesos directos a documentacion publica, binarios, herramientas de flasheo y formas de apoyar PepeAngell Labs.":
        "Quick access to public documentation, binaries, flashing tools and ways to support PepeAngell Labs.",
      "Accesos directos a documentación pública, binarios, herramientas de flasheo y formas de apoyar PepeAngell Labs.":
        "Quick access to public documentation, binaries, flashing tools and ways to support PepeAngell Labs.",
      "Firmware documentado": "Documented firmware",
      "Explora componentes, funciones, conexiones y notas de cada firmware sin salir de la pagina.":
        "Explore components, features, wiring and notes for each firmware without leaving the site.",
      "Explora componentes, funciones, conexiones y notas de cada firmware sin salir de la página.":
        "Explore components, features, wiring and notes for each firmware without leaving the site.",
      "Instalacion web": "Web installation",
      "Instalación web": "Web installation",
      "Accede a los enlaces de flasheo disponibles y a los repositorios cuando el flasher aun no esta publicado.":
        "Open available web flashers and repositories when a flasher is not published yet.",
      "Accede a los enlaces de flasheo disponibles y a los repositorios cuando el flasher aún no está publicado.":
        "Open available web flashers and repositories when a flasher is not published yet.",
      "Binarios y ZIP": "Binaries and ZIP",
      "Descarga binarios finales, manifests, releases y ZIP completos de los repositorios principales.":
        "Download final binaries, releases and full repository ZIP files.",
      "Ayuda al laboratorio": "Help the lab",
      "Apoya nuevas pruebas, componentes, documentacion y mantenimiento de proyectos educativos.":
        "Support new tests, components, documentation and maintenance for educational projects.",
      "Apoya nuevas pruebas, componentes, documentación y mantenimiento de proyectos educativos.":
        "Support new tests, components, documentation and maintenance for educational projects.",
      "Latest public repositories": "Latest public repositories",
      "Esta sección muestra primero los repos principales del laboratorio y se actualiza desde datos públicos de GitHub.":
        "This section shows the lab's main repositories first and updates from public GitHub data.",
      "PepeAngell Labs · ESP32, RF, BLE, WiFi y firmware educativo.": "PepeAngell Labs · ESP32, RF, BLE, WiFi and educational firmware.",
      "Visitas reales": "Real visits",
      "privado": "private",
      "Uso educativo y laboratorio controlado.": "Educational use and controlled lab only.",
      "Los proyectos publicados aquí son para investigación, aprendizaje y pruebas en entornos autorizados. No deben usarse en redes, sistemas, dispositivos o espacios donde no exista permiso explícito.":
        "Projects published here are for research, learning and testing in authorized environments. Do not use them on networks, systems, devices or spaces without explicit permission.",
      "README de proyectos GitHub": "GitHub project READMEs",
      "Explora la documentación pública de cada firmware sin salir de PepeAngell Labs. Selecciona un proyecto para ver componentes, funciones, conexiones y notas tal como vienen en su README.":
        "Explore each firmware's public documentation without leaving PepeAngell Labs. Select a project to view components, features, wiring and notes exactly as they appear in its README.",
      "Seleccionar firmware": "Select firmware",
      "Buscar firmware": "Search firmware",
      "Cargando README": "Loading README",
      "Descargando información pública desde GitHub.": "Downloading public information from GitHub.",
      "GitHub repo": "GitHub repo",
      "README original": "Original README",
      "Selecciona un firmware para ver su README dentro de PepeAngell Labs.": "Select firmware to view its README inside PepeAngell Labs.",
      "Ver Markdown original": "View original Markdown",
      "No hay README que coincidan con la búsqueda.": "No READMEs match the search.",
      "README público del repositorio.": "Public repository README.",
      "No hay contenido disponible.": "No content available.",
      "No se pudieron cargar los README públicos en este momento.": "Public READMEs could not be loaded right now.",
      "Flashers para hardware compatible": "Flashers for compatible hardware",
      "Tarjetas preparadas para enlazar firmware y flasheadores web detectados desde GitHub Pages. Usar solo con placas, pantallas y modulos compatibles.":
        "Cards ready to link firmware and web flashers detected from GitHub Pages. Use only with compatible boards, displays and modules.",
      "Tarjetas preparadas para enlazar firmware y flasheadores web detectados desde GitHub Pages. Usar solo con placas, pantallas y módulos compatibles.":
        "Cards ready to link firmware and web flashers detected from GitHub Pages. Use only with compatible boards, displays and modules.",
      "Flash only compatible hardware. Verifica placa, pantalla, pines y alimentación antes de usar.":
        "Flash only compatible hardware. Verify board, display, pins and power before use.",
      "GitHub repo": "GitHub repo",
      "Descargas de proyectos y repos": "Project and repo downloads",
      "Accesos directos a Web Flashers, binarios finales, releases y ZIP completos. Los repos nuevos se agregan automaticamente aunque todavia no tengan flasher detectado.":
        "Direct access to Web Flashers, final binaries, releases and full ZIP files. New repos are added automatically even when no flasher has been detected yet.",
      "Accesos directos a Web Flashers, binarios finales, releases y ZIP completos. Los repos nuevos se agregan automáticamente aunque todavía no tengan flasher detectado.":
        "Direct access to Web Flashers, final binaries, releases and full ZIP files. New repos are added automatically even when no flasher has been detected yet.",
      "Recomendacion:": "Recommendation:",
      "Recomendación:": "Recommendation:",
      "si el proyecto tiene Web Flasher, usa primero esa opcion. El binario final es el mismo archivo que usa el flasher para instalar el firmware.":
        "if the project has a Web Flasher, use that option first. The final binary is the same file the flasher uses to install the firmware.",
      "Buscar descarga": "Search download",
      "Ultima release:": "Latest release:",
      "Última release:": "Latest release:",
      "Binario final": "Final binary",
      "ZIP completo": "Full ZIP",
      "README local": "Local README",
      "Binarios usados por el Web Flasher": "Binaries used by the Web Flasher",
      "Este repositorio todavia no tiene Web Flasher detectado. Se muestran descargas directas disponibles y el ZIP completo del repositorio.":
        "This repository does not have a detected Web Flasher yet. Available direct downloads and the full repository ZIP are shown.",
      "Este repositorio todavía no tiene Web Flasher detectado. Se muestran descargas directas disponibles y el ZIP completo del repositorio.":
        "This repository does not have a detected Web Flasher yet. Available direct downloads and the full repository ZIP are shown.",
      "Componentes del laboratorio": "Lab components",
      "Lista tipo wiki de componentes, modulos, pantallas, energia y prototipado usados en los proyectos. Abre cada componente para ver descripcion, imagen, voltaje, uso tipico y advertencias.":
        "Wiki-style list of components, modules, displays, power parts and prototyping items used in the projects. Open each component to view description, image, voltage, typical use and warnings.",
      "Lista tipo wiki de componentes, módulos, pantallas, energía y prototipado usados en los proyectos. Abre cada componente para ver descripción, imagen, voltaje, uso típico y advertencias.":
        "Wiki-style list of components, modules, displays, power parts and prototyping items used in the projects. Open each component to view description, image, voltage, typical use and warnings.",
      "Buscar componente": "Search component",
      "Fuente de imagen": "Image source",
      "imagen pendiente": "image pending",
      "Voltaje / energia": "Voltage / power",
      "Voltaje / energía": "Voltage / power",
      "Uso en el laboratorio": "Lab usage",
      "Nota de seguridad": "Safety note",
      "Detectado automaticamente desde README.": "Automatically detected from README.",
      "Noticias": "News",
      "Lecturas recientes sobre firmware, gadgets, Cardputer, M5Stack, Hashcat, Pwnagotchi, Flipper, hardware hacking, RF, WiFi/BLE, ESP32, IoT y ciberseguridad. Solo se muestran noticias publicadas en los ultimos 30 dias y se actualizan desde fuentes RSS al generar la pagina.":
        "Recent reads about firmware, gadgets, Cardputer, M5Stack, Hashcat, Pwnagotchi, Flipper, hardware hacking, RF, WiFi/BLE, ESP32, IoT and cybersecurity. Only news published in the last 30 days is shown and it updates from RSS sources when the site is generated.",
      "Buscar": "Search",
      "Todo": "All",
      "Leer noticia": "Read news",
      "No hay noticias que coincidan con ese filtro.": "No news match that filter.",
      "Repos públicos": "Public repos",
      "Datos generados desde la API pública de GitHub y guardados en public/data/repos.json. Puedes buscar, filtrar por lenguaje y ordenar sin exponer tokens ni usar backend.":
        "Data generated from the public GitHub API and stored in public/data/repos.json. You can search, filter by language and sort without exposing tokens or using a backend.",
      "Lenguaje": "Language",
      "Todos": "All",
      "Ordenar": "Sort",
      "Principales": "Featured",
      "Última actualización": "Last updated",
      "Estrellas": "Stars",
      "Nombre": "Name",
      "Abrir repo": "Open repo",
      "Actualizado:": "Updated:",
      "Desconocido": "Unknown",
      "No hay repos para mostrar": "No repos to show",
      "No se pudo cargar /data/repos.json": "Could not load /data/repos.json",
      "Error cargando repos": "Error loading repos",
      "Revisa que public/data/repos.json exista.": "Check that public/data/repos.json exists.",
      "Contacto y enlaces": "Contact and links",
      "Enlaces oficiales para seguir proyectos, repositorios y actualizaciones de PepeAngell Labs.":
        "Official links to follow PepeAngell Labs projects, repositories and updates.",
      "Repositorios públicos, firmware, notas y proyectos.": "Public repositories, firmware, notes and projects.",
      "Updates visuales, avances de laboratorio y publicaciones cortas de proyectos.":
        "Visual updates, lab progress and short project posts.",
      "Comunidad y publicaciones relacionadas con ESP32 Tools.": "Community and posts related to ESP32 Tools.",
      "Apoya PepeAngell Labs": "Support PepeAngell Labs",
      "Si mis firmwares, guias, web flashers o pruebas con ESP32 te han servido, puedes apoyar el laboratorio para mantener mas placas, pantallas, modulos RF, componentes y documentacion publica.":
        "If my firmware, guides, web flashers or ESP32 tests have helped you, you can support the lab to keep more boards, displays, RF modules, components and public documentation going.",
      "Donar con PayPal": "Donate with PayPal",
      "Ver firmwares": "View firmware",
      "Componentes para pruebas": "Test components",
      "ESP32, BW16, NRF24L01, pantallas, placas, sensores y piezas para validar firmware real antes de publicarlo.":
        "ESP32, BW16, NRF24L01, displays, boards, sensors and parts to validate real firmware before publishing.",
      "Documentacion": "Documentation",
      "Documentación": "Documentation",
      "READMEs y guias": "READMEs and guides",
      "READMEs y guías": "READMEs and guides",
      "Tiempo para mantener conexiones, capturas, listas de componentes, flasheo web y notas de uso responsable.":
        "Time to maintain wiring, screenshots, component lists, web flashing and responsible use notes.",
      "Laboratorio": "Lab",
      "Proyectos abiertos": "Open projects",
      "Mas pruebas, mas compatibilidad y mejores herramientas educativas para la comunidad de hardware embebido.":
        "More testing, more compatibility and better educational tools for the embedded hardware community.",
      "Pagina no encontrada": "Page not found",
      "Página no encontrada": "Page not found",
      "La ruta no existe o todavia no se ha publicado. Puedes volver al inicio o explorar la documentacion.":
        "This route does not exist or has not been published yet. You can go back home or explore the documentation.",
      "Disclaimer bilingue": "Bilingual disclaimer",
      "Disclaimer bilingüe": "Bilingual disclaimer",
      "Todo el contenido se presenta con fines educativos, de investigación y laboratorio controlado.":
        "All content is presented for educational, research and controlled lab purposes.",
      "Español": "Spanish",
      "Todos los proyectos publicados en PepeAngell Labs tienen fines educativos, de investigación y pruebas en entornos controlados. No deben utilizarse en redes, sistemas, dispositivos o entornos donde no se tenga autorización explícita. El usuario final es responsable del uso que le dé al hardware, firmware o documentación publicada.":
        "All projects published on PepeAngell Labs are intended for educational, research and controlled testing environments only. Do not use them on networks, systems, devices or environments without explicit authorization. The end user is responsible for how they use any hardware, firmware or documentation published here.",
      "Project detail": "Project detail",
      "Ver README en Firmware": "View README in Firmware",
      "Responsible use disclaimer": "Responsible use disclaimer",
      "Registro de cambios": "Changelog",
      "Entradas estaticas mantenidas desde JSON para documentar avances del sitio y proyectos.":
        "Static entries maintained from JSON to document site and project progress.",
      "Entradas estáticas mantenidas desde JSON para documentar avances del sitio y proyectos.":
        "Static entries maintained from JSON to document site and project progress.",
      "Plan de trabajo": "Work plan",
      "Seguimiento simple para proyectos, pruebas y mejoras del sitio.":
        "Simple tracking for projects, tests and site improvements.",
      "Seccion actualizada": "Updated section",
      "Sección actualizada": "Updated section",
      "Notas ahora es Noticias": "Notes is now News",
      "La seccion de notas fue sustituida por un feed de noticias recientes sobre firmware, gadgets, Flipper, RF, WiFi/BLE, ESP32 y ciberseguridad.":
        "The notes section was replaced by a recent news feed about firmware, gadgets, Flipper, RF, WiFi/BLE, ESP32 and cybersecurity.",
      "La sección de notas fue sustituida por un feed de noticias recientes sobre firmware, gadgets, Flipper, RF, WiFi/BLE, ESP32 y ciberseguridad.":
        "The notes section was replaced by a recent news feed about firmware, gadgets, Flipper, RF, WiFi/BLE, ESP32 and cybersecurity.",
      "Ir a Noticias": "Go to News",
      "In progress": "In progress",
      "Planned": "Planned",
      "Testing": "Testing",
      "Done": "Done",
      "Stable": "Stable",
      "Experimental": "Experimental",
      "Demo": "Demo",
      "In Development": "In Development",
      "Completar documentación de hardware compatible": "Complete compatible hardware documentation",
      "Publicar enlaces de firmware y flasher cuando estén listos": "Publish firmware and flasher links when ready",
      "Validar layout 480x320 con ILI9488": "Validate 480x320 layout with ILI9488",
      "Agregar URL pública de Web Flasher": "Add public Web Flasher URL",
      "Documentar toolchain Realtek/AmebaD": "Document Realtek/AmebaD toolchain",
      "Crear tabla de compatibilidad para BW16 RTL8720DN": "Create compatibility table for BW16 RTL8720DN",
      "Probar energía, pantalla y controles": "Test power, display and controls",
      "Publicar galería técnica y notas de armado": "Publish technical gallery and build notes",
      "Publicación estable en pepeangell.dev": "Stable publication on pepeangell.dev",
      "Reemplazar botones de firmware por flashers reales cuando existan": "Replace firmware buttons with real flashers when available",
      "Website improvements": "Website improvements"
    })
  );

  const patterns = [
    [/^(\d+) repositorios p(?:ú|u|Ãº)?blicos$/, (_text, count) => `${count} public repositories`],
    [/^Stars: (.+)$/, (_text, value) => `Stars: ${value}`],
    [/^Forks: (.+)$/, (_text, value) => `Forks: ${value}`],
    [/^Updated: (.+)$/, (_text, value) => `Updated: ${value}`],
    [/^Actualizado: (.+)$/, (_text, value) => `Updated: ${value}`],
    [/^Actualizado automaticamente en el ultimo deploy: (.+)\. Las noticias abren en sitios externos\. Solo se muestran publicaciones de los ultimos (\d+) dias\.$/,
      (_text, date, days) => `Automatically updated in the latest deploy: ${date}. News opens on external sites. Only posts from the last ${days} days are shown.`],
    [/^No se encontraron noticias publicadas en los ultimos (\d+) dias\. El feed se revisa en cada deploy diario\.$/,
      (_text, days) => `No news published in the last ${days} days was found. The feed is checked on every daily deploy.`],
    [/^Detectado en (\d+) documento\(s\) del laboratorio\.$/,
      (_text, count) => `Detected in ${count} lab document(s).`],
    [/^Base curada para componentes compatibles; pendiente de detectar en README p(?:ú|u|Ãº)blico\.$/,
      () => "Curated base for compatible components; pending detection in a public README."],
    [/^Binario final - (.+)$/, (_text, family) => `Final binary - ${family}`],
    [/^Release: (.+)$/, (_text, asset) => `Release: ${asset}`],
    [/^(.+) - offset (.+)$/, (_text, path, offset) => `${path} - offset ${offset}`]
  ];

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function translatedText(original, lang) {
    const trimmed = normalizeText(original);
    if (!trimmed || lang === "es") return original;

    const mapped = translations.get(trimmed);
    if (mapped) return original.replace(trimmed, mapped);

    for (const [pattern, replacer] of patterns) {
      const match = trimmed.match(pattern);
      if (match) return original.replace(trimmed, replacer(trimmed, ...match.slice(1)));
    }

    return original;
  }

  function shouldSkip(node) {
    const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return !parent || parent.closest(excludedSelector);
  }

  function translateTextNode(node, lang) {
    if (shouldSkip(node)) return;
    if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
    node.nodeValue = translatedText(originalTextNodes.get(node), lang);
  }

  function translateAttributes(element, lang) {
    if (element.closest(excludedSelector)) return;

    for (const attr of ["placeholder", "aria-label", "title", "alt"]) {
      if (!element.hasAttribute(attr)) continue;

      let originals = originalAttributes.get(element);
      if (!originals) {
        originals = {};
        originalAttributes.set(element, originals);
      }

      if (!(attr in originals)) originals[attr] = element.getAttribute(attr) || "";
      element.setAttribute(attr, translatedText(originals[attr], lang));
    }
  }

  function walk(root, lang) {
    if (!root || shouldSkip(root)) return;

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, lang);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

    if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root, lang);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        return shouldSkip(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });

    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, lang);
      else if (node.nodeType === Node.ELEMENT_NODE) translateAttributes(node, lang);
      node = walker.nextNode();
    }
  }

  function updateToggle(lang) {
    document.querySelectorAll("[data-lang-option]").forEach((button) => {
      const active = button.getAttribute("data-lang-option") === lang;
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function applyLanguage(lang) {
    applying = true;
    document.documentElement.lang = lang;
    walk(document.body, lang);
    updateToggle(lang);
    applying = false;
  }

  const savedLanguage = localStorage.getItem(storageKey);
  let currentLanguage = savedLanguage === "en" ? "en" : "es";

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lang-option]");
    if (!button) return;

    currentLanguage = button.getAttribute("data-lang-option") === "en" ? "en" : "es";
    localStorage.setItem(storageKey, currentLanguage);
    applyLanguage(currentLanguage);
  });

  const observer = new MutationObserver((mutations) => {
    if (applying) return;
    applying = true;
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => walk(node, currentLanguage));
      if (mutation.type === "characterData") walk(mutation.target, currentLanguage);
    }
    updateToggle(currentLanguage);
    applying = false;
  });

  document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(currentLanguage);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
