(() => {
  const storageKey = "pepeangell-labs-language-v2";
  const excludedSelector = "script, style, code, pre, [data-no-translate], .readme-raw, .support-terminal";
  const originalTextNodes = new WeakMap();
  const renderedTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  const renderedAttributes = new WeakMap();
  const originalExplicitElements = new WeakMap();

  const translations = new Map(
    Object.entries({
      "Saltar al contenido": "Skip to content",
      "Inicio": "Home",
      "Apoyo": "Support",
      "Firmware": "Firmware",
      "Tienda": "Shop",
      "Repos": "Repos",
      "Flashers": "Flashers",
      "Hardware": "Hardware",
      "Descargas": "Downloads",
      "Code Simulator": "Code Simulator",
      "Noticias": "News",
      "Contacto": "Contact",
      "Idioma": "Language",
      "Navegacion principal": "Main navigation",
      "Navegaci√≥n principal": "Main navigation",
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
      "Accesos directos a documentaci√≥n p√∫blica, binarios, herramientas de flasheo y formas de apoyar PepeAngell Labs.":
        "Quick access to public documentation, binaries, flashing tools and ways to support PepeAngell Labs.",
      "Firmware documentado": "Documented firmware",
      "Explora componentes, funciones, conexiones y notas de cada firmware sin salir de la pagina.":
        "Explore components, features, wiring and notes for each firmware without leaving the site.",
      "Explora componentes, funciones, conexiones y notas de cada firmware sin salir de la p√°gina.":
        "Explore components, features, wiring and notes for each firmware without leaving the site.",
      "Instalacion web": "Web installation",
      "Instalaci√≥n web": "Web installation",
      "Accede a los enlaces de flasheo disponibles y a los repositorios cuando el flasher aun no esta publicado.":
        "Open available web flashers and repositories when a flasher is not published yet.",
      "Accede a los enlaces de flasheo disponibles y a los repositorios cuando el flasher a√∫n no est√° publicado.":
        "Open available web flashers and repositories when a flasher is not published yet.",
      "Binarios y ZIP": "Binaries and ZIP",
      "Descarga binarios finales, manifests, releases y ZIP completos de los repositorios principales.":
        "Download final binaries, releases and full repository ZIP files.",
      "Ayuda al laboratorio": "Help the lab",
      "Apoya nuevas pruebas, componentes, documentacion y mantenimiento de proyectos educativos.":
        "Support new tests, components, documentation and maintenance for educational projects.",
      "Apoya nuevas pruebas, componentes, documentaci√≥n y mantenimiento de proyectos educativos.":
        "Support new tests, components, documentation and maintenance for educational projects.",
      "Latest public repositories": "Latest public repositories",
      "Esta secci√≥n muestra primero los repos principales del laboratorio y se actualiza desde datos p√∫blicos de GitHub.":
        "This section shows the lab's main repositories first and updates from public GitHub data.",
      "PepeAngell Labs ¬∑ ESP32, RF, BLE, WiFi y firmware educativo.": "PepeAngell Labs ¬∑ ESP32, RF, BLE, WiFi and educational firmware.",
      "Visitas reales": "Real visits",
      "privado": "private",
      "Uso educativo y laboratorio controlado.": "Educational use and controlled lab only.",
      "Los proyectos publicados aqu√≠ son para investigaci√≥n, aprendizaje y pruebas en entornos autorizados. No deben usarse en redes, sistemas, dispositivos o espacios donde no exista permiso expl√≠cito.":
        "Projects published here are for research, learning and testing in authorized environments. Do not use them on networks, systems, devices or spaces without explicit permission.",
      "README de proyectos GitHub": "GitHub project READMEs",
      "Explora la documentaci√≥n p√∫blica de cada firmware sin salir de PepeAngell Labs. Selecciona un proyecto para ver componentes, funciones, conexiones y notas tal como vienen en su README.":
        "Explore each firmware's public documentation without leaving PepeAngell Labs. Select a project to view components, features, wiring and notes exactly as they appear in its README.",
      "Seleccionar firmware": "Select firmware",
      "Buscar firmware": "Search firmware",
      "Cargando README": "Loading README",
      "Descargando informaci√≥n p√∫blica desde GitHub.": "Downloading public information from GitHub.",
      "GitHub repo": "GitHub repo",
      "README original": "Original README",
      "Selecciona un firmware para ver su README dentro de PepeAngell Labs.": "Select firmware to view its README inside PepeAngell Labs.",
      "Ver Markdown original": "View original Markdown",
      "No hay README que coincidan con la b√∫squeda.": "No READMEs match the search.",
      "README p√∫blico del repositorio.": "Public repository README.",
      "No hay contenido disponible.": "No content available.",
      "No se pudieron cargar los README p√∫blicos en este momento.": "Public READMEs could not be loaded right now.",
      "Flashers para hardware compatible": "Flashers for compatible hardware",
      "Tarjetas preparadas para enlazar firmware y flasheadores web detectados desde GitHub Pages. Usar solo con placas, pantallas y modulos compatibles.":
        "Cards ready to link firmware and web flashers detected from GitHub Pages. Use only with compatible boards, displays and modules.",
      "Tarjetas preparadas para enlazar firmware y flasheadores web detectados desde GitHub Pages. Usar solo con placas, pantallas y m√≥dulos compatibles.":
        "Cards ready to link firmware and web flashers detected from GitHub Pages. Use only with compatible boards, displays and modules.",
      "Flash only compatible hardware. Verifica placa, pantalla, pines y alimentaci√≥n antes de usar.":
        "Flash only compatible hardware. Verify board, display, pins and power before use.",
      "GitHub repo": "GitHub repo",
      "Descargas de proyectos y repos": "Project and repo downloads",
      "Descargas de documentos, proyectos y repos": "Document, project and repo downloads",
      "Documentacion y descargas": "Documentation and downloads",
      "PDFs, guias y recursos": "PDFs, guides and resources",
      "Archivos publicados desde GitHub": "Files published from GitHub",
      "Documentos publicos, Web Flashers, binarios finales, releases y ZIP completos. La biblioteca de documentos se actualiza desde GitHub conforme subas archivos o carpetas nuevas.":
        "Public documents, Web Flashers, final binaries, releases and full ZIP files. The document library updates from GitHub as you upload new files or folders.",
      "Accesos directos a Web Flashers, binarios finales, releases y ZIP completos. Los repos nuevos se agregan automaticamente aunque todavia no tengan flasher detectado.":
        "Direct access to Web Flashers, final binaries, releases and full ZIP files. New repos are added automatically even when no flasher has been detected yet.",
      "Accesos directos a Web Flashers, binarios finales, releases y ZIP completos. Los repos nuevos se agregan autom√°ticamente aunque todav√≠a no tengan flasher detectado.":
        "Direct access to Web Flashers, final binaries, releases and full ZIP files. New repos are added automatically even when no flasher has been detected yet.",
      "Recomendacion:": "Recommendation:",
      "Recomendaci√≥n:": "Recommendation:",
      "descarga documentacion desde la biblioteca cuando necesites manuales, guias o archivos de apoyo. Si el proyecto tiene Web Flasher, usa primero esa opcion para instalar firmware.":
        "download documentation from the library when you need manuals, guides or support files. If the project has a Web Flasher, use that option first to install firmware.",
      "si el proyecto tiene Web Flasher, usa primero esa opcion. El binario final es el mismo archivo que usa el flasher para instalar el firmware.":
        "if the project has a Web Flasher, use that option first. The final binary is the same file the flasher uses to install the firmware.",
      "Buscar descarga": "Search download",
      "Archivos:": "Files:",
      "Abrir biblioteca": "Open library",
      "Descargar": "Download",
      "Ver en GitHub": "View on GitHub",
      "Aun no hay documentos publicados en esta biblioteca.": "No documents have been published in this library yet.",
      "Interactive developer console": "Interactive developer console",
      "Elige un escenario, presiona cualquier tecla y observa como aparece codigo real de ESP32 y redes en una consola visual de laboratorio.":
        "Choose a scenario, press any key and watch real ESP32 and networking code appear in a visual lab console.",
      "Codigo": "Code",
      "Elegir codigo": "Choose code",
      "Otro codigo": "Another code",
      "Reiniciar": "Reset",
      "Escribe cualquier tecla": "Type any key",
      "Haz clic aqui y comienza a escribir...": "Click here and start typing...",
      "Escribe codigo": "Write code",
      "Comienza a programar...": "Start coding...",
      "Entrada para simulacion de codigo": "Code simulation input",
      "Ultima release:": "Latest release:",
      "√öltima release:": "Latest release:",
      "Binario final": "Final binary",
      "ZIP completo": "Full ZIP",
      "README local": "Local README",
      "Binarios usados por el Web Flasher": "Binaries used by the Web Flasher",
      "Este repositorio todavia no tiene Web Flasher detectado. Se muestran descargas directas disponibles y el ZIP completo del repositorio.":
        "This repository does not have a detected Web Flasher yet. Available direct downloads and the full repository ZIP are shown.",
      "Este repositorio todav√≠a no tiene Web Flasher detectado. Se muestran descargas directas disponibles y el ZIP completo del repositorio.":
        "This repository does not have a detected Web Flasher yet. Available direct downloads and the full repository ZIP are shown.",
      "Componentes del laboratorio": "Lab components",
      "Lista tipo wiki de componentes, modulos, pantallas, energia y prototipado usados en los proyectos. Abre cada componente para ver descripcion, imagen, voltaje, uso tipico y advertencias.":
        "Wiki-style list of components, modules, displays, power parts and prototyping items used in the projects. Open each component to view description, image, voltage, typical use and warnings.",
      "Lista tipo wiki de componentes, m√≥dulos, pantallas, energ√≠a y prototipado usados en los proyectos. Abre cada componente para ver descripci√≥n, imagen, voltaje, uso t√≠pico y advertencias.":
        "Wiki-style list of components, modules, displays, power parts and prototyping items used in the projects. Open each component to view description, image, voltage, typical use and warnings.",
      "Buscar componente": "Search component",
      "Fuente de imagen": "Image source",
      "imagen pendiente": "image pending",
      "Voltaje / energia": "Voltage / power",
      "Voltaje / energ√≠a": "Voltage / power",
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
      "Repos p√∫blicos": "Public repos",
      "Datos generados desde la API p√∫blica de GitHub y guardados en public/data/repos.json. Puedes buscar, filtrar por lenguaje y ordenar sin exponer tokens ni usar backend.":
        "Data generated from the public GitHub API and stored in public/data/repos.json. You can search, filter by language and sort without exposing tokens or using a backend.",
      "Lenguaje": "Language",
      "Todos": "All",
      "Ordenar": "Sort",
      "Principales": "Featured",
      "√öltima actualizaci√≥n": "Last updated",
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
      "Repositorios p√∫blicos, firmware, notas y proyectos.": "Public repositories, firmware, notes and projects.",
      "Repositorios publicos, firmware, notas y proyectos.": "Public repositories, firmware, notes and projects.",
      "Canal de Telegram": "Telegram channel",
      "Avisos, lanzamientos, publicaciones y novedades de PepeAngell Labs.":
        "Announcements, releases, posts and PepeAngell Labs updates.",
      "Abrir canal": "Open channel",
      "Grupo de Telegram": "Telegram group",
      "Comunidad ESP32 Tools para dudas, avances, pruebas#~y„´hëÈÏ∂ªßq´^t∞(ÄÄÄÅt∞(ÄÄÄÅ…ï≈’•…ïëA•πÃËÅlâLà∞ÄâM,à∞Äâ5=M$à∞Äâ5%M<à∞ÄâYà∞Äâ9ât∞(ÄÅÙ∞(ÄÅÏ(ÄÄÄÅ•êËÄâπïºŸ¥µù¡Ãà∞(ÄÄÄÅπÖµîËÄâALÅ9<¥Ÿ4ÅdµALŸ5X»à∞(ÄÄÄÅÕ°Ω…—9ÖµîËÄâ9<¥Ÿ4à∞(ÄÄÄÅëïÕç…•¡—•Ω∏ËÄâIïçï¡—Ω»ÅALÅUIPÅçΩ∏ÅÖπ—ïπÑÅçï…Öµ•çÑÅï·—ï…πÑÅ‰ÅÖ±•µïπ—Öç•Ω∏Å…ïù’±ÖëÑ∏à∞(ÄÄÄÅçÖ—ïùΩ…‰ËÄâ•π—ï…ôÖçîà∞(ÄÄÄÅ›•ë—°5¥ËÄ‘‡∞(ÄÄÄÅ°ï•ù°—5¥ËÄ»‡∞(ÄÄÄÅÖççïπ–ËÄàå—êÂïî‡à∞(ÄÄÄÅ¡•πÃËÅl(ÄÄÄÄÄÅÖ–°ù…Ω’πê†â9à∞Äâ±ïô–à§∞Äƒ∏‘∞Äƒ¿∏ƒ‰§∞(ÄÄÄÄÄÅÖ–°ÖÕ=’—¡’–°Õ•ùπÖ∞†âQ`à∞Äâ±ïô–à∞ÄâQ`à§§∞Äƒ∏‘∞Äƒ»∏‹Ã§∞(ÄÄÄÄÄÅÖ–°ÖÕ%π¡’–°Õ•ùπÖ∞†âI`à∞Äâ±ïô–à∞ÄâI`à§§∞Äƒ∏‘∞Äƒ‘∏»‹§∞(ÄÄÄÄÄÅÖ–°ÖÕ%π¡’–°¡Ω›ï»†âYà∞Äâ±ïô–à∞Ä‘∞ÄâYà∞Ä‘∏‘§§∞Äƒ∏‘∞Äƒ‹∏‡ƒ§∞(ÄÄÄÅt∞(ÄÄÄÅ…ï≈’•…ïëA•πÃËÅlâ9à∞ÄâQ`à∞ÄâI`à∞ÄâYât∞(ÄÅÙ∞(ÄÅÏ(ÄÄÄÅ•êËÄâ≠‰¿–¿µïπçΩëï»à∞(ÄÄÄÅπÖµîËÄâπçΩëï»Å…Ω—Ö—•ŸºÅ-d¥¿–¿à∞(ÄÄÄÅÕ°Ω…—9ÖµîËÄâ-d¥¿–¿à∞(ÄÄÄÅëïÕç…•¡—•Ω∏ËÄâπçΩëï»Å•πç…ïµïπ—Ö∞ÅçΩ∏ÅÕÖ±•ëÖÃÅ1,Å‰ÅP∞Å¡’±ÕÖëΩ»Å•π—ïù…ÖëºÅ‰Å¡±ÖçÑÅëîÄ‘Å¡•πïÃ∏à∞(ÄÄÄÅçÖ—ïùΩ…‰ËÄâçΩπ—…Ω∞à∞(ÄÄÄÅ›•ë—°5¥ËÄ»ÿ∏ÿ∞(ÄÄÄÅ°ï•ù°—5¥ËÄƒ‡∏‰∞(ÄÄÄÅÖççïπ–ËÄàçôôçÑ—àà∞(ÄÄÄÅ¡•πÃËÅl(ÄÄÄÄÄÅÖ–°ÖÕ=’—¡’–°Õ•ùπÖ∞†â1,à∞Äâ…•ù°–à§§∞Ä»‘∏Ã∞Ä–∏Ã‹§∞(ÄÄÄÄÄÅÖ–°ÖÕ=’—¡’–°Õ•ùπÖ∞†âPà∞Äâ…•ù°–à§§∞Ä»‘∏Ã∞Äÿ∏‰ƒ§∞(ÄÄÄÄÄÅÖ–°ÖÕ=’—¡’–°Õ•ùπÖ∞†âM\à∞Äâ…•ù°–à§§∞Ä»‘∏Ã∞Ä‰∏–‘§∞(ÄÄÄÄÄÅÖ–°ÖÕ%π¡’–°¡Ω›ï»†âYà∞Äâ…•ù°–à∞ÄÃ∏Ã∞Äà¨à∞Ä‘§§∞Ä»‘∏Ã∞Äƒƒ∏‰‰§∞(ÄÄÄÄÄÅÖ–°ù…Ω’πê†â9à∞Äâ…•ù°–à§∞Ä»‘∏Ã∞Äƒ–∏‘Ã§∞(ÄÄÄÅt∞(ÄÄÄÅ…ï≈’•…ïëA•πÃËÅlâ1,à∞ÄâPà∞ÄâM\à∞ÄâYà∞Äâ9ât∞(ÄÅÙ∞(ÄÅÏ(ÄÄÄÅ•êËÄââ’ÈÈï»¥…¡•∏à∞(ÄÄÄÅπÖµîËÄâ	’ÈÈï»Å¡Ω±Ö…•ÈÖëºÅëîÄ»Å¡•πïÃà∞(ÄÄÄÅÕ°Ω…—9ÖµîËÄâ	UiiHà∞(ÄÄÄÅëïÕç…•¡—•Ω∏ËÄâi’µâÖëΩ»ÅçΩµ¡Öç—ºÅ¡Ö…ÑÅÖŸ•ÕΩÃÅÕΩπΩ…ΩÃ∞ÅçΩ∏Å—ï…µ•πÖ∞Å¡ΩÕ•—•ŸºÅëîÅÕïπÖ∞Å‰ÅπïùÖ—•Ÿº∏à∞(ÄÄÄÅçÖ—ïùΩ…‰ËÄâçΩπ—…Ω∞à∞(ÄÄÄÅ›•ë—°5¥ËÄƒ»∞(ÄÄÄÅ°ï•ù°—5¥ËÄƒ»∞(ÄÄÄÅÖççïπ–ËÄàçôôê‘—òà∞(ÄÄÄÅ¡•πÃËÅl(ÄÄÄÄÄÅÖ–°ÖÕ%π¡’–°Õ•ùπÖ∞†âM%à∞ÄââΩ——Ω¥à∞Äà¨ÄºÅM%90à∞Ä‘§§∞ÄÃ∏–ÿ∞Äƒ¿∏‡§∞(ÄÄÄÄÄÅÖ–°ù…Ω’πê†â9à∞ÄââΩ——Ω¥à∞Äà¥ÄºÅ9à§∞Ä‡∏‘–∞Äƒ¿∏‡§∞(ÄÄÄÅt∞(ÄÄÄÅ…ï≈’•…ïëA•πÃËÅlâM%à∞Äâ9ât∞(ÄÅÙ∞(ÄÅÏ(ÄÄÄÅ•êËÄâ—¿–¿‘ÿà∞(ÄÄÄÅπÖµîËÄâQ@–¿‘ÿÅçΩ∏Å¡…Ω—ïçç•Ω∏à∞(ÄÄÄÅÕ°Ω…—9ÖµîËÄâQ@–¿‘ÿà∞(ÄÄÄÅëïÕç…•¡—•Ω∏ËÄâÖ…ùÑÅ‰Å¡…Ω—ïçç•Ω∏Å¡Ö…ÑÅ’πÑÅçï±ëÑÅëîÅ±•—•º∏à∞(ÄÄÄÅçÖ—ïùΩ…‰ËÄâ¡Ω›ï»à∞(ÄÄÄÅ›•ë—°5¥ËÄƒ‹∞(ÄÄÄÅ°ï•ù°—5¥ËÄ»‡∞(ÄÄÄÅÖççïπ–ËÄàå—àÂôôòà∞(ÄÄÄÅ…ïôï…ïπçï%µÖùïU…∞ËÄàΩÖÕÕï—ÃΩ°Ö…ë›Ö…îµ±ÖàΩµΩë’±ïÃΩ—¿–¿‘ÿµ’Õâåπ¡πúà∞(ÄÄÄÅ¡•πÃËÅl(ÄÄÄÄÄÅÖ–°ÖÕ%π¡’–°¡Ω›ï»†â%8¨à∞Äâ±ïô–à∞Ä‘§§∞Ä¿∏‡‡∞ÄÃ∏‡ƒ§∞(ÄÄÄÄÄÅÖ–°ù…Ω’πê†â%8¥à∞Äâ±ïô–à§∞Ä¿∏‡‡∞Ä»–∏ƒÃ§∞(ÄÄÄÄÄÅÖ–°ÖÕ=’—¡’–°¡Ω›ï»†â=UP¨à∞Äâ…•ù°–à∞Ä–∏»∞Äâ=UP¨à∞Ä–∏»§§∞Äƒÿ∏ƒ»∞ÄÃ∏‡ƒ§∞(ÄÄÄÄÄÅÖ–°¡Ω›ï»†â¨à∞Äâ…•ù°–à∞Ä–∏»∞Äâ¨à∞Ä–∏»§∞Äƒÿ∏ƒ»∞Ä‡∏‡‰§∞(ÄÄÄÄÄÅÖ–°ù…Ω’πê†â¥à∞Äâ…•ù°–à§∞Äƒÿ∏ƒ»∞Äƒ‰∏¿‘§∞(ÄÄÄÄÄÅÖ–°ù…Ω’πê†â=UP¥à∞Äâ…•ù°–à§∞Äƒÿ∏ƒ»∞Ä»–∏ƒÃ§∞(ÄÄÄÅt∞(ÄÄÄÅ…ï≈’•…ïëA•πÃËÅlâ¨à∞Äâ¥à∞Äâ=UP¨à∞Äâ=UP¥ât∞(ÄÅÙ∞(ÄÅÏ(ÄÄÄÅ•êËÄâÕ—ï¿µ’¿à∞(ÄÄÄÅπÖµîËÄâΩπŸï…—•ëΩ»ÅM—ï¿µU¿à∞(ÄÄÄÅÕ°Ω…—9ÖµîËÄâMQ@µU@à∞(ÄÄÄÅëïÕç…•¡—•Ω∏ËÄâ±ïŸÖëΩ»ÅÅ¡Ö…ÑÅΩâ—ïπï»Ä‘ÅXÅëïÕëîÅ±ÑÅâÖ—ï…•Ñ∏à∞(ÄÄÄÅçÖ—ïùΩ…‰ËÄâ¡Ω›ï»à∞(ÄÄÄÅ›•ë—°5¥ËÄƒ‹∞(ÄÄÄÅ°ï•ù°—5¥ËÄÃ‹∞(ÄÄÄÅÖççïπ–ËÄàçôò›Ñ‘‰à∞(ÄÄÄÅ…ïôï…ïπçï%µÖùïU…∞ËÄàΩÖÕÕï—ÃΩ°Ö…ë›Ö…îµ±ÖàΩµΩë’±ïÃΩÕ—ï¿µ’¿µµ–Ãÿ¿‡π¡πúà∞(ÄÄÄÅ¡•πÃËÅl(ÄÄÄÄÄÅÖ–°ÖÕ%π¡’–°¡Ω›ï»†âY%8¨à∞Äâ—Ω¿à∞Ä–∏»∞Äâ%8¨à∞Ä»–§§∞Ä¿∏‡‡∞Äƒ∏‰‰§∞(ÄÄÄÄÄÅÖ–°ù…Ω’πê†âY%8¥à∞Äâ—Ω¿à∞Äâ%8¥à§∞Äƒÿ∏ƒ»∞Äƒ∏‰‰§∞(ÄÄÄÄÄÅÖ–°ÖÕ=’—¡’–°¡Ω›ï»†âY=UP¨à∞ÄââΩ——Ω¥à∞Ä‘∞Äà’XÅ=UPà∞Ä»‡§§∞Ä¿∏‡‡∞ÄÃ‘∏¿ƒ§∞(ÄÄÄÄÄÅÖ–°ù…Ω’πê†âY=UP¥à∞ÄââΩ——Ω¥à∞Äâ=UP¥à§∞Äƒÿ∏ƒ»∞ÄÃ‘∏¿ƒ§∞(ÄÄÄÅt∞(ÄÄÄÅ…ï≈’•…ïëA•πÃËÅlâY%8¨à∞ÄâY%8¥à∞ÄâY=UP¨à∞ÄâY=UP¥ât∞(ÄÅÙ∞(ÄÅÏ(ÄÄÄÅ•êËÄâÕ—ï¿µëΩ›∏à∞(ÄÄÄÅπÖµîËÄâΩπŸï…—•ëΩ»ÅM—ï¿µΩ›∏à∞(ÄÄÄÅÕ°Ω…—9ÖµîËÄâMQ@µ=]8à∞(ÄÄÄÅëïÕç…•¡—•Ω∏ËÄâIïù’±ÖëΩ»ÅÅ¡Ö…ÑÅâÖ©Ö»Å‰ÅïÕ—Öâ•±•ÈÖ»ÅŸΩ±—Ö©î∏à∞(ÄÄÄÅçÖ—ïùΩ…‰ËÄâ¡Ω›ï»à∞(ÄÄÄÅ›•ë—°5¥ËÄ»ƒ∞(ÄÄÄÅ°ï•ù°—5¥ËÄ–Ã∞(ÄÄÄÅÖççïπ–ËÄàçò¿·çôòà∞(ÄÄÄÅ¡•πÃËÅl(ÄÄÄÄÄÅÖ–°ÖÕ%π¡’–°¡Ω›ï»†âY%8¨à∞Äâ—Ω¿à∞Ä‘∞Äâ%8¨à∞Ä»–§§∞Äƒ∏ÿƒ∞ÄÃ∏‹»§∞(ÄÄÄÄÄÅÖ–°ù…Ω’πê†âY%8¥à∞Äâ—Ω¿à∞Äâ%8¥à§∞Äƒ‰∏Ã‰∞ÄÃ∏‹»§∞(ÄÄÄÄÄÅÖ–°ÖÕ=’—¡’–°¡Ω›ï»†âY=UP¨à∞ÄââΩ——Ω¥à∞ÄÃ∏Ã∞ÄàÕXÃÅ=UPà∞Ä»–§§∞Äƒ∏ÿƒ∞ÄÃ‰∏»‡§∞(ÄÄÄÄÄÅÖ–°ù…Ω’πê†âY=UP¥à∞ÄââΩ——Ω¥à∞Äâ=UP¥à§∞Äƒ‰∏Ã‰∞ÄÃ‰∏»‡§∞(ÄÄÄÅt∞(ÄÄÄÅ…ï≈’•…ïëA•πÃËÅlâY%8¨à∞ÄâY%8¥à∞ÄâY=UP¨à∞ÄâY=UP¥ât∞(ÄÅÙ∞(ÄÅÏ(ÄÄÄÅ•êËÄâ±•¡º¥Ã‹à∞(ÄÄÄÅπÖµîËÄâ	Ö—ï…•ÑÅ1•AºÄÃ∏‹ÅXà∞(ÄÄÄÅÕ°Ω…—9ÖµîËÄâ1•Aºà∞(ÄÄÄÅëïÕç…•¡—•Ω∏ËÄâï±ëÑÅëîÅ±•—•ºÅ¡Ö…ÑÅÖ±•µïπ—Ö»ÅµΩπ—Ö©ïÃÅ¡Ω…—Ö—•±ïÃ∏à∞(ÄÄÄÅçÖ—ïùΩ…‰ËÄâ¡Ω›ï»à∞(ÄÄÄÅ›•ë—°5¥ËÄÃ¿∞(ÄÄÄÅ°ï•ù°—5¥ËÄ–¿∞(ÄÄÄÅÖççïπ–ËÄàçôò’å‹‹à∞(ÄÄÄÅ¡•πÃËÅl(ÄÄÄÄÄÅÖ–°ÖÕ=’—¡’–°¡Ω›ï»†â	P¨à∞Äâ…•ù°–à∞Ä–∏»∞Äà¨à∞Ä–∏»§§∞Ä»‡∏‰‹∞Äƒ¿∏ƒÿ§∞(ÄÄÄÄÄÅÖ–°ù…Ω’πê†â	P¥à∞Äâ…•ù°–à∞Äà¥à§∞Ä»‡∏‰‹∞Äƒ‘∏»–§∞(ÄÄÄÅt∞(ÄÄÄÅ…ï≈’•…ïëA•πÃËÅlâ	P¨à∞Äâ	P¥ât∞(ÄÅÙ∞(ÄÅÏ(ÄÄÄÅ•êËÄâ¡’Õ†µâ’——Ω∏à∞(ÄÄÄÅπÖµîËÄâ	Ω—Ω∏Å¡’±ÕÖëΩ»à∞(ÄÄÄÅÕ°Ω…—9ÖµîËÄâ	UQQ=8à∞(ÄÄÄÅëïÕç…•¡—•Ω∏ËÄâA’±ÕÖëΩ»ÅµΩµïπ—ÖπïºÅ¡Ö…ÑÅïπ—…ÖëÑÅë•ù•—Ö∞∏à∞(ÄÄÄÅçÖ—ïùΩ…‰ËÄâçΩπ—…Ω∞à∞(ÄÄÄÅ›•ë—°5¥ËÄÿ∞(ÄÄÄÅ°ï•ù°—5¥ËÄÿ∞(ÄÄÄÅÖççïπ–ËÄàçôôê‘—Ñà∞(ÄÄÄÅ…ïôï…ïπçï%µÖùïU…∞ËÄàΩÖÕÕï—ÃΩ°Ö…ë›Ö…îµ±ÖàΩµΩë’±ïÃΩ¡’Õ†µâ’——Ω∏π¡πúà∞(ÄÄÄÅ¡•πÃËÅl(ÄÄÄÄÄÅÖ–°Õ•ùπÖ∞†âƒà∞Äâ±ïô–à∞Äâƒà∞Äƒ»§∞Ä¿∏–ÿ∞Ä¿∏–ÿ§∞(ÄÄÄÄÄÅÖ–°Õ•ùπÖ∞†â»à∞Äâ±ïô–à∞Äâ»à∞Äƒ»§∞Ä¿∏–ÿ∞Ä‘∏‘–§∞(ÄÄÄÄÄÅÖ–°Õ•ùπÖ∞†âƒà∞Äâ…•ù°–à∞Äâƒà∞Äƒ»§∞Ä‘∏‘–∞Ä¿∏–ÿ§∞(ÄÄÄÄÄÅÖ–°Õ•ùπÖ∞†â»à∞Äâ…•ù°–à∞Äâ»à∞Äƒ»§∞Ä‘∏‘–∞Ä‘∏‘–§∞(ÄÄÄÅt∞(ÄÄÄÅ…ï≈’•…ïëA•πÃËÅlâƒà∞Äâƒât∞(ÄÅÙ∞(ÄÅÏ(ÄÄÄÅ•êËÄâÕ±•ëîµÕ›•—ç†à∞(ÄÄÄÅπÖµîËÄâ%π—ï……’¡—Ω»à∞(ÄÄÄÅÕ°Ω…—9ÖµîËÄâM]%Q à∞(ÄÄÄÅëïÕç…•¡—•Ω∏ËÄâ%π—ï……’¡—Ω»ÅëîÅïπçïπë•ëºÅºÅÕï±ïçç•Ω∏∏à∞(ÄÄÄÅçÖ—ïùΩ…‰ËÄâçΩπ—…Ω∞à∞(ÄÄÄÅ›•ë—°5¥ËÄ‡∞(ÄÄÄÅ°ï•ù°—5¥ËÄƒ–∞(ÄÄÄÅÖççïπ–ËÄàçôôëêÿÿà∞(ÄÄÄÅ¡•πÃËÅl(ÄÄÄÄÄÅÖ–°Õ•ùπÖ∞†â=4à∞ÄââΩ——Ω¥à∞Äâ=4à∞Ä»–§∞Äƒ∏–ÿ∞Äƒ»∏‹§∞(ÄÄÄÄÄÅÖ–°Õ•ùπÖ∞†â9<à∞ÄââΩ——Ω¥à∞Äâ9<à∞Ä»–§∞Äÿ∏‘–∞Äƒ»∏‹§∞(ÄÄÄÅt∞(ÄÄÄÅ…ï≈’•…ïëA•πÃËÅlâ=4à∞Äâ9<ât∞(ÄÅÙ∞)tÏ()ï·¡Ω…–ÅçΩπÕ–ÅU1Q}1	}=ÄÙÅÄç•πç±’ëîÄÒMA$π†¯(ç•πç±’ëîÄÒI»–π†¯((ººÅ∞ÅM8)I»–Å…Öë•ºƒ†–∞Ä‘§Ï)I»–Å…Öë•º»†ƒÿ∞Äƒ‹§Ï()ŸΩ•êÅÕï—’¿†§ÅÏ(ÄÅMï…•Ö∞πâïù•∏†ƒƒ‘»¿¿§Ï(ÄÅMA$πâïù•∏†ƒ‡∞Äƒ‰∞Ä»Ã§Ï(ÄÅ…Öë•ºƒπâïù•∏†§Ï(ÄÅ…Öë•º»πâïù•∏†§Ï)Ù()ŸΩ•êÅ±ΩΩ¿†§ÅÏ(ÄÄººÅA…’ïâÑÅëîÅçΩπï·•ΩπïÃÅëï∞Å±ÖâΩ…Ö—Ω…•º)ıÄÏ()ï·¡Ω…–Åô’πç—•Ω∏Åùï—Ωµ¡Ωπïπ—ïô•π•—•Ω∏°çΩµ¡Ωπïπ—%êËÅÕ—…•πú§ÅÏ(ÄÅ…ï—’…∏Å!I]I}=5A=99QLπô•πê†°çΩµ¡Ωπïπ–§ÄÙ¯ÅçΩµ¡Ωπïπ–π•êÄÙÙÙÅçΩµ¡Ωπïπ—%ê§Ï)Ù(