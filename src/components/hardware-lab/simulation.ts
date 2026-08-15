import { getComponentDefinition } from "./catalog";

type SimulationNode = {
  data: {
    [key: string]: unknown;
    componentId?: string;
  };
  id: string;
  type?: string;
};

type SimulationEdge = {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
};

export type SimulationControls = {
  batteries: Record<string, boolean>;
  batteryVoltages: Record<string, number>;
  buttons: Record<string, boolean>;
  converterOutputs: Record<string, number>;
  switches: Record<string, boolean>;
};

export type SimulatedNodeStatus = {
  inputVoltage: number;
  outputVoltage: number;
  pinVoltages: Record<string, number>;
  powered: boolean;
  voltage: number;
};

export type SimulatedEdgeStatus = {
  energized: boolean;
  groundReturn: boolean;
  voltage: number;
};

export type SimulationResult = {
  edgeStatusById: Record<string, SimulatedEdgeStatus>;
  poweredCount: number;
  statusByNode: Record<string, SimulatedNodeStatus>;
};

const pinKey = (nodeId: string, pinId: string) => `${nodeId}::${pinId}`;
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));

export function simulateHardwareCircuit(
  nodes: SimulationNode[],
  edges: SimulationEdge[],
  controls: SimulationControls,
): SimulationResult {
  const hardwareNodes = nodes.filter((node) => node.type === "hardware");
  const parents = new Map<string, string>();

  const ensure = (key: string) => {
    if (!parents.has(key)) parents.set(key, key);
  };
  const findRoot = (key: string): string => {
    ensure(key);
    const parent = parents.get(key) ?? key;
    if (parent === key) return key;
    const root = findRoot(parent);
    parents.set(key, root);
    return root;
  };
  const join = (first: string, second: string) => {
    const firstRoot = findRoot(first);
    const secondRoot = findRoot(second);
    if (firstRoot !== secondRoot) parents.set(secondRoot, firstRoot);
  };

  hardwareNodes.forEach((node) => {
    const definition = getComponentDefinition(node.data.componentId ?? "");
    if (!definition) return;
    definition.pins.forEach((pin) => ensure(pinKey(node.id, pin.id)));

    const grounds = definition.pins.filter((pin) => pin.role === "ground");
    grounds.slice(1).forEach((pin) => join(pinKey(node.id, grounds[0].id), pinKey(node.id, pin.id)));

    if (definition.id === "tp4056") join(pinKey(node.id, "B+"), pinKey(node.id, "OUT+"));
    if (definition.id === "push-button") {
      join(pinKey(node.id, "A1"), pinKey(node.id, "A2"));
      join(pinKey(node.id, "B1"), pinKey(node.id, "B2"));
      if (controls.buttons[node.id]) join(pinKey(node.id, "A1"), pinKey(node.id, "B1"));
    }
    if (definition.id === "slide-switch" && controls.switches[node.id]) {
      join(pinKey(node.id, "COM"), pinKey(node.id, "NO"));
    }
    if (definition.id === "m5stack-ir-unit") {
      // The emitter and receiver are independent signals; power only shares the common ground.
      ensure(pinKey(node.id, "IR_TX"));
      ensure(pinKey(node.id, "IR_RX"));
    }
  });

  edges.forEach((edge) => {
    if (!edge.sourceHandle || !edge.targetHandle) return;
    join(pinKey(edge.source, edge.sourceHandle), pinKey(edge.target, edge.targetHandle));
  });

  const voltages = new Map<string, number>();
  const groundedRoots = new Set<string>();
  const getVoltage = (nodeId: string, pinId: string) =>
    voltages.get(findRoot(pinKey(nodeId, pinId))) ?? 0;
  const setVoltage = (nodeId: string, pinId: string, voltage: number) => {
    const root = findRoot(pinKey(nodeId, pinId));
    const previous = voltages.get(root) ?? 0;
    if (voltage > previous) voltages.set(root, voltage);
  };

  hardwareNodes.forEach((node) => {
    if (node.data.componentId !== "lipo-37" || controls.batteries[node.id] === false) return;
    setVoltage(node.id, "BAT+", clamp(controls.batteryVoltages[node.id] ?? 3.7, 2.5, 4.2));
    groundedRoots.add(findRoot(pinKey(node.id, "BAT-")));
  });

  for (let iteration = 0; iteration < 8; iteration += 1) {
    hardwareNodes.forEach((node) => {
      const definition = getComponentDefinition(node.data.componentId ?? "");
      if (!definition) return;

      if (definition.id === "tp4056") {
        const batteryVoltage = getVoltage(node.id, "B+");
        const usbVoltage = getVoltage(node.id, "IN+");
        if (batteryVoltage > 0) setVoltage(node.id, "OUT+", batteryVoltage);
        if (usbVoltage >= 4.5) setVoltage(node.id, "OUT+", 4.2);
      }
      if (definition.id === "step-up" && getVoltage(node.id, "VIN+") >= 2) {
        const inputVoltage = getVoltage(node.id, "VIN+");
        const selectedOutput = clamp(controls.converterOutputs[node.id] ?? 5, 3.3, 28);
        setVoltage(node.id, "VOUT+", Math.max(inputVoltage, selectedOutput));
      }
      if (definition.id === "step-down" && getVoltage(node.id, "VIN+") >= 1.5) {
        const inputVoltage = getVoltage(node.id, "VIN+");
        const selectedOutput = clamp(controls.converterOutputs[node.id] ?? 3.3, 1.2, 24);
        setVoltage(node.id, "VOUT+", Math.min(selectedOutput, Math.max(0, inputVoltage - 0.3)));
      }
      if (definition.category === "mcu") {
        const inputVoltage = Math.max(
          getVoltage(node.id, "VIN"),
          getVoltage(node.id, "5V"),
          getVoltage(node.id, "5V-L"),
          getVoltage(node.id, "5V-R"),
        );
        if (inputVoltage >= 4.5) {
          definition.pins
            .filter((pin) => pin.role === "power" && pin.direction === "output" && pin.voltage)
            .forEach((pin) => setVoltage(node.id, pin.id, pin.voltage ?? 0));
        }
      }
    });
  }

  const statusByNode: Record<string, SimulatedNodeStatus> = {};
  let poweredCount = 0;

  hardwareNodes.forEach((node) => {
    const definition = getComponentDefinition(node.data.componentId ?? "");
    if (!definition) return;
    const pinVoltages = Object.fromEntries(
      definition.pins.map((pin) => [pin.id, getVoltage(node.id, pin.id)]),
    );
    const voltage = Math.max(0, ...Object.values(pinVoltages));
    const inputVoltage = Math.max(0, ...definition.pins
      .filter((pin) => pin.role === "power" && (pin.direction === "input" || pin.id === "B+"))
      .map((pin) => pinVoltages[pin.id] ?? 0));
    const outputVoltage = Math.max(0, ...definition.pins
      .filter((pin) => pin.role === "power" && pin.direction === "output")
      .map((pin) => pinVoltages[pin.id] ?? 0));
    const groundPins = definition.pins.filter((pin) => pin.role === "ground");
    const hasGround = groundPins.length === 0 || groundPins.some((pin) =>
      groundedRoots.has(findRoot(pinKey(node.id, pin.id))),
    );
    let powered = voltage > 0 && hasGround;

    if (definition.id === "lipo-37") powered = controls.batteries[node.id] !== false;
    if (definition.category === "mcu") {
      powered = Math.max(
        getVoltage(node.id, "VIN"),
        getVoltage(node.id, "5V"),
        getVoltage(node.id, "5V-L"),
        getVoltage(node.id, "5V-R"),
      ) >= 4.5 && hasGround;
    }
    if (definition.category === "radio") powered = getVoltage(node.id, "VCC") >= 2.7 && hasGround;
    if (definition.category === "display") powered = getVoltage(node.id, "VCC") >= 2.7 && hasGround;
    if (["microsd-spi-adapter", "neo6m-gps", "ky040-encoder"].includes(definition.id)) {
      powered = getVoltage(node.id, "VCC") >= 2.7 && hasGround;
    }
    if (definition.id === "m5stack-ir-unit") powered = getVoltage(node.id, "5V") >= 4.5 && hasGround;
    if (definition.id === "step-up") powered = getVoltage(node.id, "VIN+") >= 2 && hasGround;
    if (definition.id === "step-down") powered = getVoltage(node.id, "VIN+") >= 1.5 && hasGround;
    if (definition.id === "tp4056") {
      powered = Math.max(getVoltage(node.id, "B+"), getVoltage(node.id, "IN+")) > 0 && hasGround;
    }

    statusByNode[node.id] = { inputVoltage, outputVoltage, pinVoltages, powered, voltage };
    if (powered) poweredCount += 1;
  });

  const edgeStatusById: Record<string, SimulatedEdgeStatus> = {};
  edges.forEach((edge) => {
    if (!edge.sourceHandle || !edge.targetHandle) {
      edgeStatusById[edge.id] = { energized: false, groundReturn: false, voltage: 0 };
      return;
    }
    const sourceDefinition = getComponentDefinition(
      hardwareNodes.find((node) => node.id === edge.source)?.data.componentId ?? "",
    );
    const targetDefinition = getComponentDefinition(
      hardwareNodes.find((node) => node.id === edge.target)?.data.componentId ?? "",
    );
    const sourcePin = sourceDefinition?.pins.find((pin) => pin.id === edge.sourceHandle);
    const targetPin = targetDefinition?.pins.find((pin) => pin.id === edge.targetHandle);
    const sourceVoltage = getVoltage(edge.source, edge.sourceHandle);
    const targetVoltage = getVoltage(edge.target, edge.targetHandle);
    const voltage = Math.max(sourceVoltage, targetVoltage);
    const groundReturn = sourcePin?.role === "ground" && targetPin?.role === "ground";
    const endpointPowered = Boolean(
      statusByNode[edge.source]?.powered || statusByNode[edge.target]?.powered,
    );
    const grounded = groundedRoots.has(findRoot(pinKey(edge.source, edge.sourceHandle)));
    edgeStatusById[edge.id] = {
      energized: voltage > 0.05 || (groundReturn && grounded && endpointPowered),
      groundReturn,
      voltage,
    };
  });

  return { edgeStatusById, poweredCount, statusByNode };
}
