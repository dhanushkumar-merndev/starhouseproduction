"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { reels } from "./studio-content";
import styles from "./reel-wall.module.css";

/**
 * The wall is an arc that bows AWAY from you: the middle card sits furthest
 * back and the cards toward the edges swing forward, so they grow and turn to
 * face the middle. Bowing it the other way — the middle nearest — makes a
 * fanned stack of shrinking cards, which is a different thing entirely.
 */
const STEP_DEGREES = 21;
/** The arc's radius sideways (a share of the stage) and toward the viewer. */
const SPREAD = 0.58;
const DEPTH = 900;
/** A card has to be dragged this far before it counts as a turn of the wall. */
const DRAG_STEP = 90;
/** The wall turns first and opens second, so the card you pressed is facing you. */
const TURN_MS = 560;

const wrap = (index: number) => (index + reels.length) % reels.length;

/** The shortest way round the ring, so the ends do not unwind the long way. */
function offsetFrom(index: number, active: number) {
  const raw = index - active;
  const half = reels.length / 2;
  if (raw > half) return raw - reels.length;
  if (raw < -half) return raw + reels.length;
  return raw;
}

export default function ReelWall() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<{ index: number; from: DOMRect } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(1440);
  const stage = useRef<HTMLUListElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const turnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef({ id: -1, startX: 0, startIndex: 0, moved: 0 });

  // The gap between cards is a share of the stage, so the arc keeps its shape
  // from a phone to a wide desktop.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const turnTo = useCallback((index: number) => {
    if (turnTimer.current) { clearTimeout(turnTimer.current); turnTimer.current = null; }
    setActive(wrap(index));
  }, []);

  // Pointer drag: the wall follows the finger, then settles on the nearest card.
  function startDrag(event: React.PointerEvent<HTMLUListElement>) {
    if (event.button !== 0 || open) return;
    drag.current = { id: event.pointerId, startX: event.clientX, startIndex: active, moved: 0 };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLUListElement>) {
    if (drag.current.id !== event.pointerId) return;
    const travelled = event.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(travelled));
    const steps = Math.round(-travelled / DRAG_STEP);
    const wanted = wrap(drag.current.startIndex + steps);
    if (wanted !== active) setActive(wanted);
  }

  function endDrag(event: React.PointerEvent<HTMLUListElement>) {
    if (drag.current.id !== event.pointerId) return;
    drag.current.id = -1;
    setDragging(false);
  }

  // A horizontal wheel turns the wall; a vertical one is left alone so the page
  // keeps scrolling the way it does everywhere else.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    let last = 0;
    let amount = 0;
    function onWheel(event: WheelEvent) {
      const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;
      if (!sideways) return;
      const delta = event.shiftKey && Math.abs(event.deltaX) < 1 ? event.deltaY : event.deltaX;
      if (Math.abs(delta) < 2) return;
      event.preventDefault();
      const now = performance.now();
      if (now - last < 420) return;
      amount += delta;
      if (Math.abs(amount) > 34) {
        setActive(current => wrap(current + (amount > 0 ? 1 : -1)));
        last = now;
        amount = 0;
      }
    }
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => () => { if (turnTimer.current) clearTimeout(turnTimer.current); }, []);

  function press(index: number, event: React.MouseEvent<HTMLButtonElement>) {
    // A drag that ends on a card is a drag, not a press.
    if (drag.current.moved > 8) { drag.current.moved = 0; return; }
    const card = event.currentTarget;
    const reveal = () => {
      opener.current = card;
      setOpen({ index, from: card.getBoundingClientRect() });
    };
    if (index === active) { reveal(); return; }
    // Turn the wall first: the card rotates to the front, then opens from there.
    turnTo(index);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { reveal(); return; }
    turnTimer.current = setTimeout(reveal, TURN_MS);
  }

  const dismiss = useCallback(() => {
    const element = panel.current;
    const restore = opener.current;
    const finish = () => {
      setOpen(null);
      restore?.focus({ preventScroll: true });
    };
    if (!element || !open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    const to = element.getBoundingClientRect();
    const from = open.from;
    gsap.to(element, {
      x: from.left + from.width / 2 - (to.left + to.width / 2),
      y: from.top + from.height / 2 - (to.top + to.height / 2),
      scaleX: from.width / to.width,
      scaleY: from.height / to.height,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: finish,
    });
  }, [open]);

  // Opening reads the card's rectangle and grows the panel out of it, so the
  // detail arrives from the card you pressed rather than on top of it.
  useEffect(() => {
    const element = panel.current;
    if (!open || !element) return;
    closeButton.current?.focus({ preventScroll: true });
    const to = element.getBoundingClientRect();
    const from = open.from;
    const tween = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      : gsap.fromTo(element, {
          x: from.left + from.width / 2 - (to.left + to.width / 2),
          y: from.top + from.height / 2 - (to.top + to.height / 2),
          scaleX: from.width / to.width,
          scaleY: from.height / to.height,
          opacity: 0.5,
        }, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 0.62, ease: "power3.out" });
    return () => { tween.kill(); };
  }, [open]);

  // While the detail is up it owns the keyboard, and the page underneath holds.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  function onStageKey(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    turnTo(active + (event.key === "ArrowRight" ? 1 : -1));
  }

  const radius = Math.max(520, width * SPREAD);
  const shown = open && reels[open.index];

  return (
    <section className={styles.wall} aria-labelledby="reel-wall-heading">
      <div className={styles.head}>
        <p className={styles.eyebrow}><b />THE REEL WALL</p>
        <h2 id="reel-wall-heading">Every frame<br />we <em>stand behind.</em></h2>
        <p>Turn the wall, then open a reel to read what went into it.</p>
      </div>

      <ul
        className={styles.stage}
        ref={stage}
        data-dragging={dragging}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onStageKey}
      >
        {reels.map((reel, index) => {
          const offset = offsetFrom(index, active);
          const angle = (offset * STEP_DEGREES * Math.PI) / 180;
          // Perspective alone does the scaling: a card that has swung forward
          // is nearer the camera, so it is larger without being scaled.
          const x = Math.sin(angle) * radius;
          const z = (1 - Math.cos(angle)) * DEPTH;
          const transform = `translate(-50%, -50%) translateX(${x.toFixed(1)}px) translateZ(${z.toFixed(1)}px) rotateY(${-offset * STEP_DEGREES}deg)`;
          return (
            <li
              key={reel.title}
              className={styles.card}
              data-active={index === active}
              data-settled={!dragging}
              style={{ transform, zIndex: Math.round(z) }}
            >
              <button
                type="button"
                className={styles.cardButton}
                onClick={event => press(index, event)}
                aria-label={`${reel.title} — open details`}
              >
                <span className={styles.cardPhoto} style={{ backgroundImage: `url('${reel.image}')`, backgroundSize: reel.size, backgroundPosition: reel.frame }} />
                <span className={styles.cardShade} />
                <span className={styles.cardOpen} aria-hidden="true">↗</span>
                <span className={styles.cardText}>
                  <span className={styles.cardIndex}>{String(index + 1).padStart(2, "0")} / {reel.kicker}</span>
                  <h3>{reel.title}</h3>
                  <p>{reel.tagline}</p>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className={styles.controls}>
        <span className={styles.hint}>⇄ DRAG TO TURN THE WALL</span>
        <div className={styles.pager}>
          <button type="button" onClick={() => turnTo(active - 1)} aria-label="Previous reel">←</button>
          <span className={styles.count}>
            {String(active + 1).padStart(2, "0")}<i /><b>{String(reels.length).padStart(2, "0")}</b>
          </span>
          <button type="button" onClick={() => turnTo(active + 1)} aria-label="Next reel">→</button>
        </div>
        <Link className="text-link" href="/contact">START A PROJECT <span aria-hidden="true">↗</span></Link>
      </div>

      {shown && (
        <div className={styles.backdrop} onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
          <div
            className={styles.panel}
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={shown.title}
          >
            <button type="button" className={styles.close} ref={closeButton} onClick={dismiss} aria-label="Close">✕</button>
            <div className={styles.panelPhoto} style={{ backgroundImage: `url('${shown.image}')`, backgroundSize: shown.size, backgroundPosition: shown.frame }} role="img" aria-label={`${shown.title} concept artwork`} />
            <div className={styles.panelBody}>
              <p className={styles.panelKicker}>{String(open.index + 1).padStart(2, "0")} — {shown.kicker}</p>
              <h3>{shown.headline}<em>.</em></h3>
              <p>{shown.detail}</p>
              <ul className={styles.panelFacts}>
                {shown.facts.map(fact => <li key={fact}>{fact}</li>)}
              </ul>
              <Link className={styles.panelLink} href="/contact">MAKE ONE LIKE THIS <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
