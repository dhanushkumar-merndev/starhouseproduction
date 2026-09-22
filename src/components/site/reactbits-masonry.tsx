"use client";

/**
 * Adapted from React Bits Masonry by David Haz (Copyright 2026).
 * https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/Components/Masonry
 * Licensed under MIT + Commons Clause; see reactbits-LICENSE.md.
 * Keeps the shortest-column layout and GSAP positioning from the original,
 * with measured content height, scoped animations, and reduced-motion support.
 */
import { gsap } from "gsap";
import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import styles from "./reactbits-masonry.module.css";

export interface MasonryItem {
  id: string;
  imageRatio: number;
  content: ReactNode;
}

interface GridItem extends MasonryItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

function subscribeToMotionPreference(callback: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", callback);
  return () => preference.removeEventListener("change", callback);
}

function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ReactBitsMasonry({ items }: { items: MasonryItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const hasPositioned = useRef(false);
  const hasEntered = useRef(false);
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getMotionPreference, () => false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // contentRect is untransformed: the monitor's perspective must not change
    // the column calculation while the camera moves towards its screen.
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const { grid, height } = useMemo(() => {
    if (!width) return { grid: [] as GridItem[], height: undefined };
    const columns = width >= 760 ? 3 : 2;
    const gap = width >= 760 ? 24 : 16;
    const columnWidth = (width - gap * (columns - 1)) / columns;
    const colHeights = new Array<number>(columns).fill(0);
    const grid = items.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = (columnWidth + gap) * col;
      const y = colHeights[col];
      const h = Math.round(columnWidth * child.imageRatio) + (width >= 760 ? 96 : 86);
      colHeights[col] += h + gap;
      return { ...child, x, y, w: columnWidth, h };
    });
    return { grid, height: Math.max(...colHeights) - gap };
  }, [items, width]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !grid.length) return;
    const elements = Array.from(container.children) as HTMLElement[];
    let frame = 0;
    let observer: MutationObserver | undefined;

    grid.forEach((item, index) => {
      const position = { x: item.x, y: item.y, width: item.w, height: item.h, opacity: 1 };
      if (hasPositioned.current && !reducedMotion) {
        gsap.to(elements[index], { ...position, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      } else {
        gsap.set(elements[index], position);
      }
    });
    hasPositioned.current = true;

    const reveal = () => {
      frame = 0;
      if (hasEntered.current) return;
      const active = Number(getComputedStyle(container).getPropertyValue("--services-active").trim() || "1");
      if (active < 0.99) return;
      hasEntered.current = true;
      observer?.disconnect();
      if (reducedMotion) return;
      gsap.fromTo(elements, {
        opacity: 0,
        y: (index) => grid[index].y + 28,
      }, {
        opacity: 1,
        y: (index) => grid[index].y,
        duration: 0.7,
        stagger: 0.055,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    if (!hasEntered.current) {
      const portal = container.closest("#monitor-portal");
      const scene = container.closest(".camera-studio");
      observer = new MutationObserver(() => {
        if (!frame) frame = requestAnimationFrame(reveal);
      });
      if (portal) observer.observe(portal, { attributes: true, attributeFilter: ["style"] });
      if (scene) observer.observe(scene, { attributes: true, attributeFilter: ["style"] });
      reveal();
    }

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      gsap.killTweensOf(elements);
    };
  }, [grid, reducedMotion]);

  return (
    <div ref={containerRef} className={styles.list} data-masonry-ready={Boolean(width)} style={{ height }}>
      {items.map((item) => (
        <div key={item.id} className={styles.itemWrapper} data-masonry-item={item.id}>
          {item.content}
        </div>
      ))}
    </div>
  );
}
