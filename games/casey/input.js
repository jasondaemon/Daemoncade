export function createInput({ root, onDirection, onPause, onStart, onToggleMute }) {
  const controller = new AbortController();
  const { signal } = controller;
  const isTouch = window.matchMedia?.("(pointer: coarse)")?.matches || navigator.maxTouchPoints > 0;
  const pressed = new Set();
  const state = {
    heldDir: null,
    bufferedDir: null,
  };

  const dirForKey = (key) => {
    if (["arrowup", "w"].includes(key)) return { x: 0, y: -1 };
    if (["arrowdown", "s"].includes(key)) return { x: 0, y: 1 };
    if (["arrowleft", "a"].includes(key)) return { x: -1, y: 0 };
    if (["arrowright", "d"].includes(key)) return { x: 1, y: 0 };
    return null;
  };

  const sameDir = (a, b) => a && b && a.x === b.x && a.y === b.y;

  const handleKey = (event, down) => {
    const key = event.key.toLowerCase();
    if (key === "p" && down) {
      onPause?.();
      return;
    }
    if (key === "m" && down) {
      onToggleMute?.();
      return;
    }
    if (key === "enter" && down) {
      onStart?.();
      return;
    }
    const dir = dirForKey(key);
    if (!dir) return;
    event.preventDefault();
    if (down) {
      if (event.repeat && sameDir(state.heldDir, dir)) return;
      pressed.add(key);
      state.heldDir = dir;
      state.bufferedDir = dir;
      onDirection?.(dir);
    } else {
      pressed.delete(key);
      if (sameDir(state.heldDir, dir)) {
        const remaining = Array.from(pressed).map(dirForKey).filter(Boolean);
        state.heldDir = remaining[0] || null;
        if (!state.heldDir) {
          state.bufferedDir = { x: 0, y: 0 };
        }
      }
    }
  };

  document.addEventListener("keydown", (event) => handleKey(event, true), { signal });
  document.addEventListener("keyup", (event) => handleKey(event, false), { signal });

  if (isTouch) {
    root.classList.add("casey-touch-enabled");
    const dpad = document.createElement("div");
    dpad.className = "casey-dpad";
    const buttons = [
      { dir: { x: 0, y: -1 }, label: "↑" },
      { dir: { x: -1, y: 0 }, label: "←" },
      { dir: { x: 1, y: 0 }, label: "→" },
      { dir: { x: 0, y: 1 }, label: "↓" },
    ];
    buttons.forEach((btn) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "casey-dpad-button";
      button.textContent = btn.label;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        state.heldDir = btn.dir;
        state.bufferedDir = btn.dir;
        onDirection?.(btn.dir);
      }, { signal });
      button.addEventListener("pointerup", (event) => {
        event.preventDefault();
        if (sameDir(state.heldDir, btn.dir)) {
          state.heldDir = null;
          state.bufferedDir = { x: 0, y: 0 };
        }
      }, { signal });
      button.addEventListener("pointercancel", (event) => {
        event.preventDefault();
        if (sameDir(state.heldDir, btn.dir)) {
          state.heldDir = null;
          state.bufferedDir = { x: 0, y: 0 };
        }
      }, { signal });
      dpad.appendChild(button);
    });

    const touchWrap = document.createElement("div");
    touchWrap.className = "casey-touch";
    touchWrap.appendChild(dpad);
    root.appendChild(touchWrap);

    const pauseBtn = document.createElement("button");
    pauseBtn.type = "button";
    pauseBtn.className = "casey-pause-button";
    pauseBtn.textContent = "Pause";
    pauseBtn.addEventListener("click", () => onPause?.(), { signal });
    root.appendChild(pauseBtn);
  }

  return {
    state,
    destroy: () => controller.abort(),
  };
}
