import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import {
  Background,
  ConnectionMode,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  reconnectEdge,
  type Connection,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeProps,
  type NodeTypes,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useUpdateNodeInternals,
} from "@xyflow/react";
import {
  Cable,
  CheckCircle2,
  ChevronDown,
  CircuitBoard,
  Code2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileUp,
  FlipHorizontal2,
  History as HistoryIcon,
  Info,
  Link2,
  Lock,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Plus,
  Power,
  RotateCw,
  Save,
  Search,
  Trash2,
  TriangleAlert,
  Undo2,
  Unlink2,
  Unlock,
  X,
  Zap,
} from "lucide-react";
import "@xyflow/react/dist/style.css";
import "./hardware-lab.css";
import ComponentArtwork from "./ComponentArtwork";
import EditableWireEdge, { type WireEdge } from "./EditableWireEdge";
import {
  simulateHardwareCircuit,
  type SimulationControls,
  type SimulationResult,
} from "./simulation";
import rfKillDevkitTemplate from "./templates/rf-kill-esp32-devkit.json";
import {
  BOARD_COLORS,
  BOARD_PRESETS,
  HARDWARE_COMPONENTS,
  getComponentDefinition,
  type BoardPreset,
  type HardwareComponentDefinition,
  type HardwarePin,
} from "./catalog";

const STORAGE_KEY = "esp32-tools-hardware-lab-v5";
const CATALOG_PREFERENCE_KEY = "esp32-tools-hardware-lab-catalog-v1";
const INSPECTOR_PREFERENCE_KEY = "esp32-tools-hardware-lab-inspector-v1";
const HISTORY_STATE_LIMIT = 6;
const SCALE = 6;
const PITCH_MM = 2.54;
const HOLE_PITCH = PITCH_MM * SCALE;
const BOARD_GRID_X = HOLE_PITCH * 12;
const BOARD_GRID_Y = HOLE_PITCH * 7;

type BoardView = "bottom" | "top";
type Rotation = 0 | 90 | 180 | 270;
type WorkspaceTab = "code" | "mount";
type CanvasInteractionMode = "components" | "wiring";
type SimulationBooleanControl = "batteries" | "buttons" | "switches";
type SimulationVoltageControl = "batteryVoltages" | "converterOutputs";

type HardwareNodeData = {
  [key: string]: unknown;
  componentId: string;
  face: BoardView;
  instanceName: string;
  locked: boolean;
  mountedToBoard: boolean;
  boardView: BoardView;
  connectedPinIds?: string[];
  diagnosticStatus?: "error" | "ok" | "warning";
  powered?: boolean;
  rotation: Rotation;
  simulatedVoltage?: number;
  simulationActive?: boolean;
};

type PerfboardNodeData = {
  [key: string]: unknown;
  boardColorId: string;
  boardColor: string;
  boardLabel: string;
  boardPresetId: string;
  heightMm: number;
  holeColumns: number;
  holeInsetXmm: number;
  holeInsetYmm: number;
  holeRows: number;
  view: BoardView;
  widthMm: number;
};

type HardwareNode = Node<HardwareNodeData, "hardware">;
type PerfboardNode = Node<PerfboardNodeData, "perfboard">;
type LabNode = HardwareNode | PerfboardNode;

type Diagnostic = {
  id: string;
  message: string;
  nodeIds?: string[];
  severity: "error" | "info" | "warning";
};

type SavedProject = {
  boardColorId: string;
  boardPresetId: string;
  boardView: BoardView;
  code: string;
  edges: WireEdge[];
  name: string;
  nodes: LabNode[];
  version: 6;
};

type PersistedProject = Omit<SavedProject, "version"> & { version: number };

type HistoryProject = Omit<SavedProject, "version">;

type HistoryEntry = {
  id: number;
  label: string;
  project: HistoryProject;
  time: string;
};

const FIRMWARE_TEMPLATES = [
  {
    id: "rf-kill-devkit",
    name: "RF-KILL ESP32 DevKit",
    project: rfKillDevkitTemplate as unknown as PersistedProject,
  },
] as const;

const nodeTypes: NodeTypes = {
  hardware: HardwareNodeView,
  perfboard: PerfboardNodeView,
};

const edgeTypes: EdgeTypes = {
  "editable-wire": EditableWireEdge,
};

function createHistoryProject(project: HistoryProject): HistoryProject {
  const nodes = project.nodes.map((node) => {
    const { dragging: _dragging, measured: _measured, selected: _selected, ...stableNode } = node;
    return { ...stableNode, dragging: false, selected: false } as LabNode;
  });
  const edges = project.edges.map((edge) => {
    const { selected: _selected, ...stableEdge } = edge;
    return { ...stableEdge, selected: false } as WireEdge;
  });

  return structuredClone({ ...project, edges, nodes });
}

function describeHistoryChange(previous: HistoryProject, current: HistoryProject) {
  const previousNodes = new Map(previous.nodes.map((node) => [node.id, node]));
  const currentNodes = new Map(current.nodes.map((node) => [node.id, node]));
  const addedNode = current.nodes.find((node) => !previousNodes.has(node.id));
  const removedNode = previous.nodes.find((node) => !currentNodes.has(node.id));

  if (addedNode) {
    return addedNode.type === "perfboard"
      ? "Placa añadida"
      : `${addedNode.data.instanceName} añadido`;
  }
  if (removedNode) {
    return removedNode.type === "perfboard"
      ? "Placa eliminada"
      : `${removedNode.data.instanceName} eliminado`;
  }
  if (current.edges.length > previous.edges.length) return "Cable conectado";
  if (current.edges.length < previous.edges.length) return "Cable eliminado";
  if (current.code !== previous.code) return "Código modificado";
  if (current.name !== previous.name) return "Proyecto renombrado";

  for (const node of current.nodes) {
    const oldNode = previousNodes.get(node.id);
    if (!oldNode || oldNode.type !== node.type) continue;
    if (oldNode.position.x !== node.position.x || oldNode.position.y !== node.position.y) {
      return node.type === "perfboard" ? "Placa movida" : `${node.data.instanceName} movido`;
    }
    if (node.type === "hardware" && oldNode.type === "hardware") {
      if (oldNode.data.rotation !== node.data.rotation) return `${node.data.instanceName} rotado`;
      if (oldNode.data.face !== node.data.face) return `${node.data.instanceName} volteado`;
      if (oldNode.data.mountedToBoard !== node.data.mountedToBoard || oldNode.parentId !== node.parentId) {
        return node.data.mountedToBoard ? `${node.data.instanceName} montado` : `${node.data.instanceName} desmontado`;
      }
      if (oldNode.data.locked !== node.data.locked) {
        return node.data.locked ? "Posición bloqueada" : "Posición desbloqueada";
      }
      if (oldNode.data.instanceName !== node.data.instanceName) return "Componente renombrado";
    }
    if (node.type === "perfboard" && oldNode.type === "perfboard" && JSON.stringify(oldNode.data) !== JSON.stringify(node.data)) {
      return "Placa actualizada";
    }
  }

  const previousEdges = new Map(previous.edges.map((edge) => [edge.id, edge]));
  const cableAdjusted = current.edges.some((edge) => {
    const oldEdge = previousEdges.get(edge.id);
    return oldEdge && JSON.stringify(oldEdge) !== JSON.stringify(edge);
  });
  if (cableAdjusted) return "Cable ajustado";
  if (current.boardView !== previous.boardView) return "Vista de placa cambiada";
  return "Proyecto actualizado";
}

function normalizeProjectNodes(project: PersistedProject): LabNode[] {
  return project.nodes.map((node) => {
    if (node.type === "hardware") {
      const locked = node.data.locked ?? false;
      return {
        ...node,
        draggable: !locked,
        data: {
          ...node.data,
          boardView: node.data.mountedToBoard ? (project.boardView ?? "top") : (node.data.boardView ?? "top"),
          locked,
          mountedToBoard: node.data.mountedToBoard ?? false,
        },
      };
    }

    const matchingPreset = BOARD_PRESETS.find((preset) =>
      preset.widthMm === node.data.widthMm && preset.heightMm === node.data.heightMm,
    );
    const matchingColor = BOARD_COLORS.find((color) => color.value === node.data.boardColor);
    return {
      ...node,
      data: {
        ...node.data,
        boardColorId: node.data.boardColorId ?? matchingColor?.id ?? project.boardColorId,
        boardPresetId: node.data.boardPresetId ?? matchingPreset?.id ?? project.boardPresetId,
      },
    };
  });
}

function normalizeProjectEdges(project: PersistedProject): WireEdge[] {
  return project.edges.map((edge) => ({
    ...edge,
    data: {
      ...edge.data,
      color: edge.data?.color ?? String(edge.style?.stroke ?? "#30d8ff"),
      side: edge.data?.side ?? "top",
    },
  }));
}

type PhysicalPinSide = "bottom" | "left" | "right" | "top";

type PinPlacement = {
  pin: HardwarePin;
  side: PhysicalPinSide;
  xMm: number;
  yMm: number;
};

function getPinPlacements(
  definition: HardwareComponentDefinition,
  rotation: Rotation,
  face: BoardView,
): PinPlacement[] {
  const mirrorSide: Record<PhysicalPinSide, PhysicalPinSide> = {
    bottom: "bottom",
    left: "right",
    right: "left",
    top: "top",
  };
  const rotateSide: Record<PhysicalPinSide, PhysicalPinSide> = {
    bottom: "left",
    left: "top",
    right: "bottom",
    top: "right",
  };
  const rotatePlacement = (pin: HardwarePin) => {
    let side = pin.side;
    let xMm = pin.xMm;
    let yMm = pin.yMm;
    const turns = rotation / 90;
    let widthMm = definition.widthMm;
    let heightMm = definition.heightMm;

    for (let turn = 0; turn < turns; turn += 1) {
      const previousX = xMm;
      xMm = heightMm - yMm;
      yMm = previousX;
      side = rotateSide[side];
      [widthMm, heightMm] = [heightMm, widthMm];
    }

    if (face === "bottom") {
      xMm = widthMm - xMm;
      side = mirrorSide[side];
    }

    return { pin, side, xMm, yMm };
  };

  return definition.pins.map(rotatePlacement);
}

function getNodeSize(definition: HardwareComponentDefinition, rotation: Rotation) {
  const isQuarterTurn = rotation === 90 || rotation === 270;
  return {
    height: (isQuarterTurn ? definition.widthMm : definition.heightMm) * SCALE,
    width: (isQuarterTurn ? definition.heightMm : definition.widthMm) * SCALE,
  };
}

function getBoardGeometry(preset: BoardPreset) {
  const holeColumns = Math.round((preset.widthMm - 4) / PITCH_MM) + 1;
  const holeRows = Math.round((preset.heightMm - 4) / PITCH_MM) + 1;
  const holeInsetXmm = (preset.widthMm - (holeColumns - 1) * PITCH_MM) / 2;
  const holeInsetYmm = (preset.heightMm - (holeRows - 1) * PITCH_MM) / 2;
  return { holeColumns, holeInsetXmm, holeInsetYmm, holeRows };
}

function createBoardNode(
  preset: BoardPreset,
  boardColor: string,
  view: BoardView,
  boardColorId: string = BOARD_COLORS[0].id,
  id = `perfboard-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  position?: { x: number; y: number },
): PerfboardNode {
  const geometry = getBoardGeometry(preset);
  return {
    id,
    type: "perfboard",
    position: position ?? {
      x: BOARD_GRID_X - geometry.holeInsetXmm * SCALE,
      y: BOARD_GRID_Y - geometry.holeInsetYmm * SCALE,
    },
    data: {
      boardColorId,
      boardColor,
      boardLabel: preset.label,
      boardPresetId: preset.id,
      heightMm: preset.heightMm,
      ...geometry,
      view,
      widthMm: preset.widthMm,
    },
    draggable: true,
    selectable: true,
    deletable: true,
    focusable: true,
    zIndex: 0,
    style: {
      height: preset.heightMm * SCALE,
      width: preset.widthMm * SCALE,
    },
  };
}

function createHardwareNode(
  componentId: string,
  instanceName: string,
  x: number,
  y: number,
  rotation: Rotation = 0,
  id = `${componentId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  face: BoardView = "top",
): HardwareNode {
  const definition = getComponentDefinition(componentId);
  const size = definition ? getNodeSize(definition, rotation) : { height: 100, width: 120 };

  return {
    id,
    type: "hardware",
    position: { x, y },
    data: { boardView: "top", componentId, face, instanceName, locked: false, mountedToBoard: false, rotation },
    draggable: true,
    zIndex: 2,
    style: size,
  };
}

function snapNodeToBoardGrid(node: HardwareNode, board: PerfboardNode): HardwareNode {
  const definition = getComponentDefinition(node.data.componentId);
  if (!definition) return node;
  const anchor = getPinPlacements(definition, node.data.rotation, node.data.face)[0];
  if (!anchor) return node;

  const holeOriginX = board.position.x + board.data.holeInsetXmm * SCALE;
  const holeOriginY = board.position.y + board.data.holeInsetYmm * SCALE;
  const pinX = node.position.x + anchor.xMm * SCALE;
  const pinY = node.position.y + anchor.yMm * SCALE;
  const snappedPinX = holeOriginX + Math.round((pinX - holeOriginX) / HOLE_PITCH) * HOLE_PITCH;
  const snappedPinY = holeOriginY + Math.round((pinY - holeOriginY) / HOLE_PITCH) * HOLE_PITCH;

  return {
    ...node,
    position: {
      x: node.position.x + snappedPinX - pinX,
      y: node.position.y + snappedPinY - pinY,
    },
  };
}

function snapMountedNodeToBoardGrid(node: HardwareNode, board: PerfboardNode): HardwareNode {
  const absoluteNode: HardwareNode = {
    ...node,
    parentId: undefined,
    position: {
      x: board.position.x + node.position.x,
      y: board.position.y + node.position.y,
    },
  };
  const snapped = snapNodeToBoardGrid(absoluteNode, board);
  return {
    ...snapped,
    parentId: board.id,
    data: { ...snapped.data, boardView: board.data.view, mountedToBoard: true },
    position: {
      x: snapped.position.x - board.position.x,
      y: snapped.position.y - board.position.y,
    },
  };
}

function arePinsInsideBoard(node: HardwareNode, board: PerfboardNode) {
  const definition = getComponentDefinition(node.data.componentId);
  if (!definition) return false;
  const placements = getPinPlacements(definition, node.data.rotation, "top");
  const minX = board.position.x + board.data.holeInsetXmm * SCALE - 0.5;
  const minY = board.position.y + board.data.holeInsetYmm * SCALE - 0.5;
  const maxX = minX + (board.data.holeColumns - 1) * HOLE_PITCH + 1;
  const maxY = minY + (board.data.holeRows - 1) * HOLE_PITCH + 1;

  return placements.every(({ xMm, yMm }) => {
    const x = node.position.x + xMm * SCALE;
    const y = node.position.y + yMm * SCALE;
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  });
}

function hasMountedComponentCollision(
  candidate: HardwareNode,
  board: PerfboardNode,
  nodes: LabNode[],
) {
  const candidateDefinition = getComponentDefinition(candidate.data.componentId);
  if (!candidateDefinition) return false;
  const candidateSize = getNodeSize(candidateDefinition, candidate.data.rotation);
  const candidatePosition = candidate.parentId === board.id
    ? {
        x: board.position.x + candidate.position.x,
        y: board.position.y + candidate.position.y,
      }
    : candidate.position;
  const gap = 2;

  return nodes.some((node) => {
    if (
      node.type !== "hardware" ||
      node.id === candidate.id ||
      !node.data.mountedToBoard ||
      node.parentId !== board.id
    ) return false;
    const definition = getComponentDefinition(node.data.componentId);
    if (!definition) return false;
    const size = getNodeSize(definition, node.data.rotation);
    const position = {
      x: board.position.x + node.position.x,
      y: board.position.y + node.position.y,
    };

    return !(
      candidatePosition.x + candidateSize.width + gap <= position.x ||
      candidatePosition.x >= position.x + size.width + gap ||
      candidatePosition.y + candidateSize.height + gap <= position.y ||
      candidatePosition.y >= position.y + size.height + gap
    );
  });
}

function canMountNodeOnBoard(node: HardwareNode, board: PerfboardNode, nodes: LabNode[]) {
  const snapped = snapNodeToBoardGrid(node, board);
  return arePinsInsideBoard(snapped, board) && !hasMountedComponentCollision(snapped, board, nodes);
}

function mountNodeOnBoard(node: HardwareNode, board: PerfboardNode) {
  const absoluteNode = node.parentId === board.id
    ? {
        ...node,
        parentId: undefined,
        position: {
          x: board.position.x + node.position.x,
          y: board.position.y + node.position.y,
        },
      }
    : node;
  const snapped = snapNodeToBoardGrid(absoluteNode, board);
  if (!arePinsInsideBoard(snapped, board)) return node;

  return {
    ...snapped,
    parentId: board.id,
    data: { ...snapped.data, boardView: board.data.view, face: "top" as BoardView, mountedToBoard: true },
    position: {
      x: snapped.position.x - board.position.x,
      y: snapped.position.y - board.position.y,
    },
  } satisfies HardwareNode;
}

function unmountNodeFromBoard(node: HardwareNode, board: PerfboardNode) {
  const absolutePosition = node.parentId === board.id
    ? {
        x: board.position.x + node.position.x,
        y: board.position.y + node.position.y,
      }
    : node.position;
  const unmounted: HardwareNode = {
    ...node,
    parentId: undefined,
    data: { ...node.data, face: "top", mountedToBoard: false },
    position: absolutePosition,
  };
  return snapNodeToWorkspaceGrid(unmounted);
}

function snapNodeToWorkspaceGrid(node: HardwareNode): HardwareNode {
  const definition = getComponentDefinition(node.data.componentId);
  if (!definition) return node;
  const anchor = getPinPlacements(definition, node.data.rotation, node.data.face)[0];
  if (!anchor) return node;
  const pinX = node.position.x + anchor.xMm * SCALE;
  const pinY = node.position.y + anchor.yMm * SCALE;
  return {
    ...node,
    position: {
      x: node.position.x + BOARD_GRID_X + Math.round((pinX - BOARD_GRID_X) / HOLE_PITCH) * HOLE_PITCH - pinX,
      y: node.position.y + BOARD_GRID_Y + Math.round((pinY - BOARD_GRID_Y) / HOLE_PITCH) * HOLE_PITCH - pinY,
    },
  };
}

function snapBoardToWorkspaceGrid(board: PerfboardNode): PerfboardNode {
  const holeX = board.position.x + board.data.holeInsetXmm * SCALE;
  const holeY = board.position.y + board.data.holeInsetYmm * SCALE;
  return {
    ...board,
    position: {
      x: board.position.x + BOARD_GRID_X + Math.round((holeX - BOARD_GRID_X) / HOLE_PITCH) * HOLE_PITCH - holeX,
      y: board.position.y + BOARD_GRID_Y + Math.round((holeY - BOARD_GRID_Y) / HOLE_PITCH) * HOLE_PITCH - holeY,
    },
  };
}

function createWire(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
  color: string,
  side: BoardView = "top",
): WireEdge {
  return {
    id,
    source,
    sourceHandle,
    target,
    targetHandle,
    type: "editable-wire",
    data: { color, side },
    reconnectable: true,
    zIndex: 20,
    style: { stroke: color, strokeWidth: 3 },
  };
}

function createRfKillPreset(
  preset: BoardPreset,
  boardColor: string,
  view: BoardView,
) {
  const board = createBoardNode(
    preset,
    boardColor,
    view,
    BOARD_COLORS.find((color) => color.value === boardColor)?.id ?? BOARD_COLORS[0].id,
    "perfboard-template",
  );
  const boardX = board.position.x;
  const boardY = board.position.y;
  const nodes: LabNode[] = [
    board,
    createHardwareNode("esp32-devkit-30", "ESP32 principal", boardX + 54, boardY + 66, 90, "esp32-main"),
    createHardwareNode("nrf24-pa-lna", "Radio A", boardX - 138, boardY + 18, 0, "nrf-a"),
    createHardwareNode("nrf24-pa-lna", "Radio B", boardX + preset.widthMm * SCALE + 32, boardY + 18, 0, "nrf-b"),
    createHardwareNode("tp4056", "Cargador", boardX, boardY + preset.heightMm * SCALE + 42, 90, "charger"),
    createHardwareNode("step-up", "Elevador 5V", boardX + 194, boardY + preset.heightMm * SCALE + 42, 90, "boost"),
    createHardwareNode("slide-switch", "Encendido", boardX + 390, boardY + preset.heightMm * SCALE + 68, 90, "power-switch"),
    createHardwareNode("lipo-37", "Bateria", boardX + preset.widthMm * SCALE + 176, boardY + 94, 90, "battery"),
  ];

  const edges: WireEdge[] = [
    createWire("spi-sck-a", "esp32-main", "GPIO18", "nrf-a", "SCK", "#ffd54a"),
    createWire("spi-sck-b", "esp32-main", "GPIO18", "nrf-b", "SCK", "#ffd54a"),
    createWire("spi-mosi-a", "esp32-main", "GPIO23", "nrf-a", "MOSI", "#30d8ff"),
    createWire("spi-mosi-b", "esp32-main", "GPIO23", "nrf-b", "MOSI", "#30d8ff"),
    createWire("spi-miso-a", "esp32-main", "GPIO19", "nrf-a", "MISO", "#b88cff"),
    createWire("spi-miso-b", "esp32-main", "GPIO19", "nrf-b", "MISO", "#b88cff"),
    createWire("ce-a", "esp32-main", "GPIO4", "nrf-a", "CE", "#ff8fbf"),
    createWire("csn-a", "esp32-main", "GPIO5", "nrf-a", "CSN", "#ff9f43"),
    createWire("ce-b", "esp32-main", "GPIO16", "nrf-b", "CE", "#ff8fbf"),
    createWire("csn-b", "esp32-main", "GPIO17", "nrf-b", "CSN", "#ff9f43"),
    createWire("vcc-a", "esp32-main", "3V3", "nrf-a", "VCC", "#ff4058"),
    createWire("vcc-b", "esp32-main", "3V3", "nrf-b", "VCC", "#ff4058"),
    createWire("gnd-a", "esp32-main", "GND-R", "nrf-a", "GND", "#1d1f24"),
    createWire("gnd-b", "esp32-main", "GND-R", "nrf-b", "GND", "#1d1f24"),
    createWire("battery-pos", "battery", "BAT+", "charger", "B+", "#ff4058"),
    createWire("battery-neg", "battery", "BAT-", "charger", "B-", "#1d1f24"),
    createWire("charger-pos", "charger", "OUT+", "boost", "VIN+", "#ff4058"),
    createWire("charger-neg", "charger", "OUT-", "boost", "VIN-", "#1d1f24"),
    createWire("boost-pos", "boost", "VOUT+", "power-switch", "COM", "#ff4058"),
    createWire("switch-pos", "power-switch", "NO", "esp32-main", "VIN", "#ff4058"),
    createWire("boost-neg", "boost", "VOUT-", "esp32-main", "GND-L", "#1d1f24"),
  ];

  const alignedNodes = nodes.map((node) => {
    if (node.type !== "hardware") return node;
    const snapped = snapNodeToBoardGrid(node, board);
    return arePinsInsideBoard(snapped, board) ? mountNodeOnBoard(snapped, board) : snapped;
  });

  return { edges, nodes: alignedNodes };
}

function HardwareNodeView({ data, selected }: NodeProps<HardwareNode>) {
  const definition = getComponentDefinition(data.componentId);

  if (!definition) return null;

  const visibleFace = data.mountedToBoard ? data.boardView : data.face;
  const pinPlacements = getPinPlacements(definition, data.rotation, visibleFace);
  const width = definition.widthMm * SCALE;
  const height = definition.heightMm * SCALE;
  const transforms: Record<Rotation, string | undefined> = {
    0: undefined,
    90: `translate(${height}px, 0) rotate(90deg)`,
    180: `translate(${width}px, ${height}px) rotate(180deg)`,
    270: `translate(0, ${width}px) rotate(270deg)`,
  };
  const boardStyle = data.rotation === 0
    ? undefined
    : {
        height,
        transform: transforms[data.rotation],
        transformOrigin: "0 0",
        width,
      };
  const showMountedPins = data.mountedToBoard && visibleFace === "bottom";
  const diagnosticLabel = data.diagnosticStatus === "error"
    ? "Componente con errores"
    : data.diagnosticStatus === "warning"
      ? "Componente con advertencias"
      : "Componente correcto";

  return (
    <div
      className={`hardware-node hardware-node--${definition.category} hardware-node--face-${visibleFace}${data.mountedToBoard ? " is-mounted" : ""}${showMountedPins ? " is-mounted-bottom" : ""}${selected ? " is-selected" : ""}${data.diagnosticStatus ? ` has-diagnostic-${data.diagnosticStatus}` : ""}${data.simulationActive ? data.powered ? " is-powered" : " is-unpowered" : ""}`}
      style={{ "--component-accent": definition.accent } as React.CSSProperties}
    >
      {!showMountedPins && <div className="hardware-node__board hardware-node__board--physical" style={boardStyle}>
        <ComponentArtwork definition={definition} face={visibleFace} />
      </div>}
      <PinMarkers connectedPinIds={data.connectedPinIds} placements={pinPlacements} />
      {data.diagnosticStatus && <span
        className={`hardware-node__diagnostic-indicator is-${data.diagnosticStatus}`}
        title={diagnosticLabel}
        aria-label={diagnosticLabel}
      >
        {data.diagnosticStatus === "error" ? <TriangleAlert size={11} aria-hidden="true" />
          : data.diagnosticStatus === "warning" ? <Info size={11} aria-hidden="true" />
            : <CheckCircle2 size={11} aria-hidden="true" />}
      </span>}
      {data.locked && <span className="hardware-node__lock-indicator" title="Posición bloqueada">
        <Lock size={11} aria-hidden="true" />
      </span>}
      {data.simulationActive && <span className="hardware-node__power-indicator">
        <Power size={10} aria-hidden="true" />
        {data.powered ? `${Number(data.simulatedVoltage ?? 0).toFixed(1)} V` : "SIN ENERGÍA"}
      </span>}
      <span className="hardware-node__face-indicator">
        {showMountedPins ? `SOLDADURA · ${definition.pins.length} PINES` : visibleFace === "top" ? "SUPERIOR" : "INFERIOR"}
      </span>
    </div>
  );
}

function PinMarkers({
  connectedPinIds = [],
  placements,
}: {
  connectedPinIds?: string[];
  placements: PinPlacement[];
}) {
  const positions = {
    bottom: Position.Bottom,
    left: Position.Left,
    right: Position.Right,
    top: Position.Top,
  } as const;
  const connectedPins = new Set(connectedPinIds);
  const sideIndexes: Record<PhysicalPinSide, number> = { bottom: 0, left: 0, right: 0, top: 0 };

  return (
    <>
      {placements.map(({ pin, side, xMm, yMm }) => {
        const sideIndex = sideIndexes[side]++;
        const labelLane = side === "top" || side === "bottom" ? sideIndex % 3 : 0;
        const connected = connectedPins.has(pin.id);
        return (
          <div
            className={`hardware-pin hardware-pin--${side} hardware-pin--${pin.role}${connected ? " is-connected" : ""}`}
            key={pin.id}
            style={{
              "--pin-label-lane": labelLane,
              left: xMm * SCALE,
              top: yMm * SCALE,
            } as React.CSSProperties}
          >
            <Handle
              id={pin.id}
              type="source"
              position={positions[side]}
              title={`${pin.label} · ${pin.role}`}
            />
            <span>{pin.label}</span>
          </div>
        );
      })}
    </>
  );
}

function getColumnLabel(index: number) {
  let value = index + 1;
  let label = "";

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label;
}

function getPinRoleLabel(pin: HardwarePin | undefined) {
  if (!pin) return "Terminal";
  if (pin.role === "ground") return "Tierra / GND";
  if (pin.role === "power") return "Alimentación";
  return "Señal";
}

function getPinDirectionLabel(pin: HardwarePin | undefined) {
  if (!pin) return "Dirección no definida";
  if (pin.direction === "input") return "Entrada";
  if (pin.direction === "output") return "Salida";
  if (pin.direction === "bidirectional") return "Bidireccional";
  return "Pasivo";
}

function PerfboardNodeView({ data }: NodeProps<PerfboardNode>) {
  const columns = Array.from({ length: data.holeColumns }, (_, index) => ({
    label: getColumnLabel(data.view === "bottom" ? data.holeColumns - index - 1 : index),
    position: data.holeInsetXmm * SCALE + index * HOLE_PITCH,
  }));
  const rows = Array.from({ length: data.holeRows }, (_, index) => ({
    label: String(index + 1),
    position: data.holeInsetYmm * SCALE + index * HOLE_PITCH,
  }));

  return (
    <div
      className={`perfboard-node perfboard-node--${data.view}`}
      style={{
        "--board-color": data.boardColor,
        "--hole-pattern-x": `${data.holeInsetXmm * SCALE - HOLE_PITCH / 2}px`,
        "--hole-pattern-y": `${data.holeInsetYmm * SCALE - HOLE_PITCH / 2}px`,
      } as React.CSSProperties}
    >
      <span className="perfboard-node__label">
        {data.view === "top" ? "CARA COMPONENTES" : "CARA SOLDADURA"} · {data.boardLabel} · {data.holeColumns} × {data.holeRows}
      </span>
      <div className="perfboard-node__holes" aria-hidden="true" />
      <div className="perfboard-node__coordinates" aria-hidden="true">
        {columns.map((column, index) => (
          <span
            className="perfboard-node__coordinate perfboard-node__coordinate--column"
            key={`column-${index}`}
            style={{ left: column.position }}
          >{column.label}</span>
        ))}
        {rows.map((row, index) => (
          <span
            className="perfboard-node__coordinate perfboard-node__coordinate--row"
            key={`row-${index}`}
            style={{ top: row.position }}
          >{row.label}</span>
        ))}
      </div>
    </div>
  );
}

function getPin(node: LabNode | undefined, handleId: string | null | undefined) {
  if (!node || node.type !== "hardware" || !handleId) return null;
  const definition = getComponentDefinition(node.data.componentId);
  const pin = definition?.pins.find((item) => item.id === handleId);

  return pin ? { definition, node, pin } : null;
}

function getWireColor(
  nodes: LabNode[],
  source: string,
  sourceHandle?: string | null,
  target?: string | null,
  targetHandle?: string | null,
) {
  const sourcePin = getPin(nodes.find((node) => node.id === source), sourceHandle);
  const targetPin = getPin(nodes.find((node) => node.id === target), targetHandle);
  const pins = [sourcePin?.pin, targetPin?.pin].filter(Boolean) as HardwarePin[];

  if (pins.some((pin) => pin.role === "ground")) return "#191b20";
  if (pins.some((pin) => pin.role === "power")) return "#ff4058";

  const colors = ["#30d8ff", "#ffd54a", "#ff8fbf", "#b88cff", "#58e097"];
  return colors[Math.abs(source.length + (sourceHandle?.length ?? 0)) % colors.length];
}

function validateProject(
  nodes: LabNode[],
  edges: Edge[],
  code: string,
  simulationControls?: SimulationControls,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const hardwareNodes = nodes.filter((node): node is HardwareNode => node.type === "hardware");
  const connectedPins = new Map<string, Set<string>>();
  const parents = new Map<string, string>();
  const pinsByKey = new Map<string, NonNullable<ReturnType<typeof getPin>>>();

  const pinKey = (nodeId: string, handleId: string) => `${nodeId}::${handleId}`;
  const findRoot = (key: string): string => {
    const parent = parents.get(key) ?? key;
    if (parent === key) return key;
    const root = findRoot(parent);
    parents.set(key, root);
    return root;
  };
  const joinPins = (first: string, second: string) => {
    if (!parents.has(first)) parents.set(first, first);
    if (!parents.has(second)) parents.set(second, second);
    const firstRoot = findRoot(first);
    const secondRoot = findRoot(second);
    if (firstRoot !== secondRoot) parents.set(secondRoot, firstRoot);
  };

  hardwareNodes.forEach((node) => {
    const definition = getComponentDefinition(node.data.componentId);
    if (!definition) return;
    definition.pins.forEach((pin) => {
      const key = pinKey(node.id, pin.id);
      parents.set(key, key);
      pinsByKey.set(key, { definition, node, pin });
    });
    const groundPins = definition.pins.filter((pin) => pin.role === "ground");
    groundPins.slice(1).forEach((pin) => {
      joinPins(pinKey(node.id, groundPins[0].id), pinKey(node.id, pin.id));
    });
    if (definition.id === "push-button") {
      joinPins(pinKey(node.id, "A1"), pinKey(node.id, "A2"));
      joinPins(pinKey(node.id, "B1"), pinKey(node.id, "B2"));
      if (simulationControls?.buttons[node.id]) {
        joinPins(pinKey(node.id, "A1"), pinKey(node.id, "B1"));
      }
    }
    if (definition.id === "slide-switch" && simulationControls?.switches[node.id]) {
      joinPins(pinKey(node.id, "COM"), pinKey(node.id, "NO"));
    }
  });

  for (const edge of edges) {
    if (edge.sourceHandle) {
      const set = connectedPins.get(edge.source) ?? new Set<string>();
      set.add(edge.sourceHandle);
      connectedPins.set(edge.source, set);
    }
    if (edge.targetHandle) {
      const set = connectedPins.get(edge.target) ?? new Set<string>();
      set.add(edge.targetHandle);
      connectedPins.set(edge.target, set);
    }

    const sourcePin = getPin(nodes.find((node) => node.id === edge.source), edge.sourceHandle);
    const targetPin = getPin(nodes.find((node) => node.id === edge.target), edge.targetHandle);

    if (!sourcePin || !targetPin) continue;

    const sourceKey = pinKey(sourcePin.node.id, sourcePin.pin.id);
    const targetKey = pinKey(targetPin.node.id, targetPin.pin.id);
    pinsByKey.set(sourceKey, sourcePin);
    pinsByKey.set(targetKey, targetPin);
    joinPins(sourceKey, targetKey);
  }

  const electricalNets = new Map<string, Array<NonNullable<ReturnType<typeof getPin>>>>();
  pinsByKey.forEach((pin, key) => {
    const root = findRoot(key);
    const netPins = electricalNets.get(root) ?? [];
    netPins.push(pin);
    electricalNets.set(root, netPins);
  });

  electricalNets.forEach((netPins, root) => {
    const groundPins = netPins.filter(({ pin }) => pin.role === "ground");
    const positivePins = netPins.filter(({ pin }) => pin.role === "power");
    const outputPins = netPins.filter(({ pin }) => pin.direction === "output");
    const powerOutputs = outputPins.filter(({ pin }) => pin.role === "power" && pin.voltage);
    const signalOutputs = outputPins.filter(({ pin }) => pin.role === "signal");
    const labels = netPins.map(({ node, pin }) => `${node.data.instanceName} ${pin.label}`);
    const netNodeIds = [...new Set(netPins.map(({ node }) => node.id))];
    const configuredVoltage = ({ node, pin }: (typeof powerOutputs)[number]) => {
      if (node.data.componentId === "lipo-37" && pin.id === "BAT+") {
        return simulationControls?.batteryVoltages[node.id] ?? 3.7;
      }
      if ((node.data.componentId === "step-up" || node.data.componentId === "step-down") && pin.id === "VOUT+") {
        return simulationControls?.converterOutputs[node.id]
          ?? (node.data.componentId === "step-up" ? 5 : 3.3);
      }
      return pin.voltage ?? 0;
    };

    if (groundPins.length > 0 && positivePins.length > 0) {
      diagnostics.push({
        id: `short-net-${root}`,
        nodeIds: netNodeIds,
        severity: "error",
        message: `Posible corto entre tierra y positivo: ${labels.join(" -> ")}.`,
      });
    }

    const voltageLevels = [...new Set(powerOutputs.map((output) => configuredVoltage(output).toFixed(2)))];
    if (voltageLevels.length > 1) {
      diagnostics.push({
        id: `power-conflict-${root}`,
        nodeIds: netNodeIds,
        severity: "error",
        message: `Fuentes incompatibles unidas en la misma red: ${voltageLevels.join(" V y ")} V.`,
      });
    } else if (powerOutputs.length > 1) {
      diagnostics.push({
        id: `power-outputs-${root}`,
        nodeIds: netNodeIds,
        severity: "warning",
        message: `Hay varias salidas de alimentacion unidas: ${powerOutputs.map(({ node, pin }) => `${node.data.instanceName} ${pin.label}`).join(", ")}.`,
      });
    }

    const sourceVoltage = Math.max(0, ...powerOutputs.map(configuredVoltage));
    if (sourceVoltage > 0) {
      netPins.forEach(({ node, pin }) => {
        if (pin.maxVoltage && sourceVoltage > pin.maxVoltage + 0.05) {
          diagnostics.push({
            id: `voltage-${root}-${node.id}-${pin.id}`,
            nodeIds: [node.id],
            severity: "error",
            message: `${sourceVoltage} V exceden el maximo de ${pin.maxVoltage} V en ${node.data.instanceName} ${pin.label}.`,
          });
        }
      });
    }

    const sharedSpiMiso = signalOutputs.length > 1 && signalOutputs.every(({ pin }) => pin.id === "MISO");
    if (signalOutputs.length > 1 && !sharedSpiMiso) {
      diagnostics.push({
        id: `signal-outputs-${root}`,
        nodeIds: netNodeIds,
        severity: "error",
        message: `Dos salidas de señal estan enfrentadas: ${signalOutputs.map(({ node, pin }) => `${node.data.instanceName} ${pin.label}`).join(", ")}.`,
      });
    }
  });

  for (const node of hardwareNodes) {
    const definition = getComponentDefinition(node.data.componentId);
    if (!definition) continue;
    const nodePins = connectedPins.get(node.id) ?? new Set<string>();
    const missing = definition.requiredPins.filter((pin) => !nodePins.has(pin));

    if (missing.length > 0) {
      diagnostics.push({
        id: `missing-${node.id}`,
        nodeIds: [node.id],
        severity: "warning",
        message: `${node.data.instanceName}: faltan ${missing.join(", ")}.`,
      });
    }
  }

  const boards = nodes.filter((node): node is PerfboardNode => node.type === "perfboard");
  if (boards.length > 0) {
    for (const node of hardwareNodes) {
      const definition = getComponentDefinition(node.data.componentId);
      if (!definition) continue;
      if (node.data.mountedToBoard && node.parentId) continue;
      const size = getNodeSize(definition, node.data.rotation);
      const overlapsBoard = boards.some((board) =>
        node.position.x < board.position.x + board.data.widthMm * SCALE &&
        node.position.x + size.width > board.position.x &&
        node.position.y < board.position.y + board.data.heightMm * SCALE &&
        node.position.y + size.height > board.position.y,
      );

      if (!overlapsBoard && definition.category !== "power") {
        diagnostics.push({
          id: `outside-${node.id}`,
          nodeIds: [node.id],
          severity: "info",
          message: `${node.data.instanceName} esta completamente fuera de las placas.`,
        });
      }
    }
  }

  const definitions = new Map<string, number>();
  for (const match of code.matchAll(/#define\s+([A-Za-z_]\w*)\s+(\d+)/g)) {
    definitions.set(match[1], Number(match[2]));
  }

  const resolvePin = (value: string) => {
    const normalized = value.trim();
    if (/^\d+$/.test(normalized)) return Number(normalized);
    return definitions.get(normalized);
  };

  const radioMatches = [...code.matchAll(/RF24\s+\w+\s*\(\s*([A-Za-z_]\w*|\d+)\s*,\s*([A-Za-z_]\w*|\d+)\s*\)/g)];
  const radioNodes = hardwareNodes.filter((node) => node.data.componentId === "nrf24-pa-lna");

  const hasPinConnection = (radioNode: HardwareNode, gpio: number, radioPin: string) =>
    edges.some((edge) => {
      const sourceIsGpio = edge.sourceHandle === `GPIO${gpio}`;
      const targetIsGpio = edge.targetHandle === `GPIO${gpio}`;
      return (
        (edge.source === radioNode.id && edge.sourceHandle === radioPin && targetIsGpio) ||
        (edge.target === radioNode.id && edge.targetHandle === radioPin && sourceIsGpio)
      );
    });

  for (const [index, match] of radioMatches.entries()) {
    const ce = resolvePin(match[1]);
    const csn = resolvePin(match[2]);
    const radioNode = radioNodes[index];
    if (!radioNode || ce === undefined || csn === undefined) continue;

    if (!hasPinConnection(radioNode, ce, "CE")) {
      diagnostics.push({
        id: `code-ce-${radioNode.id}`,
        nodeIds: [radioNode.id],
        severity: "error",
        message: `${radioNode.data.instanceName}: el codigo usa CE en GPIO${ce}, pero el cable no coincide.`,
      });
    }
    if (!hasPinConnection(radioNode, csn, "CSN")) {
      diagnostics.push({
        id: `code-csn-${radioNode.id}`,
        nodeIds: [radioNode.id],
        severity: "error",
        message: `${radioNode.data.instanceName}: el codigo usa CSN en GPIO${csn}, pero el cable no coincide.`,
      });
    }
  }

  if (radioNodes.length > 0 && radioMatches.length === 0) {
    diagnostics.push({
      id: "code-no-rf24",
      nodeIds: radioNodes.map((node) => node.id),
      severity: "info",
      message: "Hay radios nRF24 en el montaje, pero no se encontro un constructor RF24 en el codigo.",
    });
  }

  const spiMatch = code.match(/SPI\s*\.\s*begin\s*\(\s*([A-Za-z_]\w*|\d+)\s*,\s*([A-Za-z_]\w*|\d+)\s*,\s*([A-Za-z_]\w*|\d+)/);
  if (radioNodes.length > 0 && spiMatch) {
    const spiPins = [resolvePin(spiMatch[1]), resolvePin(spiMatch[2]), resolvePin(spiMatch[3])];
    const spiNames = ["SCK", "MISO", "MOSI"];

    radioNodes.forEach((radioNode) => {
      spiPins.forEach((gpio, index) => {
        if (gpio === undefined) return;
        const radioPin = spiNames[index];
        if (!hasPinConnection(radioNode, gpio, radioPin)) {
          diagnostics.push({
            id: `code-spi-${radioNode.id}-${radioPin}`,
            nodeIds: [radioNode.id],
            severity: "error",
            message: `${radioNode.data.instanceName}: SPI.begin usa ${radioPin} en GPIO${gpio}, pero el cable no coincide.`,
          });
        }
      });
    });
  } else if (radioNodes.length > 0 && !/SPI\s*\.\s*begin\s*\(/.test(code)) {
    diagnostics.push({
      id: "code-no-spi",
      nodeIds: radioNodes.map((node) => node.id),
      severity: "warning",
      message: "Hay radios nRF24, pero no se encontro SPI.begin() en el codigo.",
    });
  }

  if (hardwareNodes.length === 0) {
    diagnostics.push({
      id: "empty-project",
      severity: "info",
      message: "Agrega componentes o selecciona una plantilla de firmware para comenzar.",
    });
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      id: "all-good",
      severity: "info",
      message: "No se detectaron problemas en las conexiones basicas.",
    });
  }

  return diagnostics;
}

function HardwareLabWorkspace() {
  const defaultBoard = BOARD_PRESETS[3];
  const defaultBoardColor = BOARD_COLORS[0];
  const [nodes, setNodes, onNodesChange] = useNodesState<LabNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WireEdge>([]);
  const [boardPresetId, setBoardPresetId] = useState(defaultBoard.id);
  const [boardColorId, setBoardColorId] = useState<string>(defaultBoardColor.id);
  const [boardView, setBoardView] = useState<BoardView>("top");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("mount");
  const [canvasInteractionMode, setCanvasInteractionMode] = useState<CanvasInteractionMode>("components");
  const [wiresVisible, setWiresVisible] = useState(true);
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [catalogPinned, setCatalogPinned] = useState(true);
  const [catalogPreferencesReady, setCatalogPreferencesReady] = useState(false);
  const [projectName, setProjectName] = useState("Proyecto nuevo");
  const [code, setCode] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [saveState, setSaveState] = useState("Guardado local");
  const [isLight, setIsLight] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<number | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationControls, setSimulationControls] = useState<SimulationControls>({
    batteries: {},
    batteryVoltages: {},
    buttons: {},
    converterOutputs: {},
    switches: {},
  });
  const importInput = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartNodeRef = useRef<LabNode | null>(null);
  const historyFingerprintRef = useRef("");
  const historyProjectRef = useRef<HistoryProject | null>(null);
  const historyIdRef = useRef(0);
  const { fitView, screenToFlowPosition } = useReactFlow<LabNode, Edge>();
  const updateNodeInternals = useUpdateNodeInternals();

  const currentBoard =
    BOARD_PRESETS.find((board) => board.id === boardPresetId) ?? defaultBoard;
  const currentBoardColor =
    BOARD_COLORS.find((color) => color.id === boardColorId) ?? defaultBoardColor;
  const currentBoardGeometry = getBoardGeometry(currentBoard);
  const selectedLabNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedNode = nodes.find(
    (node): node is HardwareNode => node.id === selectedNodeId && node.type === "hardware",
  );
  const selectedBoard = nodes.find(
    (node): node is PerfboardNode => node.id === selectedNodeId && node.type === "perfboard",
  );
  const selectedWire = edges.find((edge) => edge.selected);
  const selectedWireSourceNode = selectedWire
    ? nodes.find((node) => node.id === selectedWire.source)
    : undefined;
  const selectedWireTargetNode = selectedWire
    ? nodes.find((node) => node.id === selectedWire.target)
    : undefined;
  const selectedWireSourceDefinition = selectedWireSourceNode?.type === "hardware"
    ? getComponentDefinition(selectedWireSourceNode.data.componentId)
    : undefined;
  const selectedWireTargetDefinition = selectedWireTargetNode?.type === "hardware"
    ? getComponentDefinition(selectedWireTargetNode.data.componentId)
    : undefined;
  const selectedWireSourcePin = selectedWireSourceDefinition?.pins.find(
    (pin) => pin.id === selectedWire?.sourceHandle,
  );
  const selectedWireTargetPin = selectedWireTargetDefinition?.pins.find(
    (pin) => pin.id === selectedWire?.targetHandle,
  );
  const boardNodes = nodes.filter((node): node is PerfboardNode => node.type === "perfboard");
  const selectedParentBoard = selectedNode?.parentId
    ? boardNodes.find((board) => board.id === selectedNode.parentId)
    : undefined;
  const boardNode = selectedBoard ?? selectedParentBoard ?? boardNodes[0];
  const activeBoardView = boardNode?.data.view ?? boardView;
  const mountedCount = nodes.filter(
    (node) => node.type === "hardware" && node.data.mountedToBoard,
  ).length;
  const activeBoardMountedCount = boardNode
    ? nodes.filter((node) => node.type === "hardware" && node.data.mountedToBoard && node.parentId === boardNode.id).length
    : 0;
  const selectedDefinition = selectedNode
    ? getComponentDefinition(selectedNode.data.componentId)
    : null;
  const pinCompatibleBoard = selectedNode && !selectedNode.data.mountedToBoard
    ? boardNodes.find((board) =>
        board.data.view === "top" && arePinsInsideBoard(snapNodeToBoardGrid(selectedNode, board), board),
      )
    : undefined;
  const mountBlockedByCollision = Boolean(
    selectedNode &&
    pinCompatibleBoard &&
    hasMountedComponentCollision(snapNodeToBoardGrid(selectedNode, pinCompatibleBoard), pinCompatibleBoard, nodes),
  );
  const mountTargetBoard = selectedNode && pinCompatibleBoard && !mountBlockedByCollision
    ? pinCompatibleBoard
    : undefined;
  const canMountSelected = Boolean(selectedNode && mountTargetBoard);
  const diagnostics = useMemo(
    () => validateProject(nodes, edges, code, simulationControls),
    [code, edges, nodes, simulationControls],
  );
  const componentCount = nodes.filter((node) => node.type === "hardware").length;
  const simulationResult = useMemo<SimulationResult>(
    () => simulationRunning
      ? simulateHardwareCircuit(nodes, edges, simulationControls)
      : { edgeStatusById: {}, poweredCount: 0, statusByNode: {} },
    [edges, nodes, simulationControls, simulationRunning],
  );
  const selectedWireSimulation = selectedWire
    ? simulationResult.edgeStatusById[selectedWire.id]
    : undefined;
  const selectedWireDiagnostics = selectedWire
    ? diagnostics.filter((diagnostic) =>
        diagnostic.nodeIds?.includes(selectedWire.source) &&
        diagnostic.nodeIds.includes(selectedWire.target),
      )
    : [];
  const renderedEdges = useMemo(
    () => edges.map((edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      const targetNode = nodes.find((node) => node.id === edge.target);
      const edgeBoardId = edge.data?.boardId ?? sourceNode?.parentId ?? targetNode?.parentId;
      const edgeBoard = boardNodes.find((board) => board.id === edgeBoardId);
      const hiddenByBoardView = Boolean(edgeBoard && (edge.data?.side ?? "top") !== edgeBoard.data.view);
      return {
        ...edge,
        data: {
          ...edge.data,
          energized: simulationResult.edgeStatusById[edge.id]?.energized ?? false,
          groundReturn: simulationResult.edgeStatusById[edge.id]?.groundReturn ?? false,
          simulatedVoltage: simulationResult.edgeStatusById[edge.id]?.voltage ?? 0,
          simulationActive: simulationRunning,
          hiddenByBoardView,
        },
        hidden: !wiresVisible || hiddenByBoardView,
      };
    }),
    [boardNodes, edges, nodes, simulationResult, simulationRunning, wiresVisible],
  );
  const renderedNodes = useMemo(() => {
    const connectedPins = new Map<string, Set<string>>();
    const diagnosticByNode = new Map<string, "error" | "warning">();
    diagnostics.forEach((diagnostic) => {
      const severity = diagnostic.severity;
      if (severity === "info") return;
      diagnostic.nodeIds?.forEach((nodeId) => {
        const current = diagnosticByNode.get(nodeId);
        if (current !== "error" || severity === "error") {
          diagnosticByNode.set(nodeId, severity);
        }
      });
    });
    renderedEdges.forEach((edge) => {
      if (edge.data?.hiddenByBoardView) return;
      if (edge.sourceHandle) {
        const pins = connectedPins.get(edge.source) ?? new Set<string>();
        pins.add(edge.sourceHandle);
        connectedPins.set(edge.source, pins);
      }
      if (edge.targetHandle) {
        const pins = connectedPins.get(edge.target) ?? new Set<string>();
        pins.add(edge.targetHandle);
        connectedPins.set(edge.target, pins);
      }
    });
    return nodes.map<LabNode>((node) => node.type === "hardware"
      ? {
          ...node,
          draggable: canvasInteractionMode === "components" && !node.data.locked,
          focusable: canvasInteractionMode === "components",
          selectable: canvasInteractionMode === "components",
          selected: canvasInteractionMode === "wiring" ? false : node.selected,
          data: {
            ...node.data,
            connectedPinIds: [...(connectedPins.get(node.id) ?? [])],
            diagnosticStatus: diagnosticByNode.get(node.id) ?? "ok",
            powered: simulationResult.statusByNode[node.id]?.powered ?? false,
            simulatedVoltage: simulationResult.statusByNode[node.id]?.voltage ?? 0,
            simulationActive: simulationRunning,
          },
        }
      : {
          ...node,
          draggable: canvasInteractionMode === "components",
          focusable: canvasInteractionMode === "components",
          selectable: canvasInteractionMode === "components",
          selected: canvasInteractionMode === "wiring" ? false : node.selected,
        });
  }, [canvasInteractionMode, diagnostics, nodes, renderedEdges, simulationResult, simulationRunning]);
  const visibleEdgeCount = renderedEdges.filter((edge) => !edge.hidden).length;
  const errorCount = diagnostics.filter((item) => item.severity === "error").length;
  const warningCount = diagnostics.filter((item) => item.severity === "warning").length;
  const filteredComponents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return HARDWARE_COMPONENTS;
    return HARDWARE_COMPONENTS.filter((component) =>
      `${component.name} ${component.category} ${component.description}`.toLowerCase().includes(query),
    );
  }, [search]);

  const handleCanvasPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const canvas = event.currentTarget;
    const pointerX = event.clientX;
    const pointerY = event.clientY;
    const pinHoverRadius = 14;
    const isOverPin = [...canvas.querySelectorAll<HTMLElement>(".hardware-pin .react-flow__handle")]
      .some((handle) => {
        const rect = handle.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return Math.hypot(pointerX - centerX, pointerY - centerY) <= pinHoverRadius;
      });

    canvas.classList.toggle("is-pin-pointer-zone", isOverPin);
  }, []);

  const clearCanvasPointerZone = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove("is-pin-pointer-zone");
  }, []);

  const selectCanvasInteractionMode = (mode: CanvasInteractionMode) => {
    setCanvasInteractionMode(mode);
    if (mode === "wiring") {
      setWiresVisible(true);
      setSelectedNodeId(null);
      setNodes((currentNodes) => currentNodes.map((node) => ({ ...node, selected: false })));
    }
  };

  const toggleWireVisibility = () => {
    const nextVisible = !wiresVisible;
    setWiresVisible(nextVisible);
    if (!nextVisible) {
      setCanvasInteractionMode("components");
      setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, selected: false })));
    }
  };

  const refreshCanvasAfterCatalogChange = () => {
    window.setTimeout(() => fitView({ padding: 0.16, duration: 220 }), 80);
  };

  const toggleCatalogPinned = () => {
    setCatalogPinned((currentPinned) => !currentPinned);
    refreshCanvasAfterCatalogChange();
  };

  const closeCatalog = () => {
    setCatalogOpen(false);
    refreshCanvasAfterCatalogChange();
  };

  const openCatalog = () => {
    setCatalogOpen(true);
    refreshCanvasAfterCatalogChange();
  };

  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem(CATALOG_PREFERENCE_KEY);
      if (savedPreference) {
        const preference = JSON.parse(savedPreference) as { open?: boolean; pinned?: boolean };
        setCatalogOpen(preference.open ?? true);
        setCatalogPinned(preference.pinned ?? true);
      }
    } catch {
      // Keep the default docked catalog if the browser preference is invalid.
    } finally {
      setCatalogPreferencesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!catalogPreferencesReady) return;
    localStorage.setItem(CATALOG_PREFERENCE_KEY, JSON.stringify({
      open: catalogOpen,
      pinned: catalogPinned,
    }));
  }, [catalogOpen, catalogPinned, catalogPreferencesReady]);

  useEffect(() => {
    if (!catalogOpen || catalogPinned) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCatalog();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [catalogOpen, catalogPinned]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const project = JSON.parse(saved) as PersistedProject;
        const savedBoard = project.nodes?.find((node) => node.type === "perfboard") as PerfboardNode | undefined;
        const hasPhysicalGrid = !savedBoard || (
          Number.isFinite(savedBoard?.data.holeColumns) &&
          Number.isFinite(savedBoard?.data.holeInsetXmm) &&
          Number.isFinite(savedBoard?.data.holeInsetYmm) &&
          Number.isFinite(savedBoard?.data.holeRows)
        );
        if ((project.version === 5 || project.version === 6) && Array.isArray(project.nodes) && Array.isArray(project.edges) && hasPhysicalGrid) {
          setNodes(normalizeProjectNodes(project));
          setEdges(normalizeProjectEdges(project));
          setBoardPresetId(project.boardPresetId);
          setBoardColorId(project.boardColorId);
          setBoardView(project.boardView);
          setProjectName(project.name);
          setCode(project.code);
        }
      }
    } catch {
      setSaveState("No se pudo leer el guardado");
    } finally {
      setHasLoaded(true);
      window.setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 80);
    }
  }, [fitView, setEdges, setNodes]);

  useEffect(() => {
    if (!hasLoaded) return;
    const project = createHistoryProject({
      boardColorId,
      boardPresetId,
      boardView,
      code,
      edges,
      name: projectName,
      nodes,
    });
    const fingerprint = JSON.stringify(project);

    if (!historyProjectRef.current) {
      const initialId = historyIdRef.current++;
      historyProjectRef.current = project;
      historyFingerprintRef.current = fingerprint;
      setHistoryEntries([{
        id: initialId,
        label: "Estado inicial",
        project,
        time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      }]);
      setCurrentHistoryId(initialId);
      return;
    }
    if (historyFingerprintRef.current === fingerprint) return;

    const timer = window.setTimeout(() => {
      const previous = historyProjectRef.current;
      if (!previous || historyFingerprintRef.current === fingerprint) return;
      const entry: HistoryEntry = {
        id: historyIdRef.current++,
        label: describeHistoryChange(previous, project),
        project,
        time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      };
      historyProjectRef.current = project;
      historyFingerprintRef.current = fingerprint;
      setHistoryEntries((currentEntries) => [...currentEntries, entry].slice(-HISTORY_STATE_LIMIT));
      setCurrentHistoryId(entry.id);
    }, 360);

    return () => window.clearTimeout(timer);
  }, [boardColorId, boardPresetId, boardView, code, edges, hasLoaded, nodes, projectName]);

  useEffect(() => {
    const updateTheme = () => setIsLight(document.documentElement.dataset.theme === "light");
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const saveProject = useCallback(() => {
    if (!hasLoaded) return;
    const project: SavedProject = {
      version: 6,
      name: projectName,
      boardPresetId,
      boardColorId,
      boardView,
      code,
      nodes,
      edges,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setSaveState(`Guardado ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`);
    } catch {
      setSaveState("No se pudo guardar");
    }
  }, [boardColorId, boardPresetId, boardView, code, edges, hasLoaded, nodes, projectName]);

  const restoreHistoryEntry = useCallback((entry: HistoryEntry) => {
    const project = createHistoryProject(entry.project);
    historyProjectRef.current = project;
    historyFingerprintRef.current = JSON.stringify(project);
    setCurrentHistoryId(entry.id);
    setNodes(project.nodes);
    setEdges(project.edges);
    setBoardPresetId(project.boardPresetId);
    setBoardColorId(project.boardColorId);
    setBoardView(project.boardView);
    setCode(project.code);
    setProjectName(project.name);
    setSelectedNodeId(null);
    setSaveState(`Restaurado: ${entry.label}`);
    window.setTimeout(() => fitView({ padding: 0.14, duration: 280 }), 60);
  }, [fitView, setEdges, setNodes]);

  useEffect(() => {
    if (!hasLoaded) return;
    setSaveState("Cambios sin guardar");
    const timer = window.setTimeout(saveProject, 900);
    return () => window.clearTimeout(timer);
  }, [hasLoaded, saveProject]);

  const updateBoard = useCallback(
    (nextPresetId = boardPresetId, nextColorId = boardColorId, nextView = boardView) => {
      const preset = BOARD_PRESETS.find((item) => item.id === nextPresetId) ?? defaultBoard;
      const color = BOARD_COLORS.find((item) => item.id === nextColorId) ?? defaultBoardColor;
      const geometry = getBoardGeometry(preset);
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.type === "perfboard" && node.id === boardNode?.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  boardColorId: color.id,
                  boardColor: color.value,
                  boardLabel: preset.label,
                  boardPresetId: preset.id,
                  heightMm: preset.heightMm,
                  ...geometry,
                  view: nextView,
                  widthMm: preset.widthMm,
                },
                position: {
                  x: node.position.x + node.data.holeInsetXmm * SCALE - geometry.holeInsetXmm * SCALE,
                  y: node.position.y + node.data.holeInsetYmm * SCALE - geometry.holeInsetYmm * SCALE,
                },
                style: { height: preset.heightMm * SCALE, width: preset.widthMm * SCALE },
              }
            : node,
        ),
      );
      window.setTimeout(() => fitView({ padding: 0.16, duration: 280 }), 40);
    },
    [boardColorId, boardNode?.id, boardPresetId, boardView, defaultBoard, defaultBoardColor, fitView, setNodes],
  );

  const handleBoardPreset = (value: string) => {
    setBoardPresetId(value);
    updateBoard(value, boardColorId, activeBoardView);
  };

  const handleBoardColor = (value: string) => {
    setBoardColorId(value);
    updateBoard(boardPresetId, value, activeBoardView);
  };

  const handleBoardView = (value: BoardView) => {
    if (value === activeBoardView) return;
    setBoardView(value);
    const mountedIds: string[] = [];
    setNodes((currentNodes) => {
      const board = currentNodes.find((node): node is PerfboardNode =>
        node.type === "perfboard" && node.id === boardNode?.id,
      );
      if (!board) return currentNodes;
      const boardWidth = board.data.widthMm * SCALE;

      return currentNodes.map((node) => {
        if (node.type === "perfboard") {
          return node.id === board.id
            ? { ...node, data: { ...node.data, view: value } }
            : node;
        }
        const belongsToBoard = node.parentId === board.id || (!node.parentId && boardNodes.length === 1);
        if (!node.data.mountedToBoard || !belongsToBoard) return node;
        const definition = getComponentDefinition(node.data.componentId);
        if (!definition) return node;
        mountedIds.push(node.id);
        const size = getNodeSize(definition, node.data.rotation);
        const relativeX = node.parentId === board.id
          ? node.position.x
          : node.position.x - board.position.x;
        const relativeY = node.parentId === board.id
          ? node.position.y
          : node.position.y - board.position.y;
        return {
          ...node,
          parentId: board.id,
          data: { ...node.data, boardView: value },
          position: {
            x: boardWidth - relativeX - size.width,
            y: relativeY,
          },
        };
      });
    });
    window.setTimeout(() => mountedIds.forEach((id) => updateNodeInternals(id)), 30);
  };

  const addBoard = () => {
    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    const center = canvasBounds
      ? screenToFlowPosition({
          x: canvasBounds.left + canvasBounds.width / 2,
          y: canvasBounds.top + canvasBounds.height / 2,
        })
      : { x: BOARD_GRID_X + 240, y: BOARD_GRID_Y + 180 };
    const boardOffset = (boardNodes.length % 4) * HOLE_PITCH * 2;
    const board = snapBoardToWorkspaceGrid(createBoardNode(
      currentBoard,
      currentBoardColor.value,
      "top",
      currentBoardColor.id,
      undefined,
      {
        x: center.x - currentBoard.widthMm * SCALE / 2 + boardOffset,
        y: center.y - currentBoard.heightMm * SCALE / 2 + boardOffset,
      },
    ));
    setNodes((currentNodes) => [
      ...currentNodes.filter((node) => node.type === "perfboard"),
      board,
      ...currentNodes.filter((node) => node.type === "hardware"),
    ]);
    setBoardView("top");
    setSelectedNodeId(board.id);
  };

  const selectLabNode = (node: LabNode) => {
    setSelectedNodeId(node.id);
    setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, selected: false })));
    const board = node.type === "perfboard"
      ? node
      : boardNodes.find((item) => item.id === node.parentId);
    if (!board) return;
    setBoardPresetId(board.data.boardPresetId);
    setBoardColorId(board.data.boardColorId);
    setBoardView(board.data.view);
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.sourceHandle || !connection.targetHandle) return;
      const duplicate = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.sourceHandle === connection.sourceHandle &&
          edge.target === connection.target &&
          edge.targetHandle === connection.targetHandle,
      );
      if (duplicate) return;

      const stroke = getWireColor(
        nodes,
        connection.source,
        connection.sourceHandle,
        connection.target,
        connection.targetHandle,
      );
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);
      const connectionBoardId = sourceNode?.parentId ?? targetNode?.parentId;
      const connectionBoard = boardNodes.find((board) => board.id === connectionBoardId);
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            id: `wire-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type: "editable-wire",
            data: {
              boardId: connectionBoard?.id,
              color: stroke,
              side: connectionBoard?.data.view ?? "top",
            },
            reconnectable: true,
            zIndex: 20,
            style: { stroke, strokeWidth: 3 },
          },
          currentEdges,
        ),
      );
    },
    [boardNodes, edges, nodes, setEdges],
  );

  const onReconnect = useCallback(
    (oldEdge: WireEdge, connection: Connection) => {
      setEdges((currentEdges) => reconnectEdge(oldEdge, connection, currentEdges, { shouldReplaceId: false }) as WireEdge[]);
    },
    [setEdges],
  );

  const addComponent = (definition: HardwareComponentDefinition) => {
    const count = nodes.filter(
      (node) => node.type === "hardware" && node.data.componentId === definition.id,
    ).length;
    const size = getNodeSize(definition, 0);
    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    const center = canvasBounds
      ? screenToFlowPosition({
          x: canvasBounds.left + canvasBounds.width / 2,
          y: canvasBounds.top + canvasBounds.height / 2,
        })
      : { x: BOARD_GRID_X + 240, y: BOARD_GRID_Y + 180 };
    const node = createHardwareNode(
      definition.id,
      `${definition.shortName} ${count + 1}`,
      center.x - size.width / 2,
      center.y - size.height / 2,
    );
    const alignedNode = snapNodeToWorkspaceGrid(node);
    setNodes((currentNodes) => [...currentNodes, alignedNode]);
    setSelectedNodeId(node.id);
  };

  const rotateSelected = () => {
    if (!selectedNode || !selectedDefinition) return;
    const rotation = ((selectedNode.data.rotation + 90) % 360) as Rotation;
    const oldSize = getNodeSize(selectedDefinition, selectedNode.data.rotation);
    const size = getNodeSize(selectedDefinition, rotation);
    const board = selectedNode.parentId
      ? boardNodes.find((item) => item.id === selectedNode.parentId)
      : undefined;
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNode.id && node.type === "hardware" ? (() => {
            const rotatedNode: HardwareNode = {
              ...node,
              data: { ...node.data, rotation },
              position: {
                x: node.position.x + oldSize.width / 2 - size.width / 2,
                y: node.position.y + oldSize.height / 2 - size.height / 2,
              },
              style: size,
            };
            if (node.data.mountedToBoard && board) {
              const snappedNode = snapMountedNodeToBoardGrid(rotatedNode, board);
              return hasMountedComponentCollision(snappedNode, board, currentNodes) ? node : snappedNode;
            }
            return snapNodeToWorkspaceGrid(rotatedNode);
          })() : node,
      ),
    );
    window.setTimeout(() => updateNodeInternals(selectedNode.id), 30);
  };

  const flipSelected = () => {
    if (!selectedNode || selectedNode.data.mountedToBoard) return;
    setNodes((currentNodes) => currentNodes.map((node) => {
      if (node.id !== selectedNode.id || node.type !== "hardware") return node;
      const flippedNode: HardwareNode = {
        ...node,
        data: { ...node.data, face: node.data.face === "top" ? "bottom" : "top" },
      };
      return snapNodeToWorkspaceGrid(flippedNode);
    }));
    window.setTimeout(() => updateNodeInternals(selectedNode.id), 30);
  };

  const snapDraggedNode = (node: LabNode) => {
    if (node.type === "perfboard") {
      const snappedBoard = snapBoardToWorkspaceGrid(node);
      setNodes((currentNodes) => currentNodes.map((item) => item.id === node.id ? snappedBoard : item));
      return;
    }
    if (node.data.locked) return;
    const restoreDragStart = () => {
      const previousNode = dragStartNodeRef.current;
      if (!previousNode) return;
      setNodes((currentNodes) => currentNodes.map((item) => item.id === previousNode.id ? previousNode : item));
      window.setTimeout(() => updateNodeInternals(previousNode.id), 20);
    };
    let snapped: HardwareNode;
    const parentBoard = node.parentId
      ? boardNodes.find((board) => board.id === node.parentId)
      : undefined;
    if (parentBoard && node.data.mountedToBoard) {
      snapped = snapMountedNodeToBoardGrid(node, parentBoard);
      if (hasMountedComponentCollision(snapped, parentBoard, nodes)) {
        restoreDragStart();
        dragStartNodeRef.current = null;
        return;
      }
    } else {
      const compatibleBoards = boardNodes.filter((board) => {
        if (board.data.view !== "top") return false;
        return arePinsInsideBoard(snapNodeToBoardGrid(node, board), board);
      });
      const targetBoard = compatibleBoards.find((board) =>
        !hasMountedComponentCollision(snapNodeToBoardGrid(node, board), board, nodes),
      );
      if (!targetBoard && compatibleBoards.length > 0) {
        restoreDragStart();
        dragStartNodeRef.current = null;
        return;
      }
      snapped = targetBoard
        ? mountNodeOnBoard(snapNodeToBoardGrid(node, targetBoard), targetBoard)
        : snapNodeToWorkspaceGrid(node);
    }
    setNodes((currentNodes) =>
      currentNodes.map((item) => item.id === node.id ? snapped : item),
    );
    window.setTimeout(() => updateNodeInternals(node.id), 20);
    dragStartNodeRef.current = null;
  };

  const deleteSelected = () => {
    if (!selectedLabNode) return;
    setNodes((currentNodes) => {
      if (selectedLabNode.type !== "perfboard") {
        return currentNodes.filter((node) => node.id !== selectedLabNode.id);
      }
      return currentNodes
        .filter((node) => node.id !== selectedLabNode.id)
        .map((node) => node.type === "hardware" && node.data.mountedToBoard && node.parentId === selectedLabNode.id
          ? unmountNodeFromBoard(node, selectedLabNode)
          : node);
    });
    setEdges((currentEdges) => currentEdges
      .filter((edge) => edge.source !== selectedLabNode.id && edge.target !== selectedLabNode.id)
      .map((edge) => selectedLabNode.type === "perfboard" && edge.data?.boardId === selectedLabNode.id
        ? { ...edge, data: { ...edge.data, boardId: undefined } }
        : edge));
    setSelectedNodeId(null);
  };

  const mountSelected = () => {
    if (!selectedNode || !mountTargetBoard || !canMountSelected) return;
    setNodes((currentNodes) => {
      const currentNode = currentNodes.find((node): node is HardwareNode =>
        node.id === selectedNode.id && node.type === "hardware",
      );
      if (!currentNode || !canMountNodeOnBoard(currentNode, mountTargetBoard, currentNodes)) return currentNodes;
      return currentNodes.map((node) =>
        node.id === currentNode.id && node.type === "hardware"
          ? mountNodeOnBoard(node, mountTargetBoard)
          : node,
      );
    });
    window.setTimeout(() => updateNodeInternals(selectedNode.id), 30);
  };

  const unmountSelected = () => {
    const parentBoard = selectedNode?.parentId
      ? boardNodes.find((board) => board.id === selectedNode.parentId)
      : undefined;
    if (!selectedNode || !parentBoard || !selectedNode.data.mountedToBoard) return;
    setNodes((currentNodes) => currentNodes.map((node) =>
      node.id === selectedNode.id && node.type === "hardware"
        ? unmountNodeFromBoard(node, parentBoard)
        : node,
    ));
    window.setTimeout(() => updateNodeInternals(selectedNode.id), 30);
  };

  const unmountAll = () => {
    if (!boardNode) return;
    const ids: string[] = [];
    setNodes((currentNodes) => currentNodes.map((node) => {
      if (node.type !== "hardware" || !node.data.mountedToBoard || node.parentId !== boardNode.id) return node;
      ids.push(node.id);
      return unmountNodeFromBoard(node, boardNode);
    }));
    window.setTimeout(() => ids.forEach((id) => updateNodeInternals(id)), 30);
  };

  const duplicateSelected = () => {
    if (!selectedNode) return;
    const duplicate = createHardwareNode(
      selectedNode.data.componentId,
      `${selectedNode.data.instanceName} copia`,
      selectedNode.position.x + HOLE_PITCH * 2,
      selectedNode.position.y + HOLE_PITCH * 2,
      selectedNode.data.rotation,
      undefined,
      selectedNode.data.face,
    );
    const alignedDuplicate = snapNodeToWorkspaceGrid(duplicate);
    setNodes((currentNodes) => [...currentNodes, alignedDuplicate]);
    setSelectedNodeId(duplicate.id);
  };

  const toggleSelectedLock = () => {
    if (!selectedNode) return;
    setNodes((currentNodes) => currentNodes.map((node) => {
      if (node.id !== selectedNode.id || node.type !== "hardware") return node;
      const locked = !node.data.locked;
      return {
        ...node,
        data: { ...node.data, locked },
        draggable: !locked,
      };
    }));
  };

  const setSimulationControl = (
    kind: SimulationBooleanControl,
    nodeId: string,
    value: boolean,
  ) => {
    setSimulationControls((current) => ({
      ...current,
      [kind]: { ...current[kind], [nodeId]: value },
    }));
  };

  const setSimulationVoltage = (
    kind: SimulationVoltageControl,
    nodeId: string,
    value: number,
  ) => {
    setSimulationControls((current) => ({
      ...current,
      [kind]: { ...current[kind], [nodeId]: value },
    }));
  };

  const resetSimulation = () => {
    setSimulationRunning(false);
    setSimulationControls({
      batteries: {},
      batteryVoltages: {},
      buttons: {},
      converterOutputs: {},
      switches: {},
    });
  };

  const loadSelectedTemplate = () => {
    const template = FIRMWARE_TEMPLATES.find((item) => item.id === selectedTemplateId);
    if (!template) return;

    const project = structuredClone(template.project);
    const fallback = createRfKillPreset(currentBoard, currentBoardColor.value, "top");
    const templateNodes = Array.isArray(project.nodes) && project.nodes.length > 0
      ? normalizeProjectNodes(project).map((node) => ({
          ...node,
          dragging: false,
          selected: false,
        }))
      : fallback.nodes;
    const templateEdges = Array.isArray(project.edges)
      ? normalizeProjectEdges(project).map((edge) => ({ ...edge, selected: false }))
      : fallback.edges;

    setNodes(templateNodes);
    setEdges(templateEdges);
    setBoardPresetId(project.boardPresetId);
    setBoardColorId(project.boardColorId);
    setBoardView(project.boardView);
    setCode(project.code);
    setProjectName(project.name);
    setSelectedNodeId(null);
    resetSimulation();
    setSaveState("Plantilla cargada");
    window.setTimeout(() => fitView({ padding: 0.12, duration: 320 }), 70);
  };

  const clearProject = () => {
    setNodes([]);
    setEdges([]);
    setCode("");
    setProjectName("Proyecto nuevo");
    setSelectedTemplateId("");
    setSelectedNodeId(null);
    resetSimulation();
    setResetOpen(false);
    window.setTimeout(() => fitView({ padding: 0.18, duration: 280 }), 40);
  };

  const exportProject = () => {
    const project: SavedProject = {
      version: 6,
      name: projectName,
      boardPresetId,
      boardColorId,
      boardView,
      code,
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "hardware-lab"}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const importProject = async (file: File | undefined) => {
    if (!file) return;
    try {
      const project = JSON.parse(await file.text()) as PersistedProject;
      if ((project.version !== 5 && project.version !== 6) || !Array.isArray(project.nodes) || !Array.isArray(project.edges)) {
        throw new Error("Formato invalido");
      }
      setNodes(normalizeProjectNodes(project));
      setEdges(normalizeProjectEdges(project));
      setBoardPresetId(project.boardPresetId);
      setBoardColorId(project.boardColorId);
      setBoardView(project.boardView);
      setProjectName(project.name);
      setCode(project.code);
      setSelectedNodeId(null);
      resetSimulation();
      setSaveState("Proyecto importado");
      window.setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 70);
    } catch {
      setSaveState("El archivo no es un proyecto valido");
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  };

  return (
    <div className="hardware-lab" data-board-view={activeBoardView}>
      <header className="lab-toolbar">
        <div className="lab-project-name">
          <label htmlFor="lab-project-name">Proyecto</label>
          <input
            id="lab-project-name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
          />
          <span>{saveState}</span>
        </div>

        <div className="lab-toolbar__group">
          <label htmlFor="lab-board-size">Placa</label>
          <select
            id="lab-board-size"
            value={boardPresetId}
            onChange={(event) => handleBoardPreset(event.target.value)}
            disabled={canvasInteractionMode === "wiring"}
          >
            {BOARD_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
        </div>

        <div className="lab-color-picker" aria-label="Color de placa">
          {BOARD_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              className={color.id === boardColorId ? "is-active" : ""}
              style={{ "--swatch": color.value } as React.CSSProperties}
              aria-label={`Placa ${color.label.toLowerCase()}`}
              aria-pressed={color.id === boardColorId}
              title={`Placa ${color.label.toLowerCase()}`}
              onClick={() => handleBoardColor(color.id)}
              disabled={canvasInteractionMode === "wiring"}
            />
          ))}
        </div>

        <button
          className="lab-board-button"
          type="button"
          onClick={addBoard}
          disabled={canvasInteractionMode === "wiring"}
        >
          <Plus size={17} />
          <span>{boardNodes.length > 0 ? "Añadir otra placa" : "Añadir placa"}</span>
        </button>

        <div className="lab-toolbar__actions">
          <button type="button" onClick={saveProject} title="Guardar en este navegador">
            <Save size={17} /> <span>Guardar</span>
          </button>
          <button type="button" onClick={exportProject} title="Exportar proyecto JSON">
            <Download size={17} /> <span>Exportar</span>
          </button>
          <button type="button" onClick={() => importInput.current?.click()} title="Importar proyecto JSON">
            <FileUp size={17} /> <span>Importar</span>
          </button>
          <button
            className="is-danger"
            type="button"
            onClick={() => setResetOpen(true)}
            aria-label="Vaciar proyecto"
            title="Vaciar proyecto"
          >
            <Trash2 size={17} />
          </button>
          <input
            ref={importInput}
            className="lab-visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={(event) => importProject(event.target.files?.[0])}
          />
        </div>
      </header>

      <div className="lab-modebar">
        <div className="lab-tabs" role="tablist" aria-label="Vista del laboratorio">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "mount"}
            className={activeTab === "mount" ? "is-active" : ""}
            onClick={() => setActiveTab("mount")}
          >
            <CircuitBoard size={18} /> Montaje
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "code"}
            className={activeTab === "code" ? "is-active" : ""}
            onClick={() => setActiveTab("code")}
          >
            <Code2 size={18} /> Código y prueba
          </button>
        </div>

        {boardNode && <div className="lab-view-toggle" aria-label="Cara de la placa perforada">
          <button
            type="button"
            className={activeBoardView === "top" ? "is-active" : ""}
            aria-pressed={activeBoardView === "top"}
            onClick={() => handleBoardView("top")}
          >Frente · componentes</button>
          <button
            type="button"
            className={activeBoardView === "bottom" ? "is-active" : ""}
            aria-pressed={activeBoardView === "bottom"}
            onClick={() => handleBoardView("bottom")}
          >Reverso · solo pines</button>
        </div>}

        <div className="lab-template-picker">
          <label htmlFor="lab-firmware-template">Plantilla</label>
          <select
            id="lab-firmware-template"
            value={selectedTemplateId}
            onChange={(event) => setSelectedTemplateId(event.target.value)}
          >
            <option value="">Seleccionar firmware...</option>
            {FIRMWARE_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
          <button
            className="lab-preset-button"
            type="button"
            onClick={loadSelectedTemplate}
            disabled={!selectedTemplateId}
          >
            <Zap size={17} /> Cargar
          </button>
        </div>
      </div>

      {activeTab === "mount" ? (
        <div className={`lab-workspace${catalogOpen ? catalogPinned ? " is-catalog-pinned" : " is-catalog-floating" : " is-catalog-hidden"}`}>
          {!catalogOpen && <button
            className="lab-catalog-reopen"
            type="button"
            onClick={openCatalog}
            aria-label="Mostrar catálogo de componentes"
            title="Mostrar catálogo de componentes"
          >
            <PanelLeftOpen size={18} />
          </button>}

          {catalogOpen && <aside className="lab-catalog" aria-label="Catalogo de componentes">
            <div className="lab-panel-heading">
              <div>
                <span>COMPONENTES</span>
                <h2>Catálogo</h2>
              </div>
              <div className="lab-panel-heading__actions">
                <button
                  type="button"
                  className={catalogPinned ? "is-active" : ""}
                  onClick={toggleCatalogPinned}
                  aria-label={catalogPinned ? "Soltar catálogo" : "Fijar catálogo al lateral"}
                  aria-pressed={catalogPinned}
                  title={catalogPinned ? "Soltar catálogo" : "Fijar catálogo al lateral"}
                >
                  {catalogPinned ? <Pin size={16} /> : <PinOff size={16} />}
                </button>
                <button
                  type="button"
                  onClick={closeCatalog}
                  aria-label="Ocultar catálogo"
                  title="Ocultar catálogo"
                >
                  <PanelLeftClose size={17} />
                </button>
              </div>
            </div>
            <label className="lab-search">
              <Search size={16} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ESP32, nRF24, energia..."
                aria-label="Buscar componente"
              />
            </label>
            <div className="lab-component-list">
              {filteredComponents.map((component) => (
                <article className="lab-component-item" key={component.id}>
                  <div className="lab-component-icon has-artwork" style={{ color: component.accent }}>
                    <ComponentArtwork definition={component} />
                  </div>
                  <div>
                    <strong>{component.name}</strong>
                    <span>{component.widthMm} × {component.heightMm} mm</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Agregar ${component.name}`}
                    title={`Agregar ${component.name}`}
                    onClick={() => addComponent(component)}
                    disabled={canvasInteractionMode === "wiring"}
                  >
                    <Plus size={17} />
                  </button>
                </article>
              ))}
            </div>
          </aside>}

          <section className="lab-canvas-panel" aria-label="Mesa de montaje">
            <div className="lab-canvas-heading">
              <div>
                <span>MESA DE MONTAJE</span>
                <strong>{boardNode ? `${currentBoard.label} · paso 2.54 mm` : "Lienzo libre · retícula 2.54 mm"}</strong>
              </div>
              <div className="lab-canvas-controls">
                <div className="lab-interaction-toggle" role="group" aria-label="Modo de trabajo del lienzo">
                  <button
                    type="button"
                    className={canvasInteractionMode === "components" ? "is-active" : ""}
                    aria-pressed={canvasInteractionMode === "components"}
                    onClick={() => selectCanvasInteractionMode("components")}
                    title="Mover y editar placas y componentes"
                  >
                    <MousePointer2 size={15} /> Componentes
                  </button>
                  <button
                    type="button"
                    className={canvasInteractionMode === "wiring" ? "is-active" : ""}
                    aria-pressed={canvasInteractionMode === "wiring"}
                    onClick={() => selectCanvasInteractionMode("wiring")}
                    title="Congelar el montaje y trabajar solo con cables y pines"
                  >
                    <Cable size={16} /> Cableado
                  </button>
                  <button
                    type="button"
                    className="lab-wire-visibility"
                    aria-pressed={wiresVisible}
                    aria-label={wiresVisible ? "Ocultar cableado" : "Mostrar cableado"}
                    title={wiresVisible ? "Ocultar cableado" : "Mostrar cableado"}
                    onClick={toggleWireVisibility}
                  >
                    {wiresVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
                <div className="lab-canvas-status">
                  <span>{boardNodes.length} placas</span>
                  <span>{componentCount} componentes</span>
                  <span>{mountedCount} montados</span>
                  <span>{wiresVisible ? `${visibleEdgeCount} cables visibles` : `${edges.length} cables ocultos`}</span>
                </div>
              </div>
            </div>
            <div
              ref={canvasRef}
              className={`lab-flow is-${canvasInteractionMode}-mode${wiresVisible ? "" : " is-wiring-hidden"}`}
              data-testid="hardware-lab-canvas"
              onPointerMoveCapture={handleCanvasPointerMove}
              onPointerLeave={clearCanvasPointerZone}
            >
              <ReactFlow
                nodes={renderedNodes}
                edges={renderedEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onReconnect={onReconnect}
                onNodeClick={(_, node) => {
                  if (canvasInteractionMode === "components") selectLabNode(node);
                }}
                onNodeDragStart={(_, node) => {
                  if (canvasInteractionMode !== "components") return;
                  dragStartNodeRef.current = nodes.find((item) => item.id === node.id) ?? node;
                }}
                onNodeDragStop={(_, node) => {
                  if (canvasInteractionMode === "components") snapDraggedNode(node);
                }}
                onPaneClick={() => {
                  setSelectedNodeId(null);
                  setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, selected: false })));
                }}
                connectionMode={ConnectionMode.Loose}
                connectionRadius={24}
                edgesReconnectable
                reconnectRadius={24}
                elevateEdgesOnSelect
                defaultEdgeOptions={{ type: "editable-wire", reconnectable: true, zIndex: 20 }}
                minZoom={0.35}
                maxZoom={2}
                fitView
                fitViewOptions={{ padding: 0.16 }}
                deleteKeyCode={null}
                proOptions={{ hideAttribution: false }}
              >
                <Background color={isLight ? "#e7bfd6" : "#17342a"} gap={HOLE_PITCH} size={1} />
                <MiniMap
                  pannable
                  zoomable
                  nodeColor={(node) => node.type === "perfboard" ? String(node.data.boardColor) : "#ff49ad"}
                />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
            <p className="lab-canvas-help">
              {canvasInteractionMode === "wiring"
                ? "Cableado activo: el montaje está congelado. Conecta pines, selecciona cables y ajusta sus puntos de ruta."
                : "Suelta una pieza con todos sus pines sobre la placa para montarla. Cada cable permanece en la cara donde fue creado."}
            </p>
          </section>

          <aside className="lab-inspector">
            <InspectorSection
              sectionId="selection"
              eyebrow="SELECCIÓN"
              title={selectedWire
                ? "Cable seleccionado"
                : selectedDefinition?.shortName ?? (selectedBoard ? "Placa perforada" : "Monitor del proyecto")}
              icon={selectedWire ? <Cable size={18} /> : <Info size={18} />}
              defaultOpen
            >
              {selectedWire ? (
              <section key={`wire-inspector-${selectedWire.id}`} className="lab-live-console lab-wire-inspector" aria-live="polite">
                <div className="lab-live-console__status">
                  <span />
                  <b>CONEXIÓN ACTIVA</b>
                  <code>ENLACE A-B</code>
                </div>
                <div className="lab-wire-endpoints">
                  <article>
                    <span>PUNTO A</span>
                    <strong>{selectedWireSourcePin?.label ?? selectedWire.sourceHandle}</strong>
                    <b>{selectedWireSourceNode?.type === "hardware" ? selectedWireSourceNode.data.instanceName : selectedWire.source}</b>
                    <small>{selectedWireSourceDefinition?.shortName ?? "Elemento del lienzo"}</small>
                    <em>{getPinRoleLabel(selectedWireSourcePin)} · {getPinDirectionLabel(selectedWireSourcePin)}</em>
                  </article>
                  <div className="lab-wire-endpoints__link" aria-hidden="true">
                    <span>A</span><Cable size={16} /><span>B</span>
                  </div>
                  <article>
                    <span>PUNTO B</span>
                    <strong>{selectedWireTargetPin?.label ?? selectedWire.targetHandle}</strong>
                    <b>{selectedWireTargetNode?.type === "hardware" ? selectedWireTargetNode.data.instanceName : selectedWire.target}</b>
                    <small>{selectedWireTargetDefinition?.shortName ?? "Elemento del lienzo"}</small>
                    <em>{getPinRoleLabel(selectedWireTargetPin)} · {getPinDirectionLabel(selectedWireTargetPin)}</em>
                  </article>
                </div>
                <dl className="lab-wire-readout">
                  <div>
                    <dt>Color</dt>
                    <dd><span style={{ background: selectedWire.data?.color ?? String(selectedWire.style?.stroke ?? "#30d8ff") }} />{selectedWire.data?.color ?? String(selectedWire.style?.stroke ?? "#30d8ff")}</dd>
                  </div>
                  <div><dt>Cara</dt><dd>{selectedWire.data?.side === "bottom" ? "Soldadura / reverso" : "Componentes / frente"}</dd></div>
                  <div><dt>Puntos de ruta</dt><dd>{selectedWire.data?.waypoints?.length ?? 1}</dd></div>
                  <div><dt>Estado</dt><dd>{simulationRunning
                    ? selectedWireSimulation?.groundReturn
                      ? "Retorno GND activo"
                      : selectedWireSimulation?.energized ? "Energizado" : "Sin energía"
                    : "Simulación detenida"}</dd></div>
                  <div><dt>Voltaje</dt><dd>{simulationRunning && selectedWireSimulation
                    ? `${selectedWireSimulation.voltage.toFixed(2)} V`
                    : "Sin medición"}</dd></div>
                  <div className="lab-wire-readout__id"><dt>ID del cable</dt><dd><code>{selectedWire.id}</code></dd></div>
                </dl>
                <div className={`lab-wire-health${selectedWireDiagnostics.some((item) => item.severity === "error") ? " is-error" : selectedWireDiagnostics.some((item) => item.severity === "warning") ? " is-warning" : " is-ok"}`}>
                  {selectedWireDiagnostics.some((item) => item.severity === "error")
                    ? <TriangleAlert size={15} />
                    : selectedWireDiagnostics.some((item) => item.severity === "warning")
                      ? <Info size={15} />
                      : <CheckCircle2 size={15} />}
                  <span>{selectedWireDiagnostics.length > 0
                    ? `${selectedWireDiagnostics.length} diagnóstico(s) relacionado(s)`
                    : "Sin problemas detectados en esta conexión"}</span>
                </div>
              </section>
            ) : selectedNode && selectedDefinition ? (
              <div className="lab-selection-details">
                <label>
                  Nombre
                  <input
                    value={selectedNode.data.instanceName}
                    onChange={(event) =>
                      setNodes((currentNodes) => currentNodes.map((node) =>
                        node.id === selectedNode.id && node.type === "hardware"
                          ? { ...node, data: { ...node.data, instanceName: event.target.value } }
                          : node,
                      ))
                    }
                  />
                </label>
                <dl>
                  <div><dt>Medida</dt><dd>{selectedDefinition.widthMm} × {selectedDefinition.heightMm} mm</dd></div>
                  <div><dt>Orientación</dt><dd>{selectedNode.data.rotation}°</dd></div>
                  <div><dt>Vista</dt><dd>{selectedNode.data.mountedToBoard ? (activeBoardView === "top" ? "Componentes" : "Soldadura") : selectedNode.data.face === "top" ? "Superior" : "Inferior"}</dd></div>
                  <div><dt>Montaje</dt><dd>{selectedNode.data.mountedToBoard ? "En placa" : "Libre"}</dd></div>
                  <div><dt>Posición</dt><dd>{selectedNode.data.locked ? "Bloqueada" : "Editable"}</dd></div>
                  <div><dt>Pines</dt><dd>{selectedDefinition.pins.length}</dd></div>
                </dl>
                <p>{selectedDefinition.description}</p>
                <div className="lab-selection-actions">
                  <button type="button" onClick={rotateSelected}><RotateCw size={16} /> Rotar</button>
                  {!selectedNode.data.mountedToBoard && <button type="button" onClick={flipSelected}><FlipHorizontal2 size={16} /> Voltear pieza</button>}
                  {selectedNode.data.mountedToBoard ? (
                    <>
                      <button type="button" onClick={() => handleBoardView(activeBoardView === "top" ? "bottom" : "top")}>
                        <FlipHorizontal2 size={16} /> {activeBoardView === "top" ? "Ver soldadura" : "Ver componentes"}
                      </button>
                      <button type="button" onClick={unmountSelected}><Unlink2 size={16} /> Desmontar</button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={mountSelected}
                      disabled={!canMountSelected}
                      title={canMountSelected
                        ? "Agrupar con la placa"
                        : mountBlockedByCollision
                          ? "Ese espacio está ocupado por otro componente"
                          : "Coloca todos los pines sobre la placa"}
                    >
                      <Link2 size={16} /> Montar
                    </button>
                  )}
                  <button
                    className={selectedNode.data.locked ? "is-lock-active" : ""}
                    type="button"
                    aria-pressed={selectedNode.data.locked}
                    onClick={toggleSelectedLock}
                    title={selectedNode.data.locked ? "Permitir mover el componente" : "Evitar movimientos accidentales"}
                  >
                    {selectedNode.data.locked ? <Unlock size={16} /> : <Lock size={16} />}
                    {selectedNode.data.locked ? "Desbloquear" : "Bloquear posición"}
                  </button>
                  <button type="button" onClick={duplicateSelected}><Copy size={16} /> Duplicar</button>
                  <button className="is-danger" type="button" onClick={deleteSelected}><Trash2 size={16} /> Eliminar</button>
                </div>
              </div>
            ) : selectedBoard ? (
              <div className="lab-board-summary">
                <CircuitBoard size={30} />
                <strong>Placa {currentBoard.label}</strong>
                <span>{currentBoardGeometry.holeColumns} × {currentBoardGeometry.holeRows} perforaciones a paso de 2.54 mm</span>
                <p>{activeBoardMountedCount} componentes montados en esta placa. Al moverla o invertirla conservarán su posición física.</p>
                <button type="button" onClick={() => handleBoardView(activeBoardView === "top" ? "bottom" : "top")}>
                  <FlipHorizontal2 size={16} /> {activeBoardView === "top" ? "Ver soldadura" : "Ver componentes"}
                </button>
                {activeBoardMountedCount > 0 && <button type="button" onClick={unmountAll}><Unlink2 size={16} /> Desmontar todos</button>}
                <button className="is-danger" type="button" onClick={deleteSelected}><Trash2 size={16} /> Eliminar placa</button>
              </div>
            ) : (
              <section key="project-live-monitor" className="lab-live-console" aria-live="polite">
                <div className="lab-live-console__status">
                  <span />
                  <b>MONITOR EN TIEMPO REAL</b>
                  <code>{simulationRunning ? "RUN" : "IDLE"}</code>
                </div>
                <div className="lab-live-console__lines">
                  <p><b>&gt;</b> {boardNodes.length} placa(s), {componentCount} componente(s), {mountedCount} montado(s).</p>
                  <p><b>&gt;</b> {edges.length} cable(s) registrados; {visibleEdgeCount} visibles en esta cara.</p>
                  <p><b>&gt;</b> Simulación {simulationRunning ? `activa: ${simulationResult.poweredCount}/${componentCount} módulos energizados` : "detenida"}.</p>
                  <p><b>&gt;</b> Diagnóstico: {errorCount} error(es), {warningCount} advertencia(s).</p>
                  <p><b>&gt;</b> Selecciona un cable, componente o placa para inspeccionarlo.</p>
                </div>
              </section>
              )}
            </InspectorSection>

            <InspectorSection
              className="lab-inspector-section--simulation"
              sectionId="simulation"
              eyebrow="PRUEBAS"
              title="Simulación eléctrica"
              icon={<Zap size={18} />}
              summary={simulationRunning ? `${simulationResult.poweredCount}/${componentCount} activos` : "Detenida"}
            >
              <SimulationPanel
                embedded
                controls={simulationControls}
                nodes={nodes}
                result={simulationResult}
                running={simulationRunning}
                onControl={setSimulationControl}
                onRunningChange={setSimulationRunning}
                onVoltageControl={setSimulationVoltage}
              />
            </InspectorSection>

            <InspectorSection
              className="lab-inspector-section--diagnostics"
              sectionId="diagnostics"
              eyebrow="REVISIÓN"
              title="Diagnóstico"
              icon={errorCount > 0 ? <TriangleAlert size={18} /> : <CheckCircle2 size={18} />}
              summary={errorCount > 0 ? `${errorCount} error(es)` : warningCount > 0 ? `${warningCount} aviso(s)` : "Sin errores"}
              defaultOpen
            >
              <DiagnosticList embedded diagnostics={diagnostics} compact />
            </InspectorSection>

            <InspectorSection
              className="lab-inspector-section--history"
              sectionId="history"
              eyebrow="CAMBIOS"
              title="Historial"
              icon={<HistoryIcon size={18} />}
              summary={`${Math.max(0, historyEntries.length - 1)}/5`}
            >
              <HistoryPanel embedded currentEntryId={currentHistoryId} entries={historyEntries} onRestore={restoreHistoryEntry} />
            </InspectorSection>
          </aside>
        </div>
      ) : (
        <div className="lab-code-workspace">
          <section className="lab-code-panel">
            <div className="lab-panel-heading">
              <div>
                <span>FIRMWARE</span>
                <h2>Editor C++ / Arduino</h2>
              </div>
              <Code2 size={20} />
            </div>
            <CodeMirror
              value={code}
              height="520px"
              extensions={[cpp()]}
              theme={isLight ? "light" : "dark"}
              onChange={setCode}
              basicSetup={{
                autocompletion: true,
                bracketMatching: true,
                foldGutter: true,
                highlightActiveLine: true,
                lineNumbers: true,
              }}
            />
          </section>

          <aside className="lab-test-panel">
            <div className="lab-test-summary">
              <div className={errorCount > 0 ? "is-error" : "is-ok"}>
                {errorCount > 0 ? <TriangleAlert size={24} /> : <CheckCircle2 size={24} />}
                <span><strong>{errorCount}</strong> errores</span>
              </div>
              <div className={warningCount > 0 ? "is-warning" : "is-ok"}>
                <Info size={24} />
                <span><strong>{warningCount}</strong> avisos</span>
              </div>
            </div>
            <InspectorSection
              className="lab-inspector-section--simulation"
              sectionId="simulation"
              eyebrow="PRUEBAS"
              title="Simulación eléctrica"
              icon={<Zap size={18} />}
              summary={simulationRunning ? `${simulationResult.poweredCount}/${componentCount} activos` : "Detenida"}
            >
              <SimulationPanel
                embedded
                controls={simulationControls}
                nodes={nodes}
                result={simulationResult}
                running={simulationRunning}
                onControl={setSimulationControl}
                onRunningChange={setSimulationRunning}
                onVoltageControl={setSimulationVoltage}
              />
            </InspectorSection>
            <InspectorSection
              className="lab-inspector-section--diagnostics"
              sectionId="diagnostics"
              eyebrow="REVISIÓN"
              title="Diagnóstico"
              icon={errorCount > 0 ? <TriangleAlert size={18} /> : <CheckCircle2 size={18} />}
              summary={errorCount > 0 ? `${errorCount} error(es)` : warningCount > 0 ? `${warningCount} aviso(s)` : "Sin errores"}
              defaultOpen
            >
              <DiagnosticList embedded diagnostics={diagnostics} />
            </InspectorSection>
            <InspectorSection
              className="lab-inspector-section--history"
              sectionId="history"
              eyebrow="CAMBIOS"
              title="Historial"
              icon={<HistoryIcon size={18} />}
              summary={`${Math.max(0, historyEntries.length - 1)}/5`}
            >
              <HistoryPanel embedded currentEntryId={currentHistoryId} entries={historyEntries} onRestore={restoreHistoryEntry} />
            </InspectorSection>
            <InspectorSection
              className="lab-inspector-section--netlist"
              sectionId="netlist"
              eyebrow="CABLEADO"
              title="Conexiones"
              icon={<Cable size={18} />}
              summary={`${edges.length} cable(s)`}
            >
              <div className="lab-netlist">
                <div>
                  {edges.length === 0 ? (
                    <p>No hay cables conectados.</p>
                  ) : (
                    edges.slice(0, 24).map((edge) => {
                      const source = nodes.find((node) => node.id === edge.source);
                      const target = nodes.find((node) => node.id === edge.target);
                      return (
                        <p key={edge.id}>
                          <span style={{ background: edge.data?.color ?? String(edge.style?.stroke ?? "#30d8ff") }} />
                          {source?.type === "hardware" ? source.data.instanceName : edge.source}
                          <b>{edge.sourceHandle}</b>
                          <Cable size={13} />
                          {target?.type === "hardware" ? target.data.instanceName : edge.target}
                          <b>{edge.targetHandle}</b>
                        </p>
                      );
                    })
                  )}
                </div>
              </div>
            </InspectorSection>
          </aside>
        </div>
      )}

      {resetOpen && (
        <div className="lab-modal-backdrop" role="presentation" onMouseDown={() => setResetOpen(false)}>
          <div
            className="lab-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lab-reset-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="lab-modal__close" type="button" onClick={() => setResetOpen(false)} aria-label="Cerrar">
              <X size={18} />
            </button>
            <Trash2 size={28} />
            <h2 id="lab-reset-title">¿Vaciar el proyecto?</h2>
            <p>Se eliminarán los componentes, cables y código del espacio de trabajo local.</p>
            <div>
              <button type="button" onClick={() => setResetOpen(false)}>Cancelar</button>
              <button className="is-danger" type="button" onClick={clearProject}>Vaciar proyecto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InspectorSection({
  children,
  className = "",
  defaultOpen = false,
  eyebrow,
  icon,
  sectionId,
  summary,
  title,
}: {
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  eyebrow: string;
  icon: ReactNode;
  sectionId: string;
  summary?: string;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [preferenceReady, setPreferenceReady] = useState(false);
  const bodyId = `lab-inspector-section-${sectionId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(INSPECTOR_PREFERENCE_KEY);
      if (saved) {
        const preferences = JSON.parse(saved) as Record<string, boolean>;
        if (typeof preferences[sectionId] === "boolean") setIsOpen(preferences[sectionId]);
      }
    } catch {
      // Keep the section default when the saved preference cannot be read.
    } finally {
      setPreferenceReady(true);
    }
  }, [sectionId]);

  useEffect(() => {
    if (!preferenceReady) return;
    try {
      const saved = localStorage.getItem(INSPECTOR_PREFERENCE_KEY);
      const preferences = saved ? JSON.parse(saved) as Record<string, boolean> : {};
      localStorage.setItem(INSPECTOR_PREFERENCE_KEY, JSON.stringify({
        ...preferences,
        [sectionId]: isOpen,
      }));
    } catch {
      // The accordion still works when browser storage is unavailable.
    }
  }, [isOpen, preferenceReady, sectionId]);

  return (
    <section className={`lab-inspector-section${isOpen ? " is-open" : ""}${className ? ` ${className}` : ""}`}>
      <button
        className="lab-inspector-section__toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="lab-inspector-section__icon">{icon}</span>
        <span className="lab-inspector-section__label">
          <small>{eyebrow}</small>
          <strong>{title}</strong>
        </span>
        {summary && <span className="lab-inspector-section__summary">{summary}</span>}
        <ChevronDown className="lab-inspector-section__chevron" size={17} aria-hidden="true" />
      </button>
      <div className="lab-inspector-section__body" id={bodyId} hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
}

function SimulationPanel({
  embedded = false,
  controls,
  nodes,
  onControl,
  onRunningChange,
  onVoltageControl,
  result,
  running,
}: {
  embedded?: boolean;
  controls: SimulationControls;
  nodes: LabNode[];
  onControl: (kind: SimulationBooleanControl, nodeId: string, value: boolean) => void;
  onRunningChange: (running: boolean) => void;
  onVoltageControl: (kind: SimulationVoltageControl, nodeId: string, value: number) => void;
  result: SimulationResult;
  running: boolean;
}) {
  const hardwareNodes = nodes.filter((node): node is HardwareNode => node.type === "hardware");
  const functionalNodes = hardwareNodes.filter((node) =>
    ["lipo-37", "tp4056", "step-up", "step-down", "push-button", "slide-switch"]
      .includes(node.data.componentId),
  );

  const controlStateLabel = (kind: SimulationBooleanControl, active: boolean) => {
    if (kind === "batteries") return active ? "Encendida" : "Apagada";
    if (kind === "buttons") return active ? "Presionado" : "Liberado";
    return active ? "Cerrado" : "Abierto";
  };
  const formatVoltage = (value: number | undefined) =>
    running && value !== undefined ? `${value.toFixed(1)} V` : "--";
  const voltageReadout = (node: HardwareNode) => {
    const status = result.statusByNode[node.id];
    if (!status || !running) return "Sin medición";
    if (node.data.componentId === "lipo-37") {
      return `SALIDA ${formatVoltage(status.outputVoltage)}`;
    }
    if (node.data.componentId === "tp4056") {
      return `BATERÍA ${formatVoltage(status.pinVoltages["B+"])} · OUT ${formatVoltage(status.pinVoltages["OUT+"])}`;
    }
    if (node.data.componentId === "slide-switch") {
      return `COM ${formatVoltage(status.pinVoltages.COM)} · NO ${formatVoltage(status.pinVoltages.NO)}`;
    }
    if (node.data.componentId === "push-button") {
      return `A ${formatVoltage(status.pinVoltages.A1)} · B ${formatVoltage(status.pinVoltages.B1)}`;
    }
    if (status.inputVoltage > 0 || status.outputVoltage > 0) {
      return `IN ${formatVoltage(status.inputVoltage)} · OUT ${formatVoltage(status.outputVoltage)}`;
    }
    return status.voltage > 0 ? formatVoltage(status.voltage) : "Sin tensión";
  };
  const liveReadout = (node: HardwareNode) => {
    const status = result.statusByNode[node.id];
    if (!status || !running) return "Sin medición";
    const values = [];
    if (status.inputVoltage > 0) values.push(`IN ${status.inputVoltage.toFixed(1)} V`);
    if (status.outputVoltage > 0) values.push(`OUT ${status.outputVoltage.toFixed(1)} V`);
    if (values.length === 0 && status.voltage > 0) values.push(`${status.voltage.toFixed(1)} V`);
    return values.join(" · ") || "Sin tensión";
  };

  const renderVoltageInput = (
    node: HardwareNode,
    kind: SimulationVoltageControl,
    value: number,
    minimum: number,
    maximum: number,
  ) => (
    <label className="lab-simulation__voltage">
      <span>{kind === "batteryVoltages" ? "Voltaje" : "Salida"}</span>
      <input
        type="number"
        min={minimum}
        max={maximum}
        step="0.1"
        value={value}
        aria-label={`Voltaje de ${node.data.instanceName}`}
        onChange={(event) => {
          const nextValue = event.currentTarget.valueAsNumber;
          if (Number.isFinite(nextValue)) onVoltageControl(kind, node.id, nextValue);
        }}
        onWheel={(event) => event.currentTarget.blur()}
      />
      <b>V</b>
    </label>
  );

  return (
    <section className={`lab-simulation${running ? " is-running" : ""}`} aria-label="Simulación eléctrica">
      <div className="lab-simulation__heading">
        {!embedded && <span><Zap size={15} /> SIMULACIÓN</span>}
        <button
          type="button"
          className={running ? "is-stop" : "is-start"}
          onClick={() => onRunningChange(!running)}
          disabled={hardwareNodes.length === 0}
        >
          <Power size={14} /> {running ? "Detener" : "Iniciar"}
        </button>
      </div>
      <div className="lab-simulation__summary" aria-live="polite">
        <strong>{running ? `${result.poweredCount}/${hardwareNodes.length}` : "En espera"}</strong>
        <span>{running ? "módulos energizados" : "Inicia para comprobar la alimentación"}</span>
      </div>
      {functionalNodes.length > 0 && <div className="lab-simulation__controls">
        {functionalNodes.map((node) => {
          const componentId = node.data.componentId;
          const booleanKind: SimulationBooleanControl | null = componentId === "lipo-37"
            ? "batteries"
            : componentId === "push-button"
              ? "buttons"
              : componentId === "slide-switch" ? "switches" : null;
          const active = booleanKind === "batteries"
            ? controls.batteries[node.id] !== false
            : booleanKind ? controls[booleanKind][node.id] ?? false : false;
          return (
            <div className="lab-simulation__control" key={node.id}>
              <div>
                <span>{node.data.instanceName}</span>
                <small>{voltageReadout(node)}</small>
              </div>
              <div className="lab-simulation__actions">
                {componentId === "lipo-37" && renderVoltageInput(
                  node,
                  "batteryVoltages",
                  controls.batteryVoltages[node.id] ?? 3.7,
                  2.5,
                  4.2,
                )}
                {componentId === "step-up" && renderVoltageInput(
                  node,
                  "converterOutputs",
                  controls.converterOutputs[node.id] ?? 5,
                  3.3,
                  28,
                )}
                {componentId === "step-down" && renderVoltageInput(
                  node,
                  "converterOutputs",
                  controls.converterOutputs[node.id] ?? 3.3,
                  1.2,
                  24,
                )}
                {booleanKind && <button
                  type="button"
                  className={active ? "is-active" : ""}
                  aria-pressed={active}
                  onClick={() => onControl(booleanKind, node.id, !active)}
                >
                  {controlStateLabel(booleanKind, active)}
                </button>}
              </div>
            </div>
          );
        })}
      </div>}
      {hardwareNodes.length > 0 && <div className="lab-simulation__readings">
        <span>LECTURAS EN VIVO</span>
        {hardwareNodes.map((node) => {
          const status = result.statusByNode[node.id];
          return <div key={node.id}>
            <i className={running && status?.powered ? "is-on" : ""} />
            <strong>{node.data.instanceName}</strong>
            <small>{liveReadout(node)}</small>
          </div>;
        })}
      </div>}
    </section>
  );
}

function DiagnosticList({
  compact = false,
  diagnostics,
  embedded = false,
}: {
  compact?: boolean;
  diagnostics: Diagnostic[];
  embedded?: boolean;
}) {
  const visible = compact ? diagnostics.slice(0, 6) : diagnostics;

  return (
    <div className="lab-diagnostics">
      {!embedded && <div className="lab-diagnostics__heading">
        <span>DIAGNÓSTICO</span>
        <strong>{diagnostics.length}</strong>
      </div>}
      <div className="lab-diagnostics__list">
        {visible.map((item) => (
          <article className={`lab-diagnostic lab-diagnostic--${item.severity}`} key={item.id}>
            {item.severity === "error" ? <TriangleAlert size={17} /> :
              item.severity === "warning" ? <Info size={17} /> : <CheckCircle2 size={17} />}
            <p>{item.message}</p>
          </article>
        ))}
      </div>
      {compact && diagnostics.length > visible.length && (
        <button type="button" onClick={() => document.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="false"]')?.click()}>
          Ver {diagnostics.length - visible.length} más en Código y prueba
        </button>
      )}
    </div>
  );
}

function HistoryPanel({
  currentEntryId,
  embedded = false,
  entries,
  onRestore,
}: {
  currentEntryId: number | null;
  embedded?: boolean;
  entries: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
}) {
  const previousCount = Math.max(0, entries.length - 1);

  return (
    <section className="lab-history" aria-label="Historial de movimientos">
      {!embedded && <div className="lab-history__heading">
        <span><HistoryIcon size={15} /> HISTORIAL</span>
        <strong>{previousCount}/5</strong>
      </div>}
      <div className="lab-history__list">
        {[...entries].reverse().map((entry) => {
          const isCurrent = entry.id === currentEntryId;
          return (
            <button
              type="button"
              className={isCurrent ? "is-current" : ""}
              disabled={isCurrent}
              key={entry.id}
              onClick={() => onRestore(entry)}
              title={isCurrent ? "Estado actual" : `Volver a ${entry.label}`}
            >
              <Undo2 size={14} aria-hidden="true" />
              <span>
                <strong>{entry.label}</strong>
                <small>{entry.time}{isCurrent ? " · actual" : ""}</small>
              </span>
            </button>
          );
        })}
      </div>
      {entries.length === 1 && <p>Los últimos cinco movimientos aparecerán aquí.</p>}
    </section>
  );
}

export default function HardwareLab() {
  return (
    <ReactFlowProvider>
      <HardwareLabWorkspace />
    </ReactFlowProvider>
  );
}
