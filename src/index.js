const TIMER_DURATION_MS = 2500;

class ChwaziCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.touches = [];

    // Update the resolution of the canvas to match the window
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // add event listeners
    ["touchstart", "touchmove", "touchend", "touchcancel"].forEach(
      (eventName) =>
        this.canvas.addEventListener(eventName, (event) => this.onTouch(event))
    );
  }

  onTouch(event) {
    event.preventDefault();
    const touches = Array.from(event.touches);
    this.touches = touches;
    this.touches.length > 0 ? this.start() : this.stop();
  }

  start() {
    if (this.started) return;

    this.started = true;
    this.startedAt = Date.now();
    this.drawInterval = setInterval(() => this.draw());
  }

  stop() {
    this.started = false;
    this.startedAt = null;
    clearInterval(this.drawInterval);
    this.clean();
  }

  draw() {
    const context = this.canvas.getContext("2d");
    this.clean();

    const timeSinceStarted = Date.now() - this.startedAt;
    const color = "#" + (timeSinceStarted >>> 0).toString(16).slice(-6);

    this.touches.forEach((touch) => {
      // draw inner circle
      context.beginPath();
      context.fillStyle = color;
      context.arc(
        touch.clientX,
        touch.clientY,
        15 * window.devicePixelRatio || 1,
        0,
        2 * Math.PI
      );
      context.fill();

      // draw outer path
      context.beginPath();
      context.lineWidth = 2 * window.devicePixelRatio;
      context.strokeStyle = color;
      context.arc(
        touch.clientX,
        touch.clientY,
        18 * window.devicePixelRatio,
        0,
        ((2 * Math.PI) / TIMER_DURATION_MS) * timeSinceStarted
      );
      context.stroke();
    });
  }

  clean() {
    const context = this.canvas.getContext("2d");
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ChwaziCanvas(document.querySelector("canvas"));
});
