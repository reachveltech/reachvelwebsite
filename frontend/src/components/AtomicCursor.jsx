import { useEffect, useRef, useState } from "react";

/**
 * AtomicCursor — Reachvel-themed custom mouse pointer.
 *
 * - A solid orange nucleus dot tracks the mouse exactly (CSS transform).
 * - An outer ring follows with spring-like easing for a subtle "orbit".
 * - Trailing particles (small dots) emit while moving and gently fade.
 * - On click, a brief expanding ring + scatter burst evokes an atomic event.
 * - Hides on touch devices and over interactive form fields where native
 *   carets / pickers must remain visible.
 */
export default function AtomicCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Detect a real fine-pointer device (mouse/trackpad). Skip on touch.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    const trails = [];
    let lastEmit = 0;
    let raf;

    const onMove = (e) => {
      const dx = e.clientX - mouseX;
      const dy = e.clientY - mouseY;
      const moved = Math.hypot(dx, dy);
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Hover detection: scale up over interactive elements
      const t = e.target;
      const interactive = t && (t.closest("a, button, [role='button'], input, textarea, select, label, [data-cursor='link']"));
      const isFormField = t && t.matches?.("input, textarea, select, [contenteditable='true']");
      dot.dataset.hover = interactive ? "1" : "0";
      dot.dataset.hide = isFormField ? "1" : "0";
      ring.dataset.hover = interactive ? "1" : "0";
      ring.dataset.hide = isFormField ? "1" : "0";

      // Emit trail particles (rate-limited)
      const now = performance.now();
      if (moved > 1.5 && now - lastEmit > 28) {
        lastEmit = now;
        const n = document.createElement("span");
        n.className = "atomic-cursor-trail";
        n.style.left = `${e.clientX}px`;
        n.style.top = `${e.clientY}px`;
        document.body.appendChild(n);
        trails.push({ el: n, born: now });
        if (trails.length > 18) {
          const old = trails.shift();
          old.el.remove();
        }
      }
    };

    const onDown = (e) => {
      // Atomic burst: ring pulse + scattered nodes
      const burst = document.createElement("span");
      burst.className = "atomic-cursor-burst";
      burst.style.left = `${e.clientX}px`;
      burst.style.top = `${e.clientY}px`;
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 700);

      // 6 small particles flying outwards
      for (let i = 0; i < 6; i++) {
        const p = document.createElement("span");
        const a = (Math.PI * 2 * i) / 6;
        p.className = "atomic-cursor-spark";
        p.style.left = `${e.clientX}px`;
        p.style.top = `${e.clientY}px`;
        p.style.setProperty("--dx", `${Math.cos(a) * 28}px`);
        p.style.setProperty("--dy", `${Math.sin(a) * 28}px`);
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 500);
      }
    };

    const onLeave = () => {
      dot.dataset.hide = "1";
      ring.dataset.hide = "1";
    };
    const onEnter = () => {
      dot.dataset.hide = "0";
      ring.dataset.hide = "0";
    };

    const tick = () => {
      // Lerp the ring toward the dot for a soft orbit
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

      // Fade trails
      const now = performance.now();
      for (let i = trails.length - 1; i >= 0; i--) {
        const t = trails[i];
        const age = now - t.born;
        if (age > 600) {
          t.el.remove();
          trails.splice(i, 1);
        } else {
          const k = 1 - age / 600;
          t.el.style.opacity = String(k * 0.55);
          t.el.style.transform = `translate(-50%, -50%) scale(${0.4 + k * 0.6})`;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
      trails.forEach((t) => t.el.remove());
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} className="atomic-cursor-ring" aria-hidden="true" />
      <div ref={dotRef}  className="atomic-cursor-dot"  aria-hidden="true" />
    </>
  );
}
