import { LANE_COUNT } from "../constants.js";

export function createInput({ signal, surface, osAPI, appId, laneCenters }) {
  const state = {
    moveLeft: false,
    moveRight: false,
    targetX: laneCenters[Math.floor(LANE_COUNT / 2)],
    dragging: false,
    pointerId: null,
    pointerStartX: 0,
    dragStartTarget: 0,
  };

  const isActive = () =>
    !osAPI?.getActiveAppId || osAPI.getActiveAppId() === appId;

  const onKeyDown = (event) => {
    if (!isActive()) return;
    const key = event.key.toLowerCase();
    if (["arrowleft", "a", "arrowright", "d", " "].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
    if (key === "arrowleft" || key === "a") state.moveLeft = true;
    if (key === "arrowright" || key === "d") state.moveRight = true;
  };

  const onKeyUp = (event) => {
    if (!isActive()) return;
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") state.moveLeft = false;
    if (key === "arrowright" || key === "d") state.moveRight = false;
  };

  const pointerToLaneX = (event) => {
    const rect = surface.getBoundingClientRect();
    const localX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const t = rect.width > 0 ? localX / rect.width : 0.5;
    const laneMin = laneCenters[0];
    const laneMax = laneCenters[laneCenters.length - 1];
    return laneMin + (laneMax - laneMin) * t;
  };

  surface.addEventListener("pointerdown", (event) => {
    if (!isActive()) return;
    event.preventDefault();
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.pointerStartX = event.clientX;
    state.dragStartTarget = state.targetX;
    state.targetX = pointerToLaneX(event);
    surface.setPointerCapture?.(event.pointerId);
  }, { signal });

  surface.addEventListener("pointermove", (event) => {
    if (!isActive()) return;
    if (state.dragging && state.pointerId === event.pointerId) {
      const rect = surface.getBoundingClientRect();
      const dx =
        ((event.clientX - state.pointerStartX) / Math.max(1, rect.width)) *
        (laneCenters[laneCenters.length - 1] - laneCenters[0]);
      state.targetX = Math.max(
        laneCenters[0],
        Math.min(
          laneCenters[laneCenters.length - 1],
          state.dragStartTarget + dx,
        ),
      );
    }
  }, { signal });

  const endDrag = (event) => {
    if (state.pointerId !== null && event.pointerId === state.pointerId) {
      state.dragging = false;
      state.pointerId = null;
    }
  };

  surface.addEventListener("pointerup", endDrag, { signal });
  surface.addEventListener("pointercancel", endDrag, { signal });

  document.addEventListener("keydown", onKeyDown, { signal, capture: true });
  document.addEventListener("keyup", onKeyUp, { signal, capture: true });

  return state;
}
