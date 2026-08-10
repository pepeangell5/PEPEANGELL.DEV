import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
  useReactFlow,
} from "@xyflow/react";

export type WirePoint = {
  x: number;
  y: number;
};

export type WireEdgeData = {
  boardId?: string;
  color?: string;
  controlX?: number;
  controlY?: number;
  energized?: boolean;
  groundReturn?: boolean;
  hiddenByBoardView?: boolean;
  side?: "bottom" | "top";
  simulatedVoltage?: number;
  simulationActive?: boolean;
  waypoints?: WirePoint[];
};

export type WireEdge = Edge<WireEdgeData, "editable-wire">;

type RouteSegment = {
  from: WirePoint;
  insertIndex: number;
  to: WirePoint;
};

const PIN_INTERACTION_CLEARANCE = 18;
const LONG_PRESS_DELAY = 420;
const LONG_PRESS_MOVE_TOLERANCE = 6;
const WIRE_COLORS = [
  { label: "Negro", value: "#191b20" },
  { label: "Rojo", value: "#ff4058" },
  { label: "Azul", value: "#30d8ff" },
  { label: "Amarillo", value: "#ffd54a" },
  { label: "Verde", value: "#58e097" },
  { label: "Rosa", value: "#ff49ad" },
  { label: "Morado", value: "#b88cff" },
  { label: "Blanco", value: "#f5f7f6" },
] as const;

function samePoint(a: WirePoint, b: WirePoint) {
  return Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;
}

function buildOrthogonalRoute(
  source: WirePoint,
  target: WirePoint,
  waypoints: WirePoint[],
) {
  const corePoints = [...waypoints, target];
  const points: WirePoint[] = [source];
  const segments: RouteSegment[] = [];

  const appendPoint = (point: WirePoint, insertIndex: number) => {
    const previous = points[points.length - 1];
    if (samePoint(previous, point)) return;
    points.push(point);
    segments.push({ from: previous, insertIndex, to: point });
  };

  corePoints.forEach((point, index) => {
    const previous = points[points.length - 1];
    if (Math.abs(previous.x - point.x) > 0.01 && Math.abs(previous.y - point.y) > 0.01) {
      appendPoint({ x: point.x, y: previous.y }, index);
    }
    appendPoint(point, index);
  });

  return {
    path: points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" "),
    points,
    segments,
  };
}

function trimRoute(points: WirePoint[], clearance: number) {
  if (points.length < 2) return "";

  const trimFromStart = (routePoints: WirePoint[]) => {
    const trimmed = routePoints.map((point) => ({ ...point }));
    let remaining = clearance;

    while (trimmed.length > 1 && remaining > 0) {
      const start = trimmed[0];
      const next = trimmed[1];
      const length = Math.hypot(next.x - start.x, next.y - start.y);
      if (length <= remaining) {
        remaining -= length;
        trimmed.shift();
        continue;
      }

      const ratio = remaining / length;
      trimmed[0] = {
        x: start.x + (next.x - start.x) * ratio,
        y: start.y + (next.y - start.y) * ratio,
      };
      remaining = 0;
    }

    return trimmed;
  };

  const withoutStart = trimFromStart(points);
  const trimmed = trimFromStart([...withoutStart].reverse()).reverse();
  if (trimmed.length < 2) return "";

  return trimmed
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function distanceToSegment(point: WirePoint, segment: RouteSegment) {
  if (Math.abs(segment.from.x - segment.to.x) < 0.01) {
    const minY = Math.min(segment.from.y, segment.to.y);
    const maxY = Math.max(segment.from.y, segment.to.y);
    const nearestY = Math.max(minY, Math.min(maxY, point.y));
    return Math.hypot(point.x - segment.from.x, point.y - nearestY);
  }
  const minX = Math.min(segment.from.x, segment.to.x);
  const maxX = Math.max(segment.from.x, segment.to.x);
  const nearestX = Math.max(minX, Math.min(maxX, point.x));
  return Math.hypot(point.x - nearestX, point.y - segment.from.y);
}

export default function EditableWireEdge({
  data,
  id,
  markerEnd,
  selected,
  sourceX,
  sourceY,
  style,
  targetX,
  targetY,
}: EdgeProps<WireEdge>) {
  const { screenToFlowPosition, setEdges } = useReactFlow();
  const suppressClickRef = useRef(false);
  const [dragPreview, setDragPreview] = useState<{
    active: boolean;
    index: number;
    point: WirePoint;
  } | null>(null);
  const waypoints = data?.waypoints ?? [{
    x: data?.controlX ?? (sourceX + targetX) / 2,
    y: data?.controlY ?? (sourceY + targetY) / 2,
  }];
  const visibleWaypoints = dragPreview?.active
    ? waypoints.map((waypoint, index) =>
        index === dragPreview.index ? dragPreview.point : waypoint,
      )
    : waypoints;
  const route = buildOrthogonalRoute(
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
    visibleWaypoints,
  );
  const wireColor = data?.color ?? String(style?.stroke ?? "#30d8ff");
  const interactionPath = trimRoute(route.points, PIN_INTERACTION_CLEARANCE);
  const toolbarPortalRoot = typeof document === "undefined"
    ? null
    : document.querySelector<HTMLElement>(".hardware-lab");

  const updateWaypoints = (nextWaypoints: WirePoint[]) => {
    setEdges((currentEdges) => currentEdges.map((edge) =>
      edge.id === id
        ? { ...edge, data: { ...edge.data, waypoints: nextWaypoints } }
        : edge,
    ));
  };

  const dragWaypoint = (index: number) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    let latestPoint = waypoints[index];
    let moved = false;

    const move = (pointerEvent: PointerEvent) => {
      moved = true;
      latestPoint = screenToFlowPosition({ x: pointerEvent.clientX, y: pointerEvent.clientY });
      setDragPreview({ active: true, index, point: latestPoint });
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      if (moved) {
        updateWaypoints(waypoints.map((waypoint, waypointIndex) =>
          waypointIndex === index ? latestPoint : waypoint,
        ));
      }
      setDragPreview(null);
    };

    setDragPreview({ active: true, index, point: latestPoint });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  };

  const insertPoint = (point: WirePoint) => {
    const nearest = route.segments.reduce((best, segment) => {
      const distance = distanceToSegment(point, segment);
      return distance < best.distance ? { distance, segment } : best;
    }, { distance: Number.POSITIVE_INFINITY, segment: route.segments[0] });
    const insertIndex = nearest.segment?.insertIndex ?? waypoints.length;
    const nextWaypoints = [...waypoints];
    nextWaypoints.splice(insertIndex, 0, point);
    updateWaypoints(nextWaypoints);
  };

  const createPointOnLongPress = (event: ReactPointerEvent<SVGPathElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();

    const origin = { x: event.clientX, y: event.clientY };
    let created = false;
    let cancelled = false;
    const activationTimer = window.setTimeout(() => {
      if (cancelled) return;
      created = true;
      suppressClickRef.current = true;
      insertPoint(screenToFlowPosition(origin));
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 600);
    }, LONG_PRESS_DELAY);

    const move = (pointerEvent: PointerEvent) => {
      if (created) return;
      const movedDistance = Math.hypot(
        pointerEvent.clientX - origin.x,
        pointerEvent.clientY - origin.y,
      );
      if (movedDistance > LONG_PRESS_MOVE_TOLERANCE) {
        cancelled = true;
        window.clearTimeout(activationTimer);
      }
    };
    const stop = () => {
      window.clearTimeout(activationTimer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  };

  const addPointFromLine = (event: ReactMouseEvent<SVGPathElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setEdges((currentEdges) => currentEdges.map((edge) => ({
      ...edge,
      selected: edge.id === id,
      zIndex: edge.id === id ? 30 : 0,
    })));
    insertPoint(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  };

  const addPointToLongestSegment = () => {
    const longest = route.segments.reduce((best, segment) => {
      const length = Math.hypot(segment.to.x - segment.from.x, segment.to.y - segment.from.y);
      return length > best.length ? { length, segment } : best;
    }, { length: -1, segment: route.segments[0] });
    if (!longest.segment) return;
    insertPoint({
      x: (longest.segment.from.x + longest.segment.to.x) / 2,
      y: (longest.segment.from.y + longest.segment.to.y) / 2,
    });
  };

  const removePoint = (index: number) => (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    updateWaypoints(waypoints.filter((_, waypointIndex) => waypointIndex !== index));
  };

  const setColor = (color: string) => {
    setEdges((currentEdges) => currentEdges.map((edge) =>
      edge.id === id
        ? {
            ...edge,
            data: { ...edge.data, color },
            style: { ...edge.style, stroke: color },
          }
        : edge,
    ));
  };

  const removeWire = () => {
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== id));
  };

  const selectWire = (event: ReactMouseEvent<SVGPathElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const wireIdsAtPointer = new Set(
      document.elementsFromPoint(event.clientX, event.clientY)
        .map((element) => (element as SVGPathElement).dataset?.wireId)
        .filter((wireId): wireId is string => Boolean(wireId)),
    );

    setEdges((currentEdges) => {
      const candidates = currentEdges
        .filter((edge) => wireIdsAtPointer.has(edge.id))
        .map((edge) => edge.id);
      const selectedCandidate = currentEdges.find((edge) =>
        edge.selected && wireIdsAtPointer.has(edge.id),
      );
      const selectedIndex = selectedCandidate ? candidates.indexOf(selectedCandidate.id) : -1;
      const nextId = selectedIndex >= 0 && candidates.length > 1
        ? candidates[(selectedIndex + 1) % candidates.length]
        : id;

      return currentEdges.map((edge) => ({
        ...edge,
        selected: edge.id === nextId,
        zIndex: edge.id === nextId ? 30 : 0,
      }));
    });
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={route.path}
        markerEnd={markerEnd}
        style={{ ...style, stroke: wireColor }}
        interactionWidth={0}
      />
      {data?.simulationActive && data.energized && <path
        className={`lab-wire-flow${data.groundReturn ? " is-ground-return" : ""}`}
        d={route.path}
        style={{ "--wire-flow-color": wireColor } as React.CSSProperties}
      />}
      {interactionPath && <path
        className="lab-wire-hit-path"
        data-wire-id={id}
        d={interactionPath}
        aria-label="Seleccionar cable o mantener presionado para crear un punto"
        onClick={selectWire}
        onDoubleClick={addPointFromLine}
        onPointerDown={createPointOnLongPress}
        onContextMenu={(event) => event.preventDefault()}
      />}
      <EdgeLabelRenderer>
        {selected && visibleWaypoints.map((point, index) => (
          <button
            type="button"
            className={`lab-wire-control nodrag nopan is-selected${dragPreview?.index === index && dragPreview.active ? " is-dragging-origin" : ""}`}
            key={`${id}-point-${index}`}
            style={{ transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)` }}
            onDoubleClick={removePoint(index)}
            onPointerDown={dragWaypoint(index)}
            onContextMenu={(event) => event.preventDefault()}
            aria-label={`Mover punto ${index + 1} del cable`}
            title="Arrastra para mover; doble clic para eliminar"
          />
        ))}
      </EdgeLabelRenderer>
      {selected && toolbarPortalRoot && createPortal(<div className="lab-wire-tools nodrag nopan">
          <div className="lab-wire-colors" aria-label="Color del cable">
            {WIRE_COLORS.map((color) => (
              <button
                type="button"
                key={color.value}
                className={wireColor.toLowerCase() === color.value ? "is-active" : ""}
                style={{ "--wire-swatch": color.value } as React.CSSProperties}
                aria-label={`Cable ${color.label.toLowerCase()}`}
                aria-pressed={wireColor.toLowerCase() === color.value}
                title={color.label}
                onClick={() => setColor(color.value)}
              />
            ))}
          </div>
          <button type="button" onClick={addPointToLongestSegment} aria-label="Añadir punto de ruta" title="Añadir punto de ruta">
            <Plus size={14} />
          </button>
          <button className="is-danger" type="button" onClick={removeWire} aria-label="Eliminar cable" title="Eliminar cable">
            <Trash2 size={14} />
          </button>
        </div>, toolbarPortalRoot)}
    </>
  );
}
