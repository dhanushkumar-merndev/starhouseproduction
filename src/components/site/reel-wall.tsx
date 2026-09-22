"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { reels } from "./studio-content";
import styles from "./reel-wall.module.css";

/**
 * The wall is a ring of cards seen from INSIDE it, and it is built the way a
 * carousel of this kind has to be built: the ring is ONE element carrying both
 * the perspective and the rotation, and the cards are arms bolted to it at a
 * fixed angle each. Turning the wall then moves a single transform, so the
 * whole ring swings as one piece — rotating each card on its own instead lets
 * them drift out of formation and costs a layout per card per frame.
 *
 * With the camera at the ring's centre, the card facing you sits at the far
 * wall and reads smallest; the ones either side swing round toward the camera,
 * growing until they pass the edges of the frame half-cropped.
 *
 *   card:  rotateY(slot × STEP) translateZ(−RADIUS)   — fixed, set once
 *   ring:  perspective(P) rotateY(angle)              — the only moving part
 */
const SLOTS = 12;
const STEP_DEGREES = 360 / SLOTS;
/** Shallow on purpose: the depth is what throws the outer cards past the edge. */
const PERSPECTIVE = 500;
/** The ring spans the stage, so the cards at its sides meet the frame edges. */
const RADIUS_RATIO = 0.5;
/** Only the far half is drawn. Past this the ring has come round behind you. */
const VISIBLE_ARC = 100;
/**
 * Drag feel: about 340px of travel brings the next card round to the front.
 * Tracking the pointer one-to-one at the FRONT of the ring is too fast to
 * follow, because a card accelerates as it swings out toward the camera — the
 * edges of the wall move several times faster than the middle does.
 */
const DEGREES_PER_PX = 0.088;
/** The wall turns first and opens second, so the card you pressed is facing you. */
const TURN_MS = 560;

/** The shortest way round to an angle, so the ring never unwinds the long way. */
function shortestTurn(from: number, to: number) {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

/** An angle folded into (-180, 180], which is what the cull measures against. */
const foldAngle = (degrees: number) => ((((degrees % 360) + 540) % 360) - 180);

export default function ReelWall() {
  // The ring's rotation, in degrees, and it accumulates: turning past the last
  // card keeps counting up rather than snapping back round to zero.
  const [angle, setAngle] = useState(0);
  const [open, setOpen] = useState<{ index: number; from: DOMRect } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(1440);
  const stage = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const turnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef({ id: -1, startX: 0, startAngle: 0, moved: 0 });

  // The slot at the front of the ring, and the reel it is showing. Twelve arms
  // share six reels, so each one appears twice — half a turn apart, which is
  // the furthest two copies can be from each other.
  const frontSlot = ((Math.round(-angle / STEP_DEGREES) % SLOTS) + SLOTS) % SLOTS;
  const active = frontSlot % reels.length;

  // The ring is as wide as the stage, so the tunnel keeps its shape rather than
  // its pixel measurements when the window changes.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /** Bring a slot round to the front of the ring by the shortest way. */
  const turnToSlot = useCallback((slot: number) => {
    if (turnTimer.current) { clearTimeout(turnTimer.current); turnTimer.current = null; }
    setAngle(current => current + shortestTurn(current, -slot * STEP_DEGREES));
  }, []);

  /** One card along, from wherever the ring has settled. */
  const step = useCallback((direction: number) => {
    if (turnTimer.current) { clearTimeout(turnTimer.current); turnTimer.current = null; }
    setAngle(current => (Math.round(current / STEP_DEGREES) - direction) * STEP_DEGREES);
  }, []);

  // Pointer drag: the ring follows the finger degree for degree, then settles
  // on the nearest card when it comes off.
  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || open) return;
    drag.current = { id: event.pointerId, startX: event.clientX, startAngle: angle, moved: 0 };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (drag.current.id !== event.pointerId) return;
    const travelled = event.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(travelled));
    setAngle(drag.current.startAngle - travelled * DEGREES_PER_PX);
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (drag.current.id !== event.pointerId) return;
    drag.current.id = -1;
    setDragging(false);
    setAngle(current => Math.round(current / STEP_DEGREES) * STEP_DEGREES);
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
      if (now - last < 560) return;
      amount += delta;
      if (Math.abs(amount) > 60) {
        step(amount > 0 ? 1 : -1);
        last = now;
        amount = 0;
      }
    }
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [step]);

  useEffect(() => () => { if (turnTimer.current) clearTimeout(turnTimer.current); }, []);

  function press(slot: number, index: number, event: React.MouseEvent<HTMLButtonElement>) {
    // A drag that ends on a card is a drag, not a press.
    if (drag.current.moved > 8) { drag.current.moved = 0; return; }
    const card = event.currentTarget;
    const reveal = () => {
      opener.current = card;
      setOpen({ index, from: card.getBoundingClientRect() });
    };
    if (slot === frontSlot) { reveal(); return; }
    // Turn the wall first: the card comes round to the front, then opens there.
    turnToSlot(slot);
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

  function onStageKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    step(event.key === "ArrowRight" ? 1 : -1);
  }

  const radius = Math.max(260, width * RADIUS_RATIO);
  const shown = open && reels[open.index];

  return (
    <section className={styles.wall} aria-labelledby="reel-wall-heading">
      <div className={styles.head}>
        <p className={styles.eyebrow}><b />THE REEL WALL</p>
        <h2 id="reel-wall-heading">Every frame<br />we <em>stand behind.</em></h2>
        <div className={styles.intro}>
          <p>
            Star Production House is a film studio working out of India — commercials, brand
            films and short-form work for people who would rather be remembered than seen.
          </p>
          <p>
            Fifty projects and twenty brands in, the job has not changed: find the true thing
            in the brief, and shoot that.
          </p>
          <p className={styles.introLine}>We call them <em>films that stay.</em></p>
        </div>
        <p className={styles.hintLine}>Turn the wall, then open a reel to read what went into it.</p>
      </div>

      <div
        className={styles.stage}
        ref={stage}
        data-dragging={dragging}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onStageKey}
        role="group"
        aria-roledescription="carousel"
        aria-label="Reels"
        tabIndex={0}
      >
        {/* The one moving part: perspective and rotation on the same element,
            so the cards inside it are a rigid ring rather than twelve tweens. */}
        <ul
          className={styles.ring}
          data-settled={!dragging}
          style={{ transform: `perspective(${PERSPECTIVE}px) rotateY(${angle.toFixed(2)}deg)` }}
        >
          {Array.from({ length: SLOTS }, (_, slot) => {
            const index = slot % reels.length;
            const reel = reels[index];
            // Where this arm has ended up once the ring's rotation is counted in.
            const hidden = Math.abs(foldAngle(angle + slot * STEP_DEGREES)) > VISIBLE_ARC;
            return (
              <li
                key={slot}
                className={styles.card}
                data-active={slot === frontSlot}
                aria-hidden={hidden}
                style={{
                  transform: `translate(-50%, -50%) rotateY(${slot * STEP_DEGREES}deg) translateZ(${-radius.toFixed(0)}px)`,
                  visibility: hidden ? "hidden" : undefined,
                }}
              >
                <button
                  type="button"
                  className={styles.cardButton}
                  tabIndex={hidden ? -1 : undefined}
                  onClick={event => press(slot, index, event)}
                  aria-label={`${reel.title} — open details`}
                >
                  <span className={styles.cardPhoto} style={{ backgroundImage: `url('${reel.image}')`, backgroundSize: reel.size, backgroundPosition: reel.frame }} />
                  <span className={styles.cardShade} />
                  <span className={styles.cardOpen} aria-hidden="true">↗</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className={styles.caption} key={reels[active].title}>
        <b>{reels[active].title}</b>
        <span>{reels[active].tagline}</span>
      </p>

      <div className={styles.controls}>
        <span className={styles.hint}>⇄ DRAG TO TURN THE WALL</span>
        <div className={styles.pager}>
          <button type="button" onClick={() => step(-1)} aria-label="Previous reel">←</button>
          <span className={styles.count}>
            {String(active + 1).padStart(2, "0")}<i /><b>{String(reels.length).padStart(2, "0")}</b>
          </span>
          <button type="button" onClick={() => step(1)} aria-label="Next reel">→</button>
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
