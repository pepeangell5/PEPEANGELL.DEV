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
  category: "control" | "mcu" | "power" | "radio";
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
