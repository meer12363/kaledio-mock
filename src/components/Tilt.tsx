"use client";

import { useRef } from "react";

/** Tilts its child in 3D toward the pointer, with a moving glare. Touch devices get no tilt. */
export function Tilt({
  children,
  className = "",
  max = 9,
}: {
  children: React.ReactNode;
  className?: string;
  /** max tilt in degrees */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * max}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * max}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
    el.dataset.tilting = "true";
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    delete el.dataset.tilting;
  };

  return (
    <div className={`tilt-3d ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={ref} className="tilt-3d-inner">
        {children}
        <span className="tilt-3d-glare" aria-hidden="true" />
      </div>
    </div>
  );
}
