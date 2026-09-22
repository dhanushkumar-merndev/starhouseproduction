"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  return Array.from({ length: BLADES }, (_, index) => {
    const a1 = (index / BLADES) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((index + 1) / BLADES) * Math.PI * 2 - Math.PI / 2;
    
    const startX = 50 + radius * Math.cos(a1);
    const startY = 50 + radius * Math.sin(a1);
    
    const nextX = 50 + radius * Math.cos(a2);
    const nextY = 50 + radius * Math.sin(a2);
    
    const angle = Math.atan2(nextY - startY, nextX - startX);
    const L = 10000;
    
    const endX = startX + L * Math.cos(angle);
    const endY = startY + L * Math.sin(angle);
    
    return `M ${startX.toFixed(2)} ${startY.toFixed(2)} L ${endX.toFixed(2)} ${endY.toFixed(2)}`;
  });
}

const HOLE = aperturePoints(30);
const SEAMS = bladeSeams(30);

export default function PageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const shown = useRef(pathname);
  const [phase, setPhase] = useState<'idle' | 'closing' | 'opening'>('opening');

  useEffect(() => {
    if (shown.current === pathname) return;
    shown.current = pathname;
    setPhase('opening');
    const done = setTimeout(() => setPhase('idle'), IRIS_MS);
    return () => clearTimeout(done);
  }, [pathname]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target || !target.href) return;
      
      if (target.target === '_blank' || target.origin !== window.location.origin) return;
      
      const url = new URL(target.href);
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const destination = url.pathname + url.search + url.hash;
      
      setPhase('closing');
      
      setTimeout(() => {
        router.push(destination);
      }, IRIS_MS);
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [router]);

  if (phase === 'idle') return null;
  const maskId = "iris-hole";
  return (
    <div key={phase === 'closing' ? 'closing' : pathname} className={`${styles.iris} ${phase === 'closing' ? styles.closing : styles.opening}`} aria-hidden="true">
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
        <rect x="0" y="0" width="100" height="100" fill="#0b0c0b" className={styles.shutterFade} />
        <g className={styles.blades}>
          <polygon className={styles.ring} points={HOLE} />
          {SEAMS.map((seam, index) => <path className={styles.edge} key={index} d={seam} />)}
        </g>
      </svg>
    </div>
  );
}
