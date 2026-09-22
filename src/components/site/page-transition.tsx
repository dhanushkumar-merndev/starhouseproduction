"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./page-transition.module.css";

const IRIS_MS = 900;
const BLADES = 8;

/** Regular polygon around the middle of the 100x100 view box. */
function aperturePoints(radius: number) {
  return Array.from({ length: BLADES }, (_, index) => {
    const angle = (index / BLADES) * Math.PI * 2 - Math.PI / 2;
    return `${(50 + Math.cos(angle) * radius).toFixed(2)},${(50 + Math.sin(angle) * radius).toFixed(2)}`;
  }).join(" ");
}

/**
 * Seams between the blades, swept tangentially the way a real iris curves
 * rather than running straight out from the middle.
 */
function bladeSeams(radius: number) {
  const point = (angle: number, distance: number) =>
    `${(50 + Math.cos(angle) * distance).toFixed(2)} ${(50 + Math.sin(angle) * distance).toFixed(2)}`;
  return Array.from({ length: BLADES }, (_, index) => {
    const angle = ((index + 0.5) / BLADES) * Math.PI * 2 - Math.PI / 2;
    const sweep = (24 * Math.PI) / 180;
    return `M ${point(angle, radius)} Q ${point(angle + sweep * 0.45, 80)} ${point(angle + sweep, 170)}`;
  });
}

const HOLE = aperturePoints(30);
const SEAMS = bladeSeams(30);

/**
 * A route change commits before this can run, so the iris opens on the page
 * that has just arrived rather than closing over the one being left.
 */
export default function PageTransition() {
  const pathname = usePathname();
  // Compared against the route this mounted on rather than a "first run" flag:
  // effects are invoked twice in development, which fired the iris on load.
  const shown = useRef(pathname);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (shown.current === pathname) return;
    shown.current = pathname;
    setPlaying(true);
    const done = setTimeout(() => setPlaying(false), IRIS_MS);
    return () => clearTimeout(done);
  }, [pathname]);

  if (!playing) return null;
  const maskId = "iris-hole";
  return (
    <div key={pathname} className={styles.iris} aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100" height="100" fill="#fff" />
            <g className={styles.blades}>
              <polygon points={HOLE} fill="#000" />
            </g>
          </mask>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="#0b0c0b" mask={`url(#${maskId})`} />
        <g className={styles.blades}>
          <polygon className={styles.ring} points={HOLE} />
          {SEAMS.map((seam, index) => <path className={styles.edge} key={index} d={seam} />)}
        </g>
      </svg>
      <span className={styles.rec}><b />REC</span>
    </div>
  );
}
