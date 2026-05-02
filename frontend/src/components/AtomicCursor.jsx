import { useEffect, useRef, useState } from "react";

/**
 * AtomicCursor — a single orange dot that follows the mouse,
 * sitting on top of the OS's default cursor. Lightweight, zero lag.
 */
export default function AtomicCursor() {
  const dotRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    if (!dot) return;

    const onMove = (e) => {
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      dot.style.opacity = "1";
    };
    const onLeave = () => { dot.style.opacity = "0"; };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={dotRef} className="atomic-cursor-dot" aria-hidden="true" />;
}
