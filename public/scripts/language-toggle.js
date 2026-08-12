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
      "Descargas de documentos, proyectos y repos": "Document, project and repo downloads",
      "Documentacion y descargas": "Documentation and downloads",
      "PDFs, guias y recursos": "PDFs, guides and resources",
      "Archivos publicados desde GitHub": "Files published from GitHub",
      "Documentos publicos, Web Flashers, binarios finales, releases y ZIP completos. La biblioteca de documentos se actualiza desde GitHub conforme subas archivos o carpetas nuevas.":
        "Public documents, Web Flashers, final binaries, releases and full ZIP files. The document library updates from GitHub as you upload new files or folders.",
      "Accesos directos a Web Flashers, binarios finales, releases y ZIP completos. Los repos nuevos se agregan automaticamente aunque todavia no tengan flasher detectado.":
        "Direct access to Web Flashers, final binaries, releases and full ZIP files. New repos are added automatically even when no flasher has been detected yet.",
      "Accesos directos a Web Flashers, binarios finales, releases y ZIP completos. Los repos nuevos se agregan automáticamente aunque todavía no tengan flasher detectado.":
        "Direct access to Web Flashers, final binaries, releases and full ZIP files. New repos are added automatically even when no flasher has been detected yet.",
      "Recomendacion:": "Recommendation:",
      "Recomendación:": "Recommendation:",
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
      "Repositorios publicos, firmware, notas y proyectos.": "Public repositories, firmware, notes and projects.",
      "Canal de Telegram": "Telegram channel",
      "Avisos, lanzamientos, publicaciones y novedades de PepeAngell Labs.":
        "Announcements, releases, posts and PepeAngell Labs updates.",
      "Abrir canal": "Open channel",
      "Grupo de Telegram": "Telegram group",
      "Comunidad ESP32 Tools para dudas, avances, pruebas y conversacion tecnica.":
        "ESP32 Tools community for questions, progress, testing and technical conversation.",
      "Abrir grupo": "Open group",
      "Canal Telegram": "Telegram channel",
      "Grupo Telegram": "Telegram group",
      "Comunidad": "Community",
      "Telegram ESP32 Tools": "Telegram ESP32 Tools",
      "Sigue avisos, disponibilidad y conversaciones de la comunidad desde Telegram.":
        "Follow announcements, availability and community conversations on Telegram.",
      "Canal": "Channel",
      "Grupo": "Group",
      "Open GitHub": "Open GitHub",
      "Open Instagram": "Open Instagram",
      "Open Facebook": "Open Facebook",
      "Updates visuales, avances de laboratorio y publicaciones cortas de proyectos.":
        "Visual updates, lab progress and short project posts.",
      "Comunidad y publicaciones relacionadas con ESP32 Tools.": "Community and posts related to ESP32 Tools.",
      "Lab shop": "Lab shop",
      "Kits ESP32 programados": "Programmed ESP32 kits",
      "Placas preparadas con firmware RF-KILL para pruebas educativas, laboratorio controlado y aprendizaje de hardware embebido. Los pagos se realizan por PayPal y la disponibilidad se confirma antes del envio.":
        "Boards prepared with RF-KILL firmware for educational testing, controlled lab work and embedded hardware learning. Payments are handled through PayPal and availability is confirmed before shipping.",
      "Pagar con PayPal": "Pay with PayPal",
      "Preguntar disponibilidad": "Ask availability",
      "Pago directo": "Direct payment",
      "Resumen de compra": "Purchase summary",
      "Antes de pagar, confirma disponibilidad, precio final y envio. En la nota del pago escribe el nombre del kit.":
        "Before paying, confirm availability, final price and shipping. In the payment note, write the kit name.",
      "Productos": "Products",
      "Kits disponibles": "Available kits",
      "Primera seleccion de placas fisicas con firmware instalado. Precios y existencias se pueden ajustar cuando definas inventario.":
        "First selection of physical boards with installed firmware. Prices and stock can be adjusted when inventory is defined.",
      "Kit programado": "Programmed kit",
      "Kit compacto": "Compact kit",
      "ESP32 DevKit 30 pines": "ESP32 DevKit 30 pins",
      "ESP32-C3 Super Mini": "ESP32-C3 Super Mini",
      "RF-KILL ESP32 DevKit Kit": "RF-KILL ESP32 DevKit Kit",
      "RF-KILL ESP32-C3 Super Mini Kit": "RF-KILL ESP32-C3 Super Mini Kit",
      "Kit fisico basado en ESP32-WROOM DevKit con firmware RF-KILL instalado para demostracion academica, laboratorio RF controlado y practicas autorizadas.":
        "Physical kit based on an ESP32-WROOM DevKit with RF-KILL firmware installed for academic demonstration, controlled RF lab work and authorized practice.",
      "Version compacta con ESP32-C3 Super Mini y firmware RF-KILL headless: arranque automatico sin pantalla ni botones para laboratorio educativo controlado.":
        "Compact version with ESP32-C3 Super Mini and headless RF-KILL firmware: automatic startup without screen or buttons for controlled educational lab work.",
      "Incluye:": "Includes:",
      "ESP32-WROOM DevKit 30 pines": "ESP32-WROOM DevKit 30 pins",
      "2x nRF24L01+ PA+LNA": "2x nRF24L01+ PA+LNA",
      "Bus SPI compartido para ambos modulos": "Shared SPI bus for both modules",
      "Bateria 3V": "3V battery",
      "Modulo de carga": "Charging module",
      "Step-up a 5V": "5V step-up",
      "Firmware RF-KILL instalado": "RF-KILL firmware installed",
      "Formato clasico, comodo para pruebas de mesa, modificaciones y laboratorio controlado.":
        "Classic format, convenient for bench testing, modifications and controlled lab work.",
      "Ideal cuando buscas una placa mas pequena con arranque automatico para montajes compactos.":
        "Ideal when you need a smaller board with automatic startup for compact builds.",
      "Comprar por PayPal": "Buy with PayPal",
      "Dudas del kit": "Kit questions",
      "Proceso": "Process",
      "Compra simple": "Simple purchase",
      "Confirma disponibilidad, realiza el pago por PayPal y comparte tus datos de envio por el canal acordado.":
        "Confirm availability, pay through PayPal and share your shipping details through the agreed channel.",
      "Listo para probar": "Ready to test",
      "El kit se entrega programado. Puede requerir bateria cargada, antenas conectadas y uso responsable en entorno permitido.":
        "The kit is delivered programmed. It may require a charged battery, connected antennas and responsible use in a permitted environment.",
      "Uso responsable": "Responsible use",
      "Laboratorio controlado": "Controlled lab",
      "Estos kits son para investigacion, aprendizaje y pruebas autorizadas. No se deben usar contra sistemas ajenos.":
        "These kits are for research, learning and authorized testing. They must not be used against systems you do not own or control.",
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

  const interfaceTranslations = {
    "Repositorios": "Repositories",
    "Laboratorio": "Lab",
    "Simulador PCB": "PCB Simulator",
    "Tema": "Theme",
    "Tema neon oscuro": "Dark neon theme",
    "Tema blanco": "Light theme",
    "Blanco": "Light",
    "Abrir menu": "Open menu",
    "ESP32-TOOLS home": "ESP32-TOOLS home",
    "Creado por": "Created by",
    "ESP32-TOOLS · Creado por": "ESP32-TOOLS · Created by",
    "Firmware educativo, hardware hacking controlado y herramientas de laboratorio para proyectos embebidos y pruebas autorizadas.":
      "Educational firmware, controlled hardware hacking and lab tools for embedded projects and authorized testing.",
    "Si mis firmwares, guias, web flashers o pruebas con ESP32 te han servido, puedes apoyar el laboratorio para mantener mas placas, pantallas, modulos RF, componentes y documentacion publica.":
      "If my firmware, guides, web flashers or ESP32 tests have helped you, you can support the lab to maintain more boards, displays, RF modules, components and public documentation.",
    "Placas preparadas con firmware RF-KILL para pruebas educativas, laboratorio controlado y aprendizaje de hardware embebido. Los pagos se realizan por PayPal o transferencia Banorte y la disponibilidad se confirma antes del envio.":
      "Boards prepared with RF-KILL firmware for educational testing, controlled labs and embedded hardware learning. Payments are made through PayPal or Banorte transfer, and availability is confirmed before shipping.",
    "PayPal o Banorte + @pepeangell": "PayPal or Banorte + @pepeangell",
    "ESP32 DevKit de 30 pines con dos modulos nRF24L01+ PA+LNA, bateria, carga y firmware instalado.":
      "30-pin ESP32 DevKit with two nRF24L01+ PA+LNA modules, battery, charging and installed firmware.",
    "ESP32-C3 Super Mini con dos modulos nRF24L01+ PA+LNA, bateria, carga y firmware instalado.":
      "ESP32-C3 Super Mini with two nRF24L01+ PA+LNA modules, battery, charging and installed firmware.",
    "Completa el checkout, paga por PayPal o Banorte y envia tu codigo de pedido a @pepeangell en Telegram.":
      "Complete checkout, pay through PayPal or Banorte and send your order code to @pepeangell on Telegram.",
    "Registra tus datos de envio, revisa el total y despues paga por PayPal o transferencia Banorte. El pedido queda pendiente hasta que Pepe confirme el pago por Telegram.":
      "Enter your shipping details, review the total and then pay through PayPal or Banorte transfer. The order remains pending until Pepe confirms the payment through Telegram.",
    "Ingresa el codigo que recibiste al terminar el checkout y el email usado en la compra. Aqui veras pago, envio e historial sin exponer informacion privada de otros pedidos.":
      "Enter the code you received after checkout and the email used for the purchase. You will see payment, shipping and history without exposing other orders' private information.",
    "README de proyectos GitHub": "GitHub project READMEs",
    "Explora la documentación pública de cada firmware sin salir de PepeAngell Labs. Selecciona un proyecto para ver componentes, funciones, conexiones y notas tal como vienen en su README.":
      "Explore each firmware's public documentation without leaving ESP32-TOOLS. Select a project to view components, features, connections and notes exactly as they appear in its README.",
    "Tarjetas preparadas para enlazar firmware y flasheadores web detectados desde GitHub Pages. Usar solo con placas, pantallas y modulos compatibles.":
      "Cards prepared to link firmware and web flashers detected from GitHub Pages. Use only with compatible boards, displays and modules.",
    "Lista tipo wiki de componentes, modulos, pantallas, energia y prototipado usados en los proyectos. Abre cada componente para ver descripcion, imagen, voltaje, uso tipico y advertencias.":
      "A wiki-style list of components, modules, displays, power and prototyping parts used in the projects. Open each component to view its description, image, voltage, typical use and warnings.",
    "Documentos publicos, Web Flashers, binarios finales, releases y ZIP completos. La biblioteca de documentos se actualiza desde GitHub conforme subas archivos o carpetas nuevas.":
      "Public documents, Web Flashers, final binaries, releases and full ZIP files. The document library updates from GitHub as new files or folders are uploaded.",
    "descarga documentacion desde la biblioteca cuando necesites manuales, guias o archivos de apoyo. Si el proyecto tiene Web Flasher, usa primero esa opcion para instalar firmware.":
      "download documentation from the library when you need manuals, guides or support files. If the project has a Web Flasher, use that option first to install firmware.",
    "Lecturas recientes sobre firmware, gadgets, Cardputer, M5Stack, Hashcat, Pwnagotchi, Flipper, hardware hacking, RF, WiFi/BLE, ESP32, IoT y ciberseguridad. Solo se muestran noticias publicadas en los ultimos 30 dias y se actualizan desde fuentes RSS al generar la pagina.":
      "Recent reading about firmware, gadgets, Cardputer, M5Stack, Hashcat, Pwnagotchi, Flipper, hardware hacking, RF, WiFi/BLE, ESP32, IoT and cybersecurity. Only news published in the last 30 days is shown, updated from RSS sources when the site is generated.",
    "Actualizado automaticamente en el ultimo deploy: 06 jun 2026. Las noticias abren en sitios externos. Solo se muestran publicaciones de los ultimos 30 dias.":
      "Automatically updated in the latest deployment: Jun 6, 2026. News opens on external sites. Only posts from the last 30 days are shown.",
    "Elige un escenario, presiona cualquier tecla y observa como aparece codigo real de ESP32 y redes en una consola visual de laboratorio.":
      "Choose a scenario, press any key and watch real ESP32 and networking code appear in a visual lab console.",

    "PROTOTIPADO · BETA PÚBLICA": "PROTOTYPING · PUBLIC BETA",
    "Diseña el montaje, conecta los pines y contrasta el cableado con tu firmware.":
      "Design the assembly, connect the pins and compare the wiring with your firmware.",
    "El proyecto se guarda localmente en este navegador.": "The project is saved locally in this browser.",
    "Reportar bug": "Report a bug",
    "Feedback de la beta": "Beta feedback",
    "Reporta un bug o comparte una idea": "Report a bug or share an idea",
    "Describe lo que ocurrio, que esperabas que pasara y los pasos para repetirlo. Las capturas solo seran visibles desde el panel privado.":
      "Describe what happened, what you expected and the steps to reproduce it. Screenshots will only be visible in the private dashboard.",
    "Describe lo que ocurrió, qué esperabas que pasara y los pasos para repetirlo. Las capturas solo serán visibles desde el panel privado.":
      "Describe what happened, what you expected and the steps to reproduce it. Screenshots will only be visible in the private dashboard.",
    "Tipo de comentario": "Feedback type",
    "Encontré un bug": "I found a bug",
    "Tengo una sugerencia": "I have a suggestion",
    "Correo para responderte": "Reply email",
    "(opcional)": "(optional)",
    "Detalles": "Details",
    "Ejemplo: al rotar el nRF24 dos veces, los pines cambian de lado. Ocurre despues de...":
      "Example: after rotating the nRF24 twice, the pins switch sides. It happens after...",
    "Capturas": "Screenshots",
    "Hasta 3 imagenes PNG, JPG o WebP, con un maximo de 5 MB cada una.":
      "Up to 3 PNG, JPG or WebP images, with a maximum of 5 MB each.",
    "Sitio web": "Website",
    "Enviar comentario": "Send feedback",
    "Enviando...": "Sending...",
    "Guardando tu comentario...": "Saving your feedback...",
    "El formulario no esta disponible en este momento.": "The form is currently unavailable.",
    "El formulario no está disponible en este momento.": "The form is currently unavailable.",
    "Has enviado varios comentarios recientemente. Intenta de nuevo mas tarde.":
      "You have submitted several messages recently. Please try again later.",
    "No pude guardar el comentario. Intenta nuevamente.": "I could not save the feedback. Please try again.",
    "No pude preparar el reporte para enviarlo.": "I could not prepare the report for submission.",
    "No pude finalizar el reporte.": "I could not finalize the report.",
    "Gracias. Tu comentario fue enviado y quedo disponible para revision.":
      "Thank you. Your feedback was submitted and is ready for review.",
    "No pude enviar el comentario.": "I could not submit the feedback.",

    "Proyecto": "Project",
    "Proyecto nuevo": "New project",
    "Placa": "Board",
    "Color de placa": "Board color",
    "PLACA PERFORADA": "PERFBOARD",
    "Añadir al lienzo": "Add to canvas",
    "Tamaño": "Size",
    "Añadir placa": "Add board",
    "Añadir otra placa": "Add another board",
    "Guardar": "Save",
    "Guardar en este navegador": "Save in this browser",
    "Exportar": "Export",
    "Exportar proyecto JSON": "Export JSON project",
    "Importar": "Import",
    "Importar proyecto JSON": "Import JSON project",
    "Vaciar proyecto": "Clear project",
    "Vista del laboratorio": "Lab view",
    "Montaje": "Assembly",
    "Código y prueba": "Code and test",
    "Cara de la placa perforada": "Perfboard side",
    "Frente · componentes": "Front · components",
    "Reverso · solo pines": "Back · pins only",
    "Plantilla": "Template",
    "Seleccionar firmware...": "Select firmware...",
    "Cargar": "Load",
    "Plantilla cargada": "Template loaded",
    "Proyecto importado": "Project imported",
    "El archivo no es un proyecto valido": "The file is not a valid project",
    "El archivo no es un proyecto válido": "The file is not a valid project",
    "Mostrar catálogo de componentes": "Show component catalog",
    "Catalogo de componentes": "Component catalog",
    "Catálogo de componentes": "Component catalog",
    "COMPONENTES": "COMPONENTS",
    "Catálogo": "Catalog",
    "Soltar catálogo": "Unpin catalog",
    "Fijar catálogo al lateral": "Pin catalog to the side",
    "Ocultar catálogo": "Hide catalog",
    "ESP32, nRF24, energia...": "ESP32, nRF24, power...",
    "ESP32, nRF24, energía...": "ESP32, nRF24, power...",
    "Buscar componente": "Search component",
    "Agregar": "Add",
    "Roja": "Red",
    "Azul": "Blue",
    "Negra": "Black",
    "Verde": "Green",
    "roja": "red",
    "azul": "blue",
    "negra": "black",
    "verde": "green",
    "Placa principal ESP32-WROOM para los kits RF-KILL.": "Main ESP32-WROOM board for RF-KILL kits.",
    "Variante con conector para antena externa.": "Variant with an external antenna connector.",
    "Variante ESP32 con antena integrada.": "ESP32 variant with an integrated antenna.",
    "Placa compacta RISC-V usada por RF-KILL C3.": "Compact RISC-V board used by RF-KILL C3.",
    "Placa ESP32-S3 para proyectos con mas GPIO y USB.": "ESP32-S3 board for projects requiring more GPIO and USB.",
    "Ai-Thinker BW16 Kit": "Ai-Thinker BW16 Kit",
    "Placa RTL8720DN de doble banda usada por BWifiKill BW16 5 GHz.": "Dual-band RTL8720DN board used by BWifiKill BW16 5 GHz.",
    "ESP8266 HW-364A con OLED 0.96 integrada": "ESP8266 HW-364A with integrated 0.96-inch OLED",
    "NodeMCU ESP8266 con CH340G y OLED SSD1306 128x64 integrada; SDA GPIO14, SCL GPIO12 y direccion 0x3C.":
      "NodeMCU ESP8266 with CH340G and integrated 128x64 SSD1306 OLED; SDA GPIO14, SCL GPIO12 and address 0x3C.",
    "OLED SSD1306 I2C 0.96 pulgadas": "0.96-inch SSD1306 I2C OLED",
    "Pantalla OLED 128x64 con interfaz I2C y direccion habitual 0x3C.": "128x64 OLED display with I2C interface and common 0x3C address.",
    "TFT ST7735 SPI 1.8 pulgadas": "1.8-inch ST7735 SPI TFT",
    "Pantalla TFT SPI 128x160 usada por BWifiKill BW16.": "128x160 SPI TFT display used by BWifiKill BW16.",
    "TFT ILI9488 SPI 3.5 pulgadas": "3.5-inch ILI9488 SPI TFT",
    "Pantalla TFT SPI 480x320 de 14 pines con tactil resistivo.": "480x320 14-pin SPI TFT display with resistive touch.",
    "Modulo RF SPI de 2.4 GHz con antena externa.": "2.4 GHz SPI RF module with external antenna.",
    "CC1101 V2.0 con SMA": "CC1101 V2.0 with SMA",
    "Transceptor Sub-GHz SPI de 433 MHz con conector SMA.": "433 MHz Sub-GHz SPI transceiver with SMA connector.",
    "M5Stack Unit IR": "M5Stack Unit IR",
    "Emisor y receptor infrarrojo de 940 nm con conector Grove PORT.B.": "940 nm infrared emitter and receiver with Grove PORT.B connector.",
    "Carga y proteccion para una celda de litio.": "Charging and protection for one lithium cell.",
    "Elevador DC para obtener 5 V desde la bateria.": "DC boost converter for obtaining 5 V from the battery.",
    "Regulador DC para bajar y estabilizar voltaje.": "DC regulator for stepping down and stabilizing voltage.",
    "Celda de litio para alimentar montajes portatiles.": "Lithium cell for powering portable assemblies.",
    "Boton pulsador": "Push button",
    "Pulsador momentaneo para entrada digital.": "Momentary push button for digital input.",
    "Interruptor": "Switch",
    "Interruptor de encendido o seleccion.": "Power or selection switch.",
    "MESA DE MONTAJE": "ASSEMBLY BENCH",
    "Lienzo libre · retícula 2.54 mm": "Free canvas · 2.54 mm grid",
    "Modo de trabajo del lienzo": "Canvas work mode",
    "Mover y editar placas y componentes": "Move and edit boards and components",
    "Congelar el montaje y trabajar solo con cables y pines": "Freeze the assembly and work only with wires and pins",
    "Ocultar cableado": "Hide wiring",
    "Mostrar cableado": "Show wiring",
    "Componentes": "Components",
    "SELECCIÓN": "SELECTION",
    "CARA COMPONENTES": "COMPONENT SIDE",
    "CARA SOLDADURA": "SOLDER SIDE",
    "SOLDADURA": "SOLDER SIDE",
    "SUPERIOR": "TOP",
    "INFERIOR": "BOTTOM",
    "PINES": "PINS",
    "Componente correcto": "Component OK",
    "Cambios sin guardar": "Unsaved changes",
    "No se detectaron problemas en las conexiones basicas.": "No issues were detected in the basic connections.",
    "TP4056 con proteccion": "TP4056 with protection",
    "Convertidor Step-Up": "Step-Up converter",
    "Convertidor Step-Down": "Step-Down converter",
    "Bateria LiPo 3.7 V": "3.7 V LiPo battery",
    "placas": "boards",
    "componentes": "components",
    "montados": "mounted",
    "cables visibles": "visible wires",
    "cables ocultos": "hidden wires",
    "paso": "pitch",
    "placa(s),": "board(s),",
    "componente(s),": "component(s),",
    "montado(s).": "mounted.",
    "cable(s) registrados;": "wire(s) registered;",
    "visibles en esta cara.": "visible on this side.",
    "Simulación": "Simulation",
    "detenida": "stopped",
    "activa:": "active:",
    "módulos energizados": "powered modules",
    "Diagnóstico:": "Diagnostics:",
    "error(es),": "error(s),",
    "advertencia(s).": "warning(s).",
    "Cableado": "Wiring",
    "Ocultar cables": "Hide wires",
    "Mostrar cables": "Show wires",
    "CONEXIÓN ACTIVA": "ACTIVE CONNECTION",
    "ENLACE A-B": "A-B LINK",
    "PUNTO A": "POINT A",
    "PUNTO B": "POINT B",
    "Color": "Color",
    "Cara": "Side",
    "Soldadura / reverso": "Solder / back",
    "Componentes / frente": "Components / front",
    "Puntos de ruta": "Route points",
    "Estado": "Status",
    "Voltaje": "Voltage",
    "ID del cable": "Wire ID",
    "Cable seleccionado": "Selected wire",
    "Placa perforada": "Perfboard",
    "Monitor del proyecto": "Project monitor",
    "Elemento del lienzo": "Canvas element",
    "Retorno GND activo": "Active GND return",
    "Energizado": "Powered",
    "Sin energía": "No power",
    "Simulación detenida": "Simulation stopped",
    "Sin problemas detectados en esta conexión": "No issues detected in this connection",
    "Medida": "Size",
    "Orientación": "Orientation",
    "Vista": "View",
    "Superior": "Top",
    "Inferior": "Bottom",
    "En placa": "On board",
    "Libre": "Free",
    "Posición": "Position",
    "Bloqueada": "Locked",
    "Editable": "Editable",
    "Pines": "Pins",
    "Rotar": "Rotate",
    "Voltear pieza": "Flip part",
    "Ver soldadura": "View solder side",
    "Ver componentes": "View components",
    "Desmontar": "Unmount",
    "Agrupar con la placa": "Group with board",
    "Ese espacio está ocupado por otro componente": "That space is occupied by another component",
    "Coloca todos los pines sobre la placa": "Place all pins on the board",
    "Montar": "Mount",
    "Permitir mover el componente": "Allow moving the component",
    "Evitar movimientos accidentales": "Prevent accidental movement",
    "Desbloquear": "Unlock",
    "Bloquear posición": "Lock position",
    "Duplicar": "Duplicate",
    "Eliminar": "Delete",
    "Desmontar todos": "Unmount all",
    "Eliminar placa": "Delete board",
    "Selecciona un cable, componente o placa para inspeccionarlo.": "Select a wire, component or board to inspect it.",
    "Cableado activo: el montaje está congelado. Conecta pines, selecciona cables y ajusta sus puntos de ruta.":
      "Wiring mode: the assembly is frozen. Connect pins, select wires and adjust their route points.",
    "Suelta una pieza con todos sus pines sobre la placa para montarla. Cada cable permanece en la cara donde fue creado.":
      "Drop a part with all its pins over the board to mount it. Each wire remains on the side where it was created.",
    "MONITOR EN TIEMPO REAL": "REAL-TIME MONITOR",
    "FIRMWARE": "FIRMWARE",
    "Editor C++ / Arduino": "C++ / Arduino editor",
    "errores": "errors",
    "avisos": "warnings",
    "PRUEBAS": "TESTS",
    "Simulación eléctrica": "Electrical simulation",
    "Detenida": "Stopped",
    "REVISIÓN": "REVIEW",
    "Diagnóstico": "Diagnostics",
    "Sin errores": "No errors",
    "CAMBIOS": "CHANGES",
    "Historial": "History",
    "CABLEADO": "WIRING",
    "Conexiones": "Connections",
    "No hay cables conectados.": "No wires connected.",
    "Cerrar": "Close",
    "¿Vaciar el proyecto?": "Clear the project?",
    "Se eliminarán los componentes, cables y código del espacio de trabajo local.":
      "Components, wires and code will be removed from the local workspace.",
    "Cancelar": "Cancel",
    "Iniciar": "Start",
    "Detener": "Stop",
    "En espera": "Waiting",
    "módulos energizados": "powered modules",
    "Inicia para comprobar la alimentación": "Start to check power delivery",
    "Encendida": "On",
    "Apagada": "Off",
    "Presionado": "Pressed",
    "Liberado": "Released",
    "Cerrado": "Closed",
    "Abierto": "Open",
    "Sin medición": "No reading",
    "Sin tensión": "No voltage",
    "Salida": "Output",
    "LECTURAS EN VIVO": "LIVE READINGS",
    "DIAGNÓSTICO": "DIAGNOSTICS",
    "Historial de movimientos": "Action history",
    "Estado actual": "Current state",
    "Los últimos cinco movimientos aparecerán aquí.": "The last five actions will appear here.",
    "Placa añadida": "Board added",
    "Placa eliminada": "Board removed",
    "Cable conectado": "Wire connected",
    "Cable eliminado": "Wire removed",
    "Código modificado": "Code changed",
    "Proyecto renombrado": "Project renamed",
    "Placa movida": "Board moved",
    "Posición bloqueada": "Position locked",
    "Posición desbloqueada": "Position unlocked",
    "Componente renombrado": "Component renamed",
    "Placa actualizada": "Board updated",

    "Admin privado": "Private admin",
    "Controla la tienda, los pedidos y los comentarios enviados desde Hardware Lab. El acceso real lo valida Supabase con la tabla de administradores y RLS.":
      "Manage the shop, orders and feedback submitted from Hardware Lab. Access is enforced by Supabase using the administrators table and RLS.",
    "Despues de iniciar sesion, el acceso lo valida el registro admin en":
      "After signing in, access is validated by the admin record in",
    "Panel de administracion": "Admin dashboard",
    "Panel de administración": "Admin dashboard",
    "Seguimiento publico": "Public tracking",
    "Seguimiento público": "Public tracking",
    "Solo Pepe": "Pepe only",
    "Despues de iniciar sesion, el acceso lo valida el registro admin en profiles.":
      "After signing in, access is validated by the admin record in profiles.",
    "Acceso": "Access",
    "Entrar al admin": "Admin sign in",
    "Usa contraseña si creaste el usuario en Supabase. Si dejas contraseña vacia, se enviara un enlace magico.":
      "Use a password if you created the user in Supabase. Leave it empty to receive a magic link.",
    "Email admin": "Admin email",
    "Contraseña": "Password",
    "Entrar": "Sign in",
    "Sesion activa": "Active session",
    "Sesión activa": "Active session",
    "Cambiar contraseña": "Change password",
    "Actualizar": "Refresh",
    "Salir": "Sign out",
    "Productos": "Products",
    "Pedidos": "Orders",
    "Feedback Lab": "Lab feedback",
    "Inventario": "Inventory",
    "Stock, precio y disponibilidad": "Stock, price and availability",
    "Pago, envio e historial": "Payment, shipping and history",
    "Pago, envío e historial": "Payment, shipping and history",
    "Sugerencias y reportes de bugs": "Suggestions and bug reports",
    "Confirmar eliminacion": "Confirm deletion",
    "Eliminar pedido entregado": "Delete delivered order",
    "Esta accion tambien borrara el historial del pedido.": "This action will also delete the order history.",
    "Confirmar eliminar": "Confirm deletion",
    "No hay productos creados.": "No products have been created.",
    "Disponible en tienda": "Available in shop",
    "Guardar producto": "Save product",
    "Todavia no hay pedidos.": "There are no orders yet.",
    "Datos del cliente": "Customer details",
    "Nombre": "Name",
    "Correo electrónico": "Email",
    "Teléfono": "Phone",
    "Usuario Telegram": "Telegram username",
    "Dirección": "Address",
    "Ciudad": "City",
    "Estado / provincia": "State / province",
    "País": "Country",
    "Código postal": "Postal code",
    "Notas del cliente": "Customer notes",
    "Pago": "Payment",
    "Envio": "Shipping",
    "Envío": "Shipping",
    "Total": "Total",
    "Envio privado": "Private shipping",
    "Envío privado": "Private shipping",
    "Paqueteria": "Carrier",
    "Paquetería": "Carrier",
    "Guia": "Tracking number",
    "Guía": "Tracking number",
    "Nota admin": "Admin note",
    "Items": "Items",
    "Actualizar pedido": "Update order",
    "Historial": "History",
    "No hay pedidos en esta categoria.": "There are no orders in this category.",
    "No hay pedidos en esta categoría.": "There are no orders in this category.",
    "Todavia no hay comentarios del Hardware Lab.": "There is no Hardware Lab feedback yet.",
    "Todavía no hay comentarios del Hardware Lab.": "There is no Hardware Lab feedback yet.",
    "Bug": "Bug",
    "Sugerencia": "Suggestion",
    "Contacto:": "Contact:",
    "Sin correo de contacto": "No contact email",
    "Traducir con Google": "Translate with Google",
    "Estado": "Status",
    "Guardar estado": "Save status",
    "Cargando comentarios...": "Loading feedback...",
    "Nuevo": "New",
    "Revisado": "Reviewed",
    "Resuelto": "Resolved",
    "Seguridad": "Security",
    "Confirma tu contraseña actual y elige una nueva de al menos 8 caracteres.":
      "Confirm your current password and choose a new one with at least 8 characters.",
    "Contraseña actual": "Current password",
    "Nueva contraseña": "New password",
    "Confirmar nueva contraseña": "Confirm new password",
    "Guardar contraseña": "Save password",

    "Completa tu pedido": "Complete your order",
    "Volver a tienda": "Back to shop",
    "Ver pedido": "View order",
    "Pago manual": "Manual payment",
    "Al finalizar recibiras un codigo de pedido. Envialo por Telegram junto con el comprobante de pago.":
      "When finished, you will receive an order code. Send it through Telegram with your payment receipt.",
    "Producto": "Product",
    "Kit a reservar": "Kit to reserve",
    "Cargando productos...": "Loading products...",
    "Por confirmar": "To be confirmed",
    "Datos de entrega": "Delivery details",
    "Crear pedido": "Create order",
    "Despues del formulario": "After the form",
    "Confirmacion por Telegram": "Telegram confirmation",
    "Crea el pedido y guarda tu codigo.": "Create the order and save your code.",
    "Elige PayPal o transferencia Banorte.": "Choose PayPal or a Banorte transfer.",
    "Envia el codigo y comprobante a @pepeangell.": "Send the code and receipt to @pepeangell.",
    "Pepe actualiza pago, envio e historial desde el admin.": "Pepe updates payment, shipping and history from the admin dashboard.",
    "Opcion 1": "Option 1",
    "Opcion 2": "Option 2",
    "Abrir PayPal": "Open PayPal",
    "Transferencia Banorte": "Banorte bank transfer",
    "CLABE interbancaria": "Interbank CLABE",
    "Beneficiario": "Beneficiary",
    "Usa el codigo de tu pedido como concepto o referencia.": "Use your order code as the payment reference.",
    "Copiar CLABE": "Copy CLABE",
    "Enviar comprobante por Telegram": "Send receipt through Telegram",
    "Estado de tu pedido": "Your order status",
    "Nuevo pedido": "New order",
    "Confirmacion": "Confirmation",
    "Si acabas de pagar, envia tu codigo y comprobante por Telegram para que Pepe actualice el estado.":
      "If you just paid, send your code and receipt through Telegram so Pepe can update the status.",
    "Buscar": "Search",
    "Consulta privada": "Private lookup",
    "Codigo de pedido": "Order code",
    "Código de pedido": "Order code",
    "Email del pedido": "Order email",
    "Sin busqueda": "No search",
    "Sin búsqueda": "No search",
    "Tu historial aparecera aqui": "Your history will appear here",
    "Tu historial aparecerá aquí": "Your history will appear here",
    "El seguimiento se actualiza cuando Pepe confirma pago, prepara envio y registra eventos del pedido.":
      "Tracking updates when Pepe confirms payment, prepares shipping and records order events.",
    "Fecha de envio": "Shipping date",
    "Fecha de envío": "Shipping date",
    "Iniciar pedido": "Start order",
    "Admin tienda": "Shop admin",
    "Canal Telegram": "Telegram channel",
    "Grupo Telegram": "Telegram group",
    "Flujo manual": "Manual flow",
    "Checkout + pago manual + Telegram": "Checkout + manual payment + Telegram",
    "El pedido guarda tus datos de envio, queda pendiente de confirmacion y se paga por PayPal o transferencia Banorte. Pepe confirma por Telegram: @pepeangell.":
      "The order stores your shipping details, remains pending confirmation and is paid through PayPal or Banorte transfer. Pepe confirms it through Telegram: @pepeangell.",
    "La disponibilidad, precio y stock se cargan desde Supabase cuando la tienda esta conectada. Si un kit no aparece disponible, confirma por Telegram antes de pagar.":
      "Availability, price and stock load from Supabase when the shop is connected. If a kit is unavailable, confirm through Telegram before paying.",
    "Precio por confirmar": "Price to be confirmed",
    "Disponibilidad por confirmar": "Availability to be confirmed",
    "Reservar kit": "Reserve kit",
    "Kit": "Kit",
    "Cantidad": "Quantity",
    "Campos obligatorios": "Required fields",
    "Nombre completo *": "Full name *",
    "Correo electrónico *": "Email *",
    "Teléfono *": "Phone *",
    "Telegram (opcional)": "Telegram (optional)",
    "País *": "Country *",
    "Estado / provincia *": "State / province *",
    "Ciudad *": "City *",
    "Código postal *": "Postal code *",
    "Dirección *": "Address *",
    "Notas": "Notes",
    "Color, referencia de envio o comentario para Pepe": "Color, shipping reference or note for Pepe"
  };

  Object.entries(interfaceTranslations).forEach(([source, translation]) => {
    translations.set(source, translation);
  });

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
    [/^(.+) - offset (.+)$/, (_text, path, offset) => `${path} - offset ${offset}`],
    [/^(\d+) errores$/, (_text, count) => `${count} errors`],
    [/^(\d+) avisos$/, (_text, count) => `${count} warnings`],
    [/^(\d+) error\(es\)$/, (_text, count) => `${count} error(s)`],
    [/^(\d+) aviso\(s\)$/, (_text, count) => `${count} warning(s)`],
    [/^(\d+) cable\(s\)$/, (_text, count) => `${count} wire(s)`],
    [/^(\d+) en stock$/, (_text, count) => `${count} in stock`],
    [/^(.+ - )(\d+) en stock$/, (_text, prefix, count) => `${prefix}${count} in stock`],
    [/^(\d+)\/(\d+) activos$/, (_text, active, total) => `${active}/${total} active`],
    [/^Placa (.+)$/, (_text, color) => `Board ${translations.get(color) ?? color}`],
    [/^Guardado (.+)$/, (_text, time) => `Saved ${time}`],
    [/^CARA COMPONENTES (.+)$/, (_text, details) => `COMPONENT SIDE ${details}`],
    [/^CARA SOLDADURA (.+)$/, (_text, details) => `SOLDER SIDE ${details}`],
    [/^Volver a (.+)$/, (_text, state) => `Return to ${state}`],
    [/^Subiendo (.+)\.\.\.$/, (_text, file) => `Uploading ${file}...`],
    [/^Solo puedes adjuntar (\d+) imagenes\.$/, (_text, count) => `You can attach up to ${count} images.`],
    [/^(.+) supera el limite de (.+)\.$/, (_text, file, limit) => `${file} exceeds the ${limit} limit.`],
    [/^Captura (\d+) adjunta al reporte$/, (_text, index) => `Screenshot ${index} attached to the report`],
    [/^Agregar (.+)$/, (_text, component) => `Add ${translations.get(component) ?? component}`],
    [/^(\d+) placas$/, (_text, count) => `${count} boards`],
    [/^(\d+) componentes$/, (_text, count) => `${count} components`],
    [/^(\d+) montados$/, (_text, count) => `${count} mounted`],
    [/^(\d+) cables visibles$/, (_text, count) => `${count} visible wires`],
    [/^(\d+) cables ocultos$/, (_text, count) => `${count} hidden wires`],
    [/^(\d+) diagnóstico\(s\) relacionado\(s\)$/, (_text, count) => `${count} related diagnostic(s)`],
    [/^(\d+) componentes montados en esta placa\. Al moverla o invertirla conservarán su posición física\.$/,
      (_text, count) => `${count} components mounted on this board. They will keep their physical position when the board is moved or flipped.`],
    [/^(\d+) placa\(s\), (\d+) componente\(s\), (\d+) montado\(s\)\.$/,
      (_text, boards, components, mounted) => `${boards} board(s), ${components} component(s), ${mounted} mounted.`],
    [/^(\d+) cable\(s\) registrados; (\d+) visibles en esta cara\.$/,
      (_text, wires, visible) => `${wires} wire(s) registered; ${visible} visible on this side.`],
    [/^Diagnóstico: (\d+) error\(es\), (\d+) advertencia\(s\)\.$/,
      (_text, errors, warnings) => `Diagnostics: ${errors} error(s), ${warnings} warning(s).`]
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
    const currentValue = node.nodeValue || "";
    const lastRenderedValue = renderedTextNodes.get(node);
    const directTranslation = translatedText(currentValue, "en");

    if (!originalTextNodes.has(node) || directTranslation !== currentValue) {
      originalTextNodes.set(node, currentValue);
    } else if (lastRenderedValue !== undefined && currentValue !== lastRenderedValue) {
      originalTextNodes.set(node, currentValue);
    }

    const nextValue = lang === "en"
      ? directTranslation !== currentValue
        ? directTranslation
        : translatedText(originalTextNodes.get(node), "en")
      : originalTextNodes.get(node);
    renderedTextNodes.set(node, nextValue);
    if (currentValue !== nextValue) node.nodeValue = nextValue;
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

      let rendered = renderedAttributes.get(element);
      if (!rendered) {
        rendered = {};
        renderedAttributes.set(element, rendered);
      }

      const currentValue = element.getAttribute(attr) || "";
      if (!(attr in originals) || (attr in rendered && currentValue !== rendered[attr])) originals[attr] = currentValue;
      const nextValue = translatedText(originals[attr], lang);
      rendered[attr] = nextValue;
      if (currentValue !== nextValue) element.setAttribute(attr, nextValue);
    }
  }

  function translateExplicitElement(element, lang) {
    const english = element.getAttribute("data-translate-en");
    if (!english) return;
    if (!originalExplicitElements.has(element)) originalExplicitElements.set(element, element.textContent || "");

    const nextValue = lang === "en" ? english : originalExplicitElements.get(element);
    if (element.textContent !== nextValue) element.textContent = nextValue;
  }

  function walk(root, lang) {
    if (!root || shouldSkip(root)) return;

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, lang);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

    if (root.nodeType === Node.ELEMENT_NODE) {
      translateAttributes(root, lang);
      translateExplicitElement(root, lang);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        return shouldSkip(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });

    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, lang);
      else if (node.nodeType === Node.ELEMENT_NODE) {
        translateAttributes(node, lang);
        translateExplicitElement(node, lang);
      }
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
    document.documentElement.lang = lang;
    document.documentElement.dataset.language = lang;
    walk(document.body, lang);
    updateToggle(lang);
    document.dispatchEvent(new CustomEvent("site-language-change", { detail: { lang } }));
  }

  const savedLanguage = localStorage.getItem(storageKey);
  let currentLanguage = savedLanguage === "en" ? "en" : "es";
  let translationReady = false;

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lang-option]");
    if (!button) return;

    currentLanguage = button.getAttribute("data-lang-option") === "en" ? "en" : "es";
    localStorage.setItem(storageKey, currentLanguage);
    updateToggle(currentLanguage);
    if (translationReady) applyLanguage(currentLanguage);
  });

  document.addEventListener("DOMContentLoaded", () => {
    window.setTimeout(() => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === "characterData") {
            translateTextNode(mutation.target, currentLanguage);
            continue;
          }

          mutation.addedNodes.forEach((node) => walk(node, currentLanguage));
        }
      });
      observer.observe(document.body, { childList: true, characterData: true, subtree: true });
      translationReady = true;
      applyLanguage(currentLanguage);
      window.setTimeout(() => applyLanguage(currentLanguage), 360);
    }, 1300);
  });
})();
