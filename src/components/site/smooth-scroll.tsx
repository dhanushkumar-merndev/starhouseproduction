"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { isScrollLocked } from "./scroll-lock";
import "lenis/dist/lenis.css";

/**
 * Wheel input is read as a direction only, never as a distance: while the
 * wheel is being turned the page travels at WHEEL_SPEED, so a hard flick and
 * a gentle nudge move at exactly the same rate. The position is advanced once
 * per animation frame, which keeps the camera scene's target moving linearly
 * instead of in throttled hops. WHEEL_SPEED is the only dial for pace: at
 * 3000 one wheel notch covers roughly a third of a viewport.
 */
const WHEEL_SPEED = 3000;
/** How long one wheel event keeps the page moving before it coasts to a stop. */
const WHEEL_IMPULSE = 150;
/**
 * Seconds spent ramping in and out of full speed. Kept short so a single notch
 * reaches full pace almost at once — a long ramp is what made this feel slow.
 */
const WHEEL_RAMP = 0.035;
/** Lenis still does the easing: the loop only feeds it a steadily moving target. */
const WHEEL_LERP = 0.14;

/** True when the wheel belongs to a scrollable element that still has room to move. */
function scrollableAncestor(target: EventTarget | null, direction: number) {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight) {
      const room = direction < 0 ? node.scrollTop > 0 : node.scrollTop + node.clientHeight < node.scrollHeight - 1;
      if (room) return true;
    }
    node = node.parentElement;
  }
  return false;
}

/** One page-level scroller; the 3D scene reads its native scroll position. */
export default function SmoothScroll() {
  const pathname = usePathname();
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    let frame = 0;
    const layers = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    function updateLayers() {
      frame = 0;
      for (const layer of layers) {
        const rect = layer.parentElement!.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > window.innerHeight + 100) continue;
        const offset = preference.matches ? 0 : (window.innerHeight * 0.5 - rect.top - rect.height * 0.5) * Number(layer.dataset.parallax);
        layer.style.setProperty("--parallax-y", `${Math.max(-100, Math.min(100, offset))}px`);
        layer.style.setProperty("--parallax-progress", String(preference.matches ? 0.4 : Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)))));
      }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(updateLayers); }

    let direction = 0;
    let travelUntil = 0;
    let throttle = 0;
    let position = 0;
    let travelFrame = 0;
    let lastFrame = 0;

    function travel(now: number) {
      travelFrame = 0;
      if (!lenis || !direction) return;
      // The first frame only seeds the clock: a rAF timestamp can predate the
      // performance.now() taken in the wheel handler, which would otherwise
      // hand us a negative step.
      const step = lastFrame ? Math.min(Math.max((now - lastFrame) / 1000, 0), 0.1) : 0;
      lastFrame = now;
      const moving = now < travelUntil;
      throttle += ((moving ? 1 : 0) - throttle) * Math.min(1, step / WHEEL_RAMP);
      // Only give up once the impulse has run out and the ramp has decayed,
      // never on a short frame.
      if (!moving && throttle < 0.004) {
        throttle = 0;
        direction = 0;
        return;
      }
      if (step > 0 && throttle > 0) {
        position = Math.max(0, Math.min(lenis.limit, position + direction * WHEEL_SPEED * throttle * step));
        // Target only — Lenis lerps the real position onto it, so the motion
        // keeps its glide and coasts to rest when the wheel stops.
        lenis.scrollTo(position, { lerp: WHEEL_LERP });
      }
      travelFrame = requestAnimationFrame(travel);
    }

    function pushWheel(event: WheelEvent) {
      // The services option wheel claims its own events in the capture phase.
      if (!lenis || event.defaultPrevented || event.ctrlKey) return;
      // The intro holds the page; swallow the event rather than moving it.
      if (isScrollLocked()) { event.preventDefault(); return; }
      const wanted = Math.sign(event.deltaY);
      if (!wanted || scrollableAncestor(event.target, wanted)) return;
      event.preventDefault();
      // Resync whenever motion restarts, so native scrolls aren't fought.
      if (!travelFrame) {
        position = lenis.targetScroll;
        lastFrame = 0;
      }
      if (wanted !== direction) {
        direction = wanted;
        throttle = 0;
      }
      travelUntil = performance.now() + WHEEL_IMPULSE;
      if (!travelFrame) travelFrame = requestAnimationFrame(travel);
    }

    function configure() {
      lenis?.destroy();
      lenis = preference.matches ? undefined : new Lenis({
        autoRaf: true,
        lerp: 0.085,
        // pushWheel/travel set the target at a fixed rate; Lenis still eases onto it.
        smoothWheel: false,
        syncTouch: false,
        // Lenis reads the root scroll-padding, matching native anchor links.
        anchors: { duration: 1.25 },
      });
      direction = 0;
      throttle = 0;
      updateLayers();
    }
    configure();
    window.addEventListener("wheel", pushWheel, { passive: false });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    preference.addEventListener("change", configure);
    return () => {
      lenis?.destroy();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(travelFrame);
      window.removeEventListener("wheel", pushWheel);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", configure);
      layers.forEach(layer => {
        layer.style.removeProperty("--parallax-y");
        layer.style.removeProperty("--parallax-progress");
      });
    };
  }, [pathname]);
  return null;
}
