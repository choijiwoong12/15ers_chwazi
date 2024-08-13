const TIMER_DURATION_MS = 1000; // 1.5s
const COLORS = [
  "#b91c1c",
  "#c2410c",
  "#b45309",
  "#a16207",
  "#4d7c0f",
  "#15803d",
  "#047857",
  "#0f766e",
  "#0369a1",
  "#1d4ed8",
  "#7e22ce",
  "#be185d",
];

class ChwaziCanvas {
  ticking = false;
  touches = {};

  constructor(canvas) {
    this.canvas = canvas;

    this.#setCanvasDimensions();
    this.#addEventListeners();
  }

  start() {
    if (this.ticking) return;

    this.ticking = true;
    this.completed = false;
    this.tickingStartedAt = Date.now();
    this.tickFn = setInterval(() => this.tick());
  }

  restart() {
    if (this.ticking) {
      this.completed = false;
      this.tickingStartedAt = Date.now();
    } else {
      clearInterval(this.tickFn);
      this.start();
    }
  }

  stop() {
    if (!this.ticking) return;

    clearInterval(this.tickFn);
    this.ticking = false;
  }

  complete() {
    this.completed = true;

    this.number = parseInt(num.value);
    this.selection = selection.value;

    const touchIdentifiers = Object.keys(this.touches);
    // random sort identifiers
    fy(touchIdentifiers);

    if (this.selection == "Fingers") {
      touchIdentifiers.forEach((identifier, index) => {
        const position = index + 1;
        this.touches[identifier] = {
          ...this.touches[identifier],
          selected: position <= this.number,
          position,
        };
      });
    } else {
      const possibleColors = [...COLORS];
      fy(possibleColors);
      chunkify(touchIdentifiers, this.number).forEach((identifiers, index) => {
        const group = index + 1;
        identifiers.forEach((identifier) => {
          this.touches[identifier] = {
            ...this.touches[identifier],
            group,
            color: possibleColors[index],
          };
        });
      });
    }
  }

  tick() {
    if (
      this.tickingStartedAt + TIMER_DURATION_MS < Date.now() &&
      !this.completed
    )
      this.complete();
    this.draw();
  }

  #onTouchStart(event) {
    if (this.completed) {
      this.completed = false;
      this.touches = {};
    }

    Array.from(event.changedTouches).forEach((touch) => {
      const existing = Object.values(this.touches).map((touch) => touch.color);
      const possible = COLORS.filter((v) => !existing.includes(v));
      const color = possible[~~(Math.random() * possible.length)];

      this.touches[touch.identifier] = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        color,
      };
    });

    this.ticking ? this.restart() : this.start();
  }

  #onTouchMove(event) {
    Array.from(event.changedTouches).forEach((touch) => {
      this.touches[touch.identifier] = {
        ...this.touches[touch.identifier],
        clientX: touch.clientX,
        clientY: touch.clientY,
      };
    });
  }

  #onTouchCancel(event) {
    if (this.completed) return;

    Array.from(event.changedTouches).forEach((touch) => {
      delete this.touches[touch.identifier];
    });

    if (Object.keys(this.touches).length === 0) {
      this.stop();
      this.clean();
    } else {
      this.restart();
    }
  }

  #onTouchEnd(event) {
    if (this.completed) return;

    Array.from(event.changedTouches).forEach((touch) => {
      delete this.touches[touch.identifier];
    });

    if (Object.keys(this.touches).length === 0) {
      this.stop();
      this.clean();
    } else {
      this.restart();
    }
  }

  #setCanvasDimensions() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  #addEventListeners() {
    this.canvas.addEventListener("touchstart", (event) =>
      this.#onTouchStart(event)
    );
    this.canvas.addEventListener("touchmove", (event) =>
      this.#onTouchMove(event)
    );
    this.canvas.addEventListener("touchend", (event) =>
      this.#onTouchEnd(event)
    );
    this.canvas.addEventListener("touchcancel", (event) =>
      this.#onTouchCancel(event)
    );
  }

  draw() {
    const context = this.canvas.getContext("2d");
    this.clean();

    // fill the canvas of the first selected color
    if (this.completed && this.selection == "Fingers") {
      if (this.number > 1) {
        context.fillStyle = "black";
      } else {
        const { color } = Object.values(this.touches).find(
          (touch) => touch.position === 1
        );
        context.fillStyle = color;
      }
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    Object.values(this.touches).forEach((touch) =>
      this.#drawTouch(context, touch)
    );
  }

  #drawTouch(context, touch) {
    const timeSinceStarted = Date.now() - this.tickingStartedAt;

    if (this.completed && this.selection == "Fingers" && !touch.selected)
      return;

    // white background
    context.beginPath();
    context.fillStyle = "white";
    context.arc(
      touch.clientX,
      touch.clientY,
      25 * window.devicePixelRatio,
      0,
      2 * Math.PI
    );
    context.fill();

    // inner
    context.beginPath();
    context.fillStyle = touch.color;
    context.arc(
      touch.clientX,
      touch.clientY,
      15 * window.devicePixelRatio || 1,
      0,
      2 * Math.PI
    );
    context.fill();

    // outer
    context.beginPath();
    context.lineWidth = 2 * window.devicePixelRatio;
    context.strokeStyle = touch.color;
    context.arc(
      touch.clientX,
      touch.clientY,
      18 * window.devicePixelRatio,
      0,
      ((2 * Math.PI) / TIMER_DURATION_MS) * timeSinceStarted
    );
    context.stroke();
  }

  clean() {
    const context = this.canvas.getContext("2d");
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

// optimized Fisher-Yates algorithm: https://stackoverflow.com/a/25984542
function fy(a, b, c, d) {
  //array,placeholder,placeholder,placeholder
  c = a.length;
  while (c)
    (b = (Math.random() * c--) | 0), (d = a[c]), (a[c] = a[b]), (a[b] = d);
}

function chunkify(array, n) {
  let result = [];
  for (let i = n; i > 0; i--) {
    result.push(array.splice(0, Math.ceil(array.length / i)));
  }
  return result;
}

document.addEventListener("DOMContentLoaded", () => {
  new ChwaziCanvas(document.querySelector("canvas"));

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }
});
