import assert from "node:assert/strict";
import test from "node:test";
import { HARDWARE_COMPONENTS } from "../src/components/hardware-lab/catalog.ts";

function orderedPins(componentId, side) {
  const component = HARDWARE_COMPONENTS.find((item) => item.id === componentId);
  assert.ok(component, `No se encontró el componente ${componentId}`);

  return component.pins
    .filter((pin) => pin.side === side)
    .sort((left, right) => left.yMm - right.yMm)
    .map((pin) => pin.id);
}

test("ESP32 DevKit 30 conserva el orden físico de la columna izquierda", () => {
  assert.deepEqual(orderedPins("esp32-devkit-30", "left"), [
    "EN",
    "GPIO36",
    "GPIO39",
    "GPIO34",
    "GPIO35",
    "GPIO32",
    "GPIO33",
    "GPIO25",
    "GPIO26",
    "GPIO27",
    "GPIO14",
    "GPIO12",
    "GPIO13",
    "GND-L",
    "VIN",
  ]);
});

test("ESP32 DevKit 30 muestra GPIO23 arriba y 3V3 abajo en la columna derecha", () => {
  assert.deepEqual(orderedPins("esp32-devkit-30", "right"), [
    "GPIO23",
    "GPIO22",
    "GPIO1",
    "GPIO3",
    "GPIO21",
    "GPIO19",
    "GPIO18",
    "GPIO5",
    "GPIO17",
    "GPIO16",
    "GPIO4",
    "GPIO2",
    "GPIO15",
    "GND-R",
    "3V3",
  ]);
});

test("la variante ESP32-WROOM-32D comparte el orden físico corregido", () => {
  assert.equal(orderedPins("esp32-devkit-d", "right")[0], "GPIO23");
  assert.equal(orderedPins("esp32-devkit-d", "right").at(-1), "3V3");
});
