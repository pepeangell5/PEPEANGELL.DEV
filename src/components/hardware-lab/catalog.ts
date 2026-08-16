export type PinRole = "ground" | "power" | "signal";
export type PinSide = "bottom" | "left" | "right" | "top";
export type PinDirection = "bidirectional" | "input" | "output" | "passive";

export type HardwarePin = {
  direction: PinDirection;
  id: string;
  label: string;
  maxVoltage?: number;
  role: PinRole;
  side: PinSide;
  voltage?: number;
  xMm: number;
  yMm: number;
};

export type HardwareComponentDefinition = {
  accent: string;
  category: "control" | "display" | "interface" | "mcu" | "power" | "radio";
  description: string;
  heightMm: number;
  id: string;
  name: string;
  pins: HardwarePin[];
  referenceImageUrl?: string;
  requiredPins: string[];
  shortName: string;
  widthMm: number;
};

export type BoardPreset = {
  heightMm: number;
  id: string;
  label: string;
  widthMm: number;
};

const signal = (id: string, side: PinSide, label = id, maxVoltage = 3.3): HardwarePin => ({
  direction: "bidirectional",
  id,
  label,
  maxVoltage,
  role: "signal",
  side,
  xMm: 0,
  yMm: 0,
});

const ground = (id: string, side: PinSide, label = id): HardwarePin => ({
  direction: "passive",
  id,
  label,
  role: "ground",
  side,
  voltage: 0,
  xMm: 0,
  yMm: 0,
});

const power = (
  id: string,
  side: PinSide,
  voltage: number,
  label = id,
  maxVoltage = voltage,
): HardwarePin => ({
  direction: "passive",
  id,
  label,
  maxVoltage,
  role: "power",
  side,
  voltage,
  xMm: 0,
  yMm: 0,
});

const asInput = (pin: HardwarePin): HardwarePin => ({ ...pin, direction: "input" });
const asOutput = (pin: HardwarePin): HardwarePin => ({ ...pin, direction: "output" });

const at = (pin: HardwarePin, xMm: number, yMm: number, side = pin.side): HardwarePin => ({
  ...pin,
  side,
  xMm,
  yMm,
});

const dualRows = (
  leftPins: HardwarePin[],
  rightPins: HardwarePin[],
  widthMm: number,
  heightMm: number,
  rowGapMm: number,
  pitchMm = 2.54,
) => {
  const maxPins = Math.max(leftPins.length, rightPins.length);
  const topMm = (heightMm - Math.max(0, maxPins - 1) * pitchMm) / 2;
  const leftMm = (widthMm - rowGapMm) / 2;

  return [
    ...leftPins.map((pin, index) => at(pin, leftMm, topMm + index * pitchMm, "left")),
    ...rightPins.map((pin, index) => at(pin, leftMm + rowGapMm, topMm + index * pitchMm, "right")),
  ];
};

const horizontalRows = (
  topPins: HardwarePin[],
  bottomPins: HardwarePin[],
  widthMm: number,
  heightMm: number,
  rowGapMm: number,
  pitchMm = 2.54,
) => {
  const maxPins = Math.max(topPins.length, bottomPins.length);
  const leftMm = (widthMm - Math.max(0, maxPins - 1) * pitchMm) / 2;
  const topMm = (heightMm - rowGapMm) / 2;

  return [
    ...topPins.map((pin, index) => at(pin, leftMm + index * pitchMm, topMm, "top")),
    ...bottomPins.map((pin, index) => at(pin, leftMm + index * pitchMm, topMm + rowGapMm, "bottom")),
  ];
};

const esp32LeftPins = [
  signal("EN", "left"),
  signal("GPIO36", "left", "VP/36"),
  signal("GPIO39", "left", "VN/39"),
  signal("GPIO34", "left"),
  signal("GPIO35", "left"),
  signal("GPIO32", "left"),
  signal("GPIO33", "left"),
  signal("GPIO25", "left"),
  signal("GPIO26", "left"),
  signal("GPIO27", "left"),
  signal("GPIO14", "left"),
  signal("GPIO12", "left"),
  signal("GPIO13", "left"),
  ground("GND-L", "left", "GND"),
  asInput(power("VIN", "left", 5)),
];

const esp32RightPins = [
  asOutput(power("3V3", "right", 3.3)),
  ground("GND-R", "right", "GND"),
  signal("GPIO15", "right"),
  signal("GPIO2", "right"),
  signal("GPIO4", "right"),
  signal("GPIO16", "right"),
  signal("GPIO17", "right"),
  signal("GPIO5", "right"),
  signal("GPIO18", "right"),
  signal("GPIO19", "right"),
  signal("GPIO21", "right"),
  signal("GPIO3", "right", "RX0/3"),
  signal("GPIO1", "right", "TX0/1"),
  signal("GPIO22", "right"),
  signal("GPIO23", "right"),
];

const esp32U38LeftPins = [
  asOutput(power("3V3", "left", 3.3)),
  signal("EN", "left"),
  signal("GPIO36", "left", "VP/36"),
  signal("GPIO39", "left", "VN/39"),
  signal("GPIO34", "left"),
  signal("GPIO35", "left"),
  signal("GPIO32", "left"),
  signal("GPIO33", "left"),
  signal("GPIO25", "left"),
  signal("GPIO26", "left"),
  signal("GPIO27", "left"),
  signal("GPIO14", "left"),
  signal("GPIO12", "left"),
  ground("GND-L", "left", "GND"),
  signal("GPIO13", "left"),
  signal("GPIO9", "left", "D2/9"),
  signal("GPIO10", "left", "D3/10"),
  signal("GPIO11", "left", "CMD/11"),
  asInput(power("VIN", "left", 5)),
];

const esp32U38RightPins = [
  ground("GND-R1", "right", "GND"),
  signal("GPIO23", "right"),
  signal("GPIO22", "right"),
  signal("GPIO1", "right", "TX0/1"),
  signal("GPIO3", "right", "RX0/3"),
  signal("GPIO21", "right"),
  ground("GND-R2", "right", "GND"),
  signal("GPIO19", "right"),
  signal("GPIO18", "right"),
  signal("GPIO5", "right"),
  signal("GPIO17", "right"),
  signal("GPIO16", "right"),
  signal("GPIO4", "right"),
  signal("GPIO0", "right"),
  signal("GPIO2", "right"),
  signal("GPIO15", "right"),
  signal("GPIO8", "right", "D1/8"),
  signal("GPIO7", "right", "D0/7"),
  signal("GPIO6", "right", "CLK/6"),
];

const esp32S3LeftPins = [
  asOutput(power("3V3-1", "left", 3.3, "3V3")),
  asOutput(power("3V3-2", "left", 3.3, "3V3")),
  signal("RST", "left"),
  ...[4, 5, 6, 7, 15, 16, 17, 18, 8, 3, 46, 9, 10, 11, 12, 13, 14].map((pin) => signal(`GPIO${pin}`, "left")),
  asInput(power("5V", "left", 5)),
  ground("GND-L", "left", "GND"),
];

const esp32S3RightPins = [
  ground("GND-R1", "right", "GND"),
  signal("GPIO43", "right", "TX/43"),
  signal("GPIO44", "right", "RX/44"),
  ...[1, 2, 42, 41, 40, 39, 38, 37, 36, 35, 0, 45, 48, 47, 21, 20, 19].map((pin) => signal(`GPIO${pin}`, "right")),
  ground("GND-R2", "right", "GND"),
  ground("GND-R3", "right", "GND"),
];

const bw16LeftPins = [
  ground("GND-L1", "left", "GND"),
  signal("PA30", "left"),
  signal("PA27", "left"),
  signal("PA25", "left"),
  signal("PA26", "left"),
  signal("PA8", "left"),
  signal("PA7", "left"),
  signal("CHIP-EN", "left", "CHIP-EN"),
  ground("GND-L2", "left", "GND"),
  asOutput(power("3V3-L", "left", 3.3, "3V3")),
  asInput(power("5V-L", "left", 5, "5V")),
];

const bw16RightPins = [
  ground("GND-R1", "right", "GND"),
  signal("PA15", "right"),
  signal("PA14", "right"),
  signal("PA13", "right"),
  signal("PA12", "right"),
  signal("PB3", "right"),
  signal("PB2", "right"),
  signal("PB1", "right"),
  ground("GND-R2", "right", "GND"),
  asOutput(power("3V3-R", "right", 3.3, "3V3")),
  asInput(power("5V-R", "right", 5, "5V")),
];

const esp8266OledTopPins = [
  signal("GPIO16", "top", "D0 / GPIO16"),
  signal("GPIO5", "top", "D1 / GPIO5"),
  signal("GPIO4", "top", "D2 / GPIO4"),
  signal("GPIO0", "top", "D3 / GPIO0"),
  signal("GPIO2", "top", "D4 / GPIO2"),
  asOutput(power("3V3-T1", "top", 3.3, "3V3")),
  ground("GND-T1", "top", "GND"),
  signal("GPIO14", "top", "D5 / OLED SDA"),
  signal("GPIO12", "top", "D6 / OLED SCL"),
  signal("GPIO13", "top", "D7 / GPIO13"),
  signal("GPIO15", "top", "D8 / GPIO15"),
  asInput(signal("GPIO3", "top", "RX / GPIO3")),
  asOutput(signal("GPIO1", "top", "TX / GPIO1")),
  ground("GND-T2", "top", "GND"),
  asOutput(power("3V3-T2", "top", 3.3, "3V3")),
];

const esp8266OledBottomPins = [
  asInput(signal("A0", "bottom", "A0", 3.3)),
  ground("GND-B1", "bottom", "GND"),
  power("VU", "bottom", 5, "VU / USB 5V", 5.25),
  signal("GPIO10", "bottom", "SD3 / GPIO10"),
  signal("GPIO9", "bottom", "SD2 / GPIO9"),
  signal("GPIO8", "bottom", "SD1 / GPIO8"),
  signal("GPIO11", "bottom", "CMD / GPIO11"),
  signal("GPIO7", "bottom", "SD0 / GPIO7"),
  signal("GPIO6", "bottom", "CLK / GPIO6"),
  ground("GND-B2", "bottom", "GND"),
  asOutput(power("3V3-B", "bottom", 3.3, "3V3")),
  signal("EN", "bottom"),
  signal("RST", "bottom"),
  ground("GND-B3", "bottom", "GND"),
  asInput(power("VIN", "bottom", 5, "VIN", 12)),
];

export const BOARD_PRESETS: BoardPreset[] = [
  { id: "20x80", label: "2 x 8 cm", widthMm: 80, heightMm: 20 },
  { id: "30x70", label: "3 x 7 cm", widthMm: 70, heightMm: 30 },
  { id: "40x60", label: "4 x 6 cm", widthMm: 60, heightMm: 40 },
  { id: "50x70", label: "5 x 7 cm", widthMm: 70, heightMm: 50 },
  { id: "70x90", label: "7 x 9 cm", widthMm: 90, heightMm: 70 },
];

export const BOARD_COLORS = [
  { id: "red", label: "Roja", value: "#b72431" },
  { id: "blue", label: "Azul", value: "#155aa8" },
  { id: "black", label: "Negra", value: "#161a1f" },
  { id: "green", label: "Verde", value: "#176b4b" },
] as const;

export const HARDWARE_COMPONENTS: HardwareComponentDefinition[] = [
  {
    id: "esp32-devkit-30",
    name: "ESP32 DevKit 30 pines",
    shortName: "ESP32",
    description: "Placa principal ESP32-WROOM para los kits RF-KILL.",
    category: "mcu",
    widthMm: 28,
    heightMm: 52,
    accent: "#36d98b",
    referenceImageUrl: "/assets/hardware-lab/modules/esp32-wroom-32d-30pin.png",
    pins: dualRows(esp32LeftPins, esp32RightPins, 28, 52, 25.4),
    requiredPins: ["VIN", "GND-L"],
  },
  {
    id: "esp32-devkit-u",
    name: "ESP32-WROOM-32U DevKit",
    shortName: "ESP32-U",
    description: "Variante con conector para antena externa.",
    category: "mcu",
    widthMm: 27.9,
    heightMm: 54.4,
    accent: "#56c7ff",
    referenceImageUrl: "/assets/hardware-lab/modules/esp32-wroom-32u-38pin.png",
    pins: dualRows(esp32U38LeftPins, esp32U38RightPins, 27.9, 54.4, 25.4),
    requiredPins: ["VIN", "GND-L"],
  },
  {
    id: "esp32-devkit-d",
    name: "ESP32-WROOM-32D DevKit",
    shortName: "ESP32-D",
    description: "Variante ESP32 con antena integrada.",
    category: "mcu",
    widthMm: 28,
    heightMm: 52,
    accent: "#4ea6ff",
    referenceImageUrl: "/assets/hardware-lab/modules/esp32-wroom-32d-30pin.png",
    pins: dualRows(esp32LeftPins, esp32RightPins, 28, 52, 25.4),
    requiredPins: ["VIN", "GND-L"],
  },
  {
    id: "esp32-c3-supermini",
    name: "ESP32-C3 Super Mini",
    shortName: "ESP32-C3",
    description: "Placa compacta RISC-V usada por RF-KILL C3.",
    category: "mcu",
    widthMm: 18,
    heightMm: 23,
    accent: "#33d6c5",
    referenceImageUrl: "/assets/hardware-lab/modules/esp32-c3-supermini.png",
    pins: dualRows(
      [
        asInput(power("5V", "left", 5)), ground("GND", "left"), asOutput(power("3V3", "left", 3.3)),
        signal("GPIO4", "left"), signal("GPIO3", "left"), signal("GPIO2", "left"),
        signal("GPIO1", "left"), signal("GPIO0", "left"),
      ],
      [
        signal("GPIO5", "right"), signal("GPIO6", "right"), signal("GPIO7", "right"),
        signal("GPIO8", "right"), signal("GPIO9", "right"), signal("GPIO10", "right"),
        signal("GPIO20", "right"), signal("GPIO21", "right"),
      ],
      18,
      23,
      15.24,
    ),
    requiredPins: ["5V", "GND"],
  },
  {
    id: "esp32-s3-devkit",
    name: "ESP32-S3 DevKit",
    shortName: "ESP32-S3",
    description: "Placa ESP32-S3 para proyectos con mas GPIO y USB.",
    category: "mcu",
    widthMm: 25.4,
    heightMm: 62.74,
    accent: "#9b8cff",
    pins: dualRows(esp32S3LeftPins, esp32S3RightPins, 25.4, 62.74, 22.86),
    requiredPins: ["5V", "GND-L"],
  },
  {
    id: "bw16-kit",
    name: "Ai-Thinker BW16 Kit",
    shortName: "BW16",
    description: "Placa RTL8720DN de doble banda usada por BWifiKill BW16 5 GHz.",
    category: "mcu",
    widthMm: 25.4,
    heightMm: 50.4,
    accent: "#2dc6bb",
    pins: dualRows(bw16LeftPins, bw16RightPins, 25.4, 50.4, 22.86),
    requiredPins: ["5V-L", "GND-L1"],
  },
  {
    id: "esp8266-hw364a-oled",
    name: "ESP8266 HW-364A con OLED 0.96 integrada",
    shortName: "ESP8266 OLED",
    description: "NodeMCU ESP8266 con CH340G y OLED SSD1306 128x64 integrada; SDA GPIO14, SCL GPIO12 y direccion 0x3C.",
    category: "mcu",
    widthMm: 59,
    heightMm: 31,
    accent: "#ffd34d",
    pins: horizontalRows(esp8266OledTopPins, esp8266OledBottomPins, 59, 31, 27.94),
    requiredPins: ["VIN", "GND-T1"],
  },
  {
    id: "ssd1306-oled-096",
    name: "OLED SSD1306 I2C 0.96 pulgadas",
    shortName: "SSD1306",
    description: "Pantalla OLED 128x64 con interfaz I2C y direccion habitual 0x3C.",
    category: "display",
    widthMm: 27,
    heightMm: 27,
    accent: "#29b6f6",
    pins: [
      at(ground("GND", "top"), 9.69, 1.55),
      at(asInput(power("VCC", "top", 3.3, "VCC", 5)), 12.23, 1.55),
      at(asInput(signal("SCL", "top")), 14.77, 1.55),
      at(asInput(signal("SDA", "top")), 17.31, 1.55),
    ],
    requiredPins: ["GND", "VCC", "SCL", "SDA"],
  },
  {
    id: "st7735-tft-18",
    name: "TFT ST7735 SPI 1.8 pulgadas",
    shortName: "ST7735",
    description: "Pantalla TFT SPI 128x160 usada por BWifiKill BW16.",
    category: "display",
    widthMm: 56,
    heightMm: 35,
    accent: "#ef5350",
    pins: [
      at(asInput(power("VCC", "right", 3.3, "VCC", 5)), 54.5, 8.61),
      at(ground("GND", "right"), 54.5, 11.15),
      at(asInput(signal("CS", "right")), 54.5, 13.69),
      at(asInput(signal("RST", "right", "RESET")), 54.5, 16.23),
      at(asInput(signal("DC", "right", "A0")), 54.5, 18.77),
      at(asInput(signal("MOSI", "right", "SDA")), 54.5, 21.31),
      at(asInput(signal("SCK", "right")), 54.5, 23.85),
      at(asInput(power("LED", "right", 3.3, "LED", 5)), 54.5, 26.39),
      at(asInput(signal("SD_CS", "left")), 1.5, 13.69),
      at(asInput(signal("SD_MOSI", "left")), 1.5, 16.23),
      at(asOutput(signal("SD_MISO", "left")), 1.5, 18.77),
      at(asInput(signal("SD_SCK", "left")), 1.5, 21.31),
    ],
    requiredPins: ["VCC", "GND", "CS", "RST", "DC", "MOSI", "SCK", "LED"],
  },
  {
    id: "ili9488-tft-35",
    name: "TFT ILI9488 SPI 3.5 pulgadas",
    shortName: "ILI9488",
    description: "Pantalla TFT SPI 480x320 de 14 pines con tactil resistivo.",
    category: "display",
    widthMm: 56,
    heightMm: 98,
    accent: "#ef5350",
    pins: [
      at(asInput(power("VCC", "bottom", 5, "VCC", 5)), 11.49, 96.5),
      at(ground("GND", "bottom"), 14.03, 96.5),
      at(asInput(signal("CS", "bottom")), 16.57, 96.5),
      at(asInput(signal("RST", "bottom", "RESET")), 19.11, 96.5),
      at(asInput(signal("DC", "bottom")), 21.65, 96.5),
      at(asInput(signal("MOSI", "bottom", "SDI/MOSI")), 24.19, 96.5),
      at(asInput(signal("SCK", "bottom")), 26.73, 96.5),
      at(asInput(power("LED", "bottom", 3.3, "LED", 5)), 29.27, 96.5),
      at(asOutput(signal("MISO", "bottom", "SDO/MISO")), 31.81, 96.5),
      at(asInput(signal("T_CLK", "bottom")), 34.35, 96.5),
      at(asInput(signal("T_CS", "bottom")), 36.89, 96.5),
      at(asInput(signal("T_DIN", "bottom")), 39.43, 96.5),
      at(asOutput(signal("T_DO", "bottom")), 41.97, 96.5),
      at(asOutput(signal("T_IRQ", "bottom")), 44.51, 96.5),
    ],
    requiredPins: ["VCC", "GND", "CS", "RST", "DC", "MOSI", "SCK", "LED"],
  },
  {
    id: "st7789-tft-28-cyberdeck",
    name: "TFT ST7789 SPI 2.8 pulgadas",
    shortName: "ST7789 2.8",
    description: "Pantalla TFT SPI 240x320 usada por CYBERDECK-MINI-ESP32; incluye tactil resistivo y lector microSD. Firmware: SCK 12, MOSI 11, MISO 13, CS 10, DC 21 y RST 14.",
    category: "display",
    widthMm: 50,
    heightMm: 86,
    accent: "#ef5350",
    pins: [
      at(asInput(power("VCC", "bottom", 5, "VCC", 5)), 8.49, 84.5),
      at(ground("GND", "bottom"), 11.03, 84.5),
      at(asInput(signal("CS", "bottom")), 13.57, 84.5),
      at(asInput(signal("RST", "bottom", "RESET")), 16.11, 84.5),
      at(asInput(signal("DC", "bottom")), 18.65, 84.5),
      at(asInput(signal("MOSI", "bottom", "SDI/MOSI")), 21.19, 84.5),
      at(asInput(signal("SCK", "bottom")), 23.73, 84.5),
      at(asInput(power("LED", "bottom", 3.3, "LED", 5)), 26.27, 84.5),
      at(asOutput(signal("MISO", "bottom", "SDO/MISO")), 28.81, 84.5),
      at(asInput(signal("T_CLK", "bottom")), 31.35, 84.5),
      at(asInput(signal("T_CS", "bottom")), 33.89, 84.5),
      at(asInput(signal("T_DIN", "bottom")), 36.43, 84.5),
      at(asOutput(signal("T_DO", "bottom")), 38.97, 84.5),
      at(asOutput(signal("T_IRQ", "bottom")), 41.51, 84.5),
      at(asInput(signal("SD_CS", "top")), 21.19, 1.5),
      at(asInput(signal("SD_MOSI", "top")), 23.73, 1.5),
      at(asOutput(signal("SD_MISO", "top")), 26.27, 1.5),
      at(asInput(signal("SD_SCK", "top")), 28.81, 1.5),
    ],
    requiredPins: ["VCC", "GND", "CS", "RST", "DC", "MOSI", "SCK", "LED"],
  },
  {
    id: "nrf24-pa-lna",
    name: "nRF24L01+ PA+LNA",
    shortName: "nRF24",
    description: "Modulo RF SPI de 2.4 GHz con antena externa.",
    category: "radio",
    widthMm: 45,
    heightMm: 18,
    accent: "#ffb020",
    referenceImageUrl: "/assets/hardware-lab/modules/nrf24-pa-lna.png",
    pins: [
      at(ground("GND", "left"), 2.54, 5.19),
      at(asInput(power("VCC", "right", 3.3, "3V3", 3.3)), 5.08, 5.19),
      at(asInput(signal("CE", "left")), 2.54, 7.73),
      at(asInput(signal("CSN", "right")), 5.08, 7.73),
      at(asInput(signal("SCK", "left")), 2.54, 10.27),
      at(asInput(signal("MOSI", "right")), 5.08, 10.27),
      at(asOutput(signal("MISO", "left")), 2.54, 12.81),
      at(asOutput(signal("IRQ", "right")), 5.08, 12.81),
    ],
    requiredPins: ["GND", "VCC", "CE", "CSN", "SCK", "MOSI", "MISO"],
  },
  {
    id: "cc1101-v2-sma",
    name: "CC1101 V2.0 con SMA",
    shortName: "CC1101",
    description: "Transceptor Sub-GHz SPI de 433 MHz con conector SMA.",
    category: "radio",
    widthMm: 28,
    heightMm: 15,
    accent: "#42a5f5",
    pins: [
      at(ground("GND", "left"), 1.3, 3.69),
      at(asInput(power("VCC", "right", 3.3, "VCC", 3.6)), 3.84, 3.69),
      at(asOutput(signal("GDO0", "left")), 1.3, 6.23),
      at(asInput(signal("CSN", "right")), 3.84, 6.23),
      at(asInput(signal("SCK", "left")), 1.3, 8.77),
      at(asInput(signal("MOSI", "right")), 3.84, 8.77),
      at(asOutput(signal("MISO", "left", "MISO/GDO1")), 1.3, 11.31),
      at(asOutput(signal("GDO2", "right")), 3.84, 11.31),
    ],
    requiredPins: ["GND", "VCC", "CSN", "SCK", "MOSI", "MISO"],
  },
  {
    id: "m5stack-ir-unit",
    name: "M5Stack Unit IR",
    shortName: "M5 IR",
    description: "Emisor y receptor infrarrojo de 940 nm con conector Grove PORT.B.",
    category: "interface",
    widthMm: 32,
    heightMm: 24,
    accent: "#f5f5f5",
    pins: [
      at(asOutput(signal("IR_RX", "top", "IN / RX")), 12.19, 1.25),
      at(asInput(signal("IR_TX", "top", "OUT / TX")), 14.73, 1.25),
      at(asInput(power("5V", "top", 5, "5V", 5)), 17.27, 1.25),
      at(ground("GND", "top"), 19.81, 1.25),
    ],
    requiredPins: ["GND", "5V", "IR_TX", "IR_RX"],
  },
  {
    id: "microsd-spi-adapter",
    name: "Lector microSD SPI",
    shortName: "microSD",
    description: "Adaptador microSD de 6 pines con regulador, interfaz SPI y alimentacion de 5 V.",
    category: "interface",
    widthMm: 42,
    heightMm: 24,
    accent: "#42a5f5",
    pins: [
      at(asInput(signal("CS", "right")), 40.5, 5.65),
      at(asInput(signal("SCK", "right")), 40.5, 8.19),
      at(asInput(signal("MOSI", "right")), 40.5, 10.73),
      at(asOutput(signal("MISO", "right")), 40.5, 13.27),
      at(asInput(power("VCC", "right", 5, "VCC", 5)), 40.5, 15.81),
      at(ground("GND", "right"), 40.5, 18.35),
    ],
    requiredPins: ["CS", "SCK", "MOSI", "MISO", "VCC", "GND"],
  },
  {
    id: "neo6m-gps",
    name: "GPS NEO-6M GY-GPS6MV2",
    shortName: "NEO-6M",
    description: "Receptor GPS UART con antena ceramica externa y alimentacion regulada.",
    category: "interface",
    widthMm: 58,
    heightMm: 28,
    accent: "#4d9ee8",
    pins: [
      at(ground("GND", "left"), 1.5, 10.19),
      at(asOutput(signal("TX", "left", "TX")), 1.5, 12.73),
      at(asInput(signal("RX", "left", "RX")), 1.5, 15.27),
      at(asInput(power("VCC", "left", 5, "VCC", 5.5)), 1.5, 17.81),
    ],
    requiredPins: ["GND", "TX", "RX", "VCC"],
  },
  {
    id: "ky040-encoder",
    name: "Encoder rotativo KY-040",
    shortName: "KY-040",
    description: "Encoder incremental con salidas CLK y DT, pulsador integrado y placa de 5 pines.",
    category: "control",
    widthMm: 26.6,
    heightMm: 18.9,
    accent: "#ffca4b",
    pins: [
      at(asOutput(signal("CLK", "right")), 25.3, 4.37),
      at(asOutput(signal("DT", "right")), 25.3, 6.91),
      at(asOutput(signal("SW", "right")), 25.3, 9.45),
      at(asInput(power("VCC", "right", 3.3, "+", 5)), 25.3, 11.99),
      at(ground("GND", "right"), 25.3, 14.53),
    ],
    requiredPins: ["CLK", "DT", "SW", "VCC", "GND"],
  },
  {
    id: "buzzer-2pin",
    name: "Buzzer polarizado de 2 pines",
    shortName: "BUZZER",
    description: "Zumbador compacto para avisos sonoros, con terminal positivo de senal y negativo.",
    category: "control",
    widthMm: 12,
    heightMm: 12,
    accent: "#ffd54f",
    pins: [
      at(asInput(signal("SIG", "bottom", "+ / SIGNAL", 5)), 3.46, 10.8),
      at(ground("GND", "bottom", "- / GND"), 8.54, 10.8),
    ],
    requiredPins: ["SIG", "GND"],
  },
  {
    id: "battery-divider-22k-1k",
    name: "Divisor de bateria 2.2k / 1k",
    shortName: "DIV ADC",
    description: "Divisor resistivo para medir una celda LiPo desde GPIO9 sin aplicar el voltaje completo al ADC.",
    category: "power",
    widthMm: 22,
    heightMm: 10,
    accent: "#f4b942",
    pins: [
      at(asInput(power("BAT+", "left", 4.2, "BAT+", 4.2)), 1.2, 5),
      at(asOutput(signal("ADC", "right", "ADC / GPIO9")), 20.8, 5),
      at(ground("GND", "bottom"), 11, 8.8),
    ],
    requiredPins: ["BAT+", "ADC", "GND"],
  },
  {
    id: "tp4056",
    name: "TP4056 con proteccion",
    shortName: "TP4056",
    description: "Carga y proteccion para una celda de litio.",
    category: "power",
    widthMm: 17,
    heightMm: 28,
    accent: "#4b9fff",
    referenceImageUrl: "/assets/hardware-lab/modules/tp4056-usbc.png",
    pins: [
      at(asInput(power("IN+", "left", 5)), 0.88, 3.81),
      at(ground("IN-", "left"), 0.88, 24.13),
      at(asOutput(power("OUT+", "right", 4.2, "OUT+", 4.2)), 16.12, 3.81),
      at(power("B+", "right", 4.2, "B+", 4.2), 16.12, 8.89),
      at(ground("B-", "right"), 16.12, 19.05),
      at(ground("OUT-", "right"), 16.12, 24.13),
    ],
    requiredPins: ["B+", "B-", "OUT+", "OUT-"],
  },
  {
    id: "step-up",
    name: "Convertidor Step-Up",
    shortName: "STEP-UP",
    description: "Elevador DC para obtener 5 V desde la bateria.",
    category: "power",
    widthMm: 17,
    heightMm: 37,
    accent: "#ff7a59",
    referenceImageUrl: "/assets/hardware-lab/modules/step-up-mt3608.png",
    pins: [
      at(asInput(power("VIN+", "top", 4.2, "IN+", 24)), 0.88, 1.99),
      at(ground("VIN-", "top", "IN-"), 16.12, 1.99),
      at(asOutput(power("VOUT+", "bottom", 5, "5V OUT", 28)), 0.88, 35.01),
      at(ground("VOUT-", "bottom", "OUT-"), 16.12, 35.01),
    ],
    requiredPins: ["VIN+", "VIN-", "VOUT+", "VOUT-"],
  },
  {
    id: "step-down",
    name: "Convertidor Step-Down",
    shortName: "STEP-DOWN",
    description: "Regulador DC para bajar y estabilizar voltaje.",
    category: "power",
    widthMm: 21,
    heightMm: 43,
    accent: "#f08cff",
    pins: [
      at(asInput(power("VIN+", "top", 5, "IN+", 24)), 1.61, 3.72),
      at(ground("VIN-", "top", "IN-"), 19.39, 3.72),
      at(asOutput(power("VOUT+", "bottom", 3.3, "3V3 OUT", 24)), 1.61, 39.28),
      at(ground("VOUT-", "bottom", "OUT-"), 19.39, 39.28),
    ],
    requiredPins: ["VIN+", "VIN-", "VOUT+", "VOUT-"],
  },
  {
    id: "lipo-37",
    name: "Bateria LiPo 3.7 V",
    shortName: "LiPo",
    description: "Celda de litio para alimentar montajes portatiles.",
    category: "power",
    widthMm: 30,
    heightMm: 40,
    accent: "#ff5c77",
    pins: [
      at(asOutput(power("BAT+", "right", 4.2, "+", 4.2)), 28.97, 10.16),
      at(ground("BAT-", "right", "-"), 28.97, 15.24),
    ],
    requiredPins: ["BAT+", "BAT-"],
  },
  {
    id: "push-button",
    name: "Boton pulsador",
    shortName: "BUTTON",
    description: "Pulsador momentaneo para entrada digital.",
    category: "control",
    widthMm: 6,
    heightMm: 6,
    accent: "#ffd54a",
    referenceImageUrl: "/assets/hardware-lab/modules/push-button.png",
    pins: [
      at(signal("A1", "left", "A1", 12), 0.46, 0.46),
      at(signal("A2", "left", "A2", 12), 0.46, 5.54),
      at(signal("B1", "right", "B1", 12), 5.54, 0.46),
      at(signal("B2", "right", "B2", 12), 5.54, 5.54),
    ],
    requiredPins: ["A1", "B1"],
  },
  {
    id: "slide-switch",
    name: "Interruptor",
    shortName: "SWITCH",
    description: "Interruptor de encendido o seleccion.",
    category: "control",
    widthMm: 8,
    heightMm: 14,
    accent: "#ffdd66",
    pins: [
      at(signal("COM", "bottom", "COM", 24), 1.46, 12.7),
      at(signal("NO", "bottom", "NO", 24), 6.54, 12.7),
    ],
    requiredPins: ["COM", "NO"],
  },
];

export const DEFAULT_LAB_CODE = `#include <SPI.h>
#include <RF24.h>

// CE, CSN
RF24 radio1(4, 5);
RF24 radio2(16, 17);

void setup() {
  Serial.begin(115200);
  SPI.begin(18, 19, 23);
  radio1.begin();
  radio2.begin();
}

void loop() {
  // Prueba de conexiones del laboratorio
}`;

export function getComponentDefinition(componentId: string) {
  return HARDWARE_COMPONENTS.find((component) => component.id === componentId);
}
