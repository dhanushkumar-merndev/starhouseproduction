"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import MonitorServices from "@/components/site/monitor-services";
import MountainFooter from "@/components/site/mountain-footer";
import SiteHeader from "@/components/site/site-header";
import { setScrollLock } from "@/components/site/scroll-lock";
import type { SceneChapter, SceneState } from "./studio-scene";

type SceneActions = { replay: () => void; skip: () => void };

/** The three reels shown under the hero copy; frames come from the contact sheet. */
const reels = [
  { title: "Brand Films", frame: "0%" },
  { title: "Commercials", frame: "33.333%" },
  { title: "Short Films", frame: "66.667%" },
];

const social = ["Instagram", "YouTube", "Behance", "LinkedIn"];

/**
 * The four beats the index rail counts through: the hero, the shoot copy, the
 * projected services screen, and the exploded rig. The footer keeps the last
 * number lit rather than dropping the rail back to nothing.
 */
const railPosition: Record<SceneChapter, number> = { stories: 0, craft: 1, monitor: 2, parts: 3, footer: 3 };

/** Counted up by the hero timeline; the markup carries the finished figure. */

const stats = [
  { value: 50, suffix: "+", label: "Projects" },
  { value: 20, suffix: "+", label: "Brands" },
  { value: 4, suffix: "K", label: "Visuals" },
];

/**
 * Module scope, so the intro plays once per page load: it survives client-side
 * navigation back to the homepage and only resets on a hard refresh.
 */
let introPlayed = false;

/**
 * The hero's entrance, like the intro, belongs to the page load: coming back to
 * the homepage from the nav re-mounts this component, and replaying the whole
 * landing there reads as a glitch rather than an entrance.
 */
let heroPlayed = false;

/** Never hold the page longer than this, however slowly the scene comes up. */
const INTRO_LOCK_LIMIT = 9000;

function subscribeToMotion(callback: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", callback);
  return () => preference.removeEventListener("change", callback);
}

export default function CameraScene() {
  const reducedMotion = useSyncExternalStore(subscribeToMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const hostRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  // The timeline reaches the reels, counts and social row as well as the copy,
  // and all of those sit outside .hero-copy — so the context is scoped here.
  const studioRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLOListElement>(null);
  const [monitorCovers, setMonitorCovers] = useState(false);
  const actionsRef = useRef<SceneActions | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [view, setView] = useState<SceneState>({ phase: "intro", progress: 0 });
  const revealed = view.progress > 0.8 || status === "error";
  const staticView = reducedMotion || status === "error";
  // view.progress is the intro's own progress, so this is true for the whole
  // run of it, including the hold before the reveal begins.
  const introRunning = status === "ready" && view.phase !== "ready" && !staticView;
  // The rail follows the scroll story rather than the hero copy, so it keeps
  // counting once the hero has handed over.
  const chapterIndex = railPosition[view.chapter ?? "stories"];

  // Hold the page still for the length of the intro, so a scroll during it
  // cannot leave the page part-way down when it finishes.
  const [lockExpired, setLockExpired] = useState(false);
  useEffect(() => {
    const failsafe = setTimeout(() => setLockExpired(true), INTRO_LOCK_LIMIT);
    return () => clearTimeout(failsafe);
  }, []);

  useEffect(() => {
    if (!introRunning || lockExpired) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    // A hard refresh restores the old scroll position, which would show the
    // header over the intro and start the story part-way through.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    root.style.overflow = "hidden";
    setScrollLock(true);
    return () => {
      root.style.overflow = previous;
      setScrollLock(false);
    };
  }, [introRunning, lockExpired]);

  // The hero lands on a GSAP timeline: each headline line rises out of its own
  // mask, with the supporting copy following just behind it.
  // The header inverts on the monitor chapter, but only once the projected
  // screen genuinely sits behind it — measured, because the rig's framing
  // decides when that happens.
  useEffect(() => {
    const portal = document.getElementById("monitor-portal");
    if (!portal) return;
    let frame = 0;
    let settleUntil = 0;
    const measure = () => {
      frame = 0;
      if (staticView) { setMonitorCovers(false); return; }
      const rect = portal.getBoundingClientRect();
      const behindHeader = rect.top <= 4 && rect.bottom >= 140 && rect.width >= window.innerWidth * 0.92;
      // Opacity as well as visibility: past the services chapter the screen is
      // faded out but still occupies the whole rect, which blacked the header
      // over a white page.
      const shown = getComputedStyle(portal);
      setMonitorCovers(behindHeader && shown.visibility !== "hidden" && Number(shown.opacity) > 0.5);
      // The rig keeps easing after the last scroll event, so carry on watching
      // for a moment: otherwise the tone is decided mid-move and left there,
      // which is exactly when you stop and look at it.
      if (performance.now() < settleUntil) frame = requestAnimationFrame(measure);
    };
    const schedule = () => {
      settleUntil = performance.now() + 1000;
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [staticView]);

  // Each chapter change dips the rail out and back, so the number reads as a
  // deliberate cut rather than a silent swap.
  useEffect(() => {
    const list = indexRef.current;
    // Nothing until the rig has been revealed: the tween writes an inline
    // opacity, which would otherwise hold the rail lit over the intro.
    if (!list || staticView || !revealed) return;
    const fade = gsap.fromTo(list, { autoAlpha: 0.15 }, { autoAlpha: 1, duration: 0.5, ease: "power2.out" });
    return () => { fade.kill(); gsap.set(list, { clearProps: "opacity,visibility" }); };
  }, [chapterIndex, revealed, staticView]);

  useEffect(() => {
    if (!revealed || staticView || !studioRef.current) return;
    // Coming back from the nav skips the intro, so the entrance doesn't replay:
    // land the copy on its finished pose instead, or it stays on the hidden
    // start state CSS gives it and the hero reads as an empty page.
    if (heroPlayed) {
      const settled = gsap.context(() => {
        gsap.set(".hero-copy .hero-eyebrow, .hero-copy .hero-description, .hero-copy .hero-work-link", { autoAlpha: 1, y: 0 });
      }, studioRef);
      return () => settled.revert();
    }
    heroPlayed = true;
    const context = gsap.context(() => {
      // The start pose lives here rather than in CSS, so if this never runs the
      // headline is simply visible instead of stranded off-screen.
      gsap.set(".hero-line > span", { yPercent: 110 });
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .to(".hero-eyebrow", { autoAlpha: 1, y: 0, duration: 0.55 }, 0)
        .to(".hero-line > span", { yPercent: 0, duration: 1.1, stagger: 0.09 }, 0.06)
        .to(".hero-description", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.48)
        .to(".hero-work-link", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.6);

      // The furniture around the rig arrives after the headline has landed. These
      // end on a clearProps rather than a captured "from" value: the studio light
      // is still ramping as they start, so a from() would pin whatever opacity it
      // read at that instant and hold the row lit through the chapters after it.
      gsap.fromTo(".hero-reels li", { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, delay: 0.72, ease: "power3.out", clearProps: "opacity,visibility,transform" });
      gsap.fromTo(".hero-stats > div", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06, delay: 0.85, ease: "power2.out", clearProps: "opacity,visibility,transform" });
      gsap.fromTo(".hero-social a, .hero-scroll", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, stagger: 0.05, delay: 0.95, ease: "power2.out", clearProps: "opacity,visibility" });

      // Counts run up to the figure already in the markup, so the page still
      // reads correctly if this never plays.
      gsap.utils.toArray<HTMLElement>(".hero-stats dt").forEach((node, index) => {
        const target = Number(node.dataset.value ?? 0);
        const suffix = node.dataset.suffix ?? "";
        const counter = { value: 0 };
        // Zeroed as the hero lands rather than when the tween starts, so the
        // figure doesn't show for a moment and then snap back to count up.
        node.textContent = `0${suffix}`;
        gsap.to(counter, {
          value: target,
          duration: 3.5,
          delay: 0.9 + index * 0.15,
          ease: "power1.out",
          onUpdate: () => { node.textContent = `${Math.round(counter.value)}${suffix}`; },
        });
      });
    }, studioRef);
    return () => context.revert();
  }, [revealed, staticView]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const abort = new AbortController();
    let teardown: (() => void) | undefined;

    async function initialize() {
      const { mountCameraScene } = await import("./studio-scene");
      if (cancelled) return;
      const scene = await mountCameraScene(host!, setView, abort.signal);
      if (cancelled) { scene.dispose(); return; }
      teardown = scene.dispose;
      actionsRef.current = scene.actions;
      if (introPlayed) scene.actions.skip();
      else introPlayed = true;
      setStatus("ready");
    }
    initialize().catch((error: unknown) => {
      if (cancelled) return;
      console.error("Unable to initialize the camera scene:", error);
      host.parentElement?.style.setProperty("--studio-light", "1");
      setStatus("error");
    });
    return () => {
      cancelled = true;
      abort.abort();
      actionsRef.current = null;
      teardown?.();
    };
  }, []);

  return (
    <>
      <SiteHeader revealed={revealed} tone={monitorCovers ? "dark" : "light"} />
      <section id="home" className="camera-scroll-track">
      <span id="inside-services" className="story-anchor" aria-hidden="true" />
      <div ref={studioRef} className="camera-studio" data-phase={view.phase} data-revealed={revealed} data-static={staticView} aria-label="Star Production House">
        <div ref={hostRef} className={`camera-viewport${status === "ready" ? " is-ready" : ""}`} aria-hidden="true" />
        <div className="hero-backdrop" aria-hidden="true">
          <span className="hero-ghost">FILM</span>
          <span className="hero-arc" />
          <span className="hero-crosshair" />
          <span className="hero-filmstrip" />
        </div>
        <div className="hero-copy" ref={heroRef} inert={!revealed}>
          <p className="hero-eyebrow">STAR PRODUCTION HOUSE <span>/</span> FILMS &amp; STORIES</p>
          <h1>
            <span className="hero-line"><span>STORIES</span></span>
            <span className="hero-line"><span>THAT <em>STAY.</em></span></span>
          </h1>
          <p className="hero-description">A moment becomes a frame.<br />A frame becomes a feeling.</p>
          <Link className="hero-work-link" href="/projects"><span aria-hidden="true">↗</span> EXPLORE THE WORK</Link>
        </div>
        <ol className="hero-index" ref={indexRef} aria-hidden="true">
          {[0, 1, 2, 3].map(index => (
            <li key={index} data-active={index === chapterIndex}>0{index + 1}</li>
          ))}
        </ol>

        <div className="hero-rail" inert={!revealed}>
          <dl className="hero-stats">
            {stats.map(({ value, suffix, label }) => (
              <div key={label}>
                <dt data-value={value} data-suffix={suffix}>{value}{suffix}</dt>
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ul className="hero-reels" inert={!revealed}>
          {reels.map(({ title, frame }, index) => (
            <li key={title}>
              <Link href="/projects">
                <span className="hero-reel-frame" style={{ backgroundPosition: `${frame} center` }} aria-hidden="true">
                  <b>▶</b>
                </span>
                <span className="hero-reel-title">{title}</span>
                <span className="hero-reel-index">0{index + 1}</span>
              </Link>
            </li>
          ))}
        </ul>

        <nav className="hero-social" aria-label="Star Production House elsewhere" inert={!revealed}>
          {social.map(name => <a key={name} href="#contact">{name}</a>)}
        </nav>

        <p className="hero-scroll" inert={!revealed}>SCROLL TO DISCOVER</p>

        <div className="hero-second-copy" inert>
          <p className="hero-eyebrow">01 <span>/</span> SHOOT</p>
          <h2>FIND THE<br /><em>FEELING.</em></h2>
          <p>The light. The people. The unrepeatable moment. We bring a story into focus, one frame at a time.</p>
          <Link className="text-link" href="/about-us">THEN, THE EDIT <span aria-hidden="true">↗</span></Link>
        </div>
        <div id="monitor-portal" className="monitor-portal" inert={!staticView} style={{ "--services-active": 0 } as React.CSSProperties}>
          <MonitorServices />
        </div>
        <section className="camera-parts" inert={!staticView} aria-labelledby="camera-parts-title">
          <div className="camera-parts-heading"><p className="hero-eyebrow">EVERY PART HAS A PURPOSE</p><h2 id="camera-parts-title">One story.<br /><em>Every capability.</em></h2></div>
          <svg className="part-connectors" aria-hidden="true"><polyline data-part-connector="lens" /><polyline data-part-connector="body" /><polyline data-part-connector="battery" /><circle data-part-dot="lens" r="3" /><circle data-part-dot="body" r="3" /><circle data-part-dot="battery" r="3" /></svg>
          <Link className="part-label" data-part-label="lens" href="/services"><span>01 / THE LENS</span><strong>Films &amp; cinematography</strong><small>Perspective, light, and the shot.</small></Link>
          <Link className="part-label" data-part-label="body" href="/services"><span>02 / THE CAMERA</span><strong>Commercials &amp; brand stories</strong><small>Ideas made real, frame by frame.</small></Link>
          <Link className="part-label" data-part-label="battery" href="/services"><span>03 / THE POWER</span><strong>Reels &amp; post-production</strong><small>Energy, rhythm, and the final cut.</small></Link>
        </section>
        <MountainFooter staticView={staticView} />
        {status === "loading" && <div className="scene-loading" role="status" aria-label="Loading cinematic introduction"><span /></div>}
        {status === "error" && <p className="scene-fallback">Star Production House<br /><span>Commercials &amp; 4K cinema</span></p>}
      </div>
      </section>
    </>
  );
}
